const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Course = require('../models/Course');
const ExamAttempt = require('../models/ExamAttempt');
const StudySession = require('../models/StudySession');
const User = require('../models/User');

// Get AI-powered learning insights
router.get('/ai-insights', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Fetch user's activity data
    const tasks = await Task.find({ userId });
    const courses = await Course.find({ userId });
    const exams = await ExamAttempt.find({ userId }).sort({ createdAt: -1 });
    const studySessions = await StudySession.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate weekly progress
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayTasks = tasks.filter(t =>
        new Date(t.completedAt) >= dayStart &&
        new Date(t.completedAt) <= dayEnd &&
        t.status === 'completed'
      );

      const daySessions = studySessions.filter(s =>
        new Date(s.createdAt) >= dayStart &&
        new Date(s.createdAt) <= dayEnd
      );

      const studyHours = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;

      weeklyProgress.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        hours: Math.round(studyHours * 10) / 10,
        tasksCompleted: dayTasks.length
      });
    }

    // Calculate productivity by hour
    const studyTimeByHour = new Array(7).fill(0);
    const hourMapping = { 6: 0, 9: 1, 12: 2, 15: 3, 18: 4, 21: 5, 0: 6 };
    
    studySessions.forEach(session => {
      const hour = new Date(session.createdAt).getHours();
      const index = Object.entries(hourMapping).reduce((acc, [h, i]) => {
        return Math.abs(hour - parseInt(h)) < Math.abs(hour - parseInt(Object.keys(hourMapping)[acc]))
          ? i : acc;
      }, 0);
      studyTimeByHour[index] += (session.duration || 0) / 3600;
    });

    // Normalize to percentage
    const maxHours = Math.max(...studyTimeByHour, 1);
    const normalizedStudyTime = studyTimeByHour.map(h => Math.round((h / maxHours) * 100));

    // Performance by subject
    const performanceBySubject = courses.slice(0, 4).map(course => ({
      subject: course.title,
      score: Math.round(Math.random() * 30 + 70) // TODO: Calculate real score
    }));

    // Calculate scores
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const recentExams = exams.slice(0, 10);
    const avgExamScore = recentExams.length > 0
      ? recentExams.reduce((sum, e) => sum + (e.score || 0), 0) / recentExams.length
      : 0;

    const productivityScore = Math.round((taskCompletionRate + avgExamScore) / 2);
    const focusScore = Math.min(Math.round(studySessions.length * 2), 100);
    const consistencyScore = Math.min(Math.round(weeklyProgress.filter(d => d.hours > 0).length * 14), 100);

    // Generate AI insights
    const insights = [];

    if (taskCompletionRate > 80) {
      insights.push({
        type: 'positive',
        title: 'Excellent Task Completion',
        message: `You're completing ${Math.round(taskCompletionRate)}% of your tasks! Keep up the great work.`,
        action: 'View Analytics'
      });
    } else if (taskCompletionRate < 50) {
      insights.push({
        type: 'negative',
        title: 'Task Completion Needs Attention',
        message: 'Try breaking larger tasks into smaller, manageable chunks to improve completion rate.',
        action: 'Create New Task'
      });
    }

    if (weeklyProgress[weeklyProgress.length - 1].hours > weeklyProgress[weeklyProgress.length - 2].hours) {
      insights.push({
        type: 'positive',
        title: 'Study Time Increasing',
        message: `You studied ${weeklyProgress[weeklyProgress.length - 1].hours} hours today, up from ${weeklyProgress[weeklyProgress.length - 2].hours} hours yesterday!`,
        action: 'View Progress'
      });
    }

    if (avgExamScore > 85) {
      insights.push({
        type: 'positive',
        title: 'Outstanding Performance',
        message: `Your average exam score is ${Math.round(avgExamScore)}%. You're mastering the material!`,
        action: 'View Certificates'
      });
    }

    const streakDays = weeklyProgress.filter(d => d.hours > 0).length;
    if (streakDays >= 7) {
      insights.push({
        type: 'positive',
        title: '7-Day Study Streak!',
        message: 'Congratulations! You\'ve studied every day this week. Consistency is key to success.',
        action: 'View Achievements'
      });
    }

    // Generate recommendations
    const recommendations = [];

    const peakHourIndex = normalizedStudyTime.indexOf(Math.max(...normalizedStudyTime));
    const peakHours = ['6-9 AM', '9 AM-12 PM', '12-3 PM', '3-6 PM', '6-9 PM', '9 PM-12 AM', '12-6 AM'][peakHourIndex];
    recommendations.push({
      title: 'Schedule Difficult Tasks During Peak Hours',
      description: `Your most productive time is ${peakHours}. Schedule challenging tasks during this window.`,
      category: 'Time Management',
      impact: 'High'
    });

    if (taskCompletionRate < 70) {
      recommendations.push({
        title: 'Use Pomodoro Technique',
        description: 'Break your study sessions into 25-minute focused intervals with 5-minute breaks.',
        category: 'Productivity',
        impact: 'Medium'
      });
    }

    if (courses.length > 5) {
      recommendations.push({
        title: 'Focus on Fewer Courses',
        description: 'You\'re enrolled in multiple courses. Consider focusing on 2-3 at a time for better retention.',
        category: 'Learning Strategy',
        impact: 'High'
      });
    }

    recommendations.push({
      title: 'Review Material Before Sleep',
      description: 'Studies show reviewing material before bed improves retention by up to 20%.',
      category: 'Study Tips',
      impact: 'Medium'
    });

    recommendations.push({
      title: 'Practice Active Recall',
      description: 'Test yourself regularly instead of passive reading. Use flashcards for better retention.',
      category: 'Learning Technique',
      impact: 'High'
    });

    recommendations.push({
      title: 'Join Study Groups',
      description: 'Collaborative learning can improve understanding and motivation. Join or create a study group.',
      category: 'Collaboration',
      impact: 'Medium'
    });

    // Optimal study times
    const optimalStudyTimes = [
      {
        timeRange: peakHours,
        reason: 'Your peak productivity period based on past performance',
        efficiency: Math.max(...normalizedStudyTime)
      },
      {
        timeRange: '6-8 AM',
        reason: 'Brain is fresh and focused after rest',
        efficiency: 92
      },
      {
        timeRange: '2-4 PM',
        reason: 'Post-lunch energy boost for focused work',
        efficiency: 85
      },
      {
        timeRange: '7-9 PM',
        reason: 'Ideal for review and consolidation',
        efficiency: 78
      }
    ];

    res.json({
      success: true,
      data: {
        insights,
        analytics: {
          weeklyProgress,
          studyTimeByHour: normalizedStudyTime,
          performanceBySubject,
          productivityScore,
          focusScore,
          consistencyScore
        },
        recommendations,
        optimalStudyTimes
      }
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights'
    });
  }
});

module.exports = router;
