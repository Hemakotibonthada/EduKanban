const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 8000
  },
  metadata: {
    // For user messages
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // For AI responses
    aiModel: String,
    temperature: Number,
    maxTokens: Number,
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    
    // Message processing info
    processingTime: Number, // milliseconds
    requestId: String,
    
    // Content analysis
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    topics: [String],
    confidence: Number,
    
    // Interaction data
    helpful: {
      type: Boolean,
      default: null
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed', 'processing'],
    default: 'sent',
    index: true
  },
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
aiMessageSchema.virtual('timeAgo').get(function() {
  if (!this.createdAt) return '';
  
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Virtual for token cost calculation (rough estimate)
aiMessageSchema.virtual('estimatedCost').get(function() {
  if (!this.metadata?.totalTokens) return 0;
  
  // Rough pricing estimates (in USD)
  const pricing = {
    'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens
    'gpt-4': 0.03 / 1000,          // $0.03 per 1K tokens
    'gpt-4-turbo': 0.01 / 1000     // $0.01 per 1K tokens
  };
  
  const model = this.metadata.aiModel || 'gpt-3.5-turbo';
  const rate = pricing[model] || pricing['gpt-3.5-turbo'];
  
  return (this.metadata.totalTokens * rate).toFixed(6);
});

// Instance methods
aiMessageSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

aiMessageSchema.methods.markAsHelpful = function(helpful, feedback = '') {
  this.metadata.helpful = helpful;
  if (feedback) {
    this.metadata.feedback = feedback;
  }
  return this.save();
};

aiMessageSchema.methods.rate = function(rating, feedback = '') {
  if (rating >= 1 && rating <= 5) {
    this.metadata.rating = rating;
  }
  if (feedback) {
    this.metadata.feedback = feedback;
  }
  return this.save();
};

aiMessageSchema.methods.edit = function(newContent, reason = '') {
  // Store edit history
  this.editHistory.push({
    content: this.content,
    reason: reason
  });
  
  // Update content
  this.content = newContent;
  
  return this.save();
};

aiMessageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

aiMessageSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Static methods
aiMessageSchema.statics.findByConversation = function(conversationId, options = {}) {
  const {
    includeDeleted = false,
    limit = 50,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 1,
    role = null
  } = options;

  const query = {
    conversation: conversationId
  };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  if (role) {
    query.role = role;
  }

  return this.find(query)
    .populate('metadata.userId', 'firstName lastName username avatar')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
};

aiMessageSchema.statics.createUserMessage = function(conversationId, userId, content, metadata = {}) {
  const message = new this({
    conversation: conversationId,
    role: 'user',
    content: content.trim(),
    metadata: {
      userId: userId,
      ...metadata
    },
    status: 'sent'
  });
  
  return message.save();
};

aiMessageSchema.statics.createAIMessage = function(conversationId, content, metadata = {}) {
  const message = new this({
    conversation: conversationId,
    role: 'assistant',
    content: content.trim(),
    metadata: {
      aiModel: metadata.aiModel || 'gpt-3.5-turbo',
      temperature: metadata.temperature,
      maxTokens: metadata.maxTokens,
      promptTokens: metadata.promptTokens,
      completionTokens: metadata.completionTokens,
      totalTokens: metadata.totalTokens,
      processingTime: metadata.processingTime,
      requestId: metadata.requestId,
      sentiment: metadata.sentiment,
      topics: metadata.topics,
      confidence: metadata.confidence
    },
    status: 'sent'
  });
  
  return message.save();
};

aiMessageSchema.statics.getConversationStats = function(conversationId) {
  return this.aggregate([
    { $match: { conversation: mongoose.Types.ObjectId(conversationId), isDeleted: false } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        totalTokens: { $sum: '$metadata.totalTokens' },
        avgConfidence: { $avg: '$metadata.confidence' }
      }
    }
  ]).exec();
};

// Indexes for performance
aiMessageSchema.index({ conversation: 1, createdAt: 1 });
aiMessageSchema.index({ conversation: 1, role: 1 });
aiMessageSchema.index({ 'metadata.userId': 1, createdAt: -1 });
aiMessageSchema.index({ role: 1, status: 1 });
aiMessageSchema.index({ isDeleted: 1, createdAt: -1 });

// Compound index for efficient conversation message queries
aiMessageSchema.index({ 
  conversation: 1, 
  isDeleted: 1, 
  createdAt: 1 
});

const AIMessage = mongoose.model('AIMessage', aiMessageSchema);

module.exports = AIMessage;