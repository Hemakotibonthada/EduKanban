const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  duration: {
    type: String
  },
  grade: {
    type: String
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  examAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt'
  },
  weakAreasAddressed: [{
    category: String,
    status: {
      type: String,
      enum: ['identified', 'remediated', 'mastered'],
      default: 'identified'
    }
  }],
  skills: [{
    type: String
  }],
  template: {
    type: String,
    default: 'default',
    enum: ['default', 'modern', 'elegant', 'professional']
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date
  },
  revokedReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster lookups
certificateSchema.index({ user: 1, course: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ user: 1, issueDate: -1 });
certificateSchema.index({ isRevoked: 1 });

// Virtual for certificate URL
certificateSchema.virtual('verificationUrl').get(function() {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${this.verificationCode}`;
});

// Method to revoke certificate
certificateSchema.methods.revoke = function(reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

module.exports = mongoose.model('Certificate', certificateSchema);
