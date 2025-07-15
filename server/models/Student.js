const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  parentEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  parentPhone: {
    type: String,
    required: true,
    trim: true
  },
  parentAddress: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  assignedClass: {
    type: String,
    required: true,
    trim: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documents: {
    photo: {
      type: String
    },
    birthCertificate: {
      type: String
    },
    idProof: {
      type: String
    }
  },
  medicalInfo: {
    allergies: [String],
    medications: [String],
    specialNeeds: String
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: 'O+' // or leave undefined if not provided
  },
  feeStructure: {
    monthlyFee: {
      type: Number,
      required: true
    },
    transportFee: {
      type: Number,
      default: 0
    },
    otherFees: {
      type: Number,
      default: 0
    }
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

// Update timestamp on save
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema); 