const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { devAdminOnly } = require('../middleware/role');
const bcrypt = require('bcryptjs');

// GET /api/dev-admin/super-admins
// Query params: isActive, hasPaidThisMonth
router.get('/super-admins', auth, devAdminOnly, async (req, res) => {
  try {
    const filter = { role: 'super_admin' };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.hasPaidThisMonth !== undefined) filter.hasPaidThisMonth = req.query.hasPaidThisMonth === 'true';
    const superAdmins = await User.find(filter).select('-password');
    res.json(superAdmins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dev-admin/create-super-admin
router.post('/create-super-admin', auth, devAdminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, schoolName, schoolAddress, country, accessibleModules } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'super_admin',
      phone,
      schoolName,
      schoolAddress,
      country,
      accessibleModules,
      createdBy: req.user._id
    });
    await superAdmin.save();
    res.status(201).json({ message: 'Super admin created', superAdmin: { ...superAdmin.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/dev-admin/super-admins/:id/status
router.patch('/super-admins/:id/status', auth, devAdminOnly, async (req, res) => {
  try {
    const { isActive, hasPaidThisMonth } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (hasPaidThisMonth !== undefined) update.hasPaidThisMonth = hasPaidThisMonth;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/dev-admin/super-admins/:id/modules
router.patch('/super-admins/:id/modules', auth, devAdminOnly, async (req, res) => {
  try {
    const { accessibleModules } = req.body;
    if (!accessibleModules) return res.status(400).json({ message: 'accessibleModules required' });
    const user = await User.findByIdAndUpdate(req.params.id, { accessibleModules }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 