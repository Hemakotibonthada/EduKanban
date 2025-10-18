const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Channel = require('../models/Channel');
const Group = require('../models/Group');
const DirectMessage = require('../models/DirectMessage');
const DirectConversation = require('../models/DirectConversation');
const FriendRequest = require('../models/FriendRequest');
const FileAttachment = require('../models/FileAttachment');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const fileUploadService = require('../services/FileUploadService');

// ==================== FRIEND REQUESTS ====================

// Get all friend requests for current user
router.get('/friend-requests', async (req, res) => {
  try {
    const sent = await FriendRequest.find({
      sender: req.userId,
      status: { $in: ['pending', 'accepted', 'rejected'] }
    })
      .populate('receiver', 'username firstName lastName avatar onlineStatus')
      .sort({ createdAt: -1 });

    const received = await FriendRequest.find({
      receiver: req.userId,
      status: 'pending'
    })
      .populate('sender', 'username firstName lastName avatar onlineStatus')
      .populate('metadata.commonCourses', 'title')
      .populate('metadata.commonCommunities', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { sent, received }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch friend requests'
    });
  }
});

// Send friend request
router.post('/friend-requests', async (req, res) => {
  try {
    const { receiverId, message, connectionReason = 'search' } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    if (receiverId === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if request already exists
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.userId }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already exists'
      });
    }

    // Check if already friends
    const user = await User.findById(req.userId);
    if (user.friends.includes(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends'
      });
    }

    const friendRequest = new FriendRequest({
      sender: req.userId,
      receiver: receiverId,
      message,
      connectionReason
    });

    await friendRequest.save();
    await friendRequest.populate('receiver', 'username firstName lastName avatar');
    await friendRequest.populate('sender', 'username firstName lastName avatar');

    // Create notification for the receiver
    const senderUser = await User.findById(req.userId).select('username firstName lastName');
    await Notification.createNotification({
      recipient: receiverId,
      sender: req.userId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${senderUser.firstName} ${senderUser.lastName} sent you a friend request`,
      data: {
        friendRequestId: friendRequest._id,
        senderUsername: senderUser.username,
        connectionReason
      },
      priority: 'normal',
      actionUrl: `/chat?tab=friends`
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_notification', {
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderUser.firstName} ${senderUser.lastName} sent you a friend request`,
        friendRequestId: friendRequest._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: { friendRequest }
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }
});

