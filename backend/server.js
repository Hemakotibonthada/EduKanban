require('dotenv').config();
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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edukanban', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Security middleware
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// More strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 auth requests per windowMs
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
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
      });
      
      // Broadcast to friends
      const user = await User.findById(socket.userId).populate('friends', '_id');
      if (user && user.friends) {
        user.friends.forEach(friend => {
          const friendSocketId = onlineUsers.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_status_changed', {
              userId: socket.userId,
              status
            });
          }
        });
      }
    } catch (error) {
      console.error('Change status error:', error);
    }
  });

  // Handle notification events
  socket.on('send_notification', async (data) => {
    try {
      const Notification = require('./models/Notification');
      const notification = await Notification.createNotification(data);
      
      // Send to recipient via Socket.IO
      io.to(`user_${data.recipient}`).emit('new_notification', notification);
    } catch (error) {
      console.error('Send notification error:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', async () => {
    console.log('❌ User disconnected:', socket.id, '| User ID:', socket.userId);
    
    try {
      await User.findByIdAndUpdate(socket.userId, {
        'onlineStatus.isOnline': false,
        'onlineStatus.status': 'offline',
        'onlineStatus.lastSeen': new Date()
      });
      
      onlineUsers.delete(socket.userId);
      console.log(`👤 User ${socket.userId} marked as offline | Total online: ${onlineUsers.size}`);
      
      // Broadcast to friends
      const user = await User.findById(socket.userId).populate('friends', '_id');
      if (user && user.friends) {
        console.log(`📢 Broadcasting offline status to ${user.friends.length} friends`);
        let broadcastCount = 0;
        user.friends.forEach(friend => {
          const friendSocketId = onlineUsers.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_offline', {
              userId: socket.userId,
              lastSeen: new Date()
            });
            broadcastCount++;
          }
        });
        console.log(`✅ Notified ${broadcastCount} online friends`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local: http://localhost:${PORT}/api`);
  console.log(`🌐 Network: http://<your-local-ip>:${PORT}/api`);
  console.log(`💡 Tip: Find your local IP with 'ifconfig | grep inet' (macOS/Linux) or 'ipconfig' (Windows)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      process.exit(0);
    });
  });
});

module.exports = app;