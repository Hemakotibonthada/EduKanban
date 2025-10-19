const mongoose = require('mongoose');

const peerReviewSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['programming', 'design', 'writing', 'research', 'general'],
    default: 'general'
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  fileUrl: {
    type: String,
    trim: true,
    default: ''
  },
  requiredReviews: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PeerReview'
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
peerReviewSubmissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update status when required reviews are met
peerReviewSubmissionSchema.pre('save', function(next) {
  if (this.reviews.length >= this.requiredReviews) {
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('PeerReviewSubmission', peerReviewSubmissionSchema);
