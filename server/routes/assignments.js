const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const { auth, requireAnyRole, requireAssignmentsAccess } = require('../middleware/auth');
const { uploadAssignmentAttachment, handleUploadError, isS3Configured } = require('../middleware/upload');
const { enforceTenantScope, addTenantFilter, getTenantScope, requireTenantAccess } = require('../middleware/tenant');

const router = express.Router();

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Super Admin or Teacher with assignments module access)
router.post('/', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope,
  uploadAssignmentAttachment,
  body('title').notEmpty().withMessage('Assignment title is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('type').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'half-yearly', 'annual']).withMessage('Valid assignment type is required'),
  body('contentHtml').notEmpty().withMessage('Assignment content is required')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, classId, type, contentHtml } = req.body;
    const createdBy = getTenantScope(req.user) || req.user._id;

    // Verify the class exists and belongs to the user's tenant
    const classExists = await Class.findOne({
      _id: classId,
      ...addTenantFilter(req, {})
    });

    if (!classExists) {
      return res.status(404).json({ message: 'Class not found or access denied' });
    }

    const assignmentData = {
      title,
      classId,
      type,
      contentHtml,
      createdBy,
      lastEditedBy: req.user._id
    };

    // Add attachment if uploaded
    if (req.file) {
      assignmentData.attachmentUrl = isS3Configured 
        ? req.file.location 
        : `/uploads/assignments/${req.file.filename}`;
    }

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // Populate class name for response
    await assignment.populate('classId', 'name');

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments
// @desc    Get all assignments (filtered by tenant and optional filters)
// @access  Private (Super Admin or Teacher with assignments module access)
router.get('/', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope
], async (req, res) => {
  try {
    const { page = 1, limit = 10, classId, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by class if provided
    if (classId) {
      query.classId = classId;
    }

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    // Apply tenant filter
    query = addTenantFilter(req, query);

    const assignments = await Assignment.find(query)
      .populate('classId', 'name')
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(query);

    res.json({
      assignments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get assignment by ID
// @access  Private (Super Admin or Teacher with assignments module access)
router.get('/:id', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope,
  requireTenantAccess('Assignment')
], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('classId', 'name')
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Super Admin or Teacher with assignments module access)
router.put('/:id', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope,
  requireTenantAccess('Assignment'),
  uploadAssignmentAttachment,
  body('title').optional().notEmpty().withMessage('Assignment title cannot be empty'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  body('type').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'half-yearly', 'annual']).withMessage('Valid assignment type is required'),
  body('contentHtml').optional().notEmpty().withMessage('Assignment content cannot be empty')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const { title, classId, type, contentHtml } = req.body;

    // If classId is being updated, verify it exists and belongs to tenant
    if (classId && classId !== assignment.classId.toString()) {
      const classExists = await Class.findOne({
        _id: classId,
        ...addTenantFilter(req, {})
      });

      if (!classExists) {
        return res.status(404).json({ message: 'Class not found or access denied' });
      }
    }

    // Update fields
    if (title) assignment.title = title;
    if (classId) assignment.classId = classId;
    if (type) assignment.type = type;
    if (contentHtml) assignment.contentHtml = contentHtml;

    // Add new attachment if uploaded
    if (req.file) {
      assignment.attachmentUrl = isS3Configured 
        ? req.file.location 
        : `/uploads/assignments/${req.file.filename}`;
    }

    assignment.lastEditedBy = req.user._id;
    assignment.updatedAt = Date.now();

    await assignment.save();

    // Populate for response
    await assignment.populate('classId', 'name');
    await assignment.populate('createdBy', 'name');
    await assignment.populate('lastEditedBy', 'name');

    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Super Admin or Teacher with assignments module access)
router.delete('/:id', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope,
  requireTenantAccess('Assignment')
], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/classes/list
// @desc    Get all classes for assignment creation (tenant filtered)
// @access  Private (Super Admin or Teacher with assignments module access)
router.get('/classes/list', [
  auth,
  requireAnyRole,
  requireAssignmentsAccess,
  enforceTenantScope
], async (req, res) => {
  try {
    const query = addTenantFilter(req, {});
    const classes = await Class.find(query)
      .select('name _id')
      .sort({ name: 1 });

    res.json(classes);
  } catch (error) {
    console.error('Get classes for assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 