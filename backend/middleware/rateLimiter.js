const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Initialize Redis client for distributed rate limiting
let redisClient;
let redisStore;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.connect().then(() => {
      console.log('Redis connected for rate limiting');
      redisStore = new RedisStore({
        client: redisClient,
        prefix: 'rl:',
      });
    }).catch(err => {
      console.error('Redis connection failed:', err);
    });
  } catch (error) {
    console.error('Redis initialization failed:', error);
  }
}

// Sliding window counter implementation
class SlidingWindowCounter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // Map<key, Array<timestamp>>
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let userRequests = this.requests.get(key) || [];

    // Remove expired requests
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (userRequests.length >= this.maxRequests) {
      this.requests.set(key, userRequests);
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...userRequests) + this.windowMs
      };
    }

    // Add current request
    userRequests.push(now);
    this.requests.set(key, userRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - userRequests.length,
      resetTime: now + this.windowMs
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

// Standard rate limiter with headers
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip,
  } = options;

  const limiterOptions = {
    windowMs,
    max,
    message: { success: false, message },
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  };

  // Use Redis store if available
  if (redisStore) {
    limiterOptions.store = redisStore;
  }

  return rateLimit(limiterOptions);
};

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use email or username if provided, otherwise IP
    // Safely access nested properties
    const email = req.body?.email;
    const username = req.body?.username;
    return email || username || req.ip;
  }
});

// Moderate rate limiter for API endpoints
const apiLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100),
  message: 'Too many requests from this IP, please try again later'
});

// Stricter limiter for write operations
const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many write operations, please slow down',
  skipSuccessfulRequests: false
});

// Lenient limiter for read operations
const readLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  message: 'Too many read requests, please slow down',
  skipSuccessfulRequests: true
});

// File upload rate limiter
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Upload limit exceeded, please try again later'
});

// Search/Query intensive operations
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please try again in a minute'
});

// AI generation endpoints (expensive operations)
const aiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,
  message: 'AI generation limit reached, please try again later',
  keyGenerator: (req) => {
    // Use userId if available (from auth middleware), otherwise use IP
    return req.userId || req.user?.id || req.ip;
  }
});

// Export rate limiter (data export operations)
const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Export limit reached, please try again later'
});

// Dynamic rate limiter based on user tier/role
const dynamicLimiter = (req, res, next) => {
  const user = req.user;
  
  // Different limits based on user tier
  let max = 100; // Default
  let windowMs = 15 * 60 * 1000;

  if (user) {
    if (user.role === 'admin') {
      max = 1000;
    } else if (user.subscription === 'premium') {
      max = 500;
    } else if (user.subscription === 'pro') {
      max = 250;
    }
  }

  const limiter = createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Safely access user ID from multiple possible locations
      return req.userId || req.user?.id || req.user?._id?.toString() || req.ip;
    }
  });

  return limiter(req, res, next);
};

// Middleware to add rate limit headers to all responses
const addRateLimitHeaders = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Add custom rate limit info to response
    if (req.rateLimit) {
      res.set({
        'X-RateLimit-Limit': req.rateLimit.limit,
        'X-RateLimit-Remaining': req.rateLimit.remaining,
        'X-RateLimit-Reset': new Date(req.rateLimit.resetTime).toISOString()
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Cleanup function for sliding window (call periodically)
const cleanupSlidingWindows = () => {
  // This would be used if implementing custom sliding window
  console.log('Rate limiter cleanup executed');
};

// Run cleanup every hour
setInterval(cleanupSlidingWindows, 60 * 60 * 1000);

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  writeLimiter,
  readLimiter,
  uploadLimiter,
  searchLimiter,
  aiLimiter,
  exportLimiter,
  dynamicLimiter,
  addRateLimitHeaders,
  SlidingWindowCounter
};
