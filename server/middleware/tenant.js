const mongoose = require('mongoose');

/**
 * Get the tenant scope for a user
 * - dev_admin: no restrictions (can access all data)
 * - super_admin: scope to their own createdBy ID
 * - teacher: scope to their createdBy (the super_admin who created them)
 */
const getTenantScope = (user) => {
  if (!user) return null;
  
  switch (user.role) {
    case 'dev_admin':
      return null; // No restrictions for dev_admin
    case 'super_admin':
      return user._id; // Super admin can only see their own data
    case 'teacher':
      return user.createdBy; // Teacher can only see data from their super_admin
    default:
      return null;
  }
};

/**
 * Middleware to add tenant filtering to MongoDB queries
 * This should be used on routes that need tenant isolation
 */
const enforceTenantScope = (req, res, next) => {
  const tenantScope = getTenantScope(req.user);
  
  if (tenantScope) {
    // Add tenant scope to request for use in route handlers
    req.tenantScope = tenantScope;
  }
  
  next();
};

/**
 * Helper function to add tenant filter to a MongoDB query
 * Usage: const filter = addTenantFilter(req, baseFilter);
 */
const addTenantFilter = (req, baseFilter = {}) => {
  if (req.tenantScope) {
    return { ...baseFilter, createdBy: req.tenantScope };
  }
  return baseFilter;
};

/**
 * Helper function to validate if a user can access a document
 * Checks if the document's createdBy matches the user's tenant scope
 */
const canAccessDocument = (user, document) => {
  const tenantScope = getTenantScope(user);
  
  // dev_admin can access everything
  if (!tenantScope) return true;
  
  // Check if document belongs to user's tenant
  return document.createdBy && document.createdBy.toString() === tenantScope.toString();
};

/**
 * Middleware specifically for route protection
 * Returns 403 if user doesn't have access to the requested resource
 */
const requireTenantAccess = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = mongoose.model(modelName);
      const documentId = req.params.id;
      
      if (!documentId) {
        return next(); // Skip check if no ID in params
      }
      
      const document = await Model.findById(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      if (!canAccessDocument(req.user, document)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = {
  getTenantScope,
  enforceTenantScope,
  addTenantFilter,
  canAccessDocument,
  requireTenantAccess
}; 