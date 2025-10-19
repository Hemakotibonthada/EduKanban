const mongoose = require('mongoose');

const peerReviewSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PeerReviewSubmission',
    required: true,
    index: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  strengths: {
    type: String,
    required: true,
    trim: true
  },
  improvements: {
    type: String,
    required: true,
    trim: true
  },
  detailedFeedback: {
    type: String,
    trim: true,
    default: ''
  },
  isHelpful: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
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
peerReviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Prevent duplicate reviews
peerReviewSchema.index({ submissionId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('PeerReview', peerReviewSchema);
