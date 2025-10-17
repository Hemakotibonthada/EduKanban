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

    // Rate limiting with environment configuration
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter);

    // More strict rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
      message: 'Too many authentication attempts, please try again later.'
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);

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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Step 7: Configure middleware
    logger.info('Step 7: Configuring middleware...');
    app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));
    app.use(requestLogger);

    // Step 8: Configure health check endpoints
    logger.info('Step 8: Setting up health check endpoints...');
    
    // Basic health check
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

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

    // Step 9: Configure API routes
    logger.info('Step 9: Configuring API routes...');
    // Step 9: Configure API routes
    logger.info('Step 9: Configuring API routes...');
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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.IO for real-time chat
const User = require('./models/User');
const DirectMessage = require('./models/DirectMessage');
const jwt = require('jsonwebtoken');

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Track online users
const onlineUsers = new Map();

io.on('connection', async (socket) => {
  console.log('✅ User connected:', socket.id, '| User ID:', socket.userId);

  // Update user online status
  try {
    await User.findByIdAndUpdate(socket.userId, {
      'onlineStatus.isOnline': true,
      'onlineStatus.status': 'online',
      'onlineStatus.lastSeen': new Date()
    });
    
    onlineUsers.set(socket.userId, socket.id);
    console.log(`👤 User ${socket.userId} marked as online | Total online: ${onlineUsers.size}`);
    
    // Broadcast to all friends that user is online
    const user = await User.findById(socket.userId).populate('friends', '_id');
    if (user && user.friends) {
      console.log(`📢 Broadcasting online status to ${user.friends.length} friends`);
      let broadcastCount = 0;
      user.friends.forEach(friend => {
        const friendSocketId = onlineUsers.get(friend._id.toString());
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend_online', {
            userId: socket.userId,
            status: 'online'
          });
          broadcastCount++;
        }
      });
      console.log(`✅ Notified ${broadcastCount} online friends`);
    }
  } catch (error) {
    console.error('Error updating online status:', error);
  }

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  console.log(`User ${socket.userId} joined their room`);

  // Join community rooms
  socket.on('join_community', async (communityId) => {
    socket.join(`community_${communityId}`);
    console.log(`User ${socket.userId} joined community ${communityId}`);
  });

  // Join channel rooms
  socket.on('join_channel', async (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`User ${socket.userId} joined channel ${channelId}`);
  });

  // Join group rooms
  socket.on('join_group', async (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User ${socket.userId} joined group ${groupId}`);
  });

  // Handle direct messages
  socket.on('send_message', async (data) => {
    const { targetType, targetId, content, messageType = 'text', replyTo } = data;
    
    try {
      const message = new DirectMessage({
        sender: socket.userId,
        targetType,
        targetId,
        content,
        messageType,
        replyTo
      });
      
      await message.save();
      await message.populate('sender', 'username firstName lastName avatar');
      
      console.log(`📨 Message from ${socket.userId} to ${targetType}:${targetId}`);
      
      // Emit to appropriate room
      if (targetType === 'user') {
        // For direct messages, send to BOTH sender and recipient rooms
        io.to(`user_${targetId}`).emit('new_message', message);
        io.to(`user_${socket.userId}`).emit('new_message', message);
        console.log(`✅ Message sent to user ${targetId} and ${socket.userId}`);
      } else if (targetType === 'channel') {
        io.to(`channel_${targetId}`).emit('new_message', message);
        console.log(`✅ Message sent to channel ${targetId}`);
      } else if (targetType === 'group') {
        io.to(`group_${targetId}`).emit('new_message', message);
        console.log(`✅ Message sent to group ${targetId}`);
      } else if (targetType === 'community') {
        io.to(`community_${targetId}`).emit('new_message', message);
        console.log(`✅ Message sent to community ${targetId}`);
      }
      
      // Confirm to sender
      socket.emit('message_sent', { tempId: data.tempId, message });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { tempId: data.tempId, error: error.message });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { targetType, targetId, isTyping } = data;
    
    if (targetType === 'user') {
      io.to(`user_${targetId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    } else if (targetType === 'channel') {
      socket.to(`channel_${targetId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    } else if (targetType === 'group') {
      socket.to(`group_${targetId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async (data) => {
    const { messageId, emoji } = data;
    
    try {
      const message = await DirectMessage.findById(messageId);
      if (message) {
        message.addReaction(socket.userId, emoji);
        await message.save();
        
        // Broadcast to relevant room
        if (message.targetType === 'channel') {
          io.to(`channel_${message.targetId}`).emit('reaction_added', {
            messageId,
            userId: socket.userId,
            emoji
          });
        } else if (message.targetType === 'group') {
          io.to(`group_${message.targetId}`).emit('reaction_added', {
            messageId,
            userId: socket.userId,
            emoji
          });
        } else if (message.targetType === 'user') {
          io.to(`user_${message.targetId}`).emit('reaction_added', {
            messageId,
            userId: socket.userId,
            emoji
          });
        }
      }
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });

  // Handle delete message
  socket.on('delete_message', async (data) => {
    const { messageId } = data;
    
    try {
      const message = await DirectMessage.findById(messageId);
      if (message && message.sender.toString() === socket.userId.toString()) {
        // Broadcast to relevant room
        if (message.targetType === 'user') {
          io.to(`user_${message.targetId}`).emit('message_deleted', { messageId });
          io.to(`user_${socket.userId}`).emit('message_deleted', { messageId });
        } else if (message.targetType === 'channel') {
          io.to(`channel_${message.targetId}`).emit('message_deleted', { messageId });
        } else if (message.targetType === 'group') {
          io.to(`group_${message.targetId}`).emit('message_deleted', { messageId });
        } else if (message.targetType === 'community') {
          io.to(`community_${message.targetId}`).emit('message_deleted', { messageId });
        }
        console.log(`🗑️ Message ${messageId} deleted by ${socket.userId}`);
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  });

  // Handle edit message
  socket.on('edit_message', async (data) => {
    const { messageId, content } = data;
    
    try {
      const message = await DirectMessage.findById(messageId);
      if (message && message.sender.toString() === socket.userId.toString()) {
        // Broadcast to relevant room
        if (message.targetType === 'user') {
          io.to(`user_${message.targetId}`).emit('message_edited', { messageId, content });
          io.to(`user_${socket.userId}`).emit('message_edited', { messageId, content });
        } else if (message.targetType === 'channel') {
          io.to(`channel_${message.targetId}`).emit('message_edited', { messageId, content });
        } else if (message.targetType === 'group') {
          io.to(`group_${message.targetId}`).emit('message_edited', { messageId, content });
        } else if (message.targetType === 'community') {
          io.to(`community_${message.targetId}`).emit('message_edited', { messageId, content });
        }
        console.log(`✏️ Message ${messageId} edited by ${socket.userId}`);
      }
    } catch (error) {
      console.error('Edit message error:', error);
    }
  });

  // Handle read receipts
  socket.on('mark_read', async (data) => {
    const { messageId, conversationId } = data;
    
    try {
      if (messageId) {
        const message = await DirectMessage.findById(messageId);
        if (message) {
          message.markAsRead(socket.userId);
          await message.save();
          
          // Notify sender
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', {
              messageId,
              readBy: socket.userId,
              readAt: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Handle status changes
  socket.on('change_status', async (status) => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        'onlineStatus.status': status
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
        
        // Handle various socket events (keeping existing logic)
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
  mongoose.connection.close(() => {
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
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