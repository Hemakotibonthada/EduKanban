const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /api/users/profile
router.put('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('username').optional().isLength({ min: 3, max: 30 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updates = {};
    const allowedFields = ['firstName', 'lastName', 'username'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.profile) {
      Object.keys(req.body.profile).forEach(key => {
        updates[`profile.${key}`] = req.body.profile[key];
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    // Log profile update
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'profile_updated',
      entity: { type: 'user', id: req.userId },
      details: { updatedFields: Object.keys(updates) },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// GET /api/users/search
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let users = [];

    if (type === 'username' || !type) {
      users = await User.find({
        username: { $regex: q, $options: 'i' },
        _id: { $ne: req.userId },
        isActive: true
      }).select('_id username firstName lastName').limit(10);
    }

    // Log user search
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'user_searched',
      entity: { type: 'system' },
      details: { searchQuery: q, searchType: type, resultsFound: users.length },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// POST /api/users/profile-picture - Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create URL for the uploaded file
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

    // Update user's profile picture
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      type: 'profile',
      action: 'update',
      details: 'Updated profile picture',
      metadata: {
        fileSize: req.file.size,
        fileName: req.file.filename
      }
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: profilePictureUrl,
        user
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    // Delete uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
    });
  }
});

// DELETE /api/users/profile-picture - Remove profile picture
router.delete('/profile-picture', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture file if it exists
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove profile picture from user
    user.profilePicture = null;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      type: 'profile',
      action: 'update',
      details: 'Removed profile picture'
    });

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      data: { user: user.toObject({ getters: true }) }
    });

  } catch (error) {
    console.error('Profile picture removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile picture'
    });
  }
});

module.exports = router;