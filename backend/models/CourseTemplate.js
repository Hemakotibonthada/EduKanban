const mongoose = require('mongoose');

const courseTemplateSchema = new mongoose.Schema({
  templateKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true,
    index: true
  },
  timeCommitment: {
    type: String,
    required: true,
    index: true
  },
  knowledgeLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true,
    index: true
  },
  // Core course content
  modules: [{
    moduleNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    learningObjectives: [{
      type: String
    }],
    estimatedDuration: {
      type: Number // in hours
    },
    content: {
      type: String
    },
    tasks: [{
      title: String,
      description: String,
      type: {
        type: String,
        enum: ['reading', 'exercise', 'project', 'quiz', 'assignment']
      },
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard']
      },
      estimatedTime: Number, // in minutes
      instructions: String,
      resources: [{
        type: String,
        url: String,
        title: String
      }]
    }],
    resources: [{
      type: {
        type: String,
        enum: ['video', 'article', 'book', 'tool', 'exercise']
      },
      title: String,
      url: String,
      description: String
    }]
  }],
  
  // Template metadata
  originalPrompt: {
    type: String,
    required: true
  },
  aiModel: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    customizations: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Quality metrics
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseTemplate'
  },
  
  // Status and lifecycle
  status: {
    type: String,
    enum: ['active', 'deprecated', 'archived'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate template key based on course parameters
courseTemplateSchema.statics.generateTemplateKey = function(courseTopic, knowledgeLevel, timeCommitment) {
  const normalizedTopic = courseTopic.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const normalizedLevel = knowledgeLevel.toLowerCase();
  const normalizedTime = timeCommitment.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return `${normalizedTopic}-${normalizedLevel}-${normalizedTime}`;
};

// Update timestamps before saving
courseTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for efficient querying
courseTemplateSchema.index({ topic: 1, difficulty: 1, knowledgeLevel: 1 });
courseTemplateSchema.index({ usageCount: -1, rating: -1 });
courseTemplateSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CourseTemplate', courseTemplateSchema);