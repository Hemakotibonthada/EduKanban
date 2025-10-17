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

// GET /api/courses - Get user's courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { courses }
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

module.exports = router;