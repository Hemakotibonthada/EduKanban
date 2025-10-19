const express = require('express');
const Task = require('../models/Task');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const ExamAttempt = require('../models/ExamAttempt');

const router = express.Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard
 *     description: Retrieve comprehensive learning statistics and activity data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in analytics
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalCourses:
 *                           type: number
 *                         activeCourses:
 *                           type: number
 *                         completedCourses:
 *                           type: number
 *                         totalTasks:
 *                           type: number
 *                         completedTasks:
 *                           type: number
 *                         completionRate:
 *                           type: number
 *                         passRate:
 *                           type: number
 *                     activityOverTime:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.userId;
    const { period = '30' } = req.query; // days
    
    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Get user's courses and tasks
    const [courses, tasks, activityLogs] = await Promise.all([
      Course.find({ userId }),
      Task.find({ userId }),
      ActivityLog.find({
        userId,
        timestamp: { $gte: periodDate }
      }).sort({ timestamp: 1 })
    ]);

    // Calculate statistics
    const stats = {
      totalCourses: courses.length,
      activeCourses: courses.filter(c => c.status === 'active').length,
      completedCourses: courses.filter(c => c.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => ['Passed', 'Completed'].includes(t.status)).length,
      passedTasks: tasks.filter(t => t.status === 'Passed').length,
      failedTasks: tasks.filter(t => t.status === 'Failed').length,
      skippedTasks: tasks.filter(t => t.status === 'Skipped').length,
      inProgressTasks: tasks.filter(t => t.status === 'In Progress').length
    };

    // Calculate completion rate
    stats.completionRate = stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
      : 0;

    // Calculate pass rate
    stats.passRate = stats.completedTasks > 0 
      ? Math.round((stats.passedTasks / stats.completedTasks) * 100) 
      : 0;

    // Learning activity over time
    const dailyActivity = {};
    activityLogs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!dailyActivity[date]) {
        dailyActivity[date] = {
          date,
          tasksCompleted: 0,
          coursesStarted: 0,
          testsCompleted: 0,
          totalActivity: 0
        };
      }
      
      dailyActivity[date].totalActivity++;
      
      if (log.action === 'task_completed' || log.action === 'task_passed') {
        dailyActivity[date].tasksCompleted++;
      }
      if (log.action === 'course_started') {
        dailyActivity[date].coursesStarted++;
      }
      if (log.action === 'test_completed') {
        dailyActivity[date].testsCompleted++;
      }
    });

    const activityTimeline = Object.values(dailyActivity)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Task distribution by status
    const taskDistribution = [
      { name: 'Passed', value: stats.passedTasks, color: '#10B981' },
      { name: 'Failed', value: stats.failedTasks, color: '#EF4444' },
      { name: 'Skipped', value: stats.skippedTasks, color: '#F59E0B' },
      { name: 'In Progress', value: stats.inProgressTasks, color: '#3B82F6' },
      { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length, color: '#6B7280' }
    ];

    // Learning curve data
    const learningCurve = [];
    let cumulativeTasks = 0;
    
    tasks
      .filter(t => t.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .forEach((task, index) => {
        cumulativeTasks++;
        learningCurve.push({
          day: `Day ${index + 1}`,
          tasksCompleted: cumulativeTasks,
          date: task.completedAt.toISOString().split('T')[0]
        });
      });

    res.json({
      success: true,
      data: {
        stats,
        activityTimeline,
        taskDistribution,
        learningCurve,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// GET /api/analytics/time-tracking
router.get('/time-tracking', async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, period = '30' } = req.query;
    
    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Get time-based activity logs
    let filter = {
      userId,
      timestamp: { $gte: periodDate },
      action: { $in: ['task_started', 'task_completed', 'task_passed', 'task_failed'] }
    };

    if (courseId) {
      filter['entity.id'] = courseId;
    }

    const activityLogs = await ActivityLog.find(filter)
      .sort({ timestamp: 1 });

    // Process time tracking data
    const timeData = {};
    const sessionData = {};

    activityLogs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      const sessionId = log.sessionId;

      if (!timeData[date]) {
        timeData[date] = {
          date,
          totalMinutes: 0,
          tasksCompleted: 0,
          sessions: 0
        };
      }

      if (!sessionData[sessionId]) {
        sessionData[sessionId] = {
          date,
          startTime: log.timestamp,
          endTime: log.timestamp,
          activities: 0
        };
      }

      sessionData[sessionId].endTime = log.timestamp;
      sessionData[sessionId].activities++;

      if (log.action.includes('completed') || log.action.includes('passed')) {
        timeData[date].tasksCompleted++;
      }
    });

    // Calculate session durations
    Object.values(sessionData).forEach(session => {
      const duration = (session.endTime - session.startTime) / (1000 * 60); // minutes
      const cappedDuration = Math.min(duration, 240); // Cap at 4 hours per session
      
      if (timeData[session.date]) {
        timeData[session.date].totalMinutes += cappedDuration;
        timeData[session.date].sessions++;
      }
    });

    const timeTrackingData = Object.values(timeData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Weekly summary
    const weeklyData = [];
    for (let i = 0; i < timeTrackingData.length; i += 7) {
      const week = timeTrackingData.slice(i, i + 7);
      const weeklyStats = week.reduce((acc, day) => ({
        totalMinutes: acc.totalMinutes + day.totalMinutes,
        tasksCompleted: acc.tasksCompleted + day.tasksCompleted,
        sessions: acc.sessions + day.sessions
      }), { totalMinutes: 0, tasksCompleted: 0, sessions: 0 });

      weeklyData.push({
        week: `Week ${Math.floor(i / 7) + 1}`,
        ...weeklyStats,
        averageSessionDuration: weeklyStats.sessions > 0 
          ? Math.round(weeklyStats.totalMinutes / weeklyStats.sessions) 
          : 0
      });
    }

    res.json({
      success: true,
      data: {
        daily: timeTrackingData,
        weekly: weeklyData,
        totalMinutes: timeTrackingData.reduce((sum, day) => sum + day.totalMinutes, 0),
        totalSessions: Object.keys(sessionData).length,
        averageSessionDuration: Object.keys(sessionData).length > 0
          ? Math.round(timeTrackingData.reduce((sum, day) => sum + day.totalMinutes, 0) / Object.keys(sessionData).length)
          : 0
      }
    });

  } catch (error) {
    console.error('Time tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time tracking data'
    });
  }
});

