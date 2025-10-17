const winston = require('winston');
const ErrorLog = require('../models/ErrorLog');

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  
  // Capture original res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    originalEnd.apply(res, args);
  };
  
  next();
};

// Global error handler middleware
const errorHandler = async (err, req, res, next) => {
  logger.error(err);

  // Determine error category
  let category = 'system';
  if (err.name === 'ValidationError') category = 'validation';
  else if (err.name === 'CastError') category = 'database';
  else if (err.name === 'MongoError') category = 'database';
  else if (err.name === 'JsonWebTokenError') category = 'authentication';
  else if (err.name === 'MulterError') category = 'file_upload';

  // Log error to database
  try {
    await ErrorLog.create({
      level: 'error',
      category,
      message: err.message,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code
      },
      context: {
        userId: req.userId || null,
        sessionId: req.sessionId || null,
        endpoint: req.originalUrl,
        method: req.method,
        params: req.params,
        body: req.body,
        query: req.query
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (logError) {
    logger.error('Failed to log error to database:', logError);
  }

  // Determine response status code
  let statusCode = 500;
  if (err.name === 'ValidationError') statusCode = 400;
  else if (err.name === 'CastError') statusCode = 400;
  else if (err.name === 'JsonWebTokenError') statusCode = 401;
  else if (err.name === 'MulterError') statusCode = 400;
  else if (err.statusCode) statusCode = err.statusCode;

  // Send error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  logger,
  requestLogger,
  errorHandler
};