// Accept friend request
router.put('/friend-requests/:id/accept', async (req, res) => {
  try {
    console.log('🔍 Accepting friend request:', req.params.id);
    console.log('🔍 User ID:', req.userId);

    const friendRequest = await FriendRequest.findById(req.params.id);

    if (!friendRequest) {
      console.log('❌ Friend request not found');
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    console.log('✅ Friend request found:', friendRequest);

    if (friendRequest.receiver.toString() !== req.userId.toString()) {
      console.log('❌ Unauthorized access');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Accept the friend request
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();
    console.log('✅ Friend request status updated');

    // Add to friends list for both users
    try {
      await User.findByIdAndUpdate(friendRequest.sender, {
        $addToSet: { friends: friendRequest.receiver }
      });
      await User.findByIdAndUpdate(friendRequest.receiver, {
        $addToSet: { friends: friendRequest.sender }
      });
      console.log('✅ Friends lists updated');
    } catch (friendsError) {
      console.error('❌ Error updating friends lists:', friendsError);
    }

    // Create a conversation
    let conversation = null;
    try {
      // Check if conversation already exists
      conversation = await DirectConversation.findOne({
        participants: { $all: [friendRequest.sender, friendRequest.receiver] }
      });

      if (!conversation) {
        conversation = new DirectConversation({
          participants: [friendRequest.sender, friendRequest.receiver]
        });
        await conversation.save();
        console.log('✅ Conversation created');
      } else {
        console.log('✅ Using existing conversation');
      }
    } catch (convError) {
      console.error('❌ Error creating conversation:', convError);
    }

    // Create notification for the sender (person who sent the original request)
    try {
      const accepterUser = await User.findById(req.userId).select('username firstName lastName');
      
      if (accepterUser && Notification && Notification.createNotification) {
        await Notification.createNotification({
          recipient: friendRequest.sender,
          sender: req.userId,
          type: 'friend_request',
          title: 'Friend Request Accepted',
          message: `${accepterUser.firstName || accepterUser.username} ${accepterUser.lastName || ''} accepted your friend request`.trim(),
          data: {
            friendRequestId: friendRequest._id,
            accepterUsername: accepterUser.username,
            conversationId: conversation?._id
          },
          priority: 'normal',
          actionUrl: conversation ? `/chat?conversationId=${conversation._id}` : '/chat'
        });
        console.log('✅ Notification created');

        // Emit real-time notification via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${friendRequest.sender}`).emit('new_notification', {
            type: 'friend_request_accepted',
            title: 'Friend Request Accepted',
            message: `${accepterUser.firstName || accepterUser.username} ${accepterUser.lastName || ''} accepted your friend request`.trim(),
            conversationId: conversation?._id
          });
          console.log('✅ Socket notification emitted');
        }
      }
    } catch (notifError) {
      console.error('❌ Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    console.log('✅ Friend request accepted successfully');

    res.json({
      success: true,
      message: 'Friend request accepted',
      data: { 
        friendRequest,
        conversation: conversation ? {
          _id: conversation._id,
          participants: conversation.participants
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Accept friend request error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to accept friend request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reject friend request
router.put('/friend-requests/:id/reject', async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.receiver.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await friendRequest.reject();

    // Optionally notify the sender (you may want to skip this for privacy)
    // Uncomment if you want to notify when request is rejected
    /*
    const rejecterUser = await User.findById(req.userId).select('username firstName lastName');
    await Notification.createNotification({
      recipient: friendRequest.sender,
      sender: req.userId,
      type: 'system',
      title: 'Friend Request Update',
      message: `Your friend request was declined`,
      data: {
        friendRequestId: friendRequest._id
      },
      priority: 'low'
    });
    */

    res.json({
      success: true,
      message: 'Friend request rejected',
      data: { friendRequest }
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject friend request'
    });
  }
});

// ==================== DIRECT MESSAGES ====================

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await DirectConversation.find({
      participants: req.userId,
      isActive: true
    })
      .populate('participants', 'username firstName lastName avatar onlineStatus')
      .populate({
        path: 'lastMessage',
        select: 'content messageType createdAt sender'
      })
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

// Get messages in a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversationId = req.params.id;

    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const messages = await DirectMessage.find({
      targetType: 'user',
      targetId: conversationId,
      isDeleted: false,
      deletedFor: { $ne: req.userId }
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('attachments')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark messages as read
    await DirectMessage.updateMany(
      {
        targetId: conversationId,
        sender: { $ne: req.userId },
        'readBy.user': { $ne: req.userId }
      },
      {
        $push: { readBy: { user: req.userId, readAt: new Date() } }
      }
    );

    // Reset unread count
    await conversation.resetUnreadCount(req.userId);

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

// Send message in conversation
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, messageType = 'text', replyTo, mentions } = req.body;
    const conversationId = req.params.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const message = new DirectMessage({
      sender: req.userId,
      targetType: 'user',
      targetId: conversationId,
      content: content.trim(),
      messageType,
      replyTo,
      mentions: mentions || []
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    conversation.stats.totalMessages += 1;
    
    // Increment unread count for other participant
    const otherParticipant = conversation.getOtherParticipant(req.userId);
    await conversation.incrementUnreadCount(otherParticipant);
    await conversation.save();

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

// ==================== COMMUNITIES ====================

// Get all communities
router.get('/communities', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    const query = { isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const communities = await Community.find(query)
      .populate('creator', 'username firstName lastName avatar')
      .populate('members.user', 'username firstName lastName avatar')
      .sort({ 'stats.totalMembers': -1 })
      .limit(50);

    res.json({
      success: true,
      data: { communities }
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communities'
    });
  }
});

// Get user's communities
router.get('/communities/my', async (req, res) => {
  try {
    const communities = await Community.find({
      'members.user': req.userId,
      isActive: true
    })
      .populate('creator', 'username firstName lastName avatar')
      .populate('channels')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { communities }
    });
  } catch (error) {
    console.error('Get my communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communities'
    });
  }
});

// Create community
router.post('/communities', async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'public',
      category = 'general',
      tags,
      relatedCourse
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Community name is required'
      });
    }

    const community = new Community({
      name: name.trim(),
      description,
      type,
      category,
      tags: tags || [],
      relatedCourse,
      creator: req.userId,
      members: [{
        user: req.userId,
        role: 'owner',
        permissions: {
          canInvite: true,
          canCreateChannels: true,
          canManageMessages: true,
          canManageMembers: true
        }
      }]
    });

    await community.save();

    // Create default general channel
    const generalChannel = new Channel({
      name: 'general',
      description: 'General discussion',
      community: community._id,
      type: 'text',
      visibility: 'public',
      creator: req.userId
    });

    await generalChannel.save();
    community.channels.push(generalChannel._id);
    await community.save();

    await community.populate('creator', 'username firstName lastName avatar');
    await community.populate('channels');

    res.status(201).json({
      success: true,
      message: 'Community created',
      data: { community }
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community'
    });
  }
});

