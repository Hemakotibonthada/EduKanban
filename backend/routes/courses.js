const express = require('express');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Progress = require('../models/Progress');

const router = express.Router();

// Helper function to auto-generate tasks for a course
async function autoGenerateTasksForCourse(courseId, userId) {
  try {
    const course = await Course.findById(courseId);
    if (!course || !course.modules || course.modules.length === 0) {
      return { success: false, message: 'Course or modules not found' };
    }

    const tasks = [];
    let taskOrder = 0;

    // Generate tasks for each module
    for (let i = 0; i < course.modules.length; i++) {
      const module = course.modules[i];
      const moduleNumber = i + 1;

      // Task 1: Study/Read the module
      tasks.push({
        title: `📚 Study: ${module.title}`,
        description: `Complete the reading and understanding of module ${moduleNumber}: ${module.title}`,
        courseId: courseId,
        userId: userId,
        status: 'todo',
        priority: i === 0 ? 'high' : 'medium', // First module is high priority
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // Week by week
        estimatedTime: 120, // 2 hours
        order: taskOrder++,
        type: 'reading'
      });

      // Task 2: Complete exercises/practice
      if (module.lessons && module.lessons.length > 0) {
        tasks.push({
          title: `✏️ Practice: ${module.title}`,
          description: `Complete practice exercises for ${module.title}. ${module.lessons.length} lessons to practice.`,
          courseId: courseId,
          userId: userId,
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000), // +3 days after study
          estimatedTime: 90, // 1.5 hours
          order: taskOrder++,
          type: 'practice'
        });
      }

      // Task 3: Quiz/Assessment
      tasks.push({
        title: `🎯 Quiz: ${module.title}`,
        description: `Take the assessment quiz for module ${moduleNumber} to test your understanding`,
        courseId: courseId,
        userId: userId,
        status: 'todo',
        priority: 'high',
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000 + 6 * 24 * 60 * 60 * 1000), // End of week
        estimatedTime: 30, // 30 minutes
        order: taskOrder++,
        type: 'quiz'
      });
    }

    // Final project/review task
    tasks.push({
      title: `🚀 Final Project: ${course.title}`,
      description: `Complete the final project to demonstrate your mastery of ${course.title}`,
      courseId: courseId,
      userId: userId,
      status: 'todo',
      priority: 'urgent',
      dueDate: new Date(Date.now() + (course.modules.length + 1) * 7 * 24 * 60 * 60 * 1000),
      estimatedTime: 240, // 4 hours
      order: taskOrder++,
      type: 'project'
    });

    // Create all tasks
    const createdTasks = await Task.insertMany(tasks);

    console.log(`✅ Auto-generated ${createdTasks.length} tasks for course: ${course.title}`);

    return {
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    };

  } catch (error) {
    console.error('Error auto-generating tasks:', error);
    return { success: false, message: error.message };
  }
}

// Export for use in other routes
router.autoGenerateTasksForCourse = autoGenerateTasksForCourse;

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get user's courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *       - $ref: '#/components/parameters/statusParam'
 *       - name: difficulty
 *         in: query
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: List of courses
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// GET /api/courses - Get user's courses
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, difficulty } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 100);
    const parsedOffset = parseInt(offset);

    let filter = { userId: req.userId };
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip(parsedOffset);

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: { 
        courses,
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + courses.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// GET /api/courses/:id - Get specific course with modules and tasks
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const modules = await Module.find({ courseId: course._id })
      .sort({ order: 1 });
    
    const tasks = await Task.find({ courseId: course._id })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: {
        course,
        modules,
        tasks
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course'
    });
  }
});

// PUT /api/courses/:id/status - Update course status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'completed', 'paused', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Log status change
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: status === 'completed' ? 'course_completed' : 'course_paused',
      entity: { type: 'course', id: course._id, title: course.title },
      details: { oldStatus: course.status, newStatus: status },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    // If course is completed, update or create progress and auto-generate certificate
    if (status === 'completed') {
      try {
        // Find or create progress record
        let progress = await Progress.findOne({
          user: req.userId,
          course: course._id
        });

        if (!progress) {
          progress = await Progress.create({
            user: req.userId,
            course: course._id,
            completionPercentage: 100,
            isCompleted: true,
            completedAt: new Date()
          });
        } else if (!progress.isCompleted) {
          progress.completionPercentage = 100;
          progress.isCompleted = true;
          progress.completedAt = new Date();
          await progress.save();
        }

        // Auto-generate certificate
        const certificateRoutes = require('./certificates');
        if (certificateRoutes.autoGenerateCertificate) {
          const certificate = await certificateRoutes.autoGenerateCertificate(req.userId, course._id);
          if (certificate) {
            console.log(`✅ Certificate automatically generated: ${certificate.certificateId}`);
          }
        }
      } catch (certError) {
        console.error('Certificate auto-generation failed:', certError);
        // Don't fail the request if certificate generation fails
      }
    }

    res.json({
      success: true,
      message: 'Course status updated',
      data: { course }
    });

  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status'
    });
  }
});

