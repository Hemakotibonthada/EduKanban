const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const query = { recipient: req.userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.getUnreadCount(req.userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: await Notification.countDocuments(query)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read'
    });
  }
});

// Mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.markAllAsRead(req.userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read'
    });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      recipient: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Create notification (for testing/admin)
router.post('/', async (req, res) => {
  try {
    const { recipientId, type, title, message, data } = req.body;

    const notification = await Notification.createNotification({
      recipient: recipientId,
      sender: req.userId,
      type,
      title,
      message,
      data
    });

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

module.exports = router;
