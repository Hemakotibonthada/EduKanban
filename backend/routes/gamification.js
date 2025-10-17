const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Task = require('../models/Task');
const { StudySession } = require('../models/StudySession');
const Achievement = require('../models/Achievement');

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

module.exports = router;
