const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOptionIndex: {
    type: Number // For multiple-choice
  },
  textAnswer: {
    type: String // For short-answer, essay, fill-blank
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
});

const submissionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  pointsEarned: {
    type: Number,
    required: true,
    default: 0
  },
  totalPoints: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded', 'reviewed'],
    default: 'submitted'
  },
  feedback: {
    type: String,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    device: String,
    browser: String,
    os: String
  }
}, {
  timestamps: true
});

// Create indexes for better performance
submissionSchema.index({ quizId: 1, userId: 1 });
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ courseId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ passed: 1 });
submissionSchema.index({ score: -1 });

// Compound index for unique attempts
submissionSchema.index({ quizId: 1, userId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
