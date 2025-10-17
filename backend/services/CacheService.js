const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
  }

  async connect() {
    if (!process.env.REDIS_URL) {
      console.warn('⚠️  REDIS_URL not configured. Caching will be disabled.');
      return;
    }

    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis connection failed after 10 retries');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
      });

      this.client.on('end', () => {
        console.log('🔴 Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const result = await this.client.incrBy(key, amount);
      return result;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  async expire(key, ttl) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // High-level caching methods for common patterns

  async cacheUser(userId, userData, ttl = 1800) {
    const key = `user:${userId}`;
    return await this.set(key, userData, ttl);
  }

  async getUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUser(userId) {
    const key = `user:${userId}`;
    return await this.delete(key);
  }

  async cacheCourse(courseId, courseData, ttl = 3600) {
    const key = `course:${courseId}`;
    return await this.set(key, courseData, ttl);
  }

  async getCourse(courseId) {
    const key = `course:${courseId}`;
    return await this.get(key);
  }

  async invalidateCourse(courseId) {
    const key = `course:${courseId}`;
    return await this.delete(key);
  }

  async invalidateUserCourses(userId) {
    const pattern = `courses:user:${userId}:*`;
    return await this.deletePattern(pattern);
  }

  async cacheUserCourses(userId, filters, courses, ttl = 600) {
    const filterKey = JSON.stringify(filters);
    const key = `courses:user:${userId}:${Buffer.from(filterKey).toString('base64')}`;
    return await this.set(key, courses, ttl);
  }

  async getUserCourses(userId, filters) {
    const filterKey = JSON.stringify(filters);
    const key = `courses:user:${userId}:${Buffer.from(filterKey).toString('base64')}`;
    return await this.get(key);
  }

  async cacheAnalytics(userId, type, data, ttl = 1800) {
    const key = `analytics:${userId}:${type}`;
    return await this.set(key, data, ttl);
  }

  async getAnalytics(userId, type) {
    const key = `analytics:${userId}:${type}`;
    return await this.get(key);
  }

  async invalidateUserAnalytics(userId) {
    const pattern = `analytics:${userId}:*`;
    return await this.deletePattern(pattern);
  }

  async cacheLeaderboard(type, data, ttl = 300) {
    const key = `leaderboard:${type}`;
    return await this.set(key, data, ttl);
  }

  async getLeaderboard(type) {
    const key = `leaderboard:${type}`;
    return await this.get(key);
  }

  // Session management
  async setSession(sessionId, sessionData, ttl = 86400) {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.delete(key);
  }

  // Rate limiting helper
  async incrementRateLimit(identifier, windowSeconds = 60) {
    const key = `ratelimit:${identifier}`;
    const count = await this.increment(key, 1);
    
    if (count === 1) {
      await this.expire(key, windowSeconds);
    }
    
    return count;
  }

  async getRateLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    const value = await this.get(key);
    return value || 0;
  }

  // Cache statistics
  async getStats() {
    if (!this.isConnected || !this.client) {
      return {
        connected: false,
        error: 'Redis not connected'
      };
    }

    try {
      const info = await this.client.info('stats');
      const keys = await this.client.dbSize();
      
      return {
        connected: true,
        totalKeys: keys,
        info: info
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis client disconnected');
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Middleware to cache GET requests
const cacheMiddleware = (ttl = 600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if caching is disabled
    if (!cacheService.isConnected) {
      return next();
    }

    // Create cache key from URL and user
    const cacheKey = `route:${req.userId || 'anonymous'}:${req.originalUrl}`;

    try {
      // Check cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Add cache hit header
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache response:', err);
        });
        
        // Add cache miss header
        res.set('X-Cache', 'MISS');
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  cacheService,
  cacheMiddleware
};
