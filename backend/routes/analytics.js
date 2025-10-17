const express = require('express');
const Task = require('../models/Task');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const router = express.Router();

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

module.exports = router;