const express = require('express');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// GET /api/quizzes - Get all quizzes (with filters)
router.get('/', async (req, res) => {
  try {
    const { courseId, difficulty, limit = 20, offset = 0 } = req.query;

    let filter = { isPublished: true };
    if (courseId) {
      filter.courseId = courseId;
    }
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const quizzes = await Quiz.find(filter)
      .populate('courseId', 'title')
      .populate('createdBy', 'username')
      .select('-questions.correctAnswer') // Don't expose correct answers
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(filter);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + quizzes.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes'
    });
  }
});

// POST /api/quizzes - Create new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, courseId, moduleId, questions, settings, difficulty, tags, category } = req.body;

    if (!title || !description || !courseId || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      courseId,
      moduleId,
      createdBy: req.userId,
      questions,
      settings: settings || {},
      difficulty: difficulty || 'intermediate',
      tags: tags || [],
      category: category || ''
    });

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'quiz_created',
      entity: { type: 'quiz', id: quiz._id, title: quiz.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    });
  }
});

// GET /api/quizzes/:id - Get quiz details
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true })
      .populate('courseId', 'title')
      .populate('createdBy', 'username');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check user's previous attempts
    const userAttempts = await Submission.find({
      quizId: req.params.id,
      userId: req.userId
    }).sort({ attemptNumber: 1 });

    // Don't expose correct answers if user hasn't completed all attempts
    const canSeeAnswers = userAttempts.length >= quiz.settings.maxAttempts || 
                          userAttempts.some(a => a.passed);

    const quizData = quiz.toObject();
    if (!canSeeAnswers) {
      quizData.questions = quizData.questions.map(q => {
        const { correctAnswer, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      });
    }

    res.json({
      success: true,
      data: {
        quiz: quizData,
        userAttempts: userAttempts.length,
        maxAttempts: quiz.settings.maxAttempts,
        attemptsRemaining: Math.max(0, quiz.settings.maxAttempts - userAttempts.length),
        bestScore: userAttempts.length > 0 ? Math.max(...userAttempts.map(a => a.score)) : null
      }
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz'
    });
  }
});

// PUT /api/quizzes/:id - Update quiz
router.put('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized'
      });
    }

    const { title, description, questions, settings, difficulty, tags, category } = req.body;

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (settings) quiz.settings = { ...quiz.settings, ...settings };
    if (difficulty) quiz.difficulty = difficulty;
    if (tags) quiz.tags = tags;
    if (category) quiz.category = category;

    await quiz.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'quiz_updated',
      entity: { type: 'quiz', id: quiz._id, title: quiz.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: { quiz }
    });

  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz'
    });
  }
});

// DELETE /api/quizzes/:id - Delete quiz
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized'
      });
    }

    // Delete all submissions for this quiz
    await Submission.deleteMany({ quizId: req.params.id });

    await Quiz.deleteOne({ _id: req.params.id });

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'quiz_deleted',
      entity: { type: 'quiz', id: req.params.id, title: quiz.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz'
    });
  }
});

// POST /api/quizzes/:id/submit - Submit quiz answers
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, startedAt } = req.body;

    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check attempt count
    const previousAttempts = await Submission.countDocuments({
      quizId: req.params.id,
      userId: req.userId
    });

    if (previousAttempts >= quiz.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts reached'
      });
    }

    // Calculate score
    let pointsEarned = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return null;

      let isCorrect = false;

      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        const selectedOption = question.options[answer.selectedOptionIndex];
        isCorrect = selectedOption && selectedOption.isCorrect;
      } else if (question.questionType === 'short-answer' || question.questionType === 'fill-blank') {
        isCorrect = answer.textAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      }

      const points = isCorrect ? question.points : 0;
      pointsEarned += points;

      return {
        questionId: question._id,
        questionIndex: index,
        selectedOptionIndex: answer.selectedOptionIndex,
        textAnswer: answer.textAnswer,
        isCorrect,
        pointsEarned: points,
        timeSpent: answer.timeSpent || 0
      };
    }).filter(a => a !== null);

    const score = Math.round((pointsEarned / quiz.totalPoints) * 100);
    const passed = score >= quiz.settings.passingScore;
    const duration = Math.floor((Date.now() - new Date(startedAt)) / 1000);

    // Create submission
    const submission = await Submission.create({
      quizId: req.params.id,
      userId: req.userId,
      courseId: quiz.courseId,
      attemptNumber: previousAttempts + 1,
      answers: processedAnswers,
      score,
      pointsEarned,
      totalPoints: quiz.totalPoints,
      passed,
      startedAt: new Date(startedAt),
      submittedAt: new Date(),
      duration,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update quiz statistics
    quiz.statistics.totalAttempts += 1;
    quiz.statistics.averageScore = 
      (quiz.statistics.averageScore * (quiz.statistics.totalAttempts - 1) + score) / quiz.statistics.totalAttempts;
    quiz.statistics.passRate = 
      ((quiz.statistics.passRate * (quiz.statistics.totalAttempts - 1)) + (passed ? 100 : 0)) / quiz.statistics.totalAttempts;
    quiz.statistics.averageCompletionTime = 
      (quiz.statistics.averageCompletionTime * (quiz.statistics.totalAttempts - 1) + duration) / quiz.statistics.totalAttempts;
    
    await quiz.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: passed ? 'quiz_passed' : 'quiz_failed',
      entity: { type: 'quiz', id: quiz._id, title: quiz.title },
      details: {
        score,
        passed,
        attemptNumber: previousAttempts + 1,
        duration
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: passed ? 'Quiz passed!' : 'Quiz failed. Try again.',
      data: {
        submission: {
          id: submission._id,
          score,
          passed,
          pointsEarned,
          totalPoints: quiz.totalPoints,
          attemptNumber: previousAttempts + 1,
          duration
        },
        attemptsRemaining: Math.max(0, quiz.settings.maxAttempts - (previousAttempts + 1))
      }
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    });
  }
});

