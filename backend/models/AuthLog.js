const mongoose = require('mongoose');

// Login and failure logs as required by section 2.3
const authLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for failed attempts where user doesn't exist
  },
  email: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['login_success', 'login_failed', 'logout', 'register_success', 'register_failed', 'password_reset_request', 'password_reset_success'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  failureReason: {
    type: String,
    enum: [
      'invalid_credentials',
      'user_not_found',
      'account_locked',
      'account_inactive',
      'email_not_verified',
      'password_expired',
      'too_many_attempts',
      'invalid_token',
      'validation_error',
      'system_error',
      'network_error',
      'database_error',
      'email_exists',
      'username_exists'
    ]
  },
  sessionInfo: {
    sessionId: {
      type: String
    },
    tokenExpiry: {
      type: Date
    },
    refreshToken: {
      type: String
    }
  },
  deviceInfo: {
    userAgent: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
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
  securityFlags: {
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    newDevice: {
      type: Boolean,
      default: false
    },
    newLocation: {
      type: Boolean,
      default: false
    },
    vpnDetected: {
      type: Boolean,
      default: false
    }
  },
  attempts: {
    attemptNumber: {
      type: Number,
      default: 1
    },
    totalAttempts: {
      type: Number,
      default: 1
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for security monitoring and performance
authLogSchema.index({ email: 1, timestamp: -1 });
authLogSchema.index({ userId: 1, timestamp: -1 });
authLogSchema.index({ action: 1, status: 1, timestamp: -1 });
authLogSchema.index({ 'deviceInfo.ipAddress': 1, timestamp: -1 });
authLogSchema.index({ 'securityFlags.suspiciousActivity': 1 });
authLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuthLog', authLogSchema);