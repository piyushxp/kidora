const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Photo = require('../models/Photo');
const { auth, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get today's date for attendance calculation
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Calculate all stats in parallel for better performance
    const [
      totalStudents,
      totalTeachers,
      todayAttendanceRecords,
      pendingInvoices,
      totalPhotos
    ] = await Promise.all([
      // Count total active students
      Student.countDocuments({ isActive: true }),
      
      // Count total active teachers (excluding super admin)
      User.countDocuments({ role: 'teacher', isActive: true }),
      
      // Count today's attendance records where students were present
      Attendance.countDocuments({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['present', 'late'] }
      }),
      
      // Count pending/unpaid invoices
      Invoice.countDocuments({ status: { $in: ['unpaid', 'partial'] } }),
      
      // Count total photos
      Photo.countDocuments({})
    ]);

    const stats = {
      totalStudents,
      totalTeachers,
      todayAttendance: todayAttendanceRecords,
      pendingPayments: pendingInvoices,
      totalPhotos
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities for dashboard
// @access  Private
router.get('/recent-activities', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent students, invoices, and photos
    const [recentStudents, recentInvoices, recentPhotos] = await Promise.all([
      Student.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name assignedClass createdAt'),
      
      Invoice.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name')
        .select('invoiceNumber totalAmount status createdAt student'),
      
      Photo.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name')
        .select('title className date uploadedBy createdAt')
    ]);

    const activities = [];

    // Add recent students
    recentStudents.forEach(student => {
      activities.push({
        type: 'student_added',
        message: `New student ${student.name} added to ${student.assignedClass}`,
        timestamp: student.createdAt,
        data: student
      });
    });

    // Add recent invoices
    recentInvoices.forEach(invoice => {
      activities.push({
        type: 'invoice_created',
        message: `Invoice ${invoice.invoiceNumber} created for ${invoice.student?.name}`,
        timestamp: invoice.createdAt,
        data: invoice
      });
    });

    // Add recent photos
    recentPhotos.forEach(photo => {
      activities.push({
        type: 'photo_uploaded',
        message: `Photo "${photo.title}" uploaded for ${photo.className}`,
        timestamp: photo.createdAt,
        data: photo
      });
    });

    // Sort all activities by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json(limitedActivities);
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 