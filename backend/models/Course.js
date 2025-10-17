const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
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
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  timeCommitment: {
    type: String,
    required: true
  },
  currentKnowledgeLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused', 'archived'],
    default: 'active'
  },
  progress: {
    totalModules: {
      type: Number,
      default: 0
    },
    completedModules: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    passedTasks: {
      type: Number,
      default: 0
    },
    failedTasks: {
      type: Number,
      default: 0
    },
    skippedTasks: {
      type: Number,
      default: 0
    },
    percentageComplete: {
      type: Number,
      default: 0
    }
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  aiPrompt: {
    type: String
  },
  // Course template/caching fields
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateKey: {
    type: String,
    index: true,
    sparse: true
  },
  sourceTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
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
    videoUrl: {
      type: String // YouTube URL or direct video URL
    },
    resources: [{
      type: {
        type: String,
        enum: ['video', 'article', 'book', 'tool', 'exercise']
      },
      title: String,
      url: String,
      description: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  completedAt: {
    type: Date,
    default: null
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

// Update the updatedAt field before saving
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
courseSchema.index({ userId: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ topic: 'text', title: 'text' });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ userId: 1, status: 1 });
courseSchema.index({ templateKey: 1 });
courseSchema.index({ isTemplate: 1 });

module.exports = mongoose.model('Course', courseSchema);