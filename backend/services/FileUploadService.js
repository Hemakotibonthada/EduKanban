const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const FileAttachment = require('../models/FileAttachment');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    
    // Allowed file types
    this.allowedMimeTypes = {
      // Images - all common formats
      images: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
        'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon', 'image/heic', 'image/heif'
      ],
      
      // Videos - all common formats
      videos: [
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
        'video/x-ms-wmv', 'video/x-flv', 'video/3gpp', 'video/3gpp2', 'video/mpeg',
        'video/x-matroska' // .mkv
      ],
      
      // Audio - all formats including voice recordings
      audio: [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-aac', 'audio/flac',
        'audio/x-flac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/opus',
        'audio/amr', 'audio/3gpp', // Voice recording formats
        'audio/x-ms-wma', 'audio/midi', 'audio/x-midi'
      ],
      
      // Documents - comprehensive list
      documents: [
        // PDFs
        'application/pdf',
        
        // Microsoft Office - Word
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        
        // Microsoft Office - Excel
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        
        // Microsoft Office - PowerPoint
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        
        // Text files
        'text/plain', // .txt
        'text/csv', // .csv
        'text/html', // .html
        'text/css', // .css
        'text/javascript', // .js
        'application/json', // .json
        'text/xml', // .xml
        'application/xml',
        'text/markdown', // .md
        'text/rtf', // .rtf
        'application/rtf',
        
        // OpenDocument formats
        'application/vnd.oasis.opendocument.text', // .odt
        'application/vnd.oasis.opendocument.spreadsheet', // .ods
        'application/vnd.oasis.opendocument.presentation', // .odp
        
        // eBooks
        'application/epub+zip', // .epub
        'application/x-mobipocket-ebook', // .mobi
        
        // Other document formats
        'application/vnd.ms-outlook', // .msg
        'application/vnd.ms-project' // .mpp
      ],
      
      // Archives/Compressed files
      archives: [
        'application/zip', 
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-rar',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-gzip'
      ],
      
      // Code files
      code: [
        'text/x-python', // .py
        'text/x-java-source', // .java
        'text/x-c', // .c
        'text/x-c++', // .cpp
        'text/x-csharp', // .cs
        'text/x-php', // .php
        'text/x-ruby', // .rb
        'text/x-go', // .go
        'text/x-swift', // .swift
        'text/x-kotlin', // .kt
        'text/x-rust', // .rs
        'application/x-httpd-php', // .php
        'application/x-sh', // .sh
        'application/x-shellscript'
      ]
    };
    
    this.initializeUploadDirectories();
  }

  async initializeUploadDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'videos'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'audio'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'archives'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'code'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'other'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  // Multer storage configuration
  getMulterStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const fileType = this.getFileType(file.mimetype);
        const dest = path.join(this.uploadDir, fileType);
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }

  // File filter for multer
  fileFilter(req, file, cb) {
    const allAllowedTypes = [
      ...this.allowedMimeTypes.images,
      ...this.allowedMimeTypes.videos,
      ...this.allowedMimeTypes.documents,
      ...this.allowedMimeTypes.audio,
      ...this.allowedMimeTypes.archives,
      ...this.allowedMimeTypes.code
    ];

    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }

  // Get multer instance
  getUploader() {
    return multer({
      storage: this.getMulterStorage(),
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Determine file type category
  getFileType(mimeType) {
    if (this.allowedMimeTypes.images.includes(mimeType)) return 'images';
    if (this.allowedMimeTypes.videos.includes(mimeType)) return 'videos';
    if (this.allowedMimeTypes.documents.includes(mimeType)) return 'documents';
    if (this.allowedMimeTypes.audio.includes(mimeType)) return 'audio';
    if (this.allowedMimeTypes.archives.includes(mimeType)) return 'archives';
    if (this.allowedMimeTypes.code.includes(mimeType)) return 'code';
    return 'other';
  }

  // Generate thumbnail for images
  async generateImageThumbnail(filePath, filename) {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, `thumb-${filename}`);
      
      await sharp(filePath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      return `/uploads/thumbnails/thumb-${filename}`;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  // Generate thumbnail for video (first frame)
  async generateVideoThumbnail(filePath, filename) {
    // Note: This requires ffmpeg to be installed
    // For now, return a placeholder
    // In production, use ffmpeg or a video processing library
    console.log('Video thumbnail generation requires ffmpeg');
    return null;
  }

  // Get image dimensions
  async getImageDimensions(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  // Save file metadata to database
  async saveFileMetadata(fileData) {
    try {
      const {
        filename,
        originalName,
        mimeType,
        fileSize,
        filePath,
        uploadedBy,
        messageId,
        targetType,
        targetId
      } = fileData;

      const fileType = this.getFileType(mimeType);
      const url = `/uploads/${fileType}/${filename}`;
      
      let thumbnailUrl = null;
      let dimensions = null;

      // Generate thumbnails and get dimensions for images
      if (fileType === 'images') {
        thumbnailUrl = await this.generateImageThumbnail(filePath, filename);
        dimensions = await getImageDimensions(filePath);
      } else if (fileType === 'videos') {
        thumbnailUrl = await this.generateVideoThumbnail(filePath, filename);
      }

      const fileAttachment = new FileAttachment({
        filename,
        originalName,
        mimeType,
        fileSize,
        fileType,
        url,
        thumbnailUrl,
        dimensions,
        uploadedBy,
        messageId,
        targetType,
        targetId,
        storageType: 'local',
        storagePath: filePath,
        scanned: false,
        scanResult: 'pending'
      });

      await fileAttachment.save();
      return fileAttachment;
    } catch (error) {
      console.error('Error saving file metadata:', error);
      throw error;
    }
  }

  // Delete file from storage
  async deleteFile(fileId) {
    try {
      const file = await FileAttachment.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Delete physical file
      await fs.unlink(file.storagePath);
      
      // Delete thumbnail if exists
      if (file.thumbnailUrl) {
        const thumbnailPath = path.join(this.uploadDir, file.thumbnailUrl);
        try {
          await fs.unlink(thumbnailPath);
        } catch (err) {
          console.error('Error deleting thumbnail:', err);
        }
      }

      // Delete from database
      await FileAttachment.findByIdAndDelete(fileId);
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check mime type
    const allAllowedTypes = [
      ...this.allowedMimeTypes.images,
      ...this.allowedMimeTypes.videos,
      ...this.allowedMimeTypes.documents,
      ...this.allowedMimeTypes.audio,
      ...this.allowedMimeTypes.archives,
      ...this.allowedMimeTypes.code
    ];

    if (!allAllowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    return errors;
  }

  // Get file statistics
  async getFileStats(userId) {
    try {
      const files = await FileAttachment.find({ uploadedBy: userId, isActive: true });
      
      const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
      const typeBreakdown = files.reduce((acc, file) => {
        acc[file.fileType] = (acc[file.fileType] || 0) + 1;
        return acc;
      }, {});

      return {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        typeBreakdown,
        totalDownloads: files.reduce((sum, file) => sum + file.downloads, 0),
        totalViews: files.reduce((sum, file) => sum + file.views, 0)
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw error;
    }
  }

  // Format bytes to human readable
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Clean up expired files
  async cleanupExpiredFiles() {
    try {
      const expiredFiles = await FileAttachment.find({
        expiresAt: { $lt: new Date() },
        isActive: true
      });

      for (const file of expiredFiles) {
        await this.deleteFile(file._id);
      }

      console.log(`Cleaned up ${expiredFiles.length} expired files`);
      return expiredFiles.length;
    } catch (error) {
      console.error('Error cleaning up expired files:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();
