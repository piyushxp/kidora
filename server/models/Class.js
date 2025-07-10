const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assistantTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    trim: true
  },
  schedule: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    daysOfWeek: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  subjects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  currentEnrollment: {
    type: Number,
    default: 0,
    min: 0
  },
  feeStructure: {
    monthlyFee: {
      type: Number,
      required: true,
      min: 0
    },
    transportFee: {
      type: Number,
      default: 0,
      min: 0
    },
    activityFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  ageGroup: {
    minAge: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    maxAge: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
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

// Validate that classTeacher is actually a teacher
classSchema.pre('save', async function(next) {
  if (this.isModified('classTeacher')) {
    const User = mongoose.model('User');
    const teacher = await User.findById(this.classTeacher);
    if (!teacher || teacher.role !== 'teacher') {
      next(new Error('Class teacher must be a user with teacher role'));
    }
  }
  
  // Validate assistant teachers
  if (this.isModified('assistantTeachers')) {
    const User = mongoose.model('User');
    for (const teacherId of this.assistantTeachers) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        next(new Error('Assistant teachers must be users with teacher role'));
      }
    }
  }
  
  // Validate age group
  if (this.ageGroup.minAge > this.ageGroup.maxAge) {
    next(new Error('Minimum age cannot be greater than maximum age'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
classSchema.index({ academicYear: 1, isActive: 1 });
classSchema.index({ classTeacher: 1 });

module.exports = mongoose.model('Class', classSchema); 