// GET /api/quizzes/:id/results - Get quiz results
router.get('/:id/results', async (req, res) => {
  try {
    const submissions = await Submission.find({
      quizId: req.params.id,
      userId: req.userId
    }).sort({ attemptNumber: 1 });

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found'
      });
    }

    const quiz = await Quiz.findById(req.params.id).select('title settings totalPoints');

    const bestAttempt = submissions.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    res.json({
      success: true,
      data: {
        quiz: {
          title: quiz.title,
          totalPoints: quiz.totalPoints,
          passingScore: quiz.settings.passingScore
        },
        attempts: submissions.map(s => ({
          attemptNumber: s.attemptNumber,
          score: s.score,
          passed: s.passed,
          pointsEarned: s.pointsEarned,
          duration: s.duration,
          submittedAt: s.submittedAt
        })),
        bestAttempt: {
          attemptNumber: bestAttempt.attemptNumber,
          score: bestAttempt.score,
          pointsEarned: bestAttempt.pointsEarned
        },
        totalAttempts: submissions.length,
        maxAttempts: quiz.settings.maxAttempts,
        attemptsRemaining: Math.max(0, quiz.settings.maxAttempts - submissions.length)
      }
    });

  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results'
    });
  }
});

// GET /api/quizzes/:id/analytics - Get quiz analytics (creator only)
router.get('/:id/analytics', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized'
      });
    }

    const submissions = await Submission.find({ quizId: req.params.id });

    // Calculate detailed analytics
    const analytics = {
      totalAttempts: submissions.length,
      uniqueUsers: new Set(submissions.map(s => s.userId.toString())).size,
      averageScore: quiz.statistics.averageScore,
      passRate: quiz.statistics.passRate,
      averageCompletionTime: quiz.statistics.averageCompletionTime,
      scoreDistribution: {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      },
      questionAnalytics: quiz.questions.map((q, index) => {
        const questionSubmissions = submissions.map(s => s.answers[index]).filter(a => a);
        const correctCount = questionSubmissions.filter(a => a.isCorrect).length;
        const totalCount = questionSubmissions.length;

        return {
          questionIndex: index,
          questionText: q.questionText,
          correctPercentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
          totalResponses: totalCount,
          difficulty: q.difficulty
        };
      })
    };

    // Calculate score distribution
    submissions.forEach(s => {
      if (s.score <= 20) analytics.scoreDistribution['0-20']++;
      else if (s.score <= 40) analytics.scoreDistribution['21-40']++;
      else if (s.score <= 60) analytics.scoreDistribution['41-60']++;
      else if (s.score <= 80) analytics.scoreDistribution['61-80']++;
      else analytics.scoreDistribution['81-100']++;
    });

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    console.error('Get quiz analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz analytics'
    });
  }
});

// POST /api/quizzes/:id/publish - Publish quiz
router.post('/:id/publish', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized'
      });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish quiz without questions'
      });
    }

    quiz.isPublished = true;
    quiz.publishedAt = new Date();
    await quiz.save();

    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'quiz_published',
      entity: { type: 'quiz', id: quiz._id, title: quiz.title },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Quiz published successfully',
      data: { quiz }
    });

  } catch (error) {
    console.error('Publish quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish quiz'
    });
  }
});

module.exports = router;
