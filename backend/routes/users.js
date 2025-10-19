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

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile fields
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// PUT /api/users/profile
router.put('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('username').optional().isLength({ min: 3, max: 30 }),
  body('email').optional().isEmail(),
  body('bio').optional().isLength({ max: 500 }),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('jobTitle').optional().trim(),
  body('company').optional().trim(),
  body('birthDate').optional().isISO8601(),
  body('website').optional().isURL().optional({ checkFalsy: true }),
  body('github').optional().isURL().optional({ checkFalsy: true }),
  body('linkedin').optional().isURL().optional({ checkFalsy: true }),
  body('twitter').optional().isURL().optional({ checkFalsy: true })
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
    const allowedFields = [
      'firstName', 
      'lastName', 
      'username', 
      'email', 
      'bio', 
      'phone', 
      'location',
      'avatar'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle profile nested fields
    if (req.body.profile) {
      Object.keys(req.body.profile).forEach(key => {
        updates[`profile.${key}`] = req.body.profile[key];
      });
    }

    // Handle additional profile fields
    const profileFields = ['jobTitle', 'company', 'birthDate', 'skills', 'interests'];
    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`profile.${field}`] = req.body[field];
      }
    });

    // Handle social links
    const socialLinks = ['website', 'github', 'linkedin', 'twitter', 'instagram'];
    const socialUpdates = {};
    socialLinks.forEach(link => {
      if (req.body[link] !== undefined) {
        socialUpdates[link] = req.body[link];
      }
    });
    
    if (Object.keys(socialUpdates).length > 0) {
      updates['profile.socialLinks'] = socialUpdates;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search for users
 *     description: Search users by username, name, or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (min 2 characters)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by user type
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// GET /api/users/search
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 20, offset = 0 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    let users = [];
    let total = 0;

    if (type === 'username' || !type) {
      const filter = {
        username: { $regex: q, $options: 'i' },
        _id: { $ne: req.userId },
        isActive: true
      };

      users = await User.find(filter)
        .select('_id username firstName lastName avatar')
        .limit(parsedLimit)
        .skip(parsedOffset);

      total = await User.countDocuments(filter);
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
      data: { users },
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
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