const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleNumber: {
    type: Number,
    required: true
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
  learningObjectives: [{
    type: String
  }],
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true
  },
  status: {
    type: String,
    enum: ['locked', 'available', 'in_progress', 'completed'],
    default: 'available'
  },
  content: {
    textContent: {
      type: String,
      default: ''
    },
    videoUrls: [{
      url: {
        type: String
      },
      title: {
        type: String
      },
      description: {
        type: String
      },
      duration: {
        type: String
      },
      thumbnail: {
        type: String
      }
    }],
    resources: [{
      title: {
        type: String
      },
      url: {
        type: String
      },
      type: {
        type: String,
        enum: ['article', 'documentation', 'tutorial', 'book', 'tool']
      }
    }],
    codeExamples: [{
      language: {
        type: String
      },
      code: {
        type: String
      },
      description: {
        type: String
      }
    }]
  },
  prerequisites: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    },
    title: {
      type: String
    }
  }],
  order: {
    type: Number,
    required: true
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
moduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
moduleSchema.index({ courseId: 1, order: 1 });
moduleSchema.index({ status: 1 });

module.exports = mongoose.model('Module', moduleSchema);