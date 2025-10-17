const mongoose = require('mongoose');

const recoveryEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  mood: {
    type: String,
    enum: ['very_poor', 'poor', 'neutral', 'good', 'excellent'],
    required: true
  },
  triggers: [{
    type: String
  }],
  copingStrategies: [{
    type: String
  }],
  notes: String,
  cravingLevel: {
    type: Number,
    min: 0,
    max: 10
  },
  successfulResistance: {
    type: Boolean,
    default: true
  }
});

const milestoneCelebrationSchema = new mongoose.Schema({
  milestone: {
    type: String,
    required: true
  },
  achievedAt: {
    type: Date,
    default: Date.now
  },
  celebrationMessage: String
});

const supportSessionSchema = new mongoose.Schema({
  sessionDate: {
    type: Date,
    default: Date.now
  },
  sessionType: {
    type: String,
    enum: ['ai_chat', 'peer_support', 'crisis', 'check_in']
  },
  duration: Number, // in minutes
  summary: String,
  helpful: Boolean
});

const rehabProgramSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Addiction Information
  addictionType: {
    type: String,
    required: true,
    enum: [
      'social_media',
      'gaming',
      'internet',
      'smartphone',
      'video_streaming',
      'shopping',
      'gambling',
      'substance',
      'other'
    ]
  },
  specificAddiction: String, // e.g., "Instagram", "Call of Duty"
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  
  // Recovery Goals
  primaryGoal: {
    type: String,
    required: true
  },
  secondaryGoals: [{
    goal: String,
    completed: Boolean,
    completedAt: Date
  }],
  targetCompletionDate: Date,
  
  // Progress Tracking
  soberDays: {
    type: Number,
    default: 0
  },
  lastRelapse: Date,
  longestStreak: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  
  // Daily Check-ins
  dailyEntries: [recoveryEntrySchema],
  
  // Milestones
  milestones: [milestoneCelebrationSchema],
  
  // Support Sessions
  supportSessions: [supportSessionSchema],
  
  // AI-Generated Recovery Plan
  recoveryPlan: {
    phases: [{
      phase: Number,
      title: String,
      duration: String,
      goals: [String],
      strategies: [String],
      completed: Boolean
    }],
    copingStrategies: [{
      strategy: String,
      category: String, // 'immediate', 'short_term', 'long_term'
      effectiveness: Number // user rating 1-5
    }],
    triggerManagement: [{
      trigger: String,
      avoidanceStrategies: [String],
      copingMechanisms: [String]
    }]
  },
  
  // Resources
  recommendedActivities: [{
    activity: String,
    category: String, // 'physical', 'mental', 'social', 'creative'
    completed: Boolean
  }],
  
  // Crisis Support
  emergencyContacts: [{
    name: String,
    relationship: String,
    phone: String
  }],
  crisisHotlines: [{
    name: String,
    phone: String,
    available24_7: Boolean
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'discontinued'],
    default: 'active'
  },
  completedAt: Date,
  
  // Settings
  settings: {
    dailyReminders: {
      enabled: Boolean,
      time: String // e.g., "09:00"
    },
    shareProgress: {
      type: Boolean,
      default: false
    },
    anonymousMode: {
      type: Boolean,
      default: true
    }
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

// Update timestamps on save
rehabProgramSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate current streak
rehabProgramSchema.methods.calculateCurrentStreak = function() {
  if (this.dailyEntries.length === 0) {
    return 0;
  }
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort entries by date descending
  const sortedEntries = [...this.dailyEntries].sort((a, b) => b.date - a.date);
  
  for (let entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak && entry.successfulResistance) {
      streak++;
    } else {
      break;
    }
  }
  
  this.currentStreak = streak;
  this.soberDays = sortedEntries.filter(e => e.successfulResistance).length;
  
  if (streak > this.longestStreak) {
    this.longestStreak = streak;
  }
  
  return streak;
};

// Indexes for performance
rehabProgramSchema.index({ userId: 1, status: 1 });
rehabProgramSchema.index({ createdAt: -1 });

const RehabProgram = mongoose.model('RehabProgram', rehabProgramSchema);

module.exports = RehabProgram;
