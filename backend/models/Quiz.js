const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank'],
    default: 'multiple-choice'
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: String // For short-answer, essay, fill-blank
  },
  explanation: {
    type: String
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  mediaUrl: {
    type: String // For images, videos in questions
  },
  order: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  settings: {
    timeLimit: {
      type: Number, // in minutes
      default: null
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    allowBackTracking: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    }
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate total points before saving
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  }
  next();
});

// Create indexes for better performance
quizSchema.index({ courseId: 1 });
quizSchema.index({ moduleId: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isPublished: 1 });
quizSchema.index({ createdAt: -1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ category: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
