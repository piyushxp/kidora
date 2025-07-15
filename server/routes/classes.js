const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { enforceTenantScope, addTenantFilter, getTenantScope, requireTenantAccess } = require('../middleware/tenant');

const router = express.Router();

// @route   GET /api/classes/list
// @desc    Get simple list of active classes for assignment (All authenticated users)
// @access  Private
router.get('/list', [auth, enforceTenantScope], async (req, res) => {
  try {
    const filter = addTenantFilter(req, { isActive: true });
    const classes = await Class.find(filter)
      .select('_id name academicYear capacity currentEnrollment')
      .sort({ name: 1 });

    res.json({
      classes,
      total: classes.length
    });
  } catch (error) {
    console.error('Get classes list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes
// @desc    Get all classes (Super Admin only)
// @access  Private (Super Admin)
router.get('/', [auth, requireSuperAdmin, enforceTenantScope], async (req, res) => {
  try {
    const { page = 1, limit = 10, academicYear, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by academic year if provided
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Filter by status if provided
    if (status) {
      query.isActive = status === 'active';
    }

    // Apply tenant filter
    query = addTenantFilter(req, query);

    const classes = await Class.find(query)
      .populate('classTeacher', 'name email phone')
      .populate('assistantTeachers', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get current enrollment for each class
    const classesWithEnrollment = await Promise.all(
      classes.map(async (classItem) => {
        const studentFilter = addTenantFilter(req, {
          assignedClass: classItem.name,
          isActive: true
        });
        const enrollmentCount = await Student.countDocuments(studentFilter);
        
        // Update current enrollment in the class document
        await Class.findByIdAndUpdate(classItem._id, { currentEnrollment: enrollmentCount });
        
        return {
          ...classItem.toObject(),
          currentEnrollment: enrollmentCount
        };
      })
    );

    const total = await Class.countDocuments(query);

    res.json({
      classes: classesWithEnrollment,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/classes
// @desc    Create new class (Super Admin only)
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  body('name').notEmpty().withMessage('Class name is required'),
  body('capacity').isInt({ min: 1, max: 50 }).withMessage('Capacity must be between 1 and 50'),
  // classTeacher is optional
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('schedule.startTime').notEmpty().withMessage('Start time is required'),
  body('schedule.endTime').notEmpty().withMessage('End time is required'),
  body('feeStructure.monthlyFee').isNumeric().withMessage('Valid monthly fee is required'),
  body('ageGroup.minAge').isInt({ min: 1, max: 10 }).withMessage('Minimum age must be between 1 and 10'),
  body('ageGroup.maxAge').isInt({ min: 1, max: 10 }).withMessage('Maximum age must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      name,
      description,
      capacity,
      classTeacher,
      assistantTeachers,
      academicYear,
      room,
      schedule,
      subjects,
      feeStructure,
      ageGroup,
      notes
    } = req.body;

    // Check if class name already exists within the tenant
    const existingClassFilter = addTenantFilter(req, { name });
    const existingClass = await Class.findOne(existingClassFilter);
    if (existingClass) {
      return res.status(400).json({ message: 'Class name already exists' });
    }

    // If classTeacher is provided, verify teacher exists and belongs to same tenant
    if (classTeacher) {
      const teacherFilter = addTenantFilter(req, { _id: classTeacher, role: 'teacher' });
      const teacher = await User.findOne(teacherFilter);
      if (!teacher) {
        return res.status(400).json({ message: 'Invalid class teacher or teacher not in your school' });
      }
      
      // Check if teacher is already assigned as class teacher to another class in this tenant
      const existingAssignmentFilter = addTenantFilter(req, { 
        classTeacher,
        isActive: true
      });
      const existingAssignment = await Class.findOne(existingAssignmentFilter);
      if (existingAssignment) {
        return res.status(400).json({ 
          message: `Teacher is already assigned as class teacher to ${existingAssignment.name}` 
        });
      }
    }

    const classData = {
      name,
      description,
      capacity: parseInt(capacity),
      classTeacher: classTeacher || null,
      assistantTeachers: assistantTeachers || [],
      academicYear,
      room,
      schedule,
      subjects: subjects || [],
      feeStructure,
      ageGroup,
      notes,
      createdBy: getTenantScope(req.user) || req.user._id
    };

    const newClass = new Class(classData);
    await newClass.save();

    // If classTeacher is provided, update teacher's assignedClass field
    if (classTeacher) {
      await User.findByIdAndUpdate(classTeacher, { assignedClass: name });
    }

    // Populate the response
    await newClass.populate('classTeacher', 'name email phone');
    await newClass.populate('assistantTeachers', 'name email phone');
    await newClass.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Class name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// @route   GET /api/classes/:id
// @desc    Get class by ID (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id', [auth, requireSuperAdmin, enforceTenantScope, requireTenantAccess('Class')], async (req, res) => {
  try {
    const filter = addTenantFilter(req, { _id: req.params.id });
    const classItem = await Class.findOne(filter)
      .populate('classTeacher', 'name email phone profileImage')
      .populate('assistantTeachers', 'name email phone profileImage')
      .populate('createdBy', 'name');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get current students in this class
    const studentFilter = addTenantFilter(req, {
      assignedClass: classItem.name,
      isActive: true 
    });
    const students = await Student.find(studentFilter).select('name dateOfBirth gender parentName parentEmail parentPhone');

    // Update current enrollment
    await Class.findByIdAndUpdate(classItem._id, { currentEnrollment: students.length });

    res.json({
      class: {
        ...classItem.toObject(),
        currentEnrollment: students.length
      },
      students
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  requireTenantAccess('Class'),
  body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
  body('capacity').optional().isInt({ min: 1, max: 50 }).withMessage('Capacity must be between 1 and 50'),
  body('classTeacher').optional().isMongoId().withMessage('Valid class teacher ID is required'),
  body('academicYear').optional().notEmpty().withMessage('Academic year cannot be empty'),
  body('feeStructure.monthlyFee').optional().isNumeric().withMessage('Valid monthly fee is required'),
  body('ageGroup.minAge').optional().isInt({ min: 1, max: 10 }).withMessage('Minimum age must be between 1 and 10'),
  body('ageGroup.maxAge').optional().isInt({ min: 1, max: 10 }).withMessage('Maximum age must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const {
      name,
      description,
      capacity,
      classTeacher,
      assistantTeachers,
      academicYear,
      room,
      schedule,
      subjects,
      feeStructure,
      ageGroup,
      notes,
      isActive
    } = req.body;

    // Check if new class name already exists (if name is being changed)
    if (name && name !== classItem.name) {
      const existingClassFilter = addTenantFilter(req, { 
        name,
        _id: { $ne: req.params.id }
      });
      const existingClass = await Class.findOne(existingClassFilter);
      if (existingClass) {
        return res.status(400).json({ message: 'Class name already exists' });
      }
    }

    // In PUT /api/classes/:id, only validate and update teacher if classTeacher is provided
    if (classTeacher && classTeacher !== classItem.classTeacher.toString()) {
      const teacherFilter = addTenantFilter(req, { _id: classTeacher, role: 'teacher' });
      const teacher = await User.findOne(teacherFilter);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid class teacher' });
      }

      // Check if teacher is already assigned as class teacher to another class in this tenant
      const existingAssignmentFilter = addTenantFilter(req, { 
        classTeacher,
        isActive: true,
        _id: { $ne: req.params.id }
      });
      const existingAssignment = await Class.findOne(existingAssignmentFilter);
      if (existingAssignment) {
        return res.status(400).json({ 
          message: `Teacher is already assigned as class teacher to ${existingAssignment.name}` 
        });
      }

      // Update old teacher's assignedClass
      await User.findByIdAndUpdate(classItem.classTeacher, { assignedClass: null });
      
      // Update new teacher's assignedClass
      await User.findByIdAndUpdate(classTeacher, { assignedClass: name || classItem.name });
    }

    // Update class name in all related students if name changed
    if (name && name !== classItem.name) {
      const studentFilter = addTenantFilter(req, { assignedClass: classItem.name });
      await Student.updateMany(
        studentFilter,
        { assignedClass: name }
      );
    }

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(capacity && { capacity: parseInt(capacity) }),
      ...(classTeacher && { classTeacher }),
      ...(assistantTeachers && { assistantTeachers }),
      ...(academicYear && { academicYear }),
      ...(room !== undefined && { room }),
      ...(schedule && { schedule }),
      ...(subjects && { subjects }),
      ...(feeStructure && { feeStructure }),
      ...(ageGroup && { ageGroup }),
      ...(notes !== undefined && { notes }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: Date.now()
    };

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('classTeacher', 'name email phone')
      .populate('assistantTeachers', 'name email phone')
      .populate('createdBy', 'name');

    res.json({
      message: 'Class updated successfully',
      class: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, requireSuperAdmin, enforceTenantScope, requireTenantAccess('Class')], async (req, res) => {
  try {
    const filter = addTenantFilter(req, { _id: req.params.id });
    const classItem = await Class.findOne(filter);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if there are students enrolled in this class
    const studentFilter = addTenantFilter(req, {
      assignedClass: classItem.name,
      isActive: true
    });
    const enrolledStudents = await Student.countDocuments(studentFilter);

    if (enrolledStudents > 0) {
      return res.status(400).json({ 
        message: `Cannot delete class. ${enrolledStudents} students are currently enrolled.` 
      });
    }

    // Update teacher's assignedClass to null
    if (classItem.classTeacher) {
      await User.findByIdAndUpdate(classItem.classTeacher, { assignedClass: null });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/classes/:id/assign-teacher
// @desc    Assign or change class teacher (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/assign-teacher', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  requireTenantAccess('Class'),
  body('classTeacher').isMongoId().withMessage('Valid teacher ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { classTeacher } = req.body;

    const filter = addTenantFilter(req, { _id: req.params.id });
    const classItem = await Class.findOne(filter);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify teacher exists and belongs to the same tenant
    const teacherFilter = addTenantFilter(req, { _id: classTeacher, role: 'teacher' });
    const teacher = await User.findOne(teacherFilter);
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid teacher or teacher not in your school' });
    }

    // Check if teacher is already assigned as class teacher to another class in this tenant
    const existingAssignmentFilter = addTenantFilter(req, { 
      classTeacher,
      isActive: true,
      _id: { $ne: req.params.id }
    });
    const existingAssignment = await Class.findOne(existingAssignmentFilter);
    if (existingAssignment) {
      return res.status(400).json({ 
        message: `Teacher is already assigned as class teacher to ${existingAssignment.name}` 
      });
    }

    // Update old teacher's assignedClass to null
    if (classItem.classTeacher) {
      await User.findByIdAndUpdate(classItem.classTeacher, { assignedClass: null });
    }

    // Update class with new teacher
    classItem.classTeacher = classTeacher;
    await classItem.save();

    // Update new teacher's assignedClass
    await User.findByIdAndUpdate(classTeacher, { assignedClass: classItem.name });

    await classItem.populate('classTeacher', 'name email phone');

    res.json({
      message: 'Class teacher assigned successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/teachers/available
// @desc    Get available teachers for assignment (Super Admin only)
// @access  Private (Super Admin)
router.get('/teachers/available', [auth, requireSuperAdmin, enforceTenantScope], async (req, res) => {
  try {
    // Get all teachers from this tenant
    const teacherFilter = addTenantFilter(req, { 
      role: 'teacher',
      isActive: true 
    });
    const allTeachers = await User.find(teacherFilter).select('name email phone assignedClass');

    // Get teachers who are already class teachers in this tenant
    const classFilter = addTenantFilter(req, { isActive: true });
    const assignedTeachers = await Class.find(classFilter).distinct('classTeacher');

    // Filter out teachers who are already assigned as class teachers
    const availableTeachers = allTeachers.filter(
      teacher => !assignedTeachers.some(assigned => assigned && assigned.toString() === teacher._id.toString())
    );

    const assignedTeachersDetails = allTeachers.filter(
      teacher => assignedTeachers.some(assigned => assigned && assigned.toString() === teacher._id.toString())
    );

    res.json({
      available: availableTeachers,
      assigned: assignedTeachersDetails,
      total: allTeachers.length
    });
  } catch (error) {
    console.error('Get available teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/stats
// @desc    Get class statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/stats', [auth, requireSuperAdmin, enforceTenantScope], async (req, res) => {
  try {
    const tenantFilter = addTenantFilter(req, {});
    const totalClasses = await Class.countDocuments(tenantFilter);
    const activeClasses = await Class.countDocuments({ ...tenantFilter, isActive: true });
    const inactiveClasses = await Class.countDocuments({ ...tenantFilter, isActive: false });

    // Get total capacity and current enrollment for this tenant
    const classStats = await Class.aggregate([
      { $match: { ...tenantFilter, isActive: true } },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalEnrollment: { $sum: '$currentEnrollment' }
        }
      }
    ]);

    const { totalCapacity = 0, totalEnrollment = 0 } = classStats[0] || {};

    // Get academic year distribution for this tenant
    const academicYearStats = await Class.aggregate([
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: '$academicYear', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get classes with enrollment info for this tenant
    const classEnrollmentStats = await Class.aggregate([
      { $match: { ...tenantFilter, isActive: true } },
      {
        $project: {
          name: 1,
          capacity: 1,
          currentEnrollment: 1,
          occupancyRate: {
            $multiply: [
              { $divide: ['$currentEnrollment', '$capacity'] },
              100
            ]
          }
        }
      },
      { $sort: { occupancyRate: -1 } }
    ]);

    res.json({
      total: totalClasses,
      active: activeClasses,
      inactive: inactiveClasses,
      capacity: {
        total: totalCapacity,
        enrolled: totalEnrollment,
        available: totalCapacity - totalEnrollment,
        occupancyRate: totalCapacity > 0 ? ((totalEnrollment / totalCapacity) * 100).toFixed(2) : 0
      },
      academicYearStats,
      classEnrollmentStats
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 