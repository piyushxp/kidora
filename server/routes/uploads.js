const express = require('express');
const { body, validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const { auth, requireTeacher, requireAnyRole } = require('../middleware/auth');
const { uploadMultiplePhotos, handleUploadError, isS3Configured } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/uploads/photos
// @desc    Upload photos (Teachers only)
// @access  Private (Teachers)
router.post('/photos', [
  auth,
  requireTeacher,
  uploadMultiplePhotos,
  body('title').notEmpty().withMessage('Title is required'),
  body('className').notEmpty().withMessage('Class name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('caption').optional().notEmpty().withMessage('Caption cannot be empty'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, className, date, caption, tags } = req.body;

    // Check if teacher can upload for this class
    if (req.user.assignedClass !== className) {
      return res.status(403).json({ message: 'You can only upload photos for your assigned class' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    const uploadedPhotos = [];

    // Create photo records for each uploaded file
    for (const file of req.files) {
      const imageUrl = isS3Configured 
        ? file.location 
        : `/uploads/photos/${file.filename}`;

      const photo = new Photo({
        title: `${title} - ${file.originalname}`,
        caption,
        imageUrl,
        className,
        date: new Date(date),
        uploadedBy: req.user._id,
        tags: tags || []
      });

      await photo.save();
      uploadedPhotos.push(photo);
    }

    res.status(201).json({
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/uploads/photos
// @desc    Get photos (filtered by role)
// @access  Private
router.get('/photos', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, class: className, date, tags } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by class
    if (className) {
      query.className = className;
    } else if (req.user.role === 'teacher') {
      // Teachers can only see photos from their class
      query.className = req.user.assignedClass;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const photos = await Photo.find(query)
      .populate('uploadedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Photo.countDocuments(query);

    res.json({
      photos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/uploads/photos/gallery
// @desc    Get photos organized by date and class
// @access  Private
router.get('/photos/gallery', auth, async (req, res) => {
  try {
    const { class: className, startDate, endDate } = req.query;

    let query = {};

    // Filter by class
    if (className) {
      query.className = className;
    } else if (req.user.role === 'teacher') {
      query.className = req.user.assignedClass;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const photos = await Photo.find(query)
      .populate('uploadedBy', 'name')
      .sort({ date: -1, createdAt: -1 });

    // Organize photos by date and class
    const gallery = {};
    photos.forEach(photo => {
      const dateKey = photo.date.toISOString().split('T')[0];
      if (!gallery[dateKey]) {
        gallery[dateKey] = {};
      }
      if (!gallery[dateKey][photo.className]) {
        gallery[dateKey][photo.className] = [];
      }
      gallery[dateKey][photo.className].push(photo);
    });

    res.json(gallery);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/uploads/photos/stats
// @desc    Get photo statistics
// @access  Private
router.get('/photos/stats', auth, async (req, res) => {
  try {
    const { class: className, startDate, endDate } = req.query;

    let query = {};

    // Filter by class
    if (className) {
      query.className = className;
    } else if (req.user.role === 'teacher') {
      query.className = req.user.assignedClass;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Photo.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            className: '$className'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.className',
          totalPhotos: { $sum: '$count' },
          dates: { $sum: 1 }
        }
      }
    ]);

    const totalPhotos = await Photo.countDocuments(query);
    const uniqueClasses = await Photo.distinct('className', query);

    res.json({
      totalPhotos,
      uniqueClasses: uniqueClasses.length,
      classStats: stats,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get photo stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/uploads/photos/:id
// @desc    Get photo by ID
// @access  Private
router.get('/photos/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('uploadedBy', 'name');

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check access permissions
    if (req.user.role === 'teacher' && photo.className !== req.user.assignedClass) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/uploads/photos/:id
// @desc    Update photo details (Teachers only)
// @access  Private (Teachers)
router.put('/photos/:id', [
  auth,
  requireTeacher,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('caption').optional().notEmpty().withMessage('Caption cannot be empty'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if teacher can modify this photo
    if (photo.className !== req.user.assignedClass) {
      return res.status(403).json({ message: 'You can only modify photos from your assigned class' });
    }

    const { title, caption, tags } = req.body;

    if (title) photo.title = title;
    if (caption !== undefined) photo.caption = caption;
    if (tags) photo.tags = tags;

    await photo.save();

    res.json({
      message: 'Photo updated successfully',
      photo
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/uploads/photos/:id
// @desc    Delete photo (Teachers only)
// @access  Private (Teachers)
router.delete('/photos/:id', [auth, requireTeacher], async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if teacher can delete this photo
    if (photo.className !== req.user.assignedClass) {
      return res.status(403).json({ message: 'You can only delete photos from your assigned class' });
    }

    await Photo.findByIdAndDelete(req.params.id);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/uploads/photos/tags
// @desc    Get all unique tags
// @access  Private
router.get('/photos/tags', auth, async (req, res) => {
  try {
    let query = {};

    // Filter by class for teachers
    if (req.user.role === 'teacher') {
      query.className = req.user.assignedClass;
    }

    const tags = await Photo.distinct('tags', query);
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 