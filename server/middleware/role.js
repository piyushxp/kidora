const devAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'dev_admin') {
    return res.status(403).json({ message: 'Access denied: dev_admins only' });
  }
  next();
};

module.exports = { devAdminOnly }; 