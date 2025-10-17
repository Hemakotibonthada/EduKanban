const { logger } = require('./middleware/logger');

/**
 * Socket.IO event handlers
 */
module.exports = (socket, io, onlineUsers) => {
  const User = require('./models/User');
  const DirectMessage = require('./models/DirectMessage');
  const DirectConversation = require('./models/DirectConversation');
  const Notification = require('./models/Notification');

  // Handle joining a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle leaving a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle sending direct messages
  socket.on('send_direct_message', async (data) => {
    try {
      const { conversationId, message, recipientId } = data;
      
      // Create the message
      const newMessage = await DirectMessage.create({
        conversation: conversationId,
        sender: socket.userId,
        content: message,
        messageType: 'text'
      });

      // Populate sender info
      await newMessage.populate('sender', 'username profilePicture');

      // Update conversation last message
      await DirectConversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
        lastActivity: new Date()
      });

      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('new_direct_message', {
        message: newMessage,
        conversationId
      });

      // Send notification to recipient if they're not in the conversation room
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message_notification', {
          senderId: socket.userId,
          conversationId,
          message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        });
      }

    } catch (error) {
      logger.error('Send direct message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  // Handle online status changes
  socket.on('change_status', async (status) => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        'onlineStatus.status': status,
        'onlineStatus.lastSeen': new Date()
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
      logger.error('Change status error:', error);
    }
  });

  // Handle notification events
  socket.on('send_notification', async (data) => {
    try {
      const notification = await Notification.createNotification(data);
      
      // Send to recipient via Socket.IO
      io.to(`user_${data.recipient}`).emit('new_notification', notification);
    } catch (error) {
      logger.error('Send notification error:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', async () => {
    logger.info(`User disconnected: ${socket.id} | User ID: ${socket.userId}`);
    
    try {
      await User.findByIdAndUpdate(socket.userId, {
        'onlineStatus.isOnline': false,
        'onlineStatus.status': 'offline',
        'onlineStatus.lastSeen': new Date()
      });
      
      onlineUsers.delete(socket.userId);
      logger.info(`User ${socket.userId} marked as offline | Total online: ${onlineUsers.size}`);
      
      // Broadcast to friends
      const user = await User.findById(socket.userId).populate('friends', '_id');
      if (user && user.friends) {
        logger.info(`Broadcasting offline status to ${user.friends.length} friends`);
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
        logger.info(`Notified ${broadcastCount} online friends`);
      }
    } catch (error) {
      logger.error('Disconnect error:', error);
    }
  });
};