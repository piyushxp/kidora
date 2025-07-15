const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { auth, requireSuperAdmin, requireAnyRole } = require('../middleware/auth');
const { uploadPhoto, uploadDocument, handleUploadError, uploadStudentFiles, isS3Configured } = require('../middleware/upload');
const { enforceTenantScope, addTenantFilter, getTenantScope, requireTenantAccess } = require('../middleware/tenant');

const router = express.Router();

// Helper function to get file URL based on storage type
const getFileUrl = (file) => {
  if (isS3Configured) {
    // For S3, multer-s3 provides the location URL
    return file.location;
  } else {
    // For local storage, construct the path
    return `/uploads/${file.filename}`;
  }
};

// @route   POST /api/students
// @desc    Add new student (Super Admin only)
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  uploadStudentFiles,
  body('name').notEmpty().withMessage('Student name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('parentName').notEmpty().withMessage('Parent name is required'),
  body('parentEmail').isEmail().withMessage('Valid parent email is required'),
  body('parentPhone').notEmpty().withMessage('Parent phone is required'),
  body('parentAddress').notEmpty().withMessage('Parent address is required'),
  // body('assignedClass').notEmpty().withMessage('Assigned class is required'),
  body('ageGroup.maxAge').isInt({ min: 1, max: 10 }).withMessage('Maximum age must be between 1 and 10'),
  body('bloodGroup').optional().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      name,
      dateOfBirth,
      gender,
      parentName,
      parentEmail,
      parentPhone,
      parentAddress,
      emergencyContact,
      assignedClass,
      feeStructure,
      medicalInfo,
      isActive
    } = req.body;

    const studentData = {
      name,
      dateOfBirth,
      gender,
      parentName,
      parentEmail,
      parentPhone,
      parentAddress,
      assignedClass,
      bloodGroup: req.body.bloodGroup,
      isActive: isActive === 'true' || isActive === true || true, // Default to true if not provided
      createdBy: getTenantScope(req.user) || req.user._id // Set createdBy for tenant isolation
    };

    // Add fee structure if provided
    if (feeStructure) {
      try {
        const fees = JSON.parse(feeStructure);
        
        // Validate that monthlyFee is provided and valid
        if (!fees.monthlyFee || isNaN(parseFloat(fees.monthlyFee)) || parseFloat(fees.monthlyFee) <= 0) {
          return res.status(400).json({ message: 'Valid monthly fee is required' });
        }
        
        studentData.feeStructure = {
          monthlyFee: parseFloat(fees.monthlyFee),
          transportFee: parseFloat(fees.transportFee || 0),
          otherFees: parseFloat(fees.otherFees || 0)
        };
      } catch (error) {
        return res.status(400).json({ message: 'Invalid fee structure format' });
      }
    } else {
      return res.status(400).json({ message: 'Fee structure is required' });
    }

    // Handle file uploads
    if (req.files) {
      studentData.documents = {};
      
      if (req.files.photo && req.files.photo[0]) {
        studentData.documents.photo = isS3Configured 
          ? req.files.photo[0].location 
          : `/uploads/photos/${req.files.photo[0].filename}`;
      }
      if (req.files.birthCertificate && req.files.birthCertificate[0]) {
        studentData.documents.birthCertificate = isS3Configured 
          ? req.files.birthCertificate[0].location 
          : `/uploads/documents/${req.files.birthCertificate[0].filename}`;
      }
      if (req.files.idProof && req.files.idProof[0]) {
        studentData.documents.idProof = isS3Configured 
          ? req.files.idProof[0].location 
          : `/uploads/documents/${req.files.idProof[0].filename}`;
      }
    }

    // Add emergency contact if provided
    if (emergencyContact) {
      try {
        const contact = JSON.parse(emergencyContact);
        studentData.emergencyContact = contact;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid emergency contact format' });
      }
    }

    // Add medical info if provided
    if (medicalInfo) {
      try {
        const medical = JSON.parse(medicalInfo);
        studentData.medicalInfo = medical;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid medical info format' });
      }
    }

    const student = new Student(studentData);
    await student.save();

    res.status(201).json({
      message: 'Student added successfully',
      student
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students
// @desc    Get all students (filtered by role)
// @access  Private
router.get('/', auth, enforceTenantScope, async (req, res) => {
  try {
    const { page = 1, limit = 10, class: className, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Teachers can only see students in their assigned class
    if (req.user.role === 'teacher') {
      query.assignedClass = req.user.assignedClass;
    }

    // Filter by class if provided
    if (className) {
      query.assignedClass = className;
    }

    // Filter by status if provided, otherwise default to active students only
    if (status) {
      query.isActive = status === 'active';
    } else {
      // Default: only show active students
      query.isActive = true;
    }

    // Apply tenant filter
    query = addTenantFilter(req, query);

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/classes
// @desc    Get all unique classes
// @access  Private
router.get('/classes', auth, enforceTenantScope, async (req, res) => {
  try {
    const filter = addTenantFilter(req, {});
    const classes = await Student.distinct('assignedClass', filter);
    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, enforceTenantScope, requireTenantAccess('Student'), async (req, res) => {
  try {
    const filter = addTenantFilter(req, { _id: req.params.id });
    const student = await Student.findOne(filter);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Teachers can only access students in their class
    if (req.user.role === 'teacher' && student.assignedClass !== req.user.assignedClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  enforceTenantScope,
  requireTenantAccess('Student'),
  uploadStudentFiles
], handleUploadError, async (req, res) => {
  try {
    const {
      emergencyContact,
      feeStructure,
      medicalInfo,
      isActive,
      ...otherFields
    } = req.body;

    const updateData = { ...otherFields };

    // Convert isActive string to boolean
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }

    // Parse and add fee structure if provided
    if (feeStructure) {
      try {
        const fees = JSON.parse(feeStructure);
        updateData.feeStructure = {
          monthlyFee: parseFloat(fees.monthlyFee || 0),
          transportFee: parseFloat(fees.transportFee || 0),
          otherFees: parseFloat(fees.otherFees || 0)
        };
      } catch (error) {
        return res.status(400).json({ message: 'Invalid fee structure format' });
      }
    }

    // Parse and add emergency contact if provided
    if (emergencyContact) {
      try {
        const contact = JSON.parse(emergencyContact);
        updateData.emergencyContact = contact;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid emergency contact format' });
      }
    }

    // Parse and add medical info if provided
    if (medicalInfo) {
      try {
        const medical = JSON.parse(medicalInfo);
        updateData.medicalInfo = medical;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid medical info format' });
      }
    }

    // Handle file uploads
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update documents if files were uploaded
    if (req.files) {
      if (!student.documents) {
        student.documents = {};
      }

      if (req.files.photo && req.files.photo[0]) {
        student.documents.photo = isS3Configured 
          ? req.files.photo[0].location 
          : `/uploads/photos/${req.files.photo[0].filename}`;
      }
      if (req.files.birthCertificate && req.files.birthCertificate[0]) {
        student.documents.birthCertificate = isS3Configured 
          ? req.files.birthCertificate[0].location 
          : `/uploads/documents/${req.files.birthCertificate[0].filename}`;
      }
      if (req.files.idProof && req.files.idProof[0]) {
        student.documents.idProof = isS3Configured 
          ? req.files.idProof[0].location 
          : `/uploads/documents/${req.files.idProof[0].filename}`;
      }
    }

    // Update the student with new data
    Object.assign(student, updateData);
    await student.save();

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id/status
// @desc    Toggle student active status (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/status', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = !student.isActive;
    await student.save();

    res.json({
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      student
    });
  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students/:id/documents
// @desc    Upload student documents (Super Admin only)
// @access  Private (Super Admin)
router.post('/:id/documents', [
  auth,
  requireSuperAdmin,
  uploadDocument
], handleUploadError, async (req, res) => {
  try {
    const { documentType } = req.body; // birthCertificate, idProof
    
    if (!['birthCertificate', 'idProof'].includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded' });
    }

    const fileUrl = isS3Configured 
      ? req.file.location 
      : `/uploads/documents/${req.file.filename}`;

    student.documents[documentType] = fileUrl;
    await student.save();

    res.json({
      message: 'Document uploaded successfully',
      student
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Deactivate student (instead of deleting) (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Deactivate the student instead of deleting
    student.isActive = false;
    await student.save();

    res.json({
      message: 'Student deactivated successfully',
      student
    });
  } catch (error) {
    console.error('Deactivate student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 