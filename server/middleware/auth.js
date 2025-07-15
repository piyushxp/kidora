const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

const requireSuperAdmin = requireRole(['super_admin']);
const requireTeacher = requireRole(['teacher']);
const requireAnyRole = requireRole(['super_admin', 'teacher']);

// Check if user has access to specific modules
const requireModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Dev admin has access to all modules
    if (req.user.role === 'dev_admin') {
      return next();
    }

    // Check if user has access to the module
    if (!req.user.accessibleModules || !req.user.accessibleModules[moduleName]) {
      return res.status(403).json({ message: `Access denied. ${moduleName} module not enabled.` });
    }

    next();
  };
};

const requireAssignmentsAccess = requireModuleAccess('assignments');

module.exports = {
  auth,
  requireRole,
  requireSuperAdmin,
  requireTeacher,
  requireAnyRole,
  requireModuleAccess,
  requireAssignmentsAccess
}; 