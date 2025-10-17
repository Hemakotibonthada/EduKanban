const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  mode: {
    type: String,
    enum: ['pomodoro', 'shortBreak', 'longBreak', 'custom'],
    default: 'pomodoro'
  },
  completedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
StudySessionSchema.index({ userId: 1, completedAt: -1 });

const StudySession = mongoose.model('StudySession', StudySessionSchema);

module.exports = { StudySession };