// GET /api/analytics/progress
router.get('/progress', async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.query;

    let courseFilter = { userId };
    if (courseId) courseFilter._id = courseId;

    const courses = await Course.find(courseFilter);
    const progressData = [];

    for (const course of courses) {
      const tasks = await Task.find({ courseId: course._id });
      
      const progress = {
        courseId: course._id,
        courseName: course.title,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => ['Passed', 'Completed'].includes(t.status)).length,
        passedTasks: tasks.filter(t => t.status === 'Passed').length,
        failedTasks: tasks.filter(t => t.status === 'Failed').length,
        skippedTasks: tasks.filter(t => t.status === 'Skipped').length,
        inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
        estimatedDuration: course.estimatedDuration,
        actualDuration: tasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0),
        createdAt: course.createdAt,
        completedAt: course.completedAt
      };

      progress.completionRate = progress.totalTasks > 0 
        ? Math.round((progress.completedTasks / progress.totalTasks) * 100) 
        : 0;

      progress.passRate = progress.completedTasks > 0 
        ? Math.round((progress.passedTasks / progress.completedTasks) * 100) 
        : 0;

      progressData.push(progress);
    }

    res.json({
      success: true,
      data: { progress: progressData }
    });

  } catch (error) {
    console.error('Progress analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress data'
    });
  }
});

