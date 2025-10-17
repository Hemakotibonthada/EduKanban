const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Task = require('../models/Task');

// Global search endpoint
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', difficulty, status, sortBy = 'relevance' } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        results: { courses: [], tasks: [], modules: [] }
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const results = {
      courses: [],
      tasks: [],
      modules: []
    };

    // Build query filters
    const baseFilter = { userId: req.userId };
    if (difficulty && difficulty !== 'all') {
      baseFilter.difficulty = difficulty;
    }
    if (status && status !== 'all') {
      baseFilter.status = status;
    }

    // Search courses
    if (type === 'all' || type === 'courses') {
      const courseQuery = {
        ...baseFilter,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { topic: searchRegex },
          { tags: searchRegex }
        ]
      };

      let coursesQuery = Course.find(courseQuery).select('-modules');
      
      // Apply sorting
      if (sortBy === 'recent') {
        coursesQuery = coursesQuery.sort({ createdAt: -1 });
      } else if (sortBy === 'alphabetical') {
        coursesQuery = coursesQuery.sort({ title: 1 });
      } else {
        // Relevance sorting (default)
        coursesQuery = coursesQuery.sort({ updatedAt: -1 });
      }

      results.courses = await coursesQuery.limit(20);
    }

    // Search tasks
    if (type === 'all' || type === 'tasks') {
      const taskQuery = {
        ...baseFilter,
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      };

      let tasksQuery = Task.find(taskQuery);
      
      // Apply sorting
      if (sortBy === 'recent') {
        tasksQuery = tasksQuery.sort({ createdAt: -1 });
      } else if (sortBy === 'alphabetical') {
        tasksQuery = tasksQuery.sort({ title: 1 });
      } else {
        tasksQuery = tasksQuery.sort({ updatedAt: -1 });
      }

      results.tasks = await tasksQuery.limit(20);
    }

    // Search within course modules
    if (type === 'all' || type === 'modules') {
      const courses = await Course.find({
        userId: req.userId,
        'modules.title': searchRegex
      }).select('title modules');

      const modules = [];
      courses.forEach(course => {
        course.modules.forEach(module => {
          if (searchRegex.test(module.title) || searchRegex.test(module.description)) {
            modules.push({
              ...module.toObject(),
              courseId: course._id,
              courseName: course.title
            });
          }
        });
      });

      // Sort modules
      if (sortBy === 'alphabetical') {
        modules.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'recent') {
        modules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      results.modules = modules.slice(0, 20);
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;
