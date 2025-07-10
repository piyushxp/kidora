const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const { auth, requireSuperAdmin, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/invoices
// @desc    Generate new invoice (Super Admin only)
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('invoiceType').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Valid invoice type is required'),
  body('period.startDate').isISO8601().withMessage('Valid start date is required'),
  body('period.endDate').isISO8601().withMessage('Valid end date is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.description').notEmpty().withMessage('Item description is required'),
  body('items.*.amount').isNumeric().withMessage('Valid amount is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      studentId,
      invoiceType,
      period,
      items,
      dueDate,
      isInstallment,
      installments,
      notes
    } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
    const tax = 0; // Can be calculated based on business logic
    const totalAmount = subtotal + tax;

    const invoiceData = {
      student: studentId,
      invoiceType,
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      },
      items,
      subtotal,
      tax,
      totalAmount,
      dueDate: new Date(dueDate),
      remainingAmount: totalAmount,
      isInstallment: isInstallment || false,
      notes,
      createdBy: req.user._id
    };

    // Add installments if specified
    if (isInstallment && installments && installments.length > 0) {
      invoiceData.installments = installments.map(inst => ({
        amount: parseFloat(inst.amount),
        dueDate: new Date(inst.dueDate)
      }));
    }

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Populate student details for response
    await invoice.populate('student', 'name parentName parentEmail');

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices
// @desc    Get all invoices (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, class: className, studentId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by class
    if (className) {
      query['student.assignedClass'] = className;
    } else if (req.user.role === 'teacher') {
      // Teachers can only see invoices for students in their class
      query['student.assignedClass'] = req.user.assignedClass;
    }

    // Filter by student
    if (studentId) {
      query.student = studentId;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const invoices = await Invoice.find(query)
      .populate('student', 'name parentName parentEmail assignedClass')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/stats
// @desc    Get invoice statistics
// @access  Private
router.get('/stats', [auth, requireAnyRole], async (req, res) => {
  try {
    const { startDate, endDate, class: className } = req.query;

    let matchQuery = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by class
    if (req.user.role === 'teacher') {
      matchQuery['student.assignedClass'] = req.user.assignedClass;
    } else if (className) {
      matchQuery['student.assignedClass'] = className;
    }

    const stats = await Invoice.aggregate([
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
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          unpaidAmount: { $sum: '$remainingAmount' },
          paidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          partialInvoices: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          unpaidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidInvoices: 0,
      partialInvoices: 0,
      unpaidInvoices: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get invoice by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('student', 'name parentName parentEmail assignedClass')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check access permissions
    if (req.user.role === 'teacher' && invoice.student.assignedClass !== req.user.assignedClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/invoices/:id/payment
// @desc    Record payment for invoice (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/payment', [
  auth,
  requireSuperAdmin,
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('method').isIn(['cash', 'card', 'bank_transfer', 'online']).withMessage('Valid payment method is required'),
  body('receiptNumber').optional().notEmpty().withMessage('Receipt number cannot be empty'),
  body('notes').optional().notEmpty().withMessage('Notes cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { amount, method, receiptNumber, notes } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Add payment record
    invoice.payments.push({
      amount: parseFloat(amount),
      method,
      receiptNumber,
      notes
    });

    // Update payment status
    invoice.calculateRemainingAmount();
    await invoice.save();

    // Populate for response
    await invoice.populate('student', 'name parentName parentEmail');

    res.json({
      message: 'Payment recorded successfully',
      invoice
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/invoices/:id/installment/:installmentId
// @desc    Mark installment as paid (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/installment/:installmentId', [
  auth,
  requireSuperAdmin,
  body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'online']).withMessage('Valid payment method is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { paymentMethod } = req.body;
    const { installmentId } = req.params;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const installment = invoice.installments.id(installmentId);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({ message: 'Installment is already paid' });
    }

    // Mark installment as paid
    installment.status = 'paid';
    installment.paidDate = new Date();

    // Add payment record
    invoice.payments.push({
      amount: installment.amount,
      method: paymentMethod,
      notes: `Installment payment for ${installment.dueDate.toLocaleDateString()}`
    });

    // Update payment status
    invoice.calculateRemainingAmount();
    await invoice.save();

    res.json({
      message: 'Installment marked as paid successfully',
      invoice
    });
  } catch (error) {
    console.error('Mark installment paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if invoice has payments
    if (invoice.payments.length > 0) {
      return res.status(400).json({ message: 'Cannot delete invoice with payments' });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 