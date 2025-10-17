const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

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

module.exports = router;