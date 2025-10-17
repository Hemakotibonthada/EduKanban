const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

/**
 * @swagger
 * /social/profile/{userId}:
 *   get:
 *     summary: Get user's public profile
 *     description: Retrieve public profile information, courses, and social stats for a user
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *                 profile:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     level:
 *                       type: number
 *                     xp:
 *                       type: number
 *                     badges:
 *                       type: array
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         followers:
 *                           type: number
 *                         following:
 *                           type: number
 *                         coursesCreated:
 *                           type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get user's public profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username firstName lastName avatar bio location website socialLinks level xp badges coursesCompleted totalStudyTime learningStreak createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's public courses
    const courses = await Course.find({
      createdBy: userId,
      isPublished: true
    }).select('title description category difficulty estimatedDuration tags createdAt');

    // Get follower/following counts
    const followers = await User.countDocuments({ following: userId });
    const following = await User.countDocuments({ _id: userId, following: { $exists: true } });

    res.json({
      success: true,
      profile: {
        ...user,
        courses,
        stats: {
          followers,
          following,
          coursesCreated: courses.length
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user._id;
    const { bio, location, website, socialLinks, isPublic } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        bio,
        location,
        website,
        socialLinks,
        'privacy.profileVisibility': isPublic ? 'public' : 'private'
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Follow user
router.post('/follow/:userId', async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;

    if (followerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const user = await User.findById(followerId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add to following list
    if (!user.following) user.following = [];
    if (!user.following.includes(userId)) {
      user.following.push(userId);
      await user.save();

      // Create notification for followed user
      const Notification = require('../models/Notification');
      await Notification.createNotification({
        recipient: userId,
        type: 'follow',
        message: `${user.username} started following you`,
        relatedUser: followerId
      });
    }

    res.json({
      success: true,
      message: 'Successfully followed user'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user',
      error: error.message
    });
  }
});

// Unfollow user
router.post('/unfollow/:userId', async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;

    const user = await User.findById(followerId);
    
    if (user.following) {
      user.following = user.following.filter(id => id.toString() !== userId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user',
      error: error.message
    });
  }
});

// Get followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);
    
    const users = await User.find({ following: userId })
      .select('username firstName lastName avatar level xp')
      .limit(parsedLimit)
      .skip(parsedOffset)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ following: userId });

    res.json({
      success: true,
      followers: users,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers',
      error: error.message
    });
  }
});

// Get following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const following = user.following || [];
    const total = following.length;
    
    // Paginate the following array
    const paginatedIds = following.slice(parsedOffset, parsedOffset + parsedLimit);
    
    const users = await User.find({ _id: { $in: paginatedIds } })
      .select('username firstName lastName avatar level xp')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      following: users,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following',
      error: error.message
    });
  }
});

// Get activity feed
router.get('/feed', async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(userId);
    const following = user.following || [];

    // Get activities from followed users
    const Activity = require('../models/Activity');
    const activities = await Activity.find({
      user: { $in: [...following, userId] }
    })
      .populate('user', 'username firstName lastName avatar')
      .populate('course', 'title description category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Activity.countDocuments({
      user: { $in: [...following, userId] }
    });

    res.json({
      success: true,
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity feed',
      error: error.message
    });
  }
});

// Share course
router.post('/share/course/:courseId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const { message } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create activity
    const Activity = require('../models/Activity');
    const activity = await Activity.create({
      user: userId,
      type: 'course_shared',
      course: courseId,
      description: message || `Shared a course: ${course.title}`,
      metadata: {
        courseTitle: course.title,
        courseCategory: course.category
      }
    });

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Share course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share course',
      error: error.message
    });
  }
});

// Get suggested users to follow
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const following = user.following || [];

    // Find users not already following, with similar interests
    const suggestions = await User.find({
      _id: { $ne: userId, $nin: following },
      level: { $gte: user.level - 2, $lte: user.level + 2 }
    })
      .select('username firstName lastName avatar level xp badges coursesCompleted')
      .limit(10)
      .sort({ coursesCompleted: -1 });

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: error.message
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username firstName lastName avatar level xp badges')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

module.exports = router;
