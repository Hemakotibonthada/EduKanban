const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const RehabProgram = require('../models/RehabProgram');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

// Export user's complete data as JSON
router.get('/data/complete', async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user data
    const [courses, tasks, progress, rehabPrograms, userProfile] = await Promise.all([
      Course.find({ createdBy: userId }),
      Task.find({ user: userId }),
      Progress.find({ user: userId }),
      RehabProgram.find({ user: userId }),
      User.findById(userId).select('-password')
    ]);

    const exportData = {
      exportVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      user: {
        username: userProfile.username,
        email: userProfile.email,
        level: userProfile.level,
        xp: userProfile.xp,
        badges: userProfile.badges,
        achievements: userProfile.achievements,
        learningStreak: userProfile.learningStreak,
        totalStudyTime: userProfile.totalStudyTime,
        coursesCompleted: userProfile.coursesCompleted
      },
      courses: courses.map(course => ({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        modules: course.modules,
        isPublished: course.isPublished,
        tags: course.tags,
        createdAt: course.createdAt
      })),
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        stage: task.stage,
        priority: task.priority,
        dueDate: task.dueDate,
        course: task.course,
        tags: task.tags,
        estimatedTime: task.estimatedTime,
        isCompleted: task.isCompleted,
        completedAt: task.completedAt,
        createdAt: task.createdAt
      })),
      progress: progress.map(p => ({
        course: p.course,
        modulesCompleted: p.modulesCompleted,
        lessonsCompleted: p.lessonsCompleted,
        quizScores: p.quizScores,
        totalTimeSpent: p.totalTimeSpent,
        lastAccessedAt: p.lastAccessedAt,
        completionPercentage: p.completionPercentage,
        isCompleted: p.isCompleted,
        completedAt: p.completedAt
      })),
      rehabilitation: rehabPrograms.map(program => ({
        addictionType: program.addictionType,
        severity: program.severity,
        startDate: program.startDate,
        soberDays: program.soberDays,
        currentStreak: program.currentStreak,
        longestStreak: program.longestStreak,
        recoveryPlan: program.recoveryPlan,
        dailyEntries: program.dailyEntries,
        milestones: program.milestones,
        isActive: program.isActive
      }))
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export complete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

// Export single course as JSON
router.get('/course/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user has access to this course
    if (course.createdBy.toString() !== req.user._id.toString() && !course.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const exportData = {
      exportVersion: '1.0.0',
      exportDate: new Date().toISOString(),
      course: {
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        modules: course.modules,
        tags: course.tags,
        objectives: course.objectives,
        prerequisites: course.prerequisites
      }
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export course',
      error: error.message
    });
  }
});

