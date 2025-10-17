const mongoose = require('mongoose');

// Direct Conversation Schema - for 1-on-1 chats
const directConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Direct conversation must have exactly 2 participants'
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Unread counts for each participant
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  // Settings for each participant
  participantSettings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    customName: String,
    notifications: {
      type: String,
      enum: ['all', 'mentions', 'none'],
      default: 'all'
    }
  }],
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalFiles: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
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
directConversationSchema.index({ participants: 1 });
directConversationSchema.index({ lastActivity: -1 });

// Update timestamp
directConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
directConversationSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.toString() !== userId.toString());
};

directConversationSchema.methods.incrementUnreadCount = function(userId) {
  const count = this.unreadCounts.get(userId.toString()) || 0;
  this.unreadCounts.set(userId.toString(), count + 1);
  return this.save();
};

directConversationSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCounts.set(userId.toString(), 0);
  return this.save();
};

const DirectConversation = mongoose.model('DirectConversation', directConversationSchema);

module.exports = DirectConversation;