// Join community
router.post('/communities/:id/join', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    if (community.isMember(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member'
      });
    }

    if (community.type === 'private' && !community.settings.requireApproval) {
      return res.status(403).json({
        success: false,
        message: 'This community requires an invitation'
      });
    }

    community.members.push({
      user: req.userId,
      role: 'member',
      permissions: {
        canInvite: community.settings.allowMemberInvites,
        canCreateChannels: false,
        canManageMessages: false,
        canManageMembers: false
      }
    });

    await community.save();

    res.json({
      success: true,
      message: 'Joined community successfully',
      data: { community }
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join community'
    });
  }
});

// Leave community
router.post('/communities/:id/leave', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    if (!community.isMember(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Not a member'
      });
    }

    if (community.creator.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave community. Transfer ownership first.'
      });
    }

    community.members = community.members.filter(
      m => m.user.toString() !== req.userId.toString()
    );

    await community.save();

    res.json({
      success: true,
      message: 'Left community successfully'
    });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave community'
    });
  }
});

// ==================== CHANNELS ====================

// Get channels in community
router.get('/communities/:id/channels', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    if (!community.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Must be a member to view channels'
      });
    }

    const userRole = community.getMemberRole(req.userId);
    const channels = await Channel.find({
      community: req.params.id,
      isActive: true
    }).sort({ order: 1 });

    // Filter channels based on visibility and user role
    const accessibleChannels = channels.filter(channel =>
      channel.canAccess(req.userId, userRole)
    );

    res.json({
      success: true,
      data: { channels: accessibleChannels }
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channels'
    });
  }
});

// Create channel
router.post('/communities/:id/channels', async (req, res) => {
  try {
    const { name, description, type = 'text', visibility = 'public' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required'
      });
    }

    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    if (!community.hasPermission(req.userId, 'canCreateChannels')) {
      return res.status(403).json({
        success: false,
        message: 'No permission to create channels'
      });
    }

    const channel = new Channel({
      name: name.trim(),
      description,
      type,
      visibility,
      community: req.params.id,
      creator: req.userId,
      order: community.channels.length
    });

    await channel.save();

    community.channels.push(channel._id);
    await community.save();

    res.status(201).json({
      success: true,
      message: 'Channel created',
      data: { channel }
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create channel'
    });
  }
});

