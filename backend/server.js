require('dotenv').config();

// Import utilities for startup 
const { validateEnvironment } = require('./utils/environmentValidator');
const { logger } = require('./middleware/logger');

// Enhanced startup process
async function startServer() {
  try {
    logger.info('🚀 Starting EduKanban Backend Server...');
    
    // Step 1: Validate environment
    logger.info('Step 1: Validating environment configuration...');
    validateEnvironment();
    
    // Step 2: Import dependencies after environment validation
    logger.info('Step 2: Loading dependencies...');
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    const http = require('http');
    const socketIo = require('socket.io');

    // Import routes
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/users');
    const courseRoutes = require('./routes/courses');
    const taskRoutes = require('./routes/tasks');
    const aiRoutes = require('./routes/ai');
    const chatRoutes = require('./routes/chat');
    const chatEnhancedRoutes = require('./routes/chatEnhanced');
    const analyticsRoutes = require('./routes/analytics');
    const videoRoutes = require('./routes/videos');
    const notificationRoutes = require('./routes/notifications');
    const studyTimerRoutes = require('./routes/studyTimer');
    const gamificationRoutes = require('./routes/gamification');
    const searchRoutes = require('./routes/search');
    const rehabilitationRoutes = require('./routes/rehabilitation');
    const exportRoutes = require('./routes/export');
    const certificateRoutes = require('./routes/certificates');
    const socialRoutes = require('./routes/social');
    const quizRoutes = require('./routes/quizzes');

    // Import middleware
    const authMiddleware = require('./middleware/auth');
    const { requestLogger, errorHandler } = require('./middleware/logger');

    // Step 3: Initialize Express app
    logger.info('Step 3: Initializing Express application...');
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Step 4: Connect to database
    logger.info('Step 4: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edukanban', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ Successfully connected to MongoDB');

    // Step 5: Initialize services
    logger.info('Step 5: Initializing services...');
    const openAIService = require('./services/OpenAIService');
    const openAIStatus = openAIService.getStatus();
    
    if (openAIStatus.available) {
      logger.info('✅ OpenAI service initialized and ready');
    } else {
      logger.warn(`⚠️ OpenAI service not available: ${openAIStatus.error}`);
    }

    // Step 6: Configure security middleware
    logger.info('Step 6: Configuring security middleware...');
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "https: data:"],
          "media-src": ["'self'", "https:"],
          "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"]
        }
      }
    }));

    // Enhanced rate limiting with per-endpoint limits
    const {
      authLimiter,
      apiLimiter,
      writeLimiter,
      readLimiter,
      uploadLimiter,
      searchLimiter,
      aiLimiter,
      exportLimiter,
      addRateLimitHeaders
    } = require('./middleware/rateLimiter');

    // Add rate limit headers to all responses
    app.use(addRateLimitHeaders);

    // General API rate limiting
    app.use('/api/', apiLimiter);

    // Strict auth endpoint rate limiting
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);
    app.use('/api/auth/reset-password', authLimiter);

    // AI generation endpoints
    app.use('/api/ai/generate-course', aiLimiter);
    app.use('/api/ai/analyze-code', aiLimiter);
    app.use('/api/ai/get-hint', aiLimiter);

    // Upload endpoints
    app.use('/api/users/profile-picture', uploadLimiter);
    app.use('/api/chat/upload', uploadLimiter);

    // Search endpoints
    app.use('/api/users/search', searchLimiter);
    app.use('/api/search/', searchLimiter);

    // Export endpoints
    app.use('/api/analytics/export', exportLimiter);
    app.use('/api/export/', exportLimiter);

    // CORS configuration
    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost and local network IPs
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          process.env.FRONTEND_URL
        ];
        
        // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):\d+$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork) {
          callback(null, true);
        } else if (process.env.NODE_ENV === 'development') {
          // In development, allow all origins
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Step 7: Configure middleware
    logger.info('Step 7: Configuring middleware...');
    app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));
    app.use(requestLogger);

    // Step 8: Configure enhanced monitoring and health check endpoints
    logger.info('Step 8: Setting up enhanced monitoring and health check endpoints...');
    
    const {
      requestTracker,
      performanceMonitor,
      errorTracker,
      updateMetrics,
      healthCheck,
      readinessCheck,
      livenessCheck,
      getMetrics
    } = require('./middleware/monitoring');

    // Apply monitoring middleware
    app.use(requestTracker);
    app.use(performanceMonitor);
    app.use(updateMetrics);

    // Health check endpoints
    app.get('/health', healthCheck);
    app.get('/api/health', healthCheck);
    app.get('/ready', readinessCheck);
    app.get('/api/ready', readinessCheck);
    app.get('/alive', livenessCheck);
    app.get('/api/alive', livenessCheck);
    app.get('/metrics', getMetrics);
    app.get('/api/metrics', getMetrics);

    // Detailed system status
    app.get('/api/status', async (req, res) => {
      const { getEnvironmentStatus } = require('./utils/environmentValidator');
      
      try {
        const status = {
          server: {
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          },
          database: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host,
            name: mongoose.connection.name
          },
          services: {
            openai: openAIService.getStatus()
          },
          environment: getEnvironmentStatus(),
          timestamp: new Date().toISOString()
        };

        res.status(200).json(status);
      } catch (error) {
        logger.error('Error getting system status:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to get system status',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Step 9: Configure API Documentation (Swagger)
    logger.info('Step 9a: Setting up API documentation...');
    const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./swagger');
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
    
    // Serve swagger spec as JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
    
    logger.info('📚 API Documentation available at: http://localhost:' + (process.env.PORT || 5001) + '/api-docs');

    // Step 9b: Configure API routes
    logger.info('Step 9b: Configuring API routes...');
    app.use('/api/auth', authRoutes);
    app.use('/api/users', authMiddleware, userRoutes);
    app.use('/api/courses', authMiddleware, courseRoutes);
    app.use('/api/tasks', authMiddleware, taskRoutes);
    app.use('/api/ai', authMiddleware, aiRoutes);
    app.use('/api/chat', authMiddleware, chatRoutes);
    app.use('/api/chat-enhanced', authMiddleware, chatEnhancedRoutes);
    app.use('/api/analytics', authMiddleware, analyticsRoutes);
    app.use('/api/videos', authMiddleware, videoRoutes);
    app.use('/api/notifications', authMiddleware, notificationRoutes);
    app.use('/api/study-timer', authMiddleware, studyTimerRoutes);
    app.use('/api/gamification', authMiddleware, gamificationRoutes);
    app.use('/api/search', authMiddleware, searchRoutes);
    app.use('/api/rehab', authMiddleware, rehabilitationRoutes);
    app.use('/api/export', authMiddleware, exportRoutes);
    app.use('/api/certificates', authMiddleware, certificateRoutes);
    app.use('/api/social', authMiddleware, socialRoutes);
    app.use('/api/quizzes', authMiddleware, quizRoutes);

    // Step 10: Configure Socket.IO
    logger.info('Step 10: Configuring Socket.IO...');
    
    // Socket.IO authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('No token provided'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Track online users
    const onlineUsers = new Map();

    // Socket.IO connection handling
    io.on('connection', async (socket) => {
      logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);
      
      try {
        const User = require('./models/User');
        
        // Update user online status
        await User.findByIdAndUpdate(socket.userId, {
          'onlineStatus.isOnline': true,
          'onlineStatus.status': 'available',
          'onlineStatus.lastSeen': new Date()
        });
        
        onlineUsers.set(socket.userId, socket.id);
        socket.join(`user_${socket.userId}`);
        
        // Handle various socket events
        require('./socketHandlers')(socket, io, onlineUsers);
        
      } catch (error) {
        logger.error('Socket connection error:', error);
      }
    });

    // Step 11: Configure error handling
    logger.info('Step 11: Configuring error handling...');
    
    // 404 handler for undefined routes
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: 'API endpoint not found',
          path: req.originalUrl,
          method: req.method,
          availableEndpoints: [
            '/api/health',
            '/api/status',
            '/api/auth',
            '/api/users',
            '/api/courses',
            '/api/tasks',
            '/api/ai'
          ]
        },
        timestamp: new Date().toISOString()
      });
    });

    // Enhanced error tracking middleware (already imported at line 181)
    app.use(errorTracker);

    // Global error handler
    app.use(errorHandler);

    // Step 12: Start the server
    logger.info('Step 12: Starting server...');
    const PORT = process.env.PORT || 5001;
    
    await new Promise((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    logger.info('🎉 Server started successfully!');
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Local: http://localhost:${PORT}/api`);
    logger.info(`🌐 Network: http://<your-local-ip>:${PORT}/api`);
    logger.info(`💡 Tip: Find your local IP with 'ifconfig | grep inet' (macOS/Linux) or 'ipconfig' (Windows)`);
    
    // Return app for module exports
    return app;

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    logger.info('Database connection closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer().then((app) => {
  module.exports = app;
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
