const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(v) {
        // Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, and number'
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor', 'moderator'],
    default: 'user',
    index: true
  },
  phone: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  profile: {
    knowledgeLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    timeCommitment: {
      type: String,
      default: '5 hours per week'
    },
    learningGoals: [{
      type: String
    }],
    preferredLearningStyle: {
      type: String,
      enum: ['Visual', 'Auditory', 'Kinesthetic', 'Reading'],
      default: 'Visual'
    },
    jobTitle: {
      type: String,
      default: null
    },
    company: {
      type: String,
      default: null
    },
    birthDate: {
      type: Date,
      default: null
    },
    skills: [{
      type: String
    }],
    interests: [{
      type: String
    }],
    socialLinks: {
      website: { type: String, default: null },
      github: { type: String, default: null },
      linkedin: { type: String, default: null },
      twitter: { type: String, default: null },
      instagram: { type: String, default: null }
    }
  },
  stats: {
    totalCoursesCompleted: {
      type: Number,
      default: 0
    },
    totalTasksCompleted: {
      type: Number,
      default: 0
    },
    totalLearningTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageTestScore: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      default: null
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  // Social features
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
    youtube: String
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'followers'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showActivity: {
      type: Boolean,
      default: true
    }
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  onlineStatus: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy', 'available', 'do-not-disturb'],
      default: 'offline'
    },
    statusMessage: {
      type: String,
      maxlength: 100,
      default: ''
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'friends': 1 });
userSchema.index({ 'following': 1 });
userSchema.index({ 'stats.lastActiveDate': -1 });
userSchema.index({ 'onlineStatus.isOnline': 1 });

module.exports = mongoose.model('User', userSchema);