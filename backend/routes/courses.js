const express = require('express');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Progress = require('../models/Progress');

const router = express.Router();

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