// Get messages in channel
router.get('/channels/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const channel = await Channel.findById(req.params.id).populate('community');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    const community = await Community.findById(channel.community._id);
    const userRole = community.getMemberRole(req.userId);

    if (!channel.canAccess(req.userId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No access to this channel'
      });
    }

    const messages = await DirectMessage.find({
      targetType: 'channel',
      targetId: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('attachments')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message in channel
router.post('/channels/:id/messages', async (req, res) => {
  try {
    const { content, messageType = 'text', replyTo, mentions } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const channel = await Channel.findById(req.params.id).populate('community');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    const community = await Community.findById(channel.community._id);
    const userRole = community.getMemberRole(req.userId);

    if (!channel.canAccess(req.userId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No access to this channel'
      });
    }

    if (channel.settings.onlyAdminsPost && !['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can post in this channel'
      });
    }

    const message = new DirectMessage({
      sender: req.userId,
      targetType: 'channel',
      targetId: req.params.id,
      content: content.trim(),
      messageType,
      replyTo,
      mentions: mentions || []
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update channel stats
    channel.stats.totalMessages += 1;
    channel.stats.lastActivity = new Date();
    await channel.save();

    // Update community stats
    community.stats.totalMessages += 1;
    await community.save();

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (error) {
    console.error('Send channel message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// ==================== GROUPS ====================

// Get user's groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.userId,
      isActive: true
    })
      .populate('members.user', 'username firstName lastName avatar onlineStatus')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups'
    });
  }
});

// Create group
router.post('/groups', async (req, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one member is required'
      });
    }

    const members = [
      { user: req.userId, role: 'admin' },
      ...memberIds.map(id => ({ user: id, role: 'member' }))
    ];

    const group = new Group({
      name: name.trim(),
      description,
      creator: req.userId,
      members
    });

    await group.save();
    await group.populate('members.user', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Group created',
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// Get group messages
router.get('/groups/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not a group member'
      });
    }

    const messages = await DirectMessage.find({
      targetType: 'group',
      targetId: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('attachments')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message in group
router.post('/groups/:id/messages', async (req, res) => {
  try {
    const { content, messageType = 'text', replyTo, mentions } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not a group member'
      });
    }

    const message = new DirectMessage({
      sender: req.userId,
      targetType: 'group',
      targetId: req.params.id,
      content: content.trim(),
      messageType,
      replyTo,
      mentions: mentions || []
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');

    // Update group
    group.lastMessage = message._id;
    group.lastActivity = new Date();
    group.stats.totalMessages += 1;
    await group.save();

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// ==================== FILE UPLOAD ====================

// Upload file
router.post('/upload', fileUploadService.getUploader().single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { targetType, targetId, messageId } = req.body;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target information is required'
      });
    }

    const fileAttachment = await fileUploadService.saveFileMetadata({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      uploadedBy: req.userId,
      messageId,
      targetType,
      targetId
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file: fileAttachment }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// ==================== MESSAGE ACTIONS ====================

// Add reaction to message
router.post('/messages/:id/reactions', async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const added = message.addReaction(req.userId, emoji);
    
    if (added) {
      await message.save();
      res.json({
        success: true,
        message: 'Reaction added',
        data: { message }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Already reacted with this emoji'
      });
    }
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
});

// Remove reaction from message
router.delete('/messages/:id/reactions/:emoji', async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const removed = message.removeReaction(req.userId, req.params.emoji);
    
    if (removed) {
      await message.save();
      res.json({
        success: true,
        message: 'Reaction removed',
        data: { message }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Reaction not found'
      });
    }
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
});

// Star/unstar message
router.post('/messages/:id/star', async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const isStarred = message.starredBy.includes(req.userId);

    if (isStarred) {
      message.starredBy = message.starredBy.filter(
        id => id.toString() !== req.userId.toString()
      );
    } else {
      message.starredBy.push(req.userId);
    }

    await message.save();

    res.json({
      success: true,
      message: isStarred ? 'Message unstarred' : 'Message starred',
      data: { message }
    });
  } catch (error) {
    console.error('Star message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to star message'
    });
  }
});

