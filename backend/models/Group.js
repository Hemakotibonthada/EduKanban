const mongoose = require('mongoose');

// Group Schema - for private group chats
const groupSchema = new mongoose.Schema({
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
  avatar: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    nickname: String,
    isMuted: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 100 * 1024 * 1024 // 100MB
    },
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: {
        type: Number, // in hours
        default: 24
      }
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
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
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ lastActivity: -1 });
groupSchema.index({ name: 'text', description: 'text' });

// Update timestamps
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

groupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && (member.role === 'admin' || this.creator.toString() === userId.toString());
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
