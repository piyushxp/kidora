const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['dev_admin', 'super_admin', 'teacher'],
    default: 'teacher'
  },
  phone: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  // Super Admin specific fields
  isActive: {
    type: Boolean,
    default: true
  },
  hasPaidThisMonth: {
    type: Boolean,
    default: false
  },
  accessibleModules: {
    teachers: { type: Boolean, default: true },
    students: { type: Boolean, default: true },
    classes: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    gallery: { type: Boolean, default: true },
    stockManagement: { type: Boolean, default: false },
    assignments: { type: Boolean, default: false }
  },
  schoolName: { type: String },
  schoolAddress: { type: String },
  country: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // dev_admin ID
  assignedClass: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema); 