const express = require('express');
const { body, validationResult } = require('express-validator');
const GalleryImage = require('../models/GalleryImage');
const Class = require('../models/Class');
const { auth, requireAnyRole } = require('../middleware/auth');
const { uploadMultiplePhotos, handleUploadError, isS3Configured } = require('../middleware/upload');

const router = express.Router();

// Helper function to get file URL based on storage type
const getFileUrl = (file) => {
  if (isS3Configured) {
    return file.location; // S3 provides the full URL
  } else {
    return `/uploads/gallery/photos/${file.filename}`;
  }
};

// @route   POST /api/gallery/upload
// @desc    Upload gallery images with class tags
// @access  Private
router.post('/upload', [
  auth,
  uploadMultiplePhotos,
  body('title').notEmpty().withMessage('Title is required'),
  body('caption').optional().trim()
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, caption, classTags } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Parse tags if they come as strings
    let parsedClassTags = [];

    if (classTags) {
      try {
        parsedClassTags = typeof classTags === 'string' ? JSON.parse(classTags) : classTags;
        
        // Ensure it's an array
        if (!Array.isArray(parsedClassTags)) {
          return res.status(400).json({ message: 'Class tags must be an array' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid class tags format' });
      }
    }

    // Validate class tags
    if (parsedClassTags.length > 0) {
      const validClasses = await Class.find({ 
        _id: { $in: parsedClassTags }, 
        isActive: true 
      });
      if (validClasses.length !== parsedClassTags.length) {
        return res.status(400).json({ message: 'Some class tags are invalid' });
      }
    }

    const uploadedImages = [];

    // Create gallery records for each uploaded file
    for (const file of req.files) {
      const imageUrl = getFileUrl(file);

      const galleryImage = new GalleryImage({
        title: req.files.length === 1 ? title : `${title} - ${file.originalname}`,
        caption: caption || '',
        imageUrl,
        uploadedBy: req.user._id,
        classTags: parsedClassTags
      });

      await galleryImage.save();
      uploadedImages.push(galleryImage);
    }

    // Populate the uploaded images with references
    const populatedImages = await GalleryImage.find({ 
      _id: { $in: uploadedImages.map(img => img._id) }
    })
    .populate('uploadedBy', 'name')
    .populate('classTags', 'name');

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: populatedImages
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gallery/search
// @desc    Search gallery images by class tags
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      classId, 
      page = 1, 
      limit = 12,
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Build search query
    if (classId) {
      query.classTags = { $in: [classId] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute search with pagination
    const images = await GalleryImage.find(query)
      .populate('uploadedBy', 'name')
      .populate('classTags', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GalleryImage.countDocuments(query);

    res.json({
      images,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Gallery search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gallery
// @desc    Get all gallery images (with optional filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12,
      search = '',
      classId = '',
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Text search in title and caption
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by class
    if (classId) {
      query.classTags = { $in: [classId] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const images = await GalleryImage.find(query)
      .populate('uploadedBy', 'name')
      .populate('classTags', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GalleryImage.countDocuments(query);

    res.json({
      images,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Gallery get all error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gallery/:id
// @desc    Get gallery image by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id)
      .populate('uploadedBy', 'name')
      .populate('classTags', 'name');

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    console.error('Gallery get by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery image details
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('caption').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const image = await GalleryImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if user can modify this image (only uploader or admin)
    if (req.user.role !== 'super_admin' && image.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, caption, classTags } = req.body;

    // Update fields if provided
    if (title) image.title = title;
    if (caption !== undefined) image.caption = caption;
    
    if (classTags !== undefined) {
      let parsedClassTags = [];
      
      if (classTags) {
        try {
          parsedClassTags = typeof classTags === 'string' ? JSON.parse(classTags) : classTags;
          
          // Ensure it's an array
          if (!Array.isArray(parsedClassTags)) {
            return res.status(400).json({ message: 'Class tags must be an array' });
          }
        } catch (error) {
          return res.status(400).json({ message: 'Invalid class tags format' });
        }
      }
      
      image.classTags = parsedClassTags;
    }

    await image.save();

    // Return populated image
    const updatedImage = await GalleryImage.findById(image._id)
      .populate('uploadedBy', 'name')
      .populate('classTags', 'name');

    res.json({
      message: 'Image updated successfully',
      image: updatedImage
    });
  } catch (error) {
    console.error('Gallery update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery image
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if user can delete this image (only uploader or admin)
    if (req.user.role !== 'super_admin' && image.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await GalleryImage.findByIdAndDelete(req.params.id);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gallery/filters/options
// @desc    Get filter options (classes only)
// @access  Private
router.get('/filters/options', auth, async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true }).select('name').sort({ name: 1 });

    res.json({
      classes
    });
  } catch (error) {
    console.error('Gallery filter options error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 