const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');
const { enforceTenantScope, addTenantFilter, getTenantScope, requireTenantAccess } = require('../middleware/tenant');

const router = express.Router();

// @route   POST /api/teachers
// @desc    Add new teacher (Super Admin only)
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  uploadProfileImage,
  body('name').notEmpty().withMessage('Teacher name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // body('assignedClass').notEmpty().withMessage('Assigned class is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('bloodGroup').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone, assignedClass, bloodGroup, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    

    const teacherData = {
      name,
      email,
      password,
      role: 'teacher',
      // assignedClass,
      isActive: isActive === 'true' || isActive === true,
      phone: phone || undefined,
      bloodGroup,
      createdBy: req.user._id // Teachers are created by and belong to the super_admin
    };
    console.log(teacherData);

    // Add profile image if uploaded
    if (req.file) {
      teacherData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const teacher = new User(teacherData);
    await teacher.save();

    // Return teacher data without password
    const { password: _, ...teacherResponse } = teacher.toObject();

    res.status(201).json({
      message: 'Teacher added successfully',
      teacher: teacherResponse
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers (Super Admin only)
// @access  Private (Super Admin)
router.get('/', [auth, requireSuperAdmin, enforceTenantScope], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: 'teacher' };

    // Filter by status if provided
    if (status) {
      query.isActive = status === 'active';
    }

    // Apply tenant filter
    query = addTenantFilter(req, query);

    const teachers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      teachers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/classes
// @desc    Get all unique teacher classes (Super Admin only)
// @access  Private (Super Admin)
router.get('/classes', [auth, requireSuperAdmin, enforceTenantScope], async (req, res) => {
  try {
    const filter = addTenantFilter(req, { role: 'teacher' });
    const classes = await User.distinct('assignedClass', filter);
    res.json(classes);
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/stats
// @desc    Get teacher statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/stats', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const activeTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const inactiveTeachers = await User.countDocuments({ role: 'teacher', isActive: false });

    const classStats = await User.aggregate([
      { $match: { role: 'teacher' } },
      { $group: { _id: '$assignedClass', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total: totalTeachers,
      active: activeTeachers,
      inactive: inactiveTeachers,
      classStats
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select('-password');
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('assignedClass').optional().notEmpty().withMessage('Assigned class cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('bloodGroup').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const teacher = await User.findById(req.params.id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== teacher.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updatedTeacher = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teachers/:id/status
// @desc    Toggle teacher active status (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/status', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.json({
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        assignedClass: teacher.assignedClass,
        isActive: teacher.isActive
      }
    });
  } catch (error) {
    console.error('Toggle teacher status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 