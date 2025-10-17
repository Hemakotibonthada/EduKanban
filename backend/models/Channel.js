const mongoose = require('mongoose');

// Channel Schema - for channels within communities
const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 300
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'announcement', 'resources'],
    default: 'text'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allowedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage'
  }],
  settings: {
    allowReactions: {
      type: Boolean,
      default: true
    },
    allowThreads: {
      type: Boolean,
      default: true
    },
    slowMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      interval: {
        type: Number,
        default: 5 // seconds
      }
    },
    onlyAdminsPost: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalThreads: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
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
channelSchema.index({ community: 1, order: 1 });
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ type: 1 });

// Update timestamps
channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
channelSchema.methods.canAccess = function(userId, userRole) {
  if (this.visibility === 'public') return true;
  if (userRole === 'owner' || userRole === 'admin') return true;
  
  if (this.visibility === 'private' || this.visibility === 'restricted') {
    return this.allowedMembers.some(m => m.toString() === userId.toString());
  }
  
  return false;
};

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