// PUT /api/courses/:id/complete - Mark course as complete
router.put('/:id/complete', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update course status to completed
    course.status = 'completed';
    course.completedAt = new Date();
    await course.save();

    // Log completion activity
    try {
      await ActivityLog.create({
        userId: req.userId,
        sessionId: req.sessionId,
        action: 'course_completed',
        entity: { type: 'course', id: course._id, title: course.title },
        details: { completedAt: course.completedAt },
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });
    } catch (logError) {
      console.error('Failed to log course completion:', logError);
    }

    // Try to generate certificate
    try {
      const Certificate = require('../models/Certificate');
      
      // Check if certificate already exists
      const existingCert = await Certificate.findOne({
        userId: req.userId,
        courseId: course._id
      });

      if (!existingCert) {
        await Certificate.create({
          userId: req.userId,
          courseId: course._id,
          courseName: course.title,
          issueDate: new Date(),
          certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          metadata: {
            completionDate: course.completedAt,
            difficulty: course.difficulty,
            estimatedDuration: course.estimatedDuration
          }
        });
      }
    } catch (certError) {
      console.error('Failed to generate certificate:', certError);
      // Don't fail the request if certificate generation fails
    }

    res.json({
      success: true,
      message: 'Course completed successfully! 🎉',
      data: { 
        course: {
          _id: course._id,
          title: course.title,
          status: course.status,
          completedAt: course.completedAt
        }
      }
    });

  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete course'
    });
  }
});

// PUT /api/courses/:courseId/modules/:moduleId/status - Update module status
router.put('/:courseId/modules/:moduleId/status', async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { status, moduleData } = req.body;
    
    console.log('Update module status request:', { courseId, moduleId, status, moduleData });

    // Find the course and update the specific module
    const course = await Course.findOne({
      _id: courseId,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find and update the module
    const moduleIndex = course.modules.findIndex(m => m._id.toString() === moduleId);
    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Update module status and data
    course.modules[moduleIndex].status = status;
    
    // Update other allowed fields from moduleData (excluding _id and other immutable fields)
    if (moduleData) {
      const allowedFields = ['reviewTopics', 'failedTopics', 'examAttempts', 'examPassed', 'certificate', 'progress', 'lastExamResults'];
      allowedFields.forEach(field => {
        if (moduleData[field] !== undefined) {
          course.modules[moduleIndex][field] = moduleData[field];
        }
      });
    }

    await course.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'module_status_updated',
      entity: { 
        type: 'module', 
        id: moduleId, 
        title: course.modules[moduleIndex].title,
        courseId: courseId,
        status: status
      },
      metadata: {
        previousStatus: course.modules[moduleIndex].status,
        newStatus: status,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Module status updated successfully',
      data: {
        module: course.modules[moduleIndex]
      }
    });

  } catch (error) {
    console.error('Update module status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module status'
    });
  }
});

// GET /api/courses/:id/progress - Get course progress
router.get('/:id/progress', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const tasks = await Task.find({ courseId: course._id });
    const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Passed');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    
    const progress = {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      percentageComplete: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      totalModules: course.modules?.length || 0,
      estimatedDuration: course.estimatedDuration || 0
    };

    res.json({
      success: true,
      data: { progress }
    });

  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course progress'
    });
  }
});

// DELETE /api/courses/:id - Delete course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete associated modules and tasks
    await Promise.all([
      Module.deleteMany({ courseId: course._id }),
      Task.deleteMany({ courseId: course._id }),
      Course.findByIdAndDelete(course._id)
    ]);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
});

// PATCH /api/courses/:courseId/modules/:moduleIndex/video - Update module video URL
router.patch('/:courseId/modules/:moduleIndex/video', async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const { videoUrl } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const index = parseInt(moduleIndex);
    if (index < 0 || index >= course.modules.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module index'
      });
    }

    // Update the video URL for the specific module
    course.modules[index].videoUrl = videoUrl;
    await course.save();

    res.json({
      success: true,
      message: 'Video URL updated successfully',
      data: { module: course.modules[index] }
    });

  } catch (error) {
    console.error('Update module video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video URL'
    });
  }
});