// GET /api/analytics/reports/weekly - Weekly report
router.get('/reports/weekly', async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [tasks, courses, activityLogs, user] = await Promise.all([
      Task.find({ 
        userId,
        updatedAt: { $gte: weekAgo }
      }),
      Course.find({ userId }),
      ActivityLog.find({
        userId,
        timestamp: { $gte: weekAgo }
      }),
      User.findById(userId)
    ]);

    const completedTasks = tasks.filter(t => 
      ['Passed', 'Completed'].includes(t.status) && 
      new Date(t.completedAt) >= weekAgo
    );

    const report = {
      period: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
        type: 'weekly'
      },
      summary: {
        tasksCompleted: completedTasks.length,
        tasksStarted: tasks.filter(t => t.status === 'In Progress').length,
        coursesActive: courses.filter(c => c.status === 'active').length,
        totalActivities: activityLogs.length,
        studyTime: Math.round(activityLogs.length * 15), // Estimate 15min per activity
        streak: user.stats?.streakDays || 0
      },
      dailyBreakdown: {},
      topCourses: [],
      achievements: []
    };

    // Daily breakdown
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      report.dailyBreakdown[dateKey] = {
        date: dateKey,
        tasksCompleted: completedTasks.filter(t => 
          new Date(t.completedAt).toISOString().split('T')[0] === dateKey
        ).length,
        activities: activityLogs.filter(log =>
          log.timestamp.toISOString().split('T')[0] === dateKey
        ).length
      };
    }

    // Top courses by activity
    const courseActivity = {};
    activityLogs.forEach(log => {
      if (log.entity?.type === 'course' || log.entity?.type === 'task') {
        const courseId = log.entity.type === 'task' 
          ? tasks.find(t => t._id.toString() === log.entity.id?.toString())?.courseId
          : log.entity.id;
        
        if (courseId) {
          const key = courseId.toString();
          courseActivity[key] = (courseActivity[key] || 0) + 1;
        }
      }
    });

    report.topCourses = Object.entries(courseActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([courseId, count]) => {
        const course = courses.find(c => c._id.toString() === courseId);
        return {
          courseId,
          courseName: course?.title || 'Unknown',
          activities: count
        };
      });

    res.json({
      success: true,
      data: { report }
    });

  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly report'
    });
  }
});

// GET /api/analytics/reports/monthly - Monthly report
router.get('/reports/monthly', async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [tasks, courses, activityLogs, user] = await Promise.all([
      Task.find({ userId }),
      Course.find({ userId }),
      ActivityLog.find({
        userId,
        timestamp: { $gte: monthAgo }
      }),
      User.findById(userId)
    ]);

    const completedTasks = tasks.filter(t => 
      ['Passed', 'Completed'].includes(t.status) && 
      t.completedAt &&
      new Date(t.completedAt) >= monthAgo
    );

    const completedCourses = courses.filter(c =>
      c.status === 'completed' &&
      c.completedAt &&
      new Date(c.completedAt) >= monthAgo
    );

    const report = {
      period: {
        start: monthAgo.toISOString(),
        end: now.toISOString(),
        type: 'monthly'
      },
      summary: {
        coursesCompleted: completedCourses.length,
        tasksCompleted: completedTasks.length,
        totalActivities: activityLogs.length,
        averageDailyActivities: Math.round(activityLogs.length / 30),
        estimatedStudyHours: Math.round(activityLogs.length * 15 / 60), // 15min per activity
        currentStreak: user.stats?.streakDays || 0
      },
      weeklyBreakdown: [],
      courseProgress: [],
      skillsDeveloped: [],
      performanceMetrics: {
        passRate: 0,
        averageScore: 0,
        improvementRate: 0
      }
    };

    // Weekly breakdown
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekTasks = completedTasks.filter(t =>
        new Date(t.completedAt) >= weekStart && new Date(t.completedAt) < weekEnd
      );

      report.weeklyBreakdown.unshift({
        week: `Week ${i + 1}`,
        tasksCompleted: weekTasks.length,
        activities: activityLogs.filter(log =>
          log.timestamp >= weekStart && log.timestamp < weekEnd
        ).length
      });
    }

    // Course progress
    report.courseProgress = courses.map(course => {
      const courseTasks = tasks.filter(t => t.courseId.toString() === course._id.toString());
      const completed = courseTasks.filter(t => ['Passed', 'Completed'].includes(t.status)).length;
      
      return {
        courseId: course._id,
        courseName: course.title,
        progress: courseTasks.length > 0 ? Math.round((completed / courseTasks.length) * 100) : 0,
        totalTasks: courseTasks.length,
        completedTasks: completed
      };
    }).sort((a, b) => b.progress - a.progress);

    // Performance metrics
    const passedTasks = completedTasks.filter(t => t.status === 'Passed');
    report.performanceMetrics.passRate = completedTasks.length > 0
      ? Math.round((passedTasks.length / completedTasks.length) * 100)
      : 0;

    res.json({
      success: true,
      data: { report }
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report'
    });
  }
});

