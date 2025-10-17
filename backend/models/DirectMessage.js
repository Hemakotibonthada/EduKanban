const mongoose = require('mongoose');

// Direct Message Schema - Enhanced version with all features
const directMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Target can be a user (DM), channel, or group
  targetType: {
    type: String,
    enum: ['user', 'channel', 'group', 'community'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  content: {
    type: String,
    maxlength: 4000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'video', 'audio', 'system', 'code', 'poll'],
    default: 'text'
  },
  // File attachments
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileAttachment'
  }],
  // Message features
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage',
    default: null
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage',
    default: null
  },
  threadReplies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage'
  }],
  // Status tracking
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message management
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pinnedAt: {
    type: Date,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Starred/saved messages
  starredBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Forward tracking
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage',
    default: null
  },
  forwardCount: {
    type: Number,
    default: 0
  },
  // Code block specific
  codeLanguage: {
    type: String,
    default: null
  },
  // Poll specific
  pollData: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    allowMultiple: {
      type: Boolean,
      default: false
    },
    endsAt: Date
  },
  // Metadata
  metadata: {
    platform: String, // web, mobile, desktop
    version: String,
    ipAddress: String
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
directMessageSchema.index({ sender: 1, createdAt: -1 });
directMessageSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
directMessageSchema.index({ threadId: 1 });
directMessageSchema.index({ status: 1 });
directMessageSchema.index({ isPinned: 1, targetId: 1 });
directMessageSchema.index({ mentions: 1 });
directMessageSchema.index({ 'reactions.user': 1 });
directMessageSchema.index({ content: 'text' }); // For search

// Update timestamp
directMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
directMessageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    return false; // Already reacted with this emoji
  }
  
  this.reactions.push({ user: userId, emoji });
  return true;
};

directMessageSchema.methods.removeReaction = function(userId, emoji) {
  const index = this.reactions.findIndex(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (index > -1) {
    this.reactions.splice(index, 1);
    return true;
  }
  
  return false;
};

directMessageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
    return true;
  }
  
  return false;
};

directMessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);

module.exports = DirectMessage;
