const mongoose = require('mongoose');

// Community Schema - for creating learning communities
const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String, // URL to community image
    default: null
  },
  banner: {
    type: String, // URL to banner image
    default: null
  },
  type: {
    type: String,
    enum: ['public', 'private', 'course-based'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['study-group', 'course-community', 'project-team', 'interest-based', 'general'],
    default: 'general'
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
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canInvite: { type: Boolean, default: false },
      canCreateChannels: { type: Boolean, default: false },
      canManageMessages: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false }
    }
  }],
  pendingInvites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 100 * 1024 * 1024 // 100MB in bytes
    },
    allowedFileTypes: [{
      type: String,
      default: ['image/*', 'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'video/*', 'text/*']
    }]
  },
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalChannels: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
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
communitySchema.index({ name: 'text', description: 'text', tags: 'text' });
communitySchema.index({ creator: 1 });
communitySchema.index({ 'members.user': 1 });
communitySchema.index({ type: 1, category: 1 });
communitySchema.index({ relatedCourse: 1 });

// Update stats before saving
communitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.stats.totalMembers = this.members.length;
  this.stats.totalChannels = this.channels.length;
  next();
});

// Methods
communitySchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

communitySchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

communitySchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return false;
  
  // Owners and admins have all permissions
  if (member.role === 'owner' || member.role === 'admin') return true;
  
  return member.permissions[permission] === true;
};

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
