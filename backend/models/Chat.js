const mongoose = require('mongoose');

// Chat and messaging system
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  content: {
    text: {
      type: String,
      required: true,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimetype: String
    }]
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date
  },
  editedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for chat functionality
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ status: 1 });

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    sharedCourses: [{
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      courseName: String
    }],
    connectionReason: {
      type: String,
      enum: ['username_search', 'same_course', 'same_project', 'recommendation'],
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ lastActivity: -1 });

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Message, Conversation };