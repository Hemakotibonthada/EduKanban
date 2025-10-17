const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  modulesCompleted: [{
    type: String
  }],
  lessonsCompleted: [{
    type: String
  }],
  quizScores: [{
    quiz: String,
    score: Number,
    maxScore: Number,
    completedAt: Date
  }],
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  currentLesson: {
    type: String
  },
  currentModule: {
    type: String
  },
  notes: [{
    lesson: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lesson: String,
    timestamp: String,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1, isCompleted: 1 });
progressSchema.index({ user: 1, lastAccessedAt: -1 });

// Method to update completion percentage
progressSchema.methods.updateCompletionPercentage = function(totalLessons) {
  if (totalLessons > 0) {
    this.completionPercentage = Math.round((this.lessonsCompleted.length / totalLessons) * 100);
    
    if (this.completionPercentage === 100 && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
  }
};

// Method to add time spent
progressSchema.methods.addTimeSpent = function(minutes) {
  this.totalTimeSpent += minutes;
  this.lastAccessedAt = new Date();
};

// Method to complete a lesson
progressSchema.methods.completeLesson = function(lessonId, totalLessons) {
  if (!this.lessonsCompleted.includes(lessonId)) {
    this.lessonsCompleted.push(lessonId);
    this.updateCompletionPercentage(totalLessons);
  }
  this.lastAccessedAt = new Date();
};

// Method to complete a module
progressSchema.methods.completeModule = function(moduleId) {
  if (!this.modulesCompleted.includes(moduleId)) {
    this.modulesCompleted.push(moduleId);
  }
  this.lastAccessedAt = new Date();
};

// Static method to find or create progress
progressSchema.statics.findOrCreate = async function(userId, courseId) {
  let progress = await this.findOne({ user: userId, course: courseId });
  
  if (!progress) {
    progress = await this.create({
      user: userId,
      course: courseId
    });
  }
  
  return progress;
};

module.exports = mongoose.model('Progress', progressSchema);