// Delete message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { forEveryone = false } = req.body;
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete your own messages'
      });
    }

    if (forEveryone) {
      message.isDeleted = true;
      message.deletedBy = req.userId;
      message.deletedAt = new Date();
    } else {
      message.deletedFor.push(req.userId);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted',
      data: { message }
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Edit message
router.patch('/messages/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only edit your own messages'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');

    res.json({
      success: true,
      message: 'Message updated',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }
});

// Pin a message
router.post('/messages/:id/pin', async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Add pinned field if it doesn't exist
    if (!message.pinned) {
      message.pinned = true;
      message.pinnedBy = req.userId;
      message.pinnedAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message pinned',
      data: message
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin message'
    });
  }
});

// Unpin a message
router.delete('/messages/:id/pin', async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.pinned = false;
    message.pinnedBy = null;
    message.pinnedAt = null;
    await message.save();

    res.json({
      success: true,
      message: 'Message unpinned',
      data: message
    });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpin message'
    });
  }
});

// ==================== USER SEARCH & DISCOVERY ====================

// Get direct messages with a specific user (by user ID)
router.get('/direct-messages/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const otherUserId = req.params.userId;

    // Find messages where:
    // 1. I am sender and other user is target, OR
    // 2. Other user is sender and I am target
    const messages = await DirectMessage.find({
      $or: [
        {
          sender: req.userId,
          targetType: 'user',
          targetId: otherUserId,
          isDeleted: false,
          deletedFor: { $ne: req.userId }
        },
        {
          sender: otherUserId,
          targetType: 'user',
          targetId: req.userId,
          isDeleted: false,
          deletedFor: { $ne: req.userId }
        }
      ]
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('attachments')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark received messages as read
    await DirectMessage.updateMany(
      {
        sender: otherUserId,
        targetId: req.userId,
        targetType: 'user',
        'readBy.user': { $ne: req.userId }
      },
      {
        $push: { readBy: { user: req.userId, readAt: new Date() } }
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Search users
router.get('/users/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = new RegExp(q, 'i');

    // Find users matching the query
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ],
      _id: { $ne: req.userId },
      isActive: true
    })
      .select('username firstName lastName email avatar onlineStatus profile.knowledgeLevel')
      .limit(parseInt(limit));

    // Get current user's courses for matching
    const currentUser = await User.findById(req.userId).select('enrolledCourses');
    const Course = require('../models/Course');
    
    // Enrich users with match reasons
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      const matchReasons = [];

      // Check username match
      if (searchRegex.test(user.username)) {
        matchReasons.push({ type: 'username', label: 'Username match' });
      }

      // Check name match
      if (searchRegex.test(user.firstName) || searchRegex.test(user.lastName)) {
        matchReasons.push({ type: 'name', label: 'Name match' });
      }

      // Check email match
      if (searchRegex.test(user.email)) {
        matchReasons.push({ type: 'email', label: 'Email match' });
      }

      // Check for common courses
      const userWithCourses = await User.findById(user._id).select('enrolledCourses');
      if (userWithCourses && userWithCourses.enrolledCourses) {
        const commonCourses = userWithCourses.enrolledCourses.filter(courseId =>
          currentUser.enrolledCourses.some(myCourse => myCourse.toString() === courseId.toString())
        );

        if (commonCourses.length > 0) {
          // Get course names
          const courses = await Course.find({ _id: { $in: commonCourses } }).select('title');
          const courseNames = courses.map(c => c.title).join(', ');
          matchReasons.push({ 
            type: 'course', 
            label: `Common course${commonCourses.length > 1 ? 's' : ''}: ${courseNames}`,
            count: commonCourses.length
          });
        }
      }

      // If no specific reason, add general match
      if (matchReasons.length === 0) {
        matchReasons.push({ type: 'general', label: 'Profile match' });
      }

      return {
        ...userObj,
        matchReasons,
        primaryReason: matchReasons[0] // The most relevant reason
      };
    }));

    // Sort by relevance (users with course matches first)
    enrichedUsers.sort((a, b) => {
      const aHasCourse = a.matchReasons.some(r => r.type === 'course');
      const bHasCourse = b.matchReasons.some(r => r.type === 'course');
      if (aHasCourse && !bHasCourse) return -1;
      if (!aHasCourse && bHasCourse) return 1;
      return 0;
    });

    res.json({
      success: true,
      data: { users: enrichedUsers }
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Get friends list
router.get('/users/friends', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username firstName lastName avatar onlineStatus profile.knowledgeLevel');

    res.json({
      success: true,
      data: { friends: user.friends }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch friends'
    });
  }
});

