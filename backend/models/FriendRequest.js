const mongoose = require('mongoose');

// Friend Request Schema - for connecting with other users
const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'blocked'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 300
  },
  connectionReason: {
    type: String,
    enum: ['same_course', 'same_community', 'search', 'suggestion', 'mutual_friend'],
    default: 'search'
  },
  metadata: {
    mutualFriends: {
      type: Number,
      default: 0
    },
    commonCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    commonCommunities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }]
  },
  respondedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Requests expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
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

// Indexes
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });
friendRequestSchema.index({ expiresAt: 1 });

// Update timestamp
friendRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
friendRequestSchema.methods.accept = function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this.save();
};

friendRequestSchema.methods.reject = function() {
  this.status = 'rejected';
  this.respondedAt = new Date();
  return this.save();
};

friendRequestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.respondedAt = new Date();
  return this.save();
};

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