// POST /api/courses - Create manual course
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      topic,
      difficulty,
      estimatedDuration,
      timeCommitment,
      currentKnowledgeLevel,
      modules,
      tags,
      learningOutcomes,
      prerequisites
    } = req.body;

    if (!title || !description || !topic || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, topic, difficulty'
      });
    }

    const course = await Course.create({
      title,
      description,
      topic,
      userId: req.userId,
      difficulty,
      estimatedDuration: estimatedDuration || 10,
      timeCommitment: timeCommitment || '5 hours per week',
      currentKnowledgeLevel: currentKnowledgeLevel || difficulty,
      modules: modules || [],
      tags: tags || [],
      learningOutcomes: learningOutcomes || [],
      prerequisites: prerequisites || [],
      aiGenerated: false,
      progress: {
        totalModules: modules?.length || 0,
        completedModules: 0,
        totalTasks: 0,
        completedTasks: 0,
        percentageComplete: 0
      }
    });

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'course_created',
      entity: { type: 'course', id: course._id, title: course.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
});

// PUT /api/courses/:id - Update course
router.put('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const {
      title,
      description,
      difficulty,
      estimatedDuration,
      timeCommitment,
      tags,
      learningOutcomes,
      prerequisites,
      status
    } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (difficulty) course.difficulty = difficulty;
    if (estimatedDuration) course.estimatedDuration = estimatedDuration;
    if (timeCommitment) course.timeCommitment = timeCommitment;
    if (tags) course.tags = tags;
    if (learningOutcomes) course.learningOutcomes = learningOutcomes;
    if (prerequisites) course.prerequisites = prerequisites;
    if (status) course.status = status;

    await course.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'course_updated',
      entity: { type: 'course', id: course._id, title: course.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
});

// POST /api/courses/:id/enroll - Enroll in course (for shared/public courses)
router.post('/:id/enroll', async (req, res) => {
  try {
    const sourceCourse = await Course.findById(req.params.id);

    if (!sourceCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user already enrolled
    const existingEnrollment = await Course.findOne({
      userId: req.userId,
      sourceTemplateId: req.params.id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create a copy of the course for the user
    const enrolledCourse = await Course.create({
      title: sourceCourse.title,
      description: sourceCourse.description,
      topic: sourceCourse.topic,
      userId: req.userId,
      difficulty: sourceCourse.difficulty,
      estimatedDuration: sourceCourse.estimatedDuration,
      timeCommitment: sourceCourse.timeCommitment,
      currentKnowledgeLevel: sourceCourse.currentKnowledgeLevel,
      modules: sourceCourse.modules,
      tags: sourceCourse.tags,
      learningOutcomes: sourceCourse.learningOutcomes,
      prerequisites: sourceCourse.prerequisites,
      aiGenerated: sourceCourse.aiGenerated,
      sourceTemplateId: sourceCourse._id,
      progress: {
        totalModules: sourceCourse.modules?.length || 0,
        completedModules: 0,
        totalTasks: 0,
        completedTasks: 0,
        percentageComplete: 0
      }
    });

    // Auto-generate tasks
    const taskResult = await autoGenerateTasksForCourse(enrolledCourse._id, req.userId);
    
    if (taskResult.success) {
      enrolledCourse.progress.totalTasks = taskResult.tasksCreated;
      await enrolledCourse.save();
    }

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'course_enrolled',
      entity: { type: 'course', id: enrolledCourse._id, title: enrolledCourse.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: { 
        course: enrolledCourse,
        tasksCreated: taskResult.tasksCreated || 0
      }
    });

  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
});

// POST /api/courses/:id/modules - Add module to course
router.post('/:id/modules', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { title, description, duration, lessons, videoUrl, resources } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Module title and description are required'
      });
    }

    const newModule = {
      title,
      description,
      duration: duration || 60,
      order: course.modules.length,
      lessons: lessons || [],
      videoUrl: videoUrl || null,
      resources: resources || [],
      isCompleted: false
    };

    course.modules.push(newModule);
    course.progress.totalModules = course.modules.length;
    await course.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'module_added',
      entity: { type: 'course', id: course._id, title: course.title },
      details: { moduleName: title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Module added successfully',
      data: { 
        course,
        module: newModule
      }
    });

  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add module'
    });
  }
});

module.exports = router;