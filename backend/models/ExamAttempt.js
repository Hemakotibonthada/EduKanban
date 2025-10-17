const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  }
});

const weakAreaSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  incorrectCount: {
    type: Number,
    required: true
  },
  percentageWrong: {
    type: Number,
    required: true
  },
  remediationTopics: [{
    type: String
  }]
});

const examAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
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
    required: false,
    default: null
  },
  answers: {
    type: [answerSchema],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  weakAreas: {
    type: [weakAreaSchema],
    default: []
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,  // in seconds
    required: true
  },
  submittedAnswers: {
    type: mongoose.Schema.Types.Mixed,  // Store original submitted answers
    required: true
  }
});

// Create indexes for efficient queries
examAttemptSchema.index({ userId: 1, examId: 1 });
examAttemptSchema.index({ courseId: 1, userId: 1 });
examAttemptSchema.index({ userId: 1, completedAt: -1 });

// Calculate percentage before saving
examAttemptSchema.pre('save', function(next) {
  if (this.isModified('score') || this.isModified('totalPoints')) {
    this.percentage = this.totalPoints > 0 ? Math.round((this.score / this.totalPoints) * 100) : 0;
  }
  next();
});

// Get attempt summary
examAttemptSchema.methods.getSummary = function() {
  return {
    attemptId: this._id,
    score: this.score,
    totalPoints: this.totalPoints,
    percentage: this.percentage,
    passed: this.passed,
    attemptNumber: this.attemptNumber,
    completedAt: this.completedAt,
    timeSpent: this.timeSpent,
    weakAreas: this.weakAreas.map(wa => ({
      category: wa.category,
      percentageWrong: wa.percentageWrong,
      remediationTopics: wa.remediationTopics
    }))
  };
};

// Get detailed results
examAttemptSchema.methods.getDetailedResults = function() {
  return {
    attemptId: this._id,
    score: this.score,
    totalPoints: this.totalPoints,
    percentage: this.percentage,
    passed: this.passed,
    attemptNumber: this.attemptNumber,
    completedAt: this.completedAt,
    timeSpent: this.timeSpent,
    answers: this.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      category: a.category
    })),
    weakAreas: this.weakAreas,
    performance: this.getPerformanceMetrics()
  };
};

// Get performance metrics by category
examAttemptSchema.methods.getPerformanceMetrics = function() {
  const categoryPerformance = {};
  
  this.answers.forEach(answer => {
    if (!categoryPerformance[answer.category]) {
      categoryPerformance[answer.category] = {
        correct: 0,
        total: 0,
        pointsEarned: 0
      };
    }
    categoryPerformance[answer.category].total++;
    if (answer.isCorrect) {
      categoryPerformance[answer.category].correct++;
    }
    categoryPerformance[answer.category].pointsEarned += answer.pointsEarned;
  });

  // Calculate percentages
  Object.keys(categoryPerformance).forEach(category => {
    const perf = categoryPerformance[category];
    perf.percentage = Math.round((perf.correct / perf.total) * 100);
  });

  return categoryPerformance;
};

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

module.exports = ExamAttempt;