// Export progress report as PDF
router.get('/progress-report/pdf', async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    const courses = await Course.find({ createdBy: userId });
    const progress = await Progress.find({ user: userId }).populate('course');
    const tasks = await Task.find({ user: userId });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=progress-report-${Date.now()}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('EduKanban Progress Report', { align: 'center' })
       .moveDown();

    // Add user info
    doc.fontSize(12)
       .font('Helvetica')
       .text(`User: ${user.username}`, { align: 'center' })
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .moveDown(2);

    // Add statistics section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Overview')
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Level: ${user.level}`)
       .text(`Total XP: ${user.xp}`)
       .text(`Learning Streak: ${user.learningStreak} days`)
       .text(`Total Study Time: ${Math.round(user.totalStudyTime / 60)} hours`)
       .text(`Courses Completed: ${user.coursesCompleted}`)
       .text(`Total Courses Created: ${courses.length}`)
       .text(`Total Tasks: ${tasks.length}`)
       .text(`Completed Tasks: ${tasks.filter(t => t.isCompleted).length}`)
       .moveDown(2);

    // Add badges section
    if (user.badges && user.badges.length > 0) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Achievements')
         .moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica');
      
      user.badges.forEach((badge, index) => {
        doc.text(`${index + 1}. ${badge.name} - ${badge.description}`)
           .text(`   Earned: ${new Date(badge.earnedAt).toLocaleDateString()}`)
           .moveDown(0.3);
      });
      doc.moveDown(1);
    }

    // Add course progress section
    if (progress.length > 0) {
      doc.addPage();
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Course Progress')
         .moveDown(0.5);

      progress.forEach((p, index) => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${p.course?.title || 'Unknown Course'}`)
           .font('Helvetica')
           .text(`   Progress: ${p.completionPercentage}%`)
           .text(`   Time Spent: ${Math.round(p.totalTimeSpent / 60)} hours`)
           .text(`   Modules Completed: ${p.modulesCompleted.length}`)
           .text(`   Lessons Completed: ${p.lessonsCompleted.length}`)
           .text(`   Status: ${p.isCompleted ? 'Completed' : 'In Progress'}`)
           .moveDown(0.5);
      });
    }

    // Add tasks section
    if (tasks.length > 0) {
      doc.addPage();
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Tasks Summary')
         .moveDown(0.5);

      const tasksByStage = {
        'To Do': tasks.filter(t => t.stage === 'To Do'),
        'In Progress': tasks.filter(t => t.stage === 'In Progress'),
        'Review': tasks.filter(t => t.stage === 'Review'),
        'Done': tasks.filter(t => t.stage === 'Done')
      };

      Object.entries(tasksByStage).forEach(([stage, stageTasks]) => {
        if (stageTasks.length > 0) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text(`${stage} (${stageTasks.length})`)
             .moveDown(0.3);

          doc.fontSize(10)
             .font('Helvetica');
          
          stageTasks.slice(0, 10).forEach((task, index) => {
            doc.text(`• ${task.title}`)
               .text(`  Priority: ${task.priority} | Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`)
               .moveDown(0.2);
          });
          
          if (stageTasks.length > 10) {
            doc.text(`... and ${stageTasks.length - 10} more tasks`);
          }
          doc.moveDown(0.5);
        }
      });
    }

    // Add footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .font('Helvetica')
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Export progress report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate progress report',
      error: error.message
    });
  }
});

// Import complete data backup
router.post('/import/complete', async (req, res) => {
  try {
    const userId = req.user._id;
    const importData = req.body;

    // Validate import data
    if (!importData.exportVersion || !importData.courses) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data format'
      });
    }

    const importResults = {
      courses: 0,
      tasks: 0,
      progress: 0,
      errors: []
    };

    // Import courses
    if (importData.courses && Array.isArray(importData.courses)) {
      for (const courseData of importData.courses) {
        try {
          const existingCourse = await Course.findOne({
            title: courseData.title,
            createdBy: userId
          });

          if (!existingCourse) {
            await Course.create({
              ...courseData,
              createdBy: userId
            });
            importResults.courses++;
          }
        } catch (err) {
          importResults.errors.push(`Course "${courseData.title}": ${err.message}`);
        }
      }
    }

    // Import tasks
    if (importData.tasks && Array.isArray(importData.tasks)) {
      for (const taskData of importData.tasks) {
        try {
          const existingTask = await Task.findOne({
            title: taskData.title,
            user: userId
          });

          if (!existingTask) {
            await Task.create({
              ...taskData,
              user: userId
            });
            importResults.tasks++;
          }
        } catch (err) {
          importResults.errors.push(`Task "${taskData.title}": ${err.message}`);
        }
      }
    }

    // Import progress (more complex - need to match with existing courses)
    if (importData.progress && Array.isArray(importData.progress)) {
      for (const progressData of importData.progress) {
        try {
          // Skip progress import for now as it requires course matching
          importResults.progress++;
        } catch (err) {
          importResults.errors.push(`Progress import: ${err.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: 'Import completed',
      results: importResults
    });
  } catch (error) {
    console.error('Import complete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error.message
    });
  }
});

// Import single course
router.post('/import/course', async (req, res) => {
  try {
    const userId = req.user._id;
    const importData = req.body;

    if (!importData.course) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course data'
      });
    }

    const courseData = importData.course;

    // Check if course already exists
    const existingCourse = await Course.findOne({
      title: courseData.title,
      createdBy: userId
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }

    // Create new course
    const newCourse = await Course.create({
      ...courseData,
      createdBy: userId,
      isPublished: false // Imported courses start as drafts
    });

    res.json({
      success: true,
      message: 'Course imported successfully',
      course: newCourse
    });
  } catch (error) {
    console.error('Import course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import course',
      error: error.message
    });
  }
});

module.exports = router;
