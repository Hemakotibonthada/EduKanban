const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'AI Assistant Chat',
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMessage'
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    topic: String,
    tags: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    category: {
      type: String,
      enum: ['general', 'programming', 'learning', 'career', 'project-help', 'other']
    }
  },
  settings: {
    aiModel: {
      type: String,
      default: 'gpt-3.5-turbo',
      enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    systemPrompt: {
      type: String,
      default: 'You are a helpful AI learning assistant for EduKanban. Provide educational, encouraging, and practical responses.'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 100,
      max: 4000
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted last activity
aiConversationSchema.virtual('lastActivityFormatted').get(function() {
  if (!this.lastActivity) return 'Never';
  
  const now = new Date();
  const diff = now - this.lastActivity;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.lastActivity.toLocaleDateString();
});

// Instance methods
aiConversationSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

aiConversationSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  this.lastActivity = new Date();
  return this.save();
};

aiConversationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

aiConversationSchema.methods.restore = function() {
  this.status = 'active';
  return this.save();
};

// Static methods
aiConversationSchema.statics.findByUser = function(userId, options = {}) {
  const {
    status = 'active',
    limit = 20,
    page = 1,
    sortBy = 'lastActivity',
    sortOrder = -1
  } = options;

  return this.find({ 
    user: userId, 
    status: status === 'all' ? { $ne: 'deleted' } : status 
  })
    .populate('lastMessage', 'content createdAt role')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
};

aiConversationSchema.statics.createNew = function(userId, data = {}) {
  const conversation = new this({
    user: userId,
    title: data.title || 'AI Assistant Chat',
    description: data.description,
    metadata: {
      topic: data.topic,
      tags: data.tags || [],
      difficulty: data.difficulty,
      category: data.category || 'general'
    },
    settings: {
      ...data.settings,
      aiModel: data.settings?.aiModel || 'gpt-3.5-turbo'
    }
  });
  
  return conversation.save();
};

// Indexes for performance
aiConversationSchema.index({ user: 1, status: 1, lastActivity: -1 });
aiConversationSchema.index({ user: 1, 'metadata.category': 1 });
aiConversationSchema.index({ 'metadata.tags': 1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = AIConversation;