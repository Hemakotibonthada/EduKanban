const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Task = require('../models/Task');
const { StudySession } = require('../models/StudySession');
const Achievement = require('../models/Achievement');

/**
 * @swagger
 * /gamification/stats:
 *   get:
 *     summary: Get user gamification statistics
 *     description: Retrieve XP, level, streak, badges, and achievement data for the authenticated user
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gamification stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalXP:
 *                       type: number
 *                     level:
 *                       type: number
 *                     streak:
 *                       type: number
 *                     badges:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Badge'
 *                     completedCourses:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                     studySessions:
 *                       type: number
 *                 recentAchievements:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get user gamification stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Calculate total XP from courses and tasks
    const completedCourses = await Course.countDocuments({
      userId: req.userId,
      status: 'completed'
    });
    
    const completedTasks = await Task.countDocuments({
      userId: req.userId,
      status: 'completed'
    });

    const studySessions = await StudySession.find({
      userId: req.userId,
      mode: 'pomodoro'
    });

    // Calculate XP
    const totalXP = (completedCourses * 100) + (completedTasks * 10) + (studySessions.length * 25);
    
    // Calculate streak
    const streak = await calculateStreak(req.userId);
    
    // Get badges
    const badges = await calculateBadges(req.userId, completedCourses, completedTasks, streak, studySessions.length);
    
    // Get recent achievements (last 5)
    const recentAchievements = await Achievement.find({ userId: req.userId })
      .sort({ earnedAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      stats: {
        totalXP,
        level: Math.floor(totalXP / 100) + 1,
        streak,
        badges,
        completedCourses,
        completedTasks,
        studySessions: studySessions.length
      },
      recentAchievements
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gamification stats'
    });
  }
});

/**
 * @swagger
 * /gamification/leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     description: Retrieve top 100 users ranked by total XP
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: number
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                       totalXP:
 *                         type: number
 *                       level:
 *                         type: number
 *                       completedCourses:
 *                         type: number
 *                       completedTasks:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email').limit(100);
    
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const completedCourses = await Course.countDocuments({
          userId: user._id,
          status: 'completed'
        });
        
        const completedTasks = await Task.countDocuments({
          userId: user._id,
          status: 'completed'
        });

        const studySessions = await StudySession.countDocuments({
          userId: user._id,
          mode: 'pomodoro'
        });

        const xp = (completedCourses * 100) + (completedTasks * 10) + (studySessions * 25);
        
        return {
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
          xp
        };
      })
    );

    // Sort by XP
    leaderboardData.sort((a, b) => b.xp - a.xp);
    
    res.json({
      success: true,
      leaderboard: leaderboardData.slice(0, 50)
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Award badge
router.post('/badges/:badgeId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.gamification) {
      user.gamification = { badges: [], achievements: [] };
    }
    
    if (!user.gamification.badges.includes(req.params.badgeId)) {
      user.gamification.badges.push(req.params.badgeId);
      await user.save();
      
      res.json({
        success: true,
        message: 'Badge awarded!',
        badge: req.params.badgeId
      });
    } else {
      res.json({
        success: false,
        message: 'Badge already earned'
      });
    }
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award badge'
    });
  }
});

// Helper function to calculate badges
async function calculateBadges(userId, completedCourses, completedTasks, streak, pomodoros) {
  const badges = [];
  
  if (completedCourses >= 1) badges.push('first_course');
  if (completedCourses >= 10) badges.push('ten_courses');
  if (completedTasks >= 100) badges.push('task_master');
  if (streak >= 7) badges.push('week_streak');
  if (streak >= 30) badges.push('month_streak');
  
  // Auto-award new badges
  const badgeDefinitions = {
    'first_course': { name: 'First Steps', xp: 100 },
    'ten_courses': { name: 'Knowledge Seeker', xp: 500 },
    'task_master': { name: 'Task Master', xp: 750 },
    'week_streak': { name: 'Consistent Learner', xp: 250 },
    'month_streak': { name: 'Dedicated', xp: 1000 }
  };
  
  for (const badgeId of badges) {
    try {
      const existingAchievement = await Achievement.findOne({ userId, badgeId });
      if (!existingAchievement && badgeDefinitions[badgeId]) {
        await Achievement.create({
          userId,
          badgeId,
          badgeName: badgeDefinitions[badgeId].name,
          xpEarned: badgeDefinitions[badgeId].xp
        });
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (error.code !== 11000) {
        console.error('Error auto-awarding badge:', error);
      }
    }
  }
  
  return badges;
}

// Helper function to calculate streak
async function calculateStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const activityCount = await StudySession.countDocuments({
        userId,
        completedAt: {
          $gte: currentDate,
          $lt: nextDay
        }
      });
      
      if (activityCount > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      if (streak > 365) break;
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// Get all badges with user progress
router.get('/badges', auth, async (req, res) => {
  try {
    const completedCourses = await Course.countDocuments({
      userId: req.userId,
      status: 'completed'
    });
    
    const completedTasks = await Task.countDocuments({
      userId: req.userId,
      status: 'completed'
    });

    const streak = await calculateStreak(req.userId);
    
    const studySessions = await StudySession.countDocuments({
      userId: req.userId,
      mode: 'pomodoro'
    });

    const earnedAchievements = await Achievement.find({ userId: req.userId });
    const earnedBadgeIds = earnedAchievements.map(a => a.badgeId);

    // Define all available badges with unlock criteria
    const allBadges = [
      {
        id: 'first_course',
        name: 'First Steps',
        description: 'Complete your first course',
        icon: '🎓',
        xp: 100,
        unlocked: earnedBadgeIds.includes('first_course'),
        progress: Math.min(completedCourses, 1),
        requirement: 1,
        category: 'courses'
      },
      {
        id: 'five_courses',
        name: 'Rising Star',
        description: 'Complete 5 courses',
        icon: '⭐',
        xp: 300,
        unlocked: completedCourses >= 5,
        progress: Math.min(completedCourses, 5),
        requirement: 5,
        category: 'courses'
      },
      {
        id: 'ten_courses',
        name: 'Knowledge Seeker',
        description: 'Complete 10 courses',
        icon: '📚',
        xp: 500,
        unlocked: earnedBadgeIds.includes('ten_courses'),
        progress: Math.min(completedCourses, 10),
        requirement: 10,
        category: 'courses'
      },
      {
        id: 'twenty_courses',
        name: 'Scholar',
        description: 'Complete 20 courses',
        icon: '🎖️',
        xp: 1000,
        unlocked: completedCourses >= 20,
        progress: Math.min(completedCourses, 20),
        requirement: 20,
        category: 'courses'
      },
      {
        id: 'task_starter',
        name: 'Task Starter',
        description: 'Complete 10 tasks',
        icon: '✅',
        xp: 50,
        unlocked: completedTasks >= 10,
        progress: Math.min(completedTasks, 10),
        requirement: 10,
        category: 'tasks'
      },
      {
        id: 'task_warrior',
        name: 'Task Warrior',
        description: 'Complete 50 tasks',
        icon: '⚔️',
        xp: 250,
        unlocked: completedTasks >= 50,
        progress: Math.min(completedTasks, 50),
        requirement: 50,
        category: 'tasks'
      },
      {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 100 tasks',
        icon: '👑',
        xp: 750,
        unlocked: earnedBadgeIds.includes('task_master'),
        progress: Math.min(completedTasks, 100),
        requirement: 100,
        category: 'tasks'
      },
      {
        id: 'three_day_streak',
        name: 'Getting Started',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        xp: 100,
        unlocked: streak >= 3,
        progress: Math.min(streak, 3),
        requirement: 3,
        category: 'streaks'
      },
      {
        id: 'week_streak',
        name: 'Consistent Learner',
        description: 'Maintain a 7-day streak',
        icon: '🔥🔥',
        xp: 250,
        unlocked: earnedBadgeIds.includes('week_streak'),
        progress: Math.min(streak, 7),
        requirement: 7,
        category: 'streaks'
      },
      {
        id: 'two_week_streak',
        name: 'Determined',
        description: 'Maintain a 14-day streak',
        icon: '🔥🔥🔥',
        xp: 500,
        unlocked: streak >= 14,
        progress: Math.min(streak, 14),
        requirement: 14,
        category: 'streaks'
      },
      {
        id: 'month_streak',
        name: 'Dedicated',
        description: 'Maintain a 30-day streak',
        icon: '🔥🔥🔥🔥',
        xp: 1000,
        unlocked: earnedBadgeIds.includes('month_streak'),
        progress: Math.min(streak, 30),
        requirement: 30,
        category: 'streaks'
      },
      {
        id: 'pomodoro_starter',
        name: 'Focused Beginner',
        description: 'Complete 10 Pomodoro sessions',
        icon: '⏰',
        xp: 100,
        unlocked: studySessions >= 10,
        progress: Math.min(studySessions, 10),
        requirement: 10,
        category: 'focus'
      },
      {
        id: 'pomodoro_expert',
        name: 'Focus Master',
        description: 'Complete 50 Pomodoro sessions',
        icon: '⏱️',
        xp: 500,
        unlocked: studySessions >= 50,
        progress: Math.min(studySessions, 50),
        requirement: 50,
        category: 'focus'
      }
    ];

    res.json({
      success: true,
      badges: allBadges,
      summary: {
        totalBadges: allBadges.length,
        unlockedBadges: allBadges.filter(b => b.unlocked).length,
        totalXP: earnedAchievements.reduce((sum, a) => sum + (a.xpEarned || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges'
    });
  }
});

// Get user's achievements history
router.get('/achievements', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, category } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    // Build filter
    const filter = { userId: req.userId };

    const achievements = await Achievement.find(filter)
      .sort({ earnedAt: -1 })
      .limit(parsedLimit)
      .skip(parsedOffset);

    const total = await Achievement.countDocuments(filter);

    // Get badge details for each achievement
    const badgeDefinitions = {
      'first_course': { name: 'First Steps', icon: '🎓', category: 'courses' },
      'five_courses': { name: 'Rising Star', icon: '⭐', category: 'courses' },
      'ten_courses': { name: 'Knowledge Seeker', icon: '📚', category: 'courses' },
      'twenty_courses': { name: 'Scholar', icon: '🎖️', category: 'courses' },
      'task_starter': { name: 'Task Starter', icon: '✅', category: 'tasks' },
      'task_warrior': { name: 'Task Warrior', icon: '⚔️', category: 'tasks' },
      'task_master': { name: 'Task Master', icon: '👑', category: 'tasks' },
      'three_day_streak': { name: 'Getting Started', icon: '🔥', category: 'streaks' },
      'week_streak': { name: 'Consistent Learner', icon: '🔥🔥', category: 'streaks' },
      'two_week_streak': { name: 'Determined', icon: '🔥🔥🔥', category: 'streaks' },
      'month_streak': { name: 'Dedicated', icon: '🔥🔥🔥🔥', category: 'streaks' },
      'pomodoro_starter': { name: 'Focused Beginner', icon: '⏰', category: 'focus' },
      'pomodoro_expert': { name: 'Focus Master', icon: '⏱️', category: 'focus' }
    };

    const enrichedAchievements = achievements.map(achievement => {
      const badgeInfo = badgeDefinitions[achievement.badgeId] || {};
      return {
        _id: achievement._id,
        badgeId: achievement.badgeId,
        badgeName: achievement.badgeName || badgeInfo.name,
        icon: badgeInfo.icon || '🏆',
        category: badgeInfo.category || 'general',
        xpEarned: achievement.xpEarned,
        earnedAt: achievement.earnedAt
      };
    });

    // Filter by category if provided
    let filteredAchievements = enrichedAchievements;
    if (category) {
      filteredAchievements = enrichedAchievements.filter(a => a.category === category);
    }

    res.json({
      success: true,
      achievements: filteredAchievements,
      pagination: {
        total: category ? filteredAchievements.length : total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < (category ? filteredAchievements.length : total)
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Award XP for completing action
router.post('/xp', auth, async (req, res) => {
  try {
    const { action, amount, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action type is required'
      });
    }

    // XP amounts based on action type
    const xpValues = {
      'task_complete': 10,
      'course_complete': 100,
      'quiz_pass': 50,
      'quiz_perfect': 100,
      'pomodoro_complete': 25,
      'daily_goal': 50,
      'streak_milestone': 100
    };

    const xpAmount = amount || xpValues[action] || 10;

    // Calculate new total XP
    const completedCourses = await Course.countDocuments({
      userId: req.userId,
      status: 'completed'
    });
    
    const completedTasks = await Task.countDocuments({
      userId: req.userId,
      status: 'completed'
    });

    const studySessions = await StudySession.countDocuments({
      userId: req.userId,
      mode: 'pomodoro'
    });

    const currentXP = (completedCourses * 100) + (completedTasks * 10) + (studySessions * 25);
    const newXP = currentXP + xpAmount;

    const oldLevel = Math.floor(currentXP / 100) + 1;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > oldLevel;

    // Check for new badges
    const streak = await calculateStreak(req.userId);
    const newBadges = await calculateBadges(req.userId, completedCourses, completedTasks, streak, studySessions);

    res.json({
      success: true,
      xp: {
        earned: xpAmount,
        total: newXP,
        action
      },
      level: {
        current: newLevel,
        leveledUp,
        progress: newXP % 100,
        nextLevelAt: (newLevel * 100)
      },
      badges: newBadges,
      metadata
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award XP'
    });
  }
});

// Get daily challenge
router.get('/challenge/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check today's progress
    const todayTasks = await Task.countDocuments({
      userId: req.userId,
      status: 'completed',
      completedAt: { $gte: today, $lt: tomorrow }
    });

    const todaySessions = await StudySession.countDocuments({
      userId: req.userId,
      completedAt: { $gte: today, $lt: tomorrow }
    });

    // Define daily challenges
    const challenges = [
      {
        id: 'daily_tasks',
        name: 'Task Completor',
        description: 'Complete 5 tasks today',
        target: 5,
        current: todayTasks,
        xpReward: 50,
        completed: todayTasks >= 5,
        icon: '✅'
      },
      {
        id: 'daily_pomodoro',
        name: 'Focus Time',
        description: 'Complete 3 Pomodoro sessions today',
        target: 3,
        current: todaySessions,
        xpReward: 50,
        completed: todaySessions >= 3,
        icon: '⏰'
      },
      {
        id: 'daily_combo',
        name: 'Full Day',
        description: 'Complete both daily challenges',
        target: 1,
        current: (todayTasks >= 5 && todaySessions >= 3) ? 1 : 0,
        xpReward: 100,
        completed: todayTasks >= 5 && todaySessions >= 3,
        icon: '🎯'
      }
    ];

    const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xpReward, 0);
    const completedCount = challenges.filter(c => c.completed).length;

    res.json({
      success: true,
      date: today,
      expiresAt: tomorrow,
      challenges,
      summary: {
        total: challenges.length,
        completed: completedCount,
        xpEarned: totalXP
      }
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily challenge'
    });
  }
});

module.exports = router;
