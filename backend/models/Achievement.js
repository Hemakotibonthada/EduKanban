const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: String,
    required: true
  },
  badgeName: {
    type: String,
    required: true
  },
  xpEarned: {
    type: Number,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique badge per user
achievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