// GET /api/analytics/skills - Skills analysis
router.get('/skills', async (req, res) => {
  try {
    const userId = req.userId;

    const [courses, tasks] = await Promise.all([
      Course.find({ userId }),
      Task.find({ userId, status: { $in: ['Passed', 'Completed'] } })
    ]);

    // Extract skills from courses
    const skillsMap = {};
    
    courses.forEach(course => {
      const topic = course.topic || 'General';
      const difficulty = course.difficulty || 'Beginner';
      
      if (!skillsMap[topic]) {
        skillsMap[topic] = {
          skill: topic,
          level: 0,
          coursesCompleted: 0,
          tasksCompleted: 0,
          lastPracticed: null,
          proficiency: 'Beginner'
        };
      }

      if (course.status === 'completed') {
        skillsMap[topic].coursesCompleted++;
        
        // Increase skill level based on difficulty
        const levelIncrease = {
          'Beginner': 1,
          'Intermediate': 2,
          'Advanced': 3,
          'Expert': 4
        }[difficulty] || 1;
        
        skillsMap[topic].level += levelIncrease;
      }

      // Count tasks for this skill
      const skillTasks = tasks.filter(t => 
        t.courseId.toString() === course._id.toString()
      );
      skillsMap[topic].tasksCompleted += skillTasks.length;

      // Update last practiced
      const latestTask = skillTasks.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      )[0];
      
      if (latestTask && latestTask.completedAt) {
        const taskDate = new Date(latestTask.completedAt);
        if (!skillsMap[topic].lastPracticed || taskDate > new Date(skillsMap[topic].lastPracticed)) {
          skillsMap[topic].lastPracticed = taskDate;
        }
      }

      // Determine proficiency
      if (skillsMap[topic].level >= 10) {
        skillsMap[topic].proficiency = 'Expert';
      } else if (skillsMap[topic].level >= 6) {
        skillsMap[topic].proficiency = 'Advanced';
      } else if (skillsMap[topic].level >= 3) {
        skillsMap[topic].proficiency = 'Intermediate';
      }
    });

    const skills = Object.values(skillsMap)
      .sort((a, b) => b.level - a.level);

    res.json({
      success: true,
      data: {
        skills,
        totalSkills: skills.length,
        expertSkills: skills.filter(s => s.proficiency === 'Expert').length,
        advancedSkills: skills.filter(s => s.proficiency === 'Advanced').length
      }
    });

  } catch (error) {
    console.error('Skills analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze skills'
    });
  }
});

