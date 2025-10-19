const os = require('os');
const ErrorLog = require('../models/ErrorLog');

// Sentry configuration (if SENTRY_DSN is provided)
let Sentry;
if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app: true }),
    ],
  });
}

// Request tracking middleware
const requestTracker = (req, res, next) => {
  req.startTime = Date.now();
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  
  // Track response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 3000) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Track metrics (headers cannot be set after response is sent)
    if (duration > 5001) {
      console.error(`🔴 CRITICAL SLOW REQUEST: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    } else if (duration > 3000) {
      console.warn(`🟡 SLOW REQUEST: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Error tracking middleware
const errorTracker = async (err, req, res, next) => {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.error(`[${new Date().toISOString()}] ERROR ${errorId}:`, err);
  
  // Determine error category based on endpoint and error type
  const determineCategory = (req, err) => {
    const path = req.path || '';
    if (path.includes('/auth')) return 'authentication';
    if (path.includes('/ai')) return 'ai_generation';
    if (path.includes('/upload')) return 'file_upload';
    if (path.includes('/payment')) return 'payment';
    if (err.name === 'ValidationError') return 'validation';
    if (err.name === 'MongoError' || err.name === 'MongooseError') return 'database';
    return 'api';
  };
  
  // Determine error level based on status code
  const determineLevel = (err) => {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'error';
    return 'warn';
  };
  
  // Log to database
  try {
    await ErrorLog.create({
      level: determineLevel(err),
      category: determineCategory(req, err),
      message: err.message || 'Unknown error',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code
      },
      context: {
        userId: req.userId || null,
        requestId: errorId,
        endpoint: `${req.method} ${req.path}`,
        method: req.method,
        body: req.body,
        query: req.query
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
  
  // Send to Sentry
  if (Sentry) {
    Sentry.captureException(err, {
      user: { id: req.userId },
      tags: {
        endpoint: req.path,
        method: req.method
      },
      extra: {
        errorId,
        body: req.body,
        query: req.query
      }
    });
  }
  
  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred. Please try again later.' 
      : err.message,
    errorId,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Health check metrics
const healthMetrics = {
  startTime: Date.now(),
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  responseTimes: []
};

// Update metrics middleware
const updateMetrics = (req, res, next) => {
  healthMetrics.totalRequests++;
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    healthMetrics.responseTimes.push(duration);
    
    // Keep only last 1000 response times
    if (healthMetrics.responseTimes.length > 1000) {
      healthMetrics.responseTimes.shift();
    }
    
    // Update average
    healthMetrics.avgResponseTime = 
      healthMetrics.responseTimes.reduce((a, b) => a + b, 0) / healthMetrics.responseTimes.length;
    
    if (res.statusCode < 400) {
      healthMetrics.successfulRequests++;
    } else {
      healthMetrics.failedRequests++;
    }
  });
  
  next();
};

// Health check endpoint handler
const healthCheck = async (req, res) => {
  const mongoose = require('mongoose');
  
  const uptime = process.uptime();
  const uptimeDays = Math.floor(uptime / 86400);
  const uptimeHours = Math.floor((uptime % 86400) / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      formatted: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      memoryUsage: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
      },
      loadAverage: os.loadavg()
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    metrics: {
      totalRequests: healthMetrics.totalRequests,
      successfulRequests: healthMetrics.successfulRequests,
      failedRequests: healthMetrics.failedRequests,
      successRate: healthMetrics.totalRequests > 0 
        ? `${((healthMetrics.successfulRequests / healthMetrics.totalRequests) * 100).toFixed(2)}%` 
        : '0%',
      avgResponseTime: `${healthMetrics.avgResponseTime.toFixed(2)}ms`,
      requestsPerMinute: (healthMetrics.totalRequests / (uptime / 60)).toFixed(2)
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version
  };
  
  // Check if system is unhealthy
  const memoryUsagePercent = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
  const cpuLoad = os.loadavg()[0];
  
  if (mongoose.connection.readyState !== 1) {
    health.status = 'unhealthy';
    health.issues = health.issues || [];
    health.issues.push('Database disconnected');
  }
  
  if (memoryUsagePercent > 90) {
    health.status = 'degraded';
    health.issues = health.issues || [];
    health.issues.push(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
  }
  
  if (cpuLoad > os.cpus().length * 0.8) {
    health.status = 'degraded';
    health.issues = health.issues || [];
    health.issues.push(`High CPU load: ${cpuLoad.toFixed(2)}`);
  }
  
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
};

// Readiness check (for Kubernetes/Docker)
const readinessCheck = async (req, res) => {
  const mongoose = require('mongoose');
  
  const checks = {
    database: mongoose.connection.readyState === 1,
    server: true
  };
  
  const isReady = Object.values(checks).every(check => check === true);
  
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks
  });
};

// Liveness check (for Kubernetes/Docker)
const livenessCheck = (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
};

// Get detailed metrics
const getMetrics = (req, res) => {
  const mongoose = require('mongoose');
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requests: {
      total: healthMetrics.totalRequests,
      successful: healthMetrics.successfulRequests,
      failed: healthMetrics.failedRequests,
      successRate: healthMetrics.totalRequests > 0 
        ? (healthMetrics.successfulRequests / healthMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    },
    performance: {
      avgResponseTime: healthMetrics.avgResponseTime.toFixed(2) + 'ms',
      p50: calculatePercentile(healthMetrics.responseTimes, 50).toFixed(2) + 'ms',
      p95: calculatePercentile(healthMetrics.responseTimes, 95).toFixed(2) + 'ms',
      p99: calculatePercentile(healthMetrics.responseTimes, 99).toFixed(2) + 'ms'
    },
    system: {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: (1 - os.freemem() / os.totalmem()) * 100
      },
      cpu: {
        count: os.cpus().length,
        loadAverage: os.loadavg()
      }
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState
    }
  });
};

// Helper function to calculate percentiles
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Reset metrics (admin only)
const resetMetrics = (req, res) => {
  healthMetrics.totalRequests = 0;
  healthMetrics.successfulRequests = 0;
  healthMetrics.failedRequests = 0;
  healthMetrics.avgResponseTime = 0;
  healthMetrics.responseTimes = [];
  
  res.json({
    success: true,
    message: 'Metrics reset successfully'
  });
};

module.exports = {
  Sentry,
  requestTracker,
  performanceMonitor,
  errorTracker,
  updateMetrics,
  healthCheck,
  readinessCheck,
  livenessCheck,
  getMetrics,
  resetMetrics,
  healthMetrics
};
