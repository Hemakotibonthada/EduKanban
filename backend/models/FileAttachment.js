const mongoose = require('mongoose');

// File Attachment Schema - for all file uploads
const fileAttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'pdf', 'code', 'archive', 'other'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  // For videos
  duration: {
    type: Number, // in seconds
    default: null
  },
  // For images and videos
  dimensions: {
    width: Number,
    height: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Where the file is used
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage',
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'channel', 'group', 'community'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // File storage information
  storageType: {
    type: String,
    enum: ['local', 's3', 'cloudinary'],
    default: 'local'
  },
  storagePath: {
    type: String,
    required: true
  },
  // Security
  isPublic: {
    type: Boolean,
    default: false
  },
  accessibleBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Analytics
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: null
  },
  // Virus scanning
  scanned: {
    type: Boolean,
    default: false
  },
  scanResult: {
    type: String,
    enum: ['clean', 'infected', 'pending'],
    default: 'pending'
  },
  // Metadata
  metadata: {
    encoding: String,
    codec: String,
    bitrate: Number,
    exif: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
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

// Indexes
fileAttachmentSchema.index({ uploadedBy: 1, createdAt: -1 });
fileAttachmentSchema.index({ messageId: 1 });
fileAttachmentSchema.index({ targetType: 1, targetId: 1 });
fileAttachmentSchema.index({ fileType: 1 });
fileAttachmentSchema.index({ mimeType: 1 });
fileAttachmentSchema.index({ expiresAt: 1 });

// Update timestamp
fileAttachmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
fileAttachmentSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  this.lastAccessed = new Date();
  return this.save();
};

fileAttachmentSchema.methods.incrementViews = function() {
  this.views += 1;
  this.lastAccessed = new Date();
  return this.save();
};

fileAttachmentSchema.methods.isImage = function() {
  return this.fileType === 'image' || this.mimeType.startsWith('image/');
};

fileAttachmentSchema.methods.isVideo = function() {
  return this.fileType === 'video' || this.mimeType.startsWith('video/');
};

fileAttachmentSchema.methods.isDocument = function() {
  return ['document', 'pdf'].includes(this.fileType) || 
         ['application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.mimeType);
};

fileAttachmentSchema.methods.getFileExtension = function() {
  return this.originalName.split('.').pop().toLowerCase();
};

fileAttachmentSchema.methods.getFormattedSize = function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(this.fileSize) / Math.log(1024)));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const FileAttachment = mongoose.model('FileAttachment', fileAttachmentSchema);

module.exports = FileAttachment;
