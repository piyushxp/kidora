const mongoose = require('mongoose');

const brandSettingsSchema = new mongoose.Schema({
  logo: {
    type: String,
    trim: true
  },
  primaryColor: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Primary color must be a valid hex color code'
    }
  },
  secondaryColor: {
    type: String,
    default: '#1E40AF',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Secondary color must be a valid hex color code'
    }
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: 200
  },
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one active brand setting per tenant
brandSettingsSchema.index({ createdBy: 1, isActive: 1 }, { unique: true, sparse: true });

// Update timestamp on save
brandSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BrandSettings', brandSettingsSchema); 