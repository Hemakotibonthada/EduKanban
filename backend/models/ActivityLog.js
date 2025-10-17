const mongoose = require('mongoose');

// Comprehensive logging schema as required by section 2.3
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login', 'logout', 'register', 'password_reset', 'password_change',
      // Learning actions
      'course_created', 'course_started', 'course_completed', 'course_paused',
      'module_started', 'module_completed', 'module_paused',
      'task_started', 'task_completed', 'task_paused', 'task_failed', 'task_skipped',
      'test_started', 'test_completed', 'test_failed',
      // Navigation actions
      'page_visit', 'dashboard_view', 'profile_view', 'reports_view', 'chat_view',
      // Social actions
      'message_sent', 'user_searched', 'chat_initiated',
      // System actions
      'ai_generation_request', 'video_search', 'content_generated',
      // Profile actions
      'profile_updated', 'preferences_changed'
    ]
  },
  entity: {
    type: {
      type: String,
      enum: ['course', 'module', 'task', 'user', 'message', 'system']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    title: {
      type: String
    }
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for storing action-specific data
    default: {}
  },
  metadata: {
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    },
    device: {
      type: String
    },
    platform: {
      type: String
    },
    browser: {
      type: String
    },
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  performance: {
    responseTime: {
      type: Number // in milliseconds
    },
    loadTime: {
      type: Number // in milliseconds
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for performance and querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ sessionId: 1 });
activityLogSchema.index({ 'entity.type': 1, 'entity.id': 1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);