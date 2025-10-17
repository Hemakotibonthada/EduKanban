const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { StudySession } = require('../models/StudySession');

/**
 * @swagger
 * /study-timer/today:
 *   get:
 *     summary: Get today's study statistics
 *     description: Retrieve study time, pomodoros, and break time for today
 *     tags: [Study Timer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's statistics retrieved successfully
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
 *                     pomodorosCompleted:
 *                       type: number
 *                     totalStudyTime:
 *                       type: number
 *                       description: Total study time in minutes
 *                     totalBreakTime:
 *                       type: number
 *                       description: Total break time in minutes
 *                     longestStreak:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get today's study statistics
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await StudySession.find({
      userId: req.userId,
      completedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const stats = {
      pomodorosCompleted: sessions.filter(s => s.mode === 'pomodoro').length,
      totalStudyTime: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      totalBreakTime: sessions.filter(s => s.mode !== 'pomodoro').reduce((sum, s) => sum + (s.duration || 0), 0),
      longestStreak: await calculateStreak(req.userId)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @swagger
 * /study-timer/session:
 *   post:
 *     summary: Save a completed study session
 *     description: Record a pomodoro or break session
 *     tags: [Study Timer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duration
 *               - mode
 *             properties:
 *               duration:
 *                 type: number
 *                 description: Session duration in minutes
 *               mode:
 *                 type: string
 *                 enum: [pomodoro, short-break, long-break]
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Session saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Save a completed study session
router.post('/session', auth, async (req, res) => {
  try {
    const { duration, mode, completedAt } = req.body;

    const session = new StudySession({
      userId: req.userId,
      duration,
      mode,
      completedAt: completedAt || new Date()
    });

    await session.save();

    res.json({
      success: true,
      message: 'Session saved',
      session
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save session'
    });
  }
});

// Get weekly statistics
router.get('/week', auth, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessions = await StudySession.find({
      userId: req.userId,
      completedAt: { $gte: weekAgo }
    }).sort({ completedAt: 1 });

    // Group by day
    const dailyStats = {};
    sessions.forEach(session => {
      const day = session.completedAt.toDateString();
      if (!dailyStats[day]) {
        dailyStats[day] = {
          pomodoros: 0,
          studyTime: 0,
          date: session.completedAt
        };
      }
      if (session.mode === 'pomodoro') {
        dailyStats[day].pomodoros++;
        dailyStats[day].studyTime += session.duration;
      }
    });

    res.json({
      success: true,
      dailyStats: Object.values(dailyStats)
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly statistics'
    });
  }
});

// Helper function to calculate study streak
async function calculateStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const sessionsOnDay = await StudySession.countDocuments({
        userId,
        mode: 'pomodoro',
        completedAt: {
          $gte: currentDate,
          $lt: nextDay
        }
      });
      
      if (sessionsOnDay > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      // Prevent infinite loop
      if (streak > 365) break;
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

module.exports = router;
