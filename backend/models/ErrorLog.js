const mongoose = require('mongoose');

// System error and failure logs
const errorLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug', 'critical'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'authentication',
      'database',
      'api',
      'ai_generation',
      'video_fetch',
      'file_upload',
      'payment',
      'validation',
      'network',
      'system',
      'security'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  error: {
    name: {
      type: String
    },
    message: {
      type: String
    },
    stack: {
      type: String
    },
    code: {
      type: String
    }
  },
  context: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionId: {
      type: String
    },
    requestId: {
      type: String
    },
    endpoint: {
      type: String
    },
    method: {
      type: String
    },
    params: {
      type: mongoose.Schema.Types.Mixed
    },
    body: {
      type: mongoose.Schema.Types.Mixed
    },
    query: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  metadata: {
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    },
    version: {
      type: String
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    }
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for monitoring and querying
errorLogSchema.index({ level: 1, timestamp: -1 });
errorLogSchema.index({ category: 1, timestamp: -1 });
errorLogSchema.index({ resolved: 1, timestamp: -1 });
errorLogSchema.index({ 'context.userId': 1, timestamp: -1 });
errorLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);