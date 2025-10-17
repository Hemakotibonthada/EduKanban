const express = require('express');
const Task = require('../models/Task');
const Course = require('../models/Course');
const Module = require('../models/Module');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// GET /api/tasks - Get user's tasks
router.get('/', async (req, res) => {
  try {
    const { courseId, status } = req.query;
    
    let filter = { userId: req.userId };
    if (courseId) filter.courseId = courseId;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: { tasks }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['To Do', 'In Progress', 'Passed', 'Failed', 'Skipped', 'Completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        status,
        ...(status === 'In Progress' && { startedAt: new Date() }),
        ...(['Passed', 'Failed', 'Skipped', 'Completed'].includes(status) && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Log task status change
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: `task_${status.toLowerCase().replace(' ', '_')}`,
      entity: { type: 'task', id: task._id, title: task.title },
      details: { newStatus: status, taskType: task.type },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Task status updated',
      data: { task }
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

// POST /api/tasks/:id/attempt - Submit test attempt
router.post('/:id/attempt', async (req, res) => {
  try {
    const { answers } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
      type: 'TEST'
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    if (!task.assessment || !task.assessment.questions) {
      return res.status(400).json({
        success: false,
        message: 'No assessment available for this task'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = task.assessment.questions[index];
      const isCorrect = question && question.options[answer] && question.options[answer].isCorrect;
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: index,
        selectedOption: answer,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / task.assessment.questions.length) * 100);
    const passed = score >= task.assessment.passingScore;
    const attemptNumber = (task.attempts?.length || 0) + 1;

    // Create attempt record
    const attempt = {
      attemptNumber,
      score,
      passed,
      answers: processedAnswers,
      startedAt: new Date(Date.now() - 30000), // Mock start time
      completedAt: new Date(),
      duration: 30 // Mock duration in seconds
    };

    // Update task
    task.attempts.push(attempt);
    task.lastAttemptAt = new Date();
    task.status = passed ? 'Passed' : 'Failed';
    
    if (passed || attemptNumber >= task.assessment.maxAttempts) {
      task.completedAt = new Date();
    }

    await task.save();

    // Log test completion
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: passed ? 'test_completed' : 'test_failed',
      entity: { type: 'task', id: task._id, title: task.title },
      details: {
        score,
        passed,
        attemptNumber,
        correctAnswers,
        totalQuestions: task.assessment.questions.length
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: passed ? 'Test passed!' : 'Test failed. Try again.',
      data: {
        score,
        passed,
        attemptNumber,
        maxAttempts: task.assessment.maxAttempts,
        attemptsRemaining: Math.max(0, task.assessment.maxAttempts - attemptNumber),
        correctAnswers,
        totalQuestions: task.assessment.questions.length
      }
    });

  } catch (error) {
    console.error('Test attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit test'
    });
  }
});

module.exports = router;