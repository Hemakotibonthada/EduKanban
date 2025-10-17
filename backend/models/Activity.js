const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'course_completed',
      'course_created',
      'course_shared',
      'badge_earned',
      'level_up',
      'task_completed',
      'certificate_earned',
      'milestone_reached',
      'achievement_unlocked'
    ]
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  badge: {
    name: String,
    icon: String,
    description: String
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Index for faster queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

// Method to add like
activitySchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to remove like
activitySchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
activitySchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to create activity
activitySchema.statics.createActivity = async function(data) {
  const activity = new this(data);
  await activity.save();
  return activity;
};

module.exports = mongoose.model('Activity', activitySchema);
