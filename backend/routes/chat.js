const express = require('express');
const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

const router = express.Router();

// GET /api/chat/conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
      isActive: true
    })
    .populate('participants', 'username firstName lastName')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// POST /api/chat/conversations
router.post('/conversations', async (req, res) => {
  try {
    const { participantId, connectionReason = 'username_search' } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] }
    });

    if (existingConversation) {
      return res.json({
        success: true,
        data: { conversation: existingConversation }
      });
    }

    // Create new conversation
    const conversationId = crypto.randomUUID();
    const conversation = new Conversation({
      participants: [req.userId, participantId],
      conversationId,
      metadata: {
        connectionReason
      }
    });

    await conversation.save();

    // Log chat initiation
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'chat_initiated',
      entity: { type: 'user', id: participantId },
      details: { conversationId, connectionReason },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      data: { conversation }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversationId = req.params.id;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
    .populate('senderId', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { text, type = 'text' } = req.body;
    const conversationId = req.params.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get the other participant
    const receiverId = conversation.participants.find(
      id => id.toString() !== req.userId.toString()
    );

    // Create message
    const message = new Message({
      senderId: req.userId,
      receiverId,
      conversationId,
      content: {
        text: text.trim(),
        type
      }
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    conversation.metadata.totalMessages = (conversation.metadata.totalMessages || 0) + 1;
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'username firstName lastName');

    // Log message sent
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'message_sent',
      entity: { type: 'user', id: receiverId },
      details: {
        conversationId,
        messageLength: text.length,
        messageType: type
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

module.exports = router;