// Get online friends
router.get('/users/online-friends', async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'friends',
        match: { 'onlineStatus.isOnline': true },
        select: 'username firstName lastName avatar onlineStatus'
      });

    res.json({
      success: true,
      data: { 
        onlineFriends: user.friends || [],
        count: user.friends?.length || 0
      }
    });
  } catch (error) {
    console.error('Get online friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online friends'
    });
  }
});

// ==================== MESSAGE REACTIONS ====================

// Add reaction to message
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await DirectMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Add reaction
    const added = message.addReaction(req.userId, emoji);
    
    if (!added) {
      return res.status(400).json({
        success: false,
        message: 'You have already reacted with this emoji'
      });
    }

    await message.save();

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(message.targetId.toString()).emit('message:reaction:add', {
        messageId: message._id,
        userId: req.userId,
        emoji,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Reaction added',
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:emoji', async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    const message = await DirectMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove reaction
    const removed = message.removeReaction(req.userId, decodeURIComponent(emoji));
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    await message.save();

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(message.targetId.toString()).emit('message:reaction:remove', {
        messageId: message._id,
        userId: req.userId,
        emoji: decodeURIComponent(emoji),
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Reaction removed',
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== MESSAGE THREADING ====================

// Get thread replies
router.get('/messages/:messageId/thread', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const parentMessage = await DirectMessage.findById(messageId)
      .populate('sender', 'firstName lastName username avatar')
      .populate('threadReplies');

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Get thread replies with pagination
    const replies = await DirectMessage.find({
      threadId: messageId,
      isDeleted: false
    })
      .populate('sender', 'firstName lastName username avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalReplies = await DirectMessage.countDocuments({
      threadId: messageId,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        parentMessage,
        replies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReplies / parseInt(limit)),
          totalItems: totalReplies
        }
      }
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reply to message (create thread)
router.post('/messages/:messageId/reply', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, attachments = [] } = req.body;

    if (!content && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachments required'
      });
    }

    const parentMessage = await DirectMessage.findById(messageId);

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Parent message not found'
      });
    }

    // Create reply message
    const reply = new DirectMessage({
      sender: req.userId,
      targetType: parentMessage.targetType,
      targetId: parentMessage.targetId,
      content,
      attachments,
      replyTo: messageId,
      threadId: parentMessage.threadId || messageId, // Use existing thread or create new one
      messageType: attachments.length > 0 ? 'file' : 'text'
    });

    await reply.save();

    // Add to parent's thread replies
    if (!parentMessage.threadReplies) {
      parentMessage.threadReplies = [];
    }
    parentMessage.threadReplies.push(reply._id);
    await parentMessage.save();

    // Populate reply data
    await reply.populate('sender', 'firstName lastName username avatar');
    await reply.populate('replyTo', 'content sender');

    // Emit socket event
    if (req.io) {
      req.io.to(parentMessage.targetId.toString()).emit('message:thread:reply', {
        parentId: messageId,
        reply
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply added',
      data: reply
    });
  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== MESSAGE EDIT/DELETE ====================

// Edit message
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if message is within edit window (15 minutes)
    const editWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
    const messageAge = Date.now() - message.createdAt.getTime();

    if (messageAge > editWindow) {
      return res.status(400).json({
        success: false,
        message: 'Message edit window has expired (15 minutes)'
      });
    }

    // Store edit history
    if (!message.editHistory) {
      message.editHistory = [];
    }
    message.editHistory.push({
      content: message.content,
      editedAt: new Date()
    });

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.targetId.toString()).emit('message:edited', {
        messageId: message._id,
        content: message.content,
        isEdited: true,
        editedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message updated',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    if (deleteForEveryone) {
      // Soft delete for everyone
      message.isDeleted = true;
      message.deletedBy = req.userId;
      message.deletedAt = new Date();
      message.content = 'This message was deleted';
    } else {
      // Delete only for this user
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.includes(req.userId)) {
        message.deletedFor.push(req.userId);
      }
    }

    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.targetId.toString()).emit('message:deleted', {
        messageId: message._id,
        deletedBy: req.userId,
        deleteForEveryone,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted for you'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CONVERSATION MANAGEMENT ====================

// Pin/Unpin conversation
router.put('/conversations/:conversationId/pin', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { isPinned = true } = req.body;

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update participant settings
    let settings = conversation.participantSettings.find(
      s => s.user.toString() === req.userId.toString()
    );

    if (!settings) {
      settings = {
        user: req.userId,
        isPinned,
        isMuted: false,
        isArchived: false
      };
      conversation.participantSettings.push(settings);
    } else {
      settings.isPinned = isPinned;
    }

    await conversation.save();

    res.json({
      success: true,
      message: isPinned ? 'Conversation pinned' : 'Conversation unpinned',
      data: { conversation }
    });
  } catch (error) {
    console.error('Pin conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mute/Unmute conversation
router.put('/conversations/:conversationId/mute', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { isMuted = true } = req.body;

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update participant settings
    let settings = conversation.participantSettings.find(
      s => s.user.toString() === req.userId.toString()
    );

    if (!settings) {
      settings = {
        user: req.userId,
        isMuted,
        isPinned: false,
        isArchived: false
      };
      conversation.participantSettings.push(settings);
    } else {
      settings.isMuted = isMuted;
    }

    await conversation.save();

    res.json({
      success: true,
      message: isMuted ? 'Conversation muted' : 'Conversation unmuted',
      data: { conversation }
    });
  } catch (error) {
    console.error('Mute conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Archive/Unarchive conversation
router.put('/conversations/:conversationId/archive', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { isArchived = true } = req.body;

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update participant settings
    let settings = conversation.participantSettings.find(
      s => s.user.toString() === req.userId.toString()
    );

    if (!settings) {
      settings = {
        user: req.userId,
        isArchived,
        isPinned: false,
        isMuted: false
      };
      conversation.participantSettings.push(settings);
    } else {
      settings.isArchived = isArchived;
    }

    await conversation.save();

    res.json({
      success: true,
      message: isArchived ? 'Conversation archived' : 'Conversation unarchived',
      data: { conversation }
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search messages in conversation
router.get('/conversations/:conversationId/search', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query, limit = 20, page = 1 } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Search messages using text index
    const messages = await DirectMessage.find({
      targetId: conversationId,
      isDeleted: false,
      $text: { $search: query }
    })
      .populate('sender', 'firstName lastName username avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalResults = await DirectMessage.countDocuments({
      targetId: conversationId,
      isDeleted: false,
      $text: { $search: query }
    });

    res.json({
      success: true,
      data: {
        query,
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalResults / parseInt(limit)),
          totalItems: totalResults
        }
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all conversations with filters
router.get('/conversations', async (req, res) => {
  try {
    const { filter = 'all', search = '', limit = 20, page = 1 } = req.query;

    // Build query
    const query = {
      participants: req.userId,
      isActive: true
    };

    // Get conversations
    let conversations = await DirectConversation.find(query)
      .populate('participants', 'firstName lastName username avatar onlineStatus')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Apply filters based on participant settings
    conversations = conversations.map(conv => {
      const userSettings = conv.participantSettings?.find(
        s => s.user.toString() === req.userId.toString()
      ) || {};

      return {
        ...conv,
        isPinned: userSettings.isPinned || false,
        isMuted: userSettings.isMuted || false,
        isArchived: userSettings.isArchived || false
      };
    });

    // Filter based on request
    if (filter === 'pinned') {
      conversations = conversations.filter(c => c.isPinned);
    } else if (filter === 'archived') {
      conversations = conversations.filter(c => c.isArchived);
    } else if (filter === 'active') {
      conversations = conversations.filter(c => !c.isArchived);
    }

    // Apply search if provided
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      conversations = conversations.filter(conv => {
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.userId.toString()
        );
        return (
          otherParticipant?.firstName?.toLowerCase().includes(searchLower) ||
          otherParticipant?.lastName?.toLowerCase().includes(searchLower) ||
          otherParticipant?.username?.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = conversations.length;

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Pin message in conversation
router.put('/messages/:messageId/pin', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isPinned = true } = req.body;

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isPinned = isPinned;
    if (isPinned) {
      message.pinnedBy = req.userId;
      message.pinnedAt = new Date();
    } else {
      message.pinnedBy = null;
      message.pinnedAt = null;
    }

    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.targetId.toString()).emit('message:pinned', {
        messageId: message._id,
        isPinned,
        pinnedBy: req.userId,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: isPinned ? 'Message pinned' : 'Message unpinned',
      data: { message }
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get pinned messages in conversation
router.get('/conversations/:conversationId/pinned', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const pinnedMessages = await DirectMessage.find({
      targetId: conversationId,
      isPinned: true,
      isDeleted: false
    })
      .populate('sender', 'firstName lastName username avatar')
      .populate('pinnedBy', 'firstName lastName username')
      .sort({ pinnedAt: -1 });

    res.json({
      success: true,
      data: { pinnedMessages }
    });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pinned messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== READ RECEIPTS ====================

// Mark message as read
router.post('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Don't mark own messages as read
    if (message.sender.toString() === req.userId.toString()) {
      return res.json({
        success: true,
        message: 'Cannot mark own message as read'
      });
    }

    const wasRead = message.markAsRead(req.userId);
    
    if (wasRead) {
      await message.save();

      // Emit socket event to sender
      if (req.io) {
        req.io.to(message.sender.toString()).emit('message:read', {
          messageId: message._id,
          readBy: req.userId,
          readAt: new Date()
        });
      }

      // Update conversation unread count
      const conversation = await DirectConversation.findOne({
        participants: { $all: [message.sender, req.userId] }
      });

      if (conversation) {
        await conversation.resetUnreadCount(req.userId);
      }
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: { readBy: message.readBy }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark all messages in conversation as read
router.post('/conversations/:conversationId/read-all', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await DirectConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark all unread messages as read
    const unreadMessages = await DirectMessage.find({
      targetId: conversationId,
      sender: { $ne: req.userId },
      'readBy.user': { $ne: req.userId }
    });

    for (const message of unreadMessages) {
      message.markAsRead(req.userId);
      await message.save();
    }

    // Reset unread count
    await conversation.resetUnreadCount(req.userId);

    // Emit socket event
    if (req.io && unreadMessages.length > 0) {
      const otherParticipant = conversation.getOtherParticipant(req.userId);
      req.io.to(otherParticipant.toString()).emit('conversation:read:all', {
        conversationId,
        readBy: req.userId,
        messageCount: unreadMessages.length,
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      message: `${unreadMessages.length} message(s) marked as read`
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
