const express = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Email templates
const emailTemplates = {
  admissionConfirmation: (student, schoolName) => ({
    subject: `Welcome to ${schoolName} - Admission Confirmation`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to ${schoolName}!</h2>
        <p>Dear ${student.parentName},</p>
        <p>We are delighted to confirm the admission of <strong>${student.name}</strong> to our playschool.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Student Details:</h3>
          <p><strong>Name:</strong> ${student.name}</p>
          <p><strong>Class:</strong> ${student.assignedClass}</p>
          <p><strong>Admission Date:</strong> ${new Date(student.admissionDate).toLocaleDateString()}</p>
          <p><strong>Monthly Fee:</strong> $${student.feeStructure.monthlyFee}</p>
        </div>
        <p>We look forward to providing a nurturing and educational environment for your child.</p>
        <p>Best regards,<br>${schoolName} Team</p>
      </div>
    `
  }),

  invoiceReminder: (student, invoice, schoolName) => ({
    subject: `Payment Reminder - ${schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Payment Reminder</h2>
        <p>Dear ${student.parentName},</p>
        <p>This is a friendly reminder about the pending payment for <strong>${student.name}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${invoice.totalAmount}</p>
          <p><strong>Remaining Amount:</strong> $${invoice.remainingAmount}</p>
        </div>
        <p>Please ensure timely payment to avoid any inconvenience.</p>
        <p>Best regards,<br>${schoolName} Team</p>
      </div>
    `
  }),

  exitNotification: (student, schoolName, exitDate) => ({
    subject: `Student Exit Notification - ${schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Student Exit Notification</h2>
        <p>Dear ${student.parentName},</p>
        <p>We regret to inform you that <strong>${student.name}</strong> will be exiting our playschool effective ${new Date(exitDate).toLocaleDateString()}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Student Details:</h3>
          <p><strong>Name:</strong> ${student.name}</p>
          <p><strong>Class:</strong> ${student.assignedClass}</p>
          <p><strong>Exit Date:</strong> ${new Date(exitDate).toLocaleDateString()}</p>
        </div>
        <p>We thank you for choosing our playschool and wish your child all the best for their future endeavors.</p>
        <p>Best regards,<br>${schoolName} Team</p>
      </div>
    `
  }),

  customMessage: (student, subject, message, schoolName) => ({
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">${subject}</h2>
        <p>Dear ${student.parentName},</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message}
        </div>
        <p>Best regards,<br>${schoolName} Team</p>
      </div>
    `
  })
};

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

// @route   POST /api/emails/send
// @desc    Send email to parent (Super Admin only)
// @access  Private (Super Admin)
router.post('/send', [
  auth,
  requireSuperAdmin,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('template').isIn(['admissionConfirmation', 'invoiceReminder', 'exitNotification', 'customMessage']).withMessage('Valid template is required'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('message').optional().notEmpty().withMessage('Message cannot be empty'),
  body('invoiceId').optional().isMongoId().withMessage('Valid invoice ID is required'),
  body('exitDate').optional().isISO8601().withMessage('Valid exit date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { studentId, template, subject, message, invoiceId, exitDate } = req.body;

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get school name from environment or use default
    const schoolName = process.env.SCHOOL_NAME || 'Playschool Manager';

    let emailContent;

    // Generate email content based on template
    switch (template) {
      case 'admissionConfirmation':
        emailContent = emailTemplates.admissionConfirmation(student, schoolName);
        break;

      case 'invoiceReminder':
        if (!invoiceId) {
          return res.status(400).json({ message: 'Invoice ID is required for invoice reminder' });
        }
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }
        emailContent = emailTemplates.invoiceReminder(student, invoice, schoolName);
        break;

      case 'exitNotification':
        if (!exitDate) {
          return res.status(400).json({ message: 'Exit date is required for exit notification' });
        }
        emailContent = emailTemplates.exitNotification(student, schoolName, exitDate);
        break;

      case 'customMessage':
        if (!subject || !message) {
          return res.status(400).json({ message: 'Subject and message are required for custom message' });
        }
        emailContent = emailTemplates.customMessage(student, subject, message, schoolName);
        break;

      default:
        return res.status(400).json({ message: 'Invalid template' });
    }

    // Send email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: student.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      message: 'Email sent successfully',
      messageId: info.messageId,
      recipient: student.parentEmail
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// @route   POST /api/emails/bulk
// @desc    Send bulk emails to multiple students (Super Admin only)
// @access  Private (Super Admin)
router.post('/bulk', [
  auth,
  requireSuperAdmin,
  body('studentIds').isArray().withMessage('Student IDs must be an array'),
  body('studentIds.*').isMongoId().withMessage('Valid student ID is required'),
  body('template').isIn(['admissionConfirmation', 'invoiceReminder', 'exitNotification', 'customMessage']).withMessage('Valid template is required'),
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('message').optional().notEmpty().withMessage('Message cannot be empty'),
  body('exitDate').optional().isISO8601().withMessage('Valid exit date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { studentIds, template, subject, message, exitDate } = req.body;

    // Get all students
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }

    const schoolName = process.env.SCHOOL_NAME || 'Playschool Manager';
    const transporter = createTransporter();
    const results = [];

    // Send emails to each student
    for (const student of students) {
      try {
        let emailContent;

        switch (template) {
          case 'admissionConfirmation':
            emailContent = emailTemplates.admissionConfirmation(student, schoolName);
            break;

          case 'exitNotification':
            if (!exitDate) {
              results.push({ studentId: student._id, success: false, error: 'Exit date required' });
              continue;
            }
            emailContent = emailTemplates.exitNotification(student, schoolName, exitDate);
            break;

          case 'customMessage':
            if (!subject || !message) {
              results.push({ studentId: student._id, success: false, error: 'Subject and message required' });
              continue;
            }
            emailContent = emailTemplates.customMessage(student, subject, message, schoolName);
            break;

          default:
            results.push({ studentId: student._id, success: false, error: 'Invalid template' });
            continue;
        }

        const mailOptions = {
          from: process.env.SMTP_USER || 'your-email@gmail.com',
          to: student.parentEmail,
          subject: emailContent.subject,
          html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          studentId: student._id,
          studentName: student.name,
          success: true,
          messageId: info.messageId
        });

      } catch (error) {
        results.push({
          studentId: student._id,
          studentName: student.name,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Bulk email completed. ${successful} successful, ${failed} failed.`,
      results,
      summary: { total: results.length, successful, failed }
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ message: 'Failed to send bulk emails' });
  }
});

// @route   POST /api/emails/invoice-reminders
// @desc    Send invoice reminders to all students with unpaid invoices (Super Admin only)
// @access  Private (Super Admin)
router.post('/invoice-reminders', [auth, requireSuperAdmin], async (req, res) => {
  try {
    // Get all unpaid invoices
    const unpaidInvoices = await Invoice.find({ status: { $in: ['unpaid', 'partial'] } })
      .populate('student', 'name parentName parentEmail');

    if (unpaidInvoices.length === 0) {
      return res.json({ message: 'No unpaid invoices found' });
    }

    const schoolName = process.env.SCHOOL_NAME || 'Playschool Manager';
    const transporter = createTransporter();
    const results = [];

    // Send reminders for each unpaid invoice
    for (const invoice of unpaidInvoices) {
      try {
        const emailContent = emailTemplates.invoiceReminder(invoice.student, invoice, schoolName);

        const mailOptions = {
          from: process.env.SMTP_USER || 'your-email@gmail.com',
          to: invoice.student.parentEmail,
          subject: emailContent.subject,
          html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          invoiceId: invoice._id,
          studentName: invoice.student.name,
          success: true,
          messageId: info.messageId
        });

      } catch (error) {
        results.push({
          invoiceId: invoice._id,
          studentName: invoice.student.name,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Invoice reminders sent. ${successful} successful, ${failed} failed.`,
      results,
      summary: { total: results.length, successful, failed }
    });

  } catch (error) {
    console.error('Invoice reminders error:', error);
    res.status(500).json({ message: 'Failed to send invoice reminders' });
  }
});

// @route   GET /api/emails/templates
// @desc    Get available email templates
// @access  Private
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = [
      {
        id: 'admissionConfirmation',
        name: 'Admission Confirmation',
        description: 'Welcome email sent to parents when a student is admitted'
      },
      {
        id: 'invoiceReminder',
        name: 'Invoice Reminder',
        description: 'Payment reminder for unpaid or partially paid invoices'
      },
      {
        id: 'exitNotification',
        name: 'Exit Notification',
        description: 'Notification sent when a student exits the playschool'
      },
      {
        id: 'customMessage',
        name: 'Custom Message',
        description: 'Send a custom message to parents'
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 