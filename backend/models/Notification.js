const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'friend_request',
      'friend_accepted',
      'message',
      'mention',
      'reaction',
      'community_invite',
      'group_invite',
      'course_update',
      'task_assigned',
      'task_due',
      'achievement',
      'system'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Flexible field for type-specific data
    friendRequestId: mongoose.Schema.Types.ObjectId,
    messageId: mongoose.Schema.Types.ObjectId,
    conversationId: mongoose.Schema.Types.ObjectId,
    communityId: mongoose.Schema.Types.ObjectId,
    groupId: mongoose.Schema.Types.ObjectId,
    courseId: mongoose.Schema.Types.ObjectId,
    taskId: mongoose.Schema.Types.ObjectId,
    url: String,
    action: String
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  icon: String,
  color: String,
  actionUrl: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return notification.save();
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
