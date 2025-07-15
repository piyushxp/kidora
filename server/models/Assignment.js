const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'half-yearly', 'annual'],
    required: true
  },
  contentHtml: {
    type: String,
    required: true
  },
  attachmentUrl: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
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

// Update timestamp on save
assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for tenant isolation and efficient queries
assignmentSchema.index({ createdBy: 1, classId: 1 });
assignmentSchema.index({ createdBy: 1, type: 1 });
assignmentSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema); 