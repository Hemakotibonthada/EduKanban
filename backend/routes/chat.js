const express = require('express');
const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

const router = express.Router();

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get user's conversations
 *     description: Retrieve all active conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           participants:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           lastMessage:
 *                             type: object
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Create a new conversation
 *     description: Start a new conversation with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: ID of the user to start conversation with
 *               connectionReason:
 *                 type: string
 *                 default: username_search
 *                 description: How the connection was initiated
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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