// GET /api/analytics/comparison - Compare with other users
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.userId;

    const [currentUser, allUsers, userTasks, allTasks] = await Promise.all([
      User.findById(userId),
      User.find({ isActive: true }),
      Task.find({ userId }),
      Task.find({})
    ]);

    const completedTasks = userTasks.filter(t => ['Passed', 'Completed'].includes(t.status));
    
    // Calculate user statistics
    const userStats = {
      tasksCompleted: completedTasks.length,
      passRate: userTasks.length > 0 
        ? Math.round((completedTasks.filter(t => t.status === 'Passed').length / userTasks.length) * 100)
        : 0,
      averageScore: currentUser.stats?.averageTestScore || 0,
      streak: currentUser.stats?.streakDays || 0,
      totalLearningTime: currentUser.stats?.totalLearningTime || 0
    };

    // Calculate platform averages
    const platformStats = {
      averageTasksCompleted: 0,
      averagePassRate: 0,
      averageScore: 0,
      averageStreak: 0,
      averageLearningTime: 0
    };

    let validUsers = 0;
    allUsers.forEach(user => {
      if (user.stats) {
        platformStats.averageTasksCompleted += user.stats.totalTasksCompleted || 0;
        platformStats.averageScore += user.stats.averageTestScore || 0;
        platformStats.averageStreak += user.stats.streakDays || 0;
        platformStats.averageLearningTime += user.stats.totalLearningTime || 0;
        validUsers++;
      }
    });

    if (validUsers > 0) {
      platformStats.averageTasksCompleted = Math.round(platformStats.averageTasksCompleted / validUsers);
      platformStats.averageScore = Math.round(platformStats.averageScore / validUsers);
      platformStats.averageStreak = Math.round(platformStats.averageStreak / validUsers);
      platformStats.averageLearningTime = Math.round(platformStats.averageLearningTime / validUsers);
    }

    // Calculate percentiles
    const sortedByTasks = allUsers
      .map(u => u.stats?.totalTasksCompleted || 0)
      .sort((a, b) => a - b);
    
    const userPercentile = sortedByTasks.indexOf(userStats.tasksCompleted) / sortedByTasks.length * 100;

    // Ranking
    const userRanking = allUsers
      .sort((a, b) => (b.stats?.totalTasksCompleted || 0) - (a.stats?.totalTasksCompleted || 0))
      .findIndex(u => u._id.toString() === userId.toString()) + 1;

    res.json({
      success: true,
      data: {
        userStats,
        platformStats,
        comparison: {
          tasksVsAverage: userStats.tasksCompleted - platformStats.averageTasksCompleted,
          passRateVsAverage: userStats.passRate - platformStats.averageScore,
          streakVsAverage: userStats.streak - platformStats.averageStreak
        },
        ranking: {
          position: userRanking,
          totalUsers: allUsers.length,
          percentile: Math.round(userPercentile)
        }
      }
    });

  } catch (error) {
    console.error('Comparison analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison data'
    });
  }
});

