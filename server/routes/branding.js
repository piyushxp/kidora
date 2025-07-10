const express = require('express');
const { body, validationResult } = require('express-validator');
const BrandSettings = require('../models/BrandSettings');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { uploadLogo, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/branding
// @desc    Get current brand settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    let brandSettings = await BrandSettings.findOne({ isActive: true });

    // If no brand settings exist, create default ones
    if (!brandSettings) {
      brandSettings = new BrandSettings({
        schoolName: 'Playschool Manager',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        tagline: 'Nurturing Young Minds',
        isActive: true
      });
      await brandSettings.save();
    }

    res.json(brandSettings);
  } catch (error) {
    console.error('Get brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/branding/history
// @desc    Get brand settings history (Super Admin only)
// @access  Private (Super Admin)
router.get('/history', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const brandSettings = await BrandSettings.find()
      .populate('updatedBy', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BrandSettings.countDocuments();

    res.json({
      brandSettings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get brand history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/branding/preview
// @desc    Get brand preview data for frontend
// @access  Public
router.get('/preview', async (req, res) => {
  try {
    const brandSettings = await BrandSettings.findOne({ isActive: true });

    if (!brandSettings) {
      return res.json({
        schoolName: 'Playschool Manager',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        tagline: 'Nurturing Young Minds',
        logo: null,
        address: null,
        phone: null,
        email: null,
        website: null
      });
    }

    // Return only the necessary data for frontend preview
    res.json({
      schoolName: brandSettings.schoolName,
      primaryColor: brandSettings.primaryColor,
      secondaryColor: brandSettings.secondaryColor,
      tagline: brandSettings.tagline,
      logo: brandSettings.logo,
      address: brandSettings.address,
      phone: brandSettings.phone,
      email: brandSettings.email,
      website: brandSettings.website
    });
  } catch (error) {
    console.error('Get brand preview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/branding/settings
// @desc    Get current brand settings for dashboard/app usage
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    let brandSettings = await BrandSettings.findOne({ isActive: true });

    // If no brand settings exist, create default ones
    if (!brandSettings) {
      brandSettings = new BrandSettings({
        schoolName: 'Playschool Manager',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        tagline: 'Nurturing Young Minds',
        address: '',
        phone: '',
        email: '',
        website: '',
        isActive: true
      });
      await brandSettings.save();
    }

    res.json(brandSettings);
  } catch (error) {
    console.error('Get brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/branding/settings
// @desc    Update current brand settings
// @access  Private (Super Admin)
router.put('/settings', [
  auth,
  requireSuperAdmin,
  uploadLogo,
  body('schoolName').optional().notEmpty().withMessage('School name cannot be empty'),
  body('primaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid primary color hex code is required'),
  body('secondaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid secondary color hex code is required'),
  body('tagline').optional().isLength({ max: 200 }).withMessage('Tagline must be less than 200 characters'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // Get the current active brand settings
    let brandSettings = await BrandSettings.findOne({ isActive: true });

    if (!brandSettings) {
      // If no brand settings exist, create new one
      const brandData = {
        ...req.body,
        isActive: true,
        updatedBy: req.user._id
      };

      // Add logo if uploaded
      if (req.file) {
        brandData.logo = `/uploads/branding/${req.file.filename}`;
      }

      brandSettings = new BrandSettings(brandData);
      await brandSettings.save();
    } else {
      // Update existing brand settings
      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      // Add logo if uploaded
      if (req.file) {
        updateData.logo = `/uploads/branding/${req.file.filename}`;
      }

      brandSettings = await BrandSettings.findByIdAndUpdate(
        brandSettings._id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    res.json({
      message: 'Brand settings updated successfully',
      brandSettings
    });
  } catch (error) {
    console.error('Update brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/branding
// @desc    Create brand settings (Super Admin only)
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  uploadLogo,
  body('schoolName').notEmpty().withMessage('School name is required'),
  body('primaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid primary color hex code is required'),
  body('secondaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid secondary color hex code is required'),
  body('tagline').optional().isLength({ max: 200 }).withMessage('Tagline must be less than 200 characters'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // Deactivate any existing brand settings
    await BrandSettings.updateMany({}, { isActive: false });

    const {
      schoolName,
      primaryColor,
      secondaryColor,
      tagline,
      address,
      phone,
      email,
      website
    } = req.body;

    const brandData = {
      schoolName,
      primaryColor,
      secondaryColor,
      tagline,
      address,
      phone,
      email,
      website,
      isActive: true,
      updatedBy: req.user._id
    };

    // Add logo if uploaded
    if (req.file) {
      brandData.logo = `/uploads/branding/${req.file.filename}`;
    }

    const brandSettings = new BrandSettings(brandData);
    await brandSettings.save();

    res.status(201).json({
      message: 'Brand settings created successfully',
      brandSettings
    });
  } catch (error) {
    console.error('Create brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/branding/:id
// @desc    Update brand settings (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  uploadLogo,
  body('schoolName').optional().notEmpty().withMessage('School name cannot be empty'),
  body('primaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid primary color hex code is required'),
  body('secondaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid secondary color hex code is required'),
  body('tagline').optional().isLength({ max: 200 }).withMessage('Tagline must be less than 200 characters'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required')
], handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const brandSettings = await BrandSettings.findById(req.params.id);
    
    if (!brandSettings) {
      return res.status(404).json({ message: 'Brand settings not found' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Add logo if uploaded
    if (req.file) {
      updateData.logo = `/uploads/branding/${req.file.filename}`;
    }

    const updatedBrandSettings = await BrandSettings.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Brand settings updated successfully',
      brandSettings: updatedBrandSettings
    });
  } catch (error) {
    console.error('Update brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/branding/:id/logo
// @desc    Update brand logo (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/logo', [
  auth,
  requireSuperAdmin,
  uploadLogo
], handleUploadError, async (req, res) => {
  try {
    const brandSettings = await BrandSettings.findById(req.params.id);
    
    if (!brandSettings) {
      return res.status(404).json({ message: 'Brand settings not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No logo uploaded' });
    }

    brandSettings.logo = `/uploads/branding/${req.file.filename}`;
    brandSettings.updatedBy = req.user._id;
    await brandSettings.save();

    res.json({
      message: 'Logo updated successfully',
      brandSettings
    });
  } catch (error) {
    console.error('Update logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/branding/:id/colors
// @desc    Update brand colors (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/colors', [
  auth,
  requireSuperAdmin,
  body('primaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid primary color hex code is required'),
  body('secondaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'i').withMessage('Valid secondary color hex code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { primaryColor, secondaryColor } = req.body;

    const brandSettings = await BrandSettings.findById(req.params.id);
    
    if (!brandSettings) {
      return res.status(404).json({ message: 'Brand settings not found' });
    }

    brandSettings.primaryColor = primaryColor;
    brandSettings.secondaryColor = secondaryColor;
    brandSettings.updatedBy = req.user._id;
    await brandSettings.save();

    res.json({
      message: 'Colors updated successfully',
      brandSettings
    });
  } catch (error) {
    console.error('Update colors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/branding/:id
// @desc    Delete brand settings (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const brandSettings = await BrandSettings.findById(req.params.id);
    
    if (!brandSettings) {
      return res.status(404).json({ message: 'Brand settings not found' });
    }

    // Don't allow deletion of active brand settings
    if (brandSettings.isActive) {
      return res.status(400).json({ message: 'Cannot delete active brand settings' });
    }

    await BrandSettings.findByIdAndDelete(req.params.id);

    res.json({ message: 'Brand settings deleted successfully' });
  } catch (error) {
    console.error('Delete brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/branding/:id/activate
// @desc    Activate brand settings (Super Admin only)
// @access  Private (Super Admin)
router.post('/:id/activate', [auth, requireSuperAdmin], async (req, res) => {
  try {
    // Deactivate all other brand settings
    await BrandSettings.updateMany({}, { isActive: false });

    // Activate the specified brand settings
    const brandSettings = await BrandSettings.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.user._id },
      { new: true }
    );

    if (!brandSettings) {
      return res.status(404).json({ message: 'Brand settings not found' });
    }

    res.json({
      message: 'Brand settings activated successfully',
      brandSettings
    });
  } catch (error) {
    console.error('Activate brand settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 