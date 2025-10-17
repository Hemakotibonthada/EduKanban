const winston = require('winston');
const path = require('path');
const fs = require('fs');
const ErrorLog = require('../models/ErrorLog');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create Winston logger with enhanced configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'edukanban-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport with color and simple format for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, stack, service }) => {
          return `${timestamp} [${service}] ${level}: ${stack || message}`;
        })
      )
    }),
    // File transports for production logging
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

// Enhanced request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = require('crypto').randomUUID();
  
  // Add request ID to request object for tracking
  req.requestId = requestId;
  
  // Log the request with enhanced details
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.userId || null,
    timestamp: new Date().toISOString()
  });
  
  // Capture original res.end to log response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0
    });
    
    originalEnd.apply(res, args);
  };
  
  next();
};

// Enhanced error categorization
const categorizeError = (err) => {
  if (err.name === 'ValidationError') return 'validation';
  if (err.name === 'CastError') return 'database';
  if (err.name === 'MongoError' || err.name === 'MongoServerError') return 'database';
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return 'authentication';
  if (err.name === 'MulterError') return 'file_upload';
  if (err.code === 'ENOENT') return 'file_system';
  if (err.code === 'ECONNREFUSED') return 'network';
  if (err.message && err.message.includes('OpenAI')) return 'external_api';
  if (err.statusCode >= 400 && err.statusCode < 500) return 'client_error';
  if (err.statusCode >= 500) return 'server_error';
  return 'system';
};

// Enhanced error status code determination
const getErrorStatusCode = (err) => {
  if (err.statusCode) return err.statusCode;
  if (err.name === 'ValidationError') return 400;
  if (err.name === 'CastError') return 400;
  if (err.name === 'JsonWebTokenError') return 401;
  if (err.name === 'TokenExpiredError') return 401;
  if (err.name === 'MulterError') return 400;
  if (err.code === 'ENOENT') return 404;
  if (err.code === 11000) return 409; // MongoDB duplicate key error
  return 500;
};

// Enhanced global error handler middleware
const errorHandler = async (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const category = categorizeError(err);
  const statusCode = getErrorStatusCode(err);

  // Log error with enhanced context
  logger.error('Error occurred', {
    requestId,
    category,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: process.env.NODE_ENV === 'development' ? req.body : '[REDACTED]',
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type')
      }
    },
    user: {
      id: req.userId || null,
      ip: req.ip || req.connection.remoteAddress
    },
    timestamp: new Date().toISOString()
  });

  // Log error to database (with fallback error handling)
  try {
    await ErrorLog.create({
      level: 'error',
      category,
      message: err.message,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : '[REDACTED]',
        code: err.code
      },
      context: {
        requestId,
        userId: req.userId || null,
        sessionId: req.sessionId || null,
        endpoint: req.originalUrl,
        method: req.method,
        params: req.params,
        body: process.env.NODE_ENV === 'development' ? req.body : '[REDACTED]',
        query: req.query
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date()
      }
    });
  } catch (logError) {
    logger.error('Failed to log error to database', {
      requestId,
      originalError: err.message,
      logError: logError.message
    });
  }

  // Create user-friendly error messages
  const getUserFriendlyMessage = (err, category) => {
    switch (category) {
      case 'validation':
        return 'The provided data is invalid. Please check your input and try again.';
      case 'authentication':
        return 'Authentication failed. Please log in again.';
      case 'database':
        return 'A database error occurred. Please try again later.';
      case 'file_upload':
        return 'File upload failed. Please check the file and try again.';
      case 'external_api':
        return 'An external service is temporarily unavailable. Please try again later.';
      case 'network':
        return 'Network connection error. Please check your internet connection.';
      default:
        return process.env.NODE_ENV === 'development' 
          ? err.message 
          : 'An unexpected error occurred. Please try again later.';
    }
  };

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message: getUserFriendlyMessage(err, category),
      category,
      requestId,
      timestamp: new Date().toISOString()
    },
    // Include additional details in development
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        originalMessage: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      }
    })
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  logger,
  requestLogger,
  errorHandler
};