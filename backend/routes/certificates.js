const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { generatePremiumCertificate } = require('../utils/certificateTemplate');

// Certificate model for tracking issued certificates
const Certificate = require('../models/Certificate');

/**
 * @swagger
 * /certificates/generate/{courseId}:
 *   post:
 *     summary: Generate course completion certificate
 *     description: Generate a PDF certificate for a completed course with QR code verification
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Certificate generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Course not completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Course or progress not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Generate certificate for completed course
router.post('/generate/:courseId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    // Verify course completion
    const progress = await Progress.findOne({
      user: userId,
      course: courseId,
      isCompleted: true
    }).populate('course');

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'Course not completed yet'
      });
    }

    const course = progress.course;
    const user = await User.findById(userId).select('username firstName lastName email');

    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      user: userId,
      course: courseId
    });

    // Calculate grade and percentage
    const gradeData = calculateGrade(progress);

    if (!certificate) {
      // Generate unique certificate ID and verification code
      const certificateId = `EDUKANBAN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const verificationCode = crypto.randomBytes(16).toString('hex');

      // Create certificate record
      certificate = await Certificate.create({
        user: userId,
        course: courseId,
        certificateId,
        verificationCode,
        issueDate: new Date(),
        courseName: course.title,
        userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.username,
        completionDate: progress.completedAt,
        duration: course.estimatedDuration,
        grade: gradeData.grade,
        percentage: gradeData.percentage,
        skills: extractSkills(course)
      });
    }

    // Prepare certificate data
    const certificateData = {
      user,
      course,
      progress,
      certificate,
      gradeData
    };

    // Generate PDF using premium template
    const doc = await generatePremiumCertificate(certificateData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateId}.pdf`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
});

// Get user's certificates
router.get('/my-certificates', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const certificates = await Certificate.find({ user: userId })
      .populate('course', 'title description category')
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

// Verify certificate by verification code
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({ verificationCode })
      .populate('user', 'username firstName lastName')
      .populate('course', 'title description');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        duration: certificate.duration,
        grade: certificate.grade,
        skills: certificate.skills,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
});

// Delete certificate
router.delete('/:certificateId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      certificateId,
      user: userId
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    await certificate.deleteOne();

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certificate',
      error: error.message
    });
  }
});

// Helper function to calculate grade and percentage based on progress
function calculateGrade(progress) {
  let averageScore = progress.completionPercentage || 0;
  
  // If quiz scores exist, factor them in
  if (progress.quizScores && progress.quizScores.length > 0) {
    const quizAverage = progress.quizScores.reduce((sum, score) => {
      const scorePercentage = (score.score / score.maxScore) * 100;
      return sum + scorePercentage;
    }, 0) / progress.quizScores.length;
    
    // Weight: 60% completion, 40% quiz scores
    averageScore = (progress.completionPercentage * 0.6) + (quizAverage * 0.4);
  }

  let grade = 'Pass';
  if (averageScore >= 95) grade = 'A+ (Outstanding)';
  else if (averageScore >= 90) grade = 'A (Excellent)';
  else if (averageScore >= 85) grade = 'A- (Very Good)';
  else if (averageScore >= 80) grade = 'B+ (Good)';
  else if (averageScore >= 75) grade = 'B (Above Average)';
  else if (averageScore >= 70) grade = 'B- (Average)';
  else if (averageScore >= 65) grade = 'C+ (Satisfactory)';
  else if (averageScore >= 60) grade = 'C (Pass)';

  return {
    grade,
    percentage: Math.round(averageScore * 10) / 10 // Round to 1 decimal place
  };
}

// Helper function to extract skills from course
function extractSkills(course) {
  const skills = [];
  
  if (course.tags && course.tags.length > 0) {
    skills.push(...course.tags.slice(0, 5));
  }

  if (course.modules && course.modules.length > 0) {
    course.modules.forEach(module => {
      if (module.title) {
        skills.push(module.title);
      }
    });
  }

  return skills.slice(0, 10);
}

// Automatic certificate generation function (to be called when course is completed)
async function autoGenerateCertificate(userId, courseId) {
  try {
    // Check if course is completed
    const progress = await Progress.findOne({
      user: userId,
      course: courseId,
      isCompleted: true
    }).populate('course');

    if (!progress) {
      console.log('Course not completed yet, skipping certificate generation');
      return null;
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: userId,
      course: courseId
    });

    if (existingCertificate) {
      console.log('Certificate already exists for this course');
      return existingCertificate;
    }

    const course = progress.course;
    const user = await User.findById(userId).select('username firstName lastName email');

    // Calculate grade and percentage
    const gradeData = calculateGrade(progress);

    // Generate unique certificate ID and verification code
    const certificateId = `EDUKANBAN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // Create certificate record
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      certificateId,
      verificationCode,
      issueDate: new Date(),
      courseName: course.title,
      userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.username,
      completionDate: progress.completedAt,
      duration: course.estimatedDuration,
      grade: gradeData.grade,
      percentage: gradeData.percentage,
      skills: extractSkills(course)
    });

    console.log(`Certificate auto-generated: ${certificateId}`);
    return certificate;

  } catch (error) {
    console.error('Auto-certificate generation error:', error);
    return null;
  }
}

// Export the auto-generation function
router.autoGenerateCertificate = autoGenerateCertificate;

module.exports = router;
