const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: true
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

// Index for efficient querying
galleryImageSchema.index({ uploadedAt: -1 });
galleryImageSchema.index({ classTags: 1, uploadedAt: -1 });
galleryImageSchema.index({ uploadedBy: 1, uploadedAt: -1 });

// Update timestamp on save
galleryImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema); 