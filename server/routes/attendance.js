const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { auth, requireTeacher, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance
// @desc    Mark attendance for students (Teachers only)
// @access  Private (Teachers)
router.post('/', [
  auth,
  requireTeacher,
  body('date').isISO8601().withMessage('Valid date is required'),
  body('attendanceData').isArray().withMessage('Attendance data must be an array'),
  body('attendanceData.*.studentId').isMongoId().withMessage('Valid student ID is required'),
  body('attendanceData.*.status').isIn(['present', 'absent', 'half_day']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { date, attendanceData } = req.body;

    // Check if attendance already exists for this date and class
    const existingAttendance = await Attendance.findOne({
      date: new Date(date),
      'student.assignedClass': req.user.assignedClass
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance for this date and class already exists' });
    }

    // Get students in the teacher's class
    const students = await Student.find({ 
      assignedClass: req.user.assignedClass,
      status: 'active'
    });

    if (students.length === 0) {
      return res.status(400).json({ message: 'No active students found in your class' });
    }

    // Create attendance records
    const attendanceRecords = attendanceData.map(record => ({
      student: record.studentId,
      date: new Date(date),
      status: record.status,
      remarks: record.remarks || '',
      timeIn: record.timeIn ? new Date(record.timeIn) : undefined,
      timeOut: record.timeOut ? new Date(record.timeOut) : undefined,
      markedBy: req.user._id
    }));

    await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      message: 'Attendance marked successfully',
      count: attendanceRecords.length
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { date, class: className, studentId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Filter by class
    if (className) {
      query['student.assignedClass'] = className;
    } else if (req.user.role === 'teacher') {
      // Teachers can only see their class attendance
      query['student.assignedClass'] = req.user.assignedClass;
    }

    // Filter by student if provided
    if (studentId) {
      query.student = studentId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name assignedClass')
      .populate('markedBy', 'name')
      .sort({ date: -1, 'student.name': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/stats', [auth, requireAnyRole], async (req, res) => {
  try {
    const { date, class: className } = req.query;

    let matchQuery = {};

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      matchQuery.date = { $gte: startDate, $lt: endDate };
    }

    // Filter by class
    if (className) {
      matchQuery['student.assignedClass'] = className;
    } else if (req.user.role === 'teacher') {
      matchQuery['student.assignedClass'] = req.user.assignedClass;
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudents = await Student.countDocuments(
      req.user.role === 'teacher' ? { assignedClass: req.user.assignedClass } : {}
    );

    const statsMap = {
      present: 0,
      absent: 0,
      half_day: 0
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      stats: statsMap,
      totalStudents,
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/date/:date
// @desc    Get attendance for a specific date
// @access  Private
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const { class: className } = req.query;

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    let query = {
      date: { $gte: startDate, $lt: endDate }
    };

    // Filter by class
    if (className) {
      query['student.assignedClass'] = className;
    } else if (req.user.role === 'teacher') {
      query['student.assignedClass'] = req.user.assignedClass;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name assignedClass')
      .populate('markedBy', 'name')
      .sort({ 'student.name': 1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get date attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance history for a specific student
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    // Check if student exists and teacher has access
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user.role === 'teacher' && student.assignedClass !== req.user.assignedClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { student: studentId };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    // Calculate attendance statistics
    const stats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      stats: stats[0] || { total: 0, present: 0, absent: 0, halfDay: 0 }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (Teachers only)
// @access  Private (Teachers)
router.put('/:id', [
  auth,
  requireTeacher,
  body('status').isIn(['present', 'absent', 'half_day']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const attendance = await Attendance.findById(req.params.id)
      .populate('student', 'assignedClass');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if teacher can modify this attendance
    if (attendance.student.assignedClass !== req.user.assignedClass) {
      return res.status(403).json({ message: 'You can only modify attendance for students in your class' });
    }

    const { status, remarks, timeIn, timeOut } = req.body;

    attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    if (timeIn !== undefined) attendance.timeIn = timeIn ? new Date(timeIn) : undefined;
    if (timeOut !== undefined) attendance.timeOut = timeOut ? new Date(timeOut) : undefined;

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/recent
// @desc    Get recent attendance records for dashboard
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    let query = {};

    // Teachers can only see their class attendance
    if (req.user.role === 'teacher') {
      // First get students from teacher's class
      const students = await Student.find({ 
        assignedClass: req.user.assignedClass,
        isActive: true 
      }).select('_id');
      
      const studentIds = students.map(student => student._id);
      query.student = { $in: studentIds };
    }

    const recentAttendance = await Attendance.find(query)
      .populate('student', 'name assignedClass')
      .populate('markedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(recentAttendance);
  } catch (error) {
    console.error('Get recent attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 