const express = require('express');
const Task = require('../models/Task');
const Course = require('../models/Course');
const Module = require('../models/Module');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get user's tasks with filters
 *     description: Retrieve paginated list of tasks for the authenticated user with optional filters
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [To Do, In Progress, Passed, Failed, Skipped, Completed]
 *         description: Filter by task status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [study, quiz, practice, review, assignment]
 *         description: Filter by task type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority level
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// GET /api/tasks - Get user's tasks
router.get('/', async (req, res) => {
  try {
    const { courseId, status, limit = 20, offset = 0, type, priority } = req.query;
    
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);
    
    let filter = { userId: req.userId };
    if (courseId) filter.courseId = courseId;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .sort({ order: 1 })
      .limit(parsedLimit)
      .skip(parsedOffset);

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: { tasks },
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

/**
 * @swagger
 * /tasks/{id}/status:
 *   put:
 *     summary: Update task status
 *     description: Update the status of a specific task and log the activity
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, Passed, Failed, Skipped, Completed]
 *     responses:
 *       200:
 *         description: Task status updated successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a custom task
 *     description: Create a new task for a course
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - courseId
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [study, quiz, practice, review, assignment]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               estimatedDuration:
 *                 type: number
 *                 default: 30
 *               content:
 *                 type: object
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Course not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// POST /api/tasks - Create custom task
router.post('/', async (req, res) => {
  try {
    const { title, description, courseId, moduleId, type, priority, estimatedDuration, content } = req.body;

    if (!title || !description || !courseId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId: req.userId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get the highest order number for this course
    const highestTask = await Task.findOne({ courseId }).sort({ order: -1 });
    const order = highestTask ? highestTask.order + 1 : 1;

    const task = await Task.create({
      title,
      description,
      courseId,
      moduleId: moduleId || course._id,
      userId: req.userId,
      type,
      priority: priority || 'medium',
      estimatedDuration: estimatedDuration || 30,
      order,
      content: content || {},
      status: 'todo'
    });

    // Update course task count
    course.progress.totalTasks += 1;
    await course.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'task_created',
      entity: { type: 'task', id: task._id, title: task.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update task details
 *     description: Update properties of an existing task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               estimatedDuration:
 *                 type: number
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// PUT /api/tasks/:id - Update task details
router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, estimatedDuration, content, status, dueDate, estimatedTime } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (estimatedDuration) updateData.estimatedDuration = estimatedDuration;
    if (content) updateData.content = content;
    if (status) updateData.status = status;
    if (dueDate) updateData.dueDate = dueDate;
    if (estimatedTime) updateData.estimatedTime = estimatedTime;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('courseId', 'title').populate('moduleId', 'title');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'task_updated',
      entity: { type: 'task', id: task._id, title: task.title },
      metadata: {
        updatedFields: Object.keys(updateData),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Permanently delete a task and update course task count
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const courseId = task.courseId;
    const taskTitle = task.title;

    await Task.deleteOne({ _id: req.params.id });

    // Update course task count
    const course = await Course.findById(courseId);
    if (course) {
      course.progress.totalTasks = Math.max(0, course.progress.totalTasks - 1);
      await course.save();
    }

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'task_deleted',
      entity: { type: 'task', id: req.params.id, title: taskTitle },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// GET /api/tasks/:id/hints - Get task hints
router.get('/:id/hints', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const hints = task.content?.hints || [];

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'task_hints_viewed',
      entity: { type: 'task', id: task._id, title: task.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      data: { hints, totalHints: hints.length }
    });

  } catch (error) {
    console.error('Get hints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hints'
    });
  }
});

// POST /api/tasks/:id/reset - Reset task progress
router.post('/:id/reset', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Reset task progress
    task.status = 'todo';
    task.attempts = [];
    task.startedAt = null;
    task.completedAt = null;
    task.lastAttemptAt = null;
    task.actualDuration = 0;

    await task.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'task_reset',
      entity: { type: 'task', id: task._id, title: task.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Task reset successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Reset task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset task'
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