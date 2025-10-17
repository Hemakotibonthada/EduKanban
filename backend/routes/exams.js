const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Task = require('../models/Task');
const Course = require('../models/Course');

// Get all exams for a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const exams = await Exam.find({ courseId, isActive: true })
      .select('-questions.correctAnswer') // Don't send correct answers
      .sort({ createdAt: 1 });

    res.json({ exams });
  } catch (error) {
    console.error('Error fetching course exams:', error);
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
});

// Get a specific exam (without correct answers)
router.get('/:examId', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findById(examId)
      .populate('courseId', 'title description')
      .populate('moduleId', 'title');

    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Remove correct answers from questions
    const examData = exam.toObject();
    examData.questions = examData.questions.map(q => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    // Get user's previous attempts
    const attempts = await ExamAttempt.find({
      examId: examId,
      userId: req.user.id
    }).select('attemptNumber score percentage passed completedAt');

    res.json({
      exam: examData,
      previousAttempts: attempts,
      attemptsRemaining: exam.attemptsAllowed - attempts.length
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Error fetching exam', error: error.message });
  }
});

// Submit exam attempt
router.post('/:examId/attempts', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers, startedAt, timeSpent } = req.body;

    // Validate request
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Get the exam
    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user has attempts remaining
    const previousAttempts = await ExamAttempt.find({
      examId: examId,
      userId: req.user.id
    });

    if (previousAttempts.length >= exam.attemptsAllowed) {
      return res.status(400).json({ 
        message: 'Maximum attempts reached',
        attemptsAllowed: exam.attemptsAllowed,
        attemptsTaken: previousAttempts.length
      });
    }

    // Grade the exam
    const gradingResults = gradeExam(exam, answers);

    // Create exam attempt record
    const examAttempt = new ExamAttempt({
      userId: req.user.id,
      examId: examId,
      courseId: exam.courseId,
      moduleId: exam.moduleId,
      answers: gradingResults.answers,
      score: gradingResults.score,
      totalPoints: gradingResults.totalPoints,
      percentage: gradingResults.percentage,
      passed: gradingResults.passed,
      weakAreas: gradingResults.weakAreas,
      attemptNumber: previousAttempts.length + 1,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - timeSpent * 1000),
      completedAt: new Date(),
      timeSpent: timeSpent || 0,
      submittedAnswers: answers
    });

    await examAttempt.save();

    // Update associated task if this is a task exam
    const task = await Task.findOne({ examId: examId, userId: req.user.id });
    if (task) {
      task.examAttempts.push(examAttempt._id);
      task.examPassed = gradingResults.passed;
      
      if (gradingResults.passed) {
        task.status = 'completed';
        task.completedAt = new Date();
      } else {
        task.status = 'review'; // Move back to review for remediation
      }
      
      await task.save();
    }

    // Return results
    res.json({
      success: true,
      attempt: examAttempt.getSummary(),
      detailedResults: {
        score: gradingResults.score,
        totalPoints: gradingResults.totalPoints,
        percentage: gradingResults.percentage,
        passed: gradingResults.passed,
        passingScore: exam.passingScore,
        weakAreas: gradingResults.weakAreas,
        answers: gradingResults.answers.map(a => ({
          questionId: a.questionId,
          isCorrect: a.isCorrect,
          pointsEarned: a.pointsEarned,
          category: a.category,
          explanation: exam.questions.find(q => q._id.toString() === a.questionId.toString())?.explanation
        }))
      },
      attemptsRemaining: exam.attemptsAllowed - (previousAttempts.length + 1)
    });

  } catch (error) {
    console.error('Error submitting exam attempt:', error);
    res.status(500).json({ message: 'Error submitting exam', error: error.message });
  }
});

// Get user's attempts for an exam
router.get('/:examId/attempts/user', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    
    const attempts = await ExamAttempt.find({
      examId: examId,
      userId: req.user.id
    })
    .sort({ completedAt: -1 })
    .populate('examId', 'title passingScore');

    res.json({ attempts: attempts.map(a => a.getSummary()) });
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
});

// Get detailed results for a specific attempt
router.get('/attempts/:attemptId', authMiddleware, async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('examId', 'title questions passingScore')
      .populate('userId', 'username email');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Verify user has access
    if (attempt.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ attempt: attempt.getDetailedResults() });
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    res.status(500).json({ message: 'Error fetching attempt', error: error.message });
  }
});

// Helper function to grade exam
function gradeExam(exam, userAnswers) {
  const answerResults = [];
  let totalScore = 0;
  let totalPoints = 0;
  const categoryStats = {};

  // Process each question
  exam.questions.forEach((question, index) => {
    const userAnswer = userAnswers.find(a => 
      a.questionId.toString() === question._id.toString()
    );

    const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correctAnswer;
    const points = question.points || 1;
    const pointsEarned = isCorrect ? points : 0;

    totalPoints += points;
    if (isCorrect) {
      totalScore += pointsEarned;
    }

    // Track category performance
    if (!categoryStats[question.category]) {
      categoryStats[question.category] = {
        total: 0,
        incorrect: 0,
        totalPoints: 0
      };
    }
    categoryStats[question.category].total++;
    categoryStats[question.category].totalPoints += points;
    if (!isCorrect) {
      categoryStats[question.category].incorrect++;
    }

    answerResults.push({
      questionId: question._id,
      selectedAnswer: userAnswer ? userAnswer.selectedAnswer : '',
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      category: question.category
    });
  });

  // Calculate percentage
  const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const passed = percentage >= exam.passingScore;

  // Identify weak areas (categories with >40% incorrect)
  const weakAreas = [];
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    const percentageWrong = (stats.incorrect / stats.total) * 100;
    
    if (percentageWrong > 40) {
      weakAreas.push({
        category: category,
        totalQuestions: stats.total,
        incorrectCount: stats.incorrect,
        percentageWrong: Math.round(percentageWrong),
        remediationTopics: generateRemediationTopics(category, percentageWrong)
      });
    }
  });

  return {
    answers: answerResults,
    score: totalScore,
    totalPoints: totalPoints,
    percentage: percentage,
    passed: passed,
    weakAreas: weakAreas
  };
}

// Helper function to generate remediation topics
function generateRemediationTopics(category, percentageWrong) {
  const topics = [
    `Review the fundamentals of ${category}`,
    `Practice more exercises related to ${category}`,
    `Study examples and case studies about ${category}`
  ];

  if (percentageWrong > 60) {
    topics.push(`Consider revisiting the entire ${category} module`);
    topics.push(`Seek additional resources or tutoring for ${category}`);
  }

  return topics;
}

module.exports = router;
