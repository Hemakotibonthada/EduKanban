const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String
  },
  category: {
    type: String,
    required: true  // e.g., "basics", "advanced", "practical", module title, etc.
  },
  points: {
    type: Number,
    default: 1
  }
});

const examSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: false,
    default: null  // null means it's a final course exam
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions && questions.length > 0;
      },
      message: 'Exam must have at least one question'
    }
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 70  // 70% to pass
  },
  duration: {
    type: Number,
    required: true,
    min: 1,  // at least 1 minute
    default: 30  // 30 minutes default
  },
  attemptsAllowed: {
    type: Number,
    default: 3,  // allow 3 attempts
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update the updatedAt timestamp before saving
examSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total points
examSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

// Get question categories for weak area analysis
examSchema.methods.getCategories = function() {
  const categories = {};
  this.questions.forEach(q => {
    if (!categories[q.category]) {
      categories[q.category] = {
        name: q.category,
        totalQuestions: 0,
        totalPoints: 0
      };
    }
    categories[q.category].totalQuestions++;
    categories[q.category].totalPoints += (q.points || 1);
  });
  return categories;
};

// Get passing points threshold
examSchema.methods.getPassingPoints = function() {
  const total = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  return Math.ceil((total * this.passingScore) / 100);
};

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
