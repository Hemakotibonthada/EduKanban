const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: false,  // Made optional to allow course-level tasks
    default: null
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  type: {
    type: String,
    enum: ['LEARN', 'PRACTICE', 'TEST', 'PROJECT'],
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'To Do', 'In Progress', 'Passed', 'Failed', 'Skipped', 'Completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  content: {
    instructions: {
      type: String
    },
    hints: [{
      type: String
    }],
    resources: [{
      title: {
        type: String
      },
      url: {
        type: String
      },
      type: {
        type: String
      }
    }]
  },
  assessment: {
    questions: [{
      question: {
        type: String
      },
      options: [{
        text: {
          type: String
        },
        isCorrect: {
          type: Boolean,
          default: false
        }
      }],
      explanation: {
        type: String
      },
      points: {
        type: Number,
        default: 1
      }
    }],
    passingScore: {
      type: Number,
      default: 70
    },
    maxAttempts: {
      type: Number,
      default: 3
    }
  },
  attempts: [{
    attemptNumber: {
      type: Number
    },
    score: {
      type: Number
    },
    passed: {
      type: Boolean
    },
    answers: [{
      questionIndex: {
        type: Number
      },
      selectedOption: {
        type: Number
      },
      isCorrect: {
        type: Boolean
      }
    }],
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    duration: {
      type: Number // in seconds
    }
  }],
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAttemptAt: {
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
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
taskSchema.index({ courseId: 1, status: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ moduleId: 1, order: 1 });
taskSchema.index({ type: 1 });
taskSchema.index({ userId: 1, courseId: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ completedAt: -1 });
taskSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);