// POST /api/analytics/export - Export analytics data
router.post('/export', async (req, res) => {
  try {
    const userId = req.userId;
    const { format = 'json', period = '30' } = req.body;

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    const [user, courses, tasks, activityLogs] = await Promise.all([
      User.findById(userId).select('-password'),
      Course.find({ userId }),
      Task.find({ userId }),
      ActivityLog.find({
        userId,
        timestamp: { $gte: periodDate }
      })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      period: {
        days: parseInt(period),
        from: periodDate.toISOString(),
        to: new Date().toISOString()
      },
      user: {
        username: user.username,
        email: user.email,
        stats: user.stats
      },
      summary: {
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.status === 'active').length,
        completedCourses: courses.filter(c => c.status === 'completed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => ['Passed', 'Completed'].includes(t.status)).length,
        totalActivities: activityLogs.length
      },
      courses: courses.map(c => ({
        id: c._id,
        title: c.title,
        topic: c.topic,
        difficulty: c.difficulty,
        status: c.status,
        progress: c.progress,
        createdAt: c.createdAt,
        completedAt: c.completedAt
      })),
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        type: t.type,
        status: t.status,
        courseId: t.courseId,
        completedAt: t.completedAt,
        attempts: t.attempts?.length || 0
      })),
      activityLogs: activityLogs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        entity: log.entity
      }))
    };

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else if (format === 'csv') {
      // Simple CSV export (tasks only for demo)
      let csv = 'Task Title,Type,Status,Completed At\n';
      exportData.tasks.forEach(task => {
        csv += `"${task.title}","${task.type}","${task.status}","${task.completedAt || 'N/A'}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use json or csv'
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

// GET /api/analytics/admin/financial - Admin financial analytics
router.get('/admin/financial', async (req, res) => {
  try {
    const userId = req.userId;
    const { timeRange = 'month' } = req.query;

    // Check if user is admin (support both role field and email)
    const user = await User.findById(userId);
    const isAdmin = user && (user.role === 'admin' || user.email === 'admin@circuvent.com');
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch all relevant data
    const [
      payments,
      certificates,
      courses,
      users,
      examAttempts
    ] = await Promise.all([
      Payment.find({ createdAt: { $gte: startDate } }),
      Certificate.find({ issueDate: { $gte: startDate } }),
      Course.find({}),
      User.find({}),
      ExamAttempt.find({ completedAt: { $gte: startDate } })
    ]);

    // Calculate total revenue from different sources
    const completedPayments = payments.filter(p => p.status === 'completed');
    const refundedPayments = payments.filter(p => p.status === 'refunded');
    
    const subscriptionRevenue = completedPayments
      .filter(p => ['premium', 'pro'].includes(p.plan))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const certificateRevenue = certificates.length * 25; // $25 per certificate
    
    // Mock course sales revenue based on active users and courses
    const activeCourses = courses.filter(c => c.status === 'active');
    const courseRevenue = activeCourses.length * users.length * 0.5; // Estimate
    
    // Mock consulting revenue
    const consultingRevenue = users.filter(u => u.role === 'admin').length * 500;
    
    // Other revenue
    const otherRevenue = Math.random() * 5000 + 2000;

    const totalRevenue = subscriptionRevenue + certificateRevenue + courseRevenue + consultingRevenue + otherRevenue;

    // Calculate expenses (mock data based on platform usage)
    const infrastructureCost = users.length * 2.5; // $2.5 per user/month
    const marketingCost = totalRevenue * 0.15; // 15% of revenue
    const salariesCost = users.filter(u => u.role === 'admin').length * 5000; // $5k per admin
    const softwareLicenses = 500 + (users.length * 0.3); // Base + per user
    const miscExpenses = totalRevenue * 0.05; // 5% of revenue

    const totalExpenses = infrastructureCost + marketingCost + salariesCost + softwareLicenses + miscExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate growth rates (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    
    const previousPayments = await Payment.find({
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
      status: 'completed'
    });
    
    const previousRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0) || 1;
    const currentRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0) || 0;
    const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    const expenseGrowth = Math.random() * 10 + 5; // Mock expense growth

    // Monthly breakdown (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(now.getMonth() - i);
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthPayments = await Payment.find({
        createdAt: { $gte: monthStart, $lt: monthEnd },
        status: 'completed'
      });
      
      const monthCertificates = await Certificate.find({
        issueDate: { $gte: monthStart, $lt: monthEnd }
      });
      
      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0) + (monthCertificates.length * 25);
      const monthExpenses = monthRevenue * 0.65; // 65% expense ratio
      const monthProfit = monthRevenue - monthExpenses;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(monthRevenue * 100) / 100,
        expenses: Math.round(monthExpenses * 100) / 100,
        profit: Math.round(monthProfit * 100) / 100
      });
    }

    // Revenue by category
    const revenueByCategory = [
      {
        category: 'Course Sales',
        amount: Math.round(courseRevenue),
        percentage: (courseRevenue / totalRevenue) * 100,
        growth: Math.random() * 25 + 10,
        color: 'bg-blue-500'
      },
      {
        category: 'Subscriptions',
        amount: Math.round(subscriptionRevenue),
        percentage: (subscriptionRevenue / totalRevenue) * 100,
        growth: Math.random() * 30 + 15,
        color: 'bg-purple-500'
      },
      {
        category: 'Certificates',
        amount: Math.round(certificateRevenue),
        percentage: (certificateRevenue / totalRevenue) * 100,
        growth: Math.random() * 20 + 8,
        color: 'bg-green-500'
      },
      {
        category: 'Consulting',
        amount: Math.round(consultingRevenue),
        percentage: (consultingRevenue / totalRevenue) * 100,
        growth: Math.random() * 10 - 5,
        color: 'bg-orange-500'
      },
      {
        category: 'Other',
        amount: Math.round(otherRevenue),
        percentage: (otherRevenue / totalRevenue) * 100,
        growth: Math.random() * 15,
        color: 'bg-gray-500'
      }
    ].sort((a, b) => b.amount - a.amount);

    // Expenses by category
    const expensesByCategory = [
      {
        category: 'Infrastructure',
        amount: Math.round(infrastructureCost),
        percentage: (infrastructureCost / totalExpenses) * 100,
        trend: 'up',
        color: 'bg-red-500'
      },
      {
        category: 'Marketing',
        amount: Math.round(marketingCost),
        percentage: (marketingCost / totalExpenses) * 100,
        trend: 'up',
        color: 'bg-yellow-500'
      },
      {
        category: 'Salaries',
        amount: Math.round(salariesCost),
        percentage: (salariesCost / totalExpenses) * 100,
        trend: 'stable',
        color: 'bg-indigo-500'
      },
      {
        category: 'Software Licenses',
        amount: Math.round(softwareLicenses),
        percentage: (softwareLicenses / totalExpenses) * 100,
        trend: 'down',
        color: 'bg-pink-500'
      },
      {
        category: 'Miscellaneous',
        amount: Math.round(miscExpenses),
        percentage: (miscExpenses / totalExpenses) * 100,
        trend: 'stable',
        color: 'bg-teal-500'
      }
    ].sort((a, b) => b.amount - a.amount);

    // Top performing courses
    const courseStats = await Promise.all(
      courses.slice(0, 10).map(async (course) => {
        const courseTasks = await Task.find({ courseId: course._id });
        const courseUsers = await Course.find({ 
          topic: course.topic,
          status: { $in: ['active', 'completed'] }
        });
        
        const estimatedRevenue = courseUsers.length * 50; // $50 per enrollment estimate
        const estimatedEnrollments = courseUsers.length;
        const estimatedProfit = estimatedRevenue * 0.7; // 70% profit margin
        
        return {
          name: course.title,
          revenue: Math.round(estimatedRevenue),
          enrollments: estimatedEnrollments,
          profit: Math.round(estimatedProfit),
          topic: course.topic
        };
      })
    );
    
    const topPerformingCourses = courseStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Loss areas
    const abandonedCarts = payments.filter(p => p.status === 'pending' || p.status === 'cancelled').length;
    const refundAmount = refundedPayments.reduce((sum, p) => sum + (p.refund?.refundAmount || p.amount), 0);
    const failedExams = examAttempts.filter(e => e.passed === false).length;
    
    const lossAreas = [
      {
        area: 'Abandoned Carts',
        impact: -(abandonedCarts * 50),
        percentage: -((abandonedCarts * 50) / totalRevenue) * 100,
        description: 'Users not completing purchases'
      },
      {
        area: 'Refunds',
        impact: -Math.round(refundAmount),
        percentage: -(refundAmount / totalRevenue) * 100,
        description: 'Course refund requests'
      },
      {
        area: 'Failed Exams',
        impact: -(failedExams * 10),
        percentage: -((failedExams * 10) / totalRevenue) * 100,
        description: 'Students failing assessments'
      },
      {
        area: 'Marketing ROI',
        impact: -Math.round(marketingCost * 0.2),
        percentage: -(marketingCost * 0.2 / totalRevenue) * 100,
        description: 'Underperforming campaigns'
      },
      {
        area: 'Support Costs',
        impact: -Math.round(totalRevenue * 0.03),
        percentage: -3,
        description: 'Customer support overhead'
      }
    ].sort((a, b) => a.impact - b.impact);

    res.json({
      success: true,
      data: {
        financialSummary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          profitMargin: Math.round(profitMargin * 10) / 10,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          expenseGrowth: Math.round(expenseGrowth * 10) / 10
        },
        monthlyData,
        revenueByCategory,
        expensesByCategory,
        topPerformingCourses,
        lossAreas,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Admin financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics'
    });
  }
});

// GET /api/analytics/admin/stats - Admin dashboard statistics
router.get('/admin/stats', async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user is admin (support both role field and email)
    const user = await User.findById(userId);
    const isAdmin = user && (user.role === 'admin' || user.email === 'admin@circuvent.com');
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all data
    const [
      allUsers,
      allCourses,
      allCertificates,
      allPayments,
      monthlyPayments,
      activityLogs
    ] = await Promise.all([
      User.find({}),
      Course.find({}),
      Certificate.find({}),
      Payment.find({ status: 'completed' }),
      Payment.find({ 
        status: 'completed',
        createdAt: { $gte: monthStart }
      }),
      ActivityLog.find({
        timestamp: { $gte: monthStart }
      })
    ]);

    // Calculate statistics
    const activeUsers = allUsers.filter(u => {
      const lastActive = new Date(u.stats?.lastActiveDate || u.createdAt);
      const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
      return daysSinceActive <= 30;
    }).length;

    const activeCourses = allCourses.filter(c => c.status === 'active').length;
    
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const stats = {
      totalUsers: allUsers.length,
      activeUsers: activeUsers,
      totalCourses: allCourses.length,
      activeCourses: activeCourses,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalCertificates: allCertificates.length,
      pendingReports: 0, // Placeholder
      serverUptime: 99.9, // Placeholder
      storageUsed: 45.2, // Placeholder
      apiCalls: activityLogs.length,
      errorRate: 0.1 // Placeholder
    };

    // Get users with detailed info
    const usersData = await Promise.all(
      allUsers.slice(0, 50).map(async (u) => {
        const userCourses = await Course.find({ userId: u._id });
        const userCerts = await Certificate.find({ user: u._id });
        const userPayments = await Payment.find({ userId: u._id, status: 'completed' });
        
        return {
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role || 'student',
          status: u.isActive ? 'active' : 'inactive',
          joinDate: u.createdAt,
          lastActive: u.stats?.lastActiveDate || u.createdAt,
          coursesEnrolled: userCourses.length,
          coursesCompleted: userCourses.filter(c => c.status === 'completed').length,
          certificatesEarned: userCerts.length,
          totalSpent: userPayments.reduce((sum, p) => sum + p.amount, 0),
          reports: 0
        };
      })
    );

    // Get courses with detailed info
    const coursesData = await Promise.all(
      allCourses.slice(0, 50).map(async (c) => {
        const instructor = await User.findById(c.userId);
        const enrollments = await Course.find({ 
          topic: c.topic,
          status: { $in: ['active', 'completed'] }
        });
        
        return {
          id: c._id,
          title: c.title,
          instructor: instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Unknown',
          status: c.status === 'active' ? 'published' : c.status,
          enrollments: enrollments.length,
          completionRate: c.progress?.percentageComplete || 0,
          rating: 4.5, // Placeholder
          revenue: enrollments.length * 50, // Estimate
          createdAt: c.createdAt,
          lastUpdated: c.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats,
        users: usersData,
        courses: coursesData,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
});

module.exports = router;