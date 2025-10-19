const express = require('express');
const router = express.Router();
const PeerReviewSubmission = require('../models/PeerReviewSubmission');
const PeerReview = require('../models/PeerReview');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get available submissions for review
router.get('/available', async (req, res) => {
  try {
    const submissions = await PeerReviewSubmission.find({
      userId: { $ne: req.user.userId }, // Not user's own submissions
      status: 'pending',
      requiredReviews: { $gt: 0 }
    })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    // Filter out submissions user has already reviewed
    const reviewedIds = await PeerReview.find({
      reviewerId: req.user.userId
    }).distinct('submissionId');

    const availableSubmissions = submissions.filter(
      s => !reviewedIds.includes(s._id.toString())
    );

    // Format for frontend
    const formatted = availableSubmissions.map(sub => ({
      _id: sub._id,
      title: sub.title,
      description: sub.description,
      category: sub.category,
      author: `${sub.userId.firstName} ${sub.userId.lastName}`,
      timeAgo: getTimeAgo(sub.createdAt),
      reviewCount: sub.reviews.length
    }));

    res.json({
      success: true,
      data: { submissions: formatted }
    });
  } catch (error) {
    console.error('Error fetching available submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions'
    });
  }
});

// Get user's submissions
router.get('/my-submissions', async (req, res) => {
  try {
    const submissions = await PeerReviewSubmission.find({
      userId: req.user.userId
    })
      .sort({ createdAt: -1 });

    // Get reviews for each submission
    const formatted = await Promise.all(submissions.map(async (sub) => {
      const reviews = await PeerReview.find({ submissionId: sub._id });
      const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;
      const positiveReviews = reviews.filter(r => r.rating >= 4).length;

      return {
        _id: sub._id,
        title: sub.title,
        description: sub.description,
        category: sub.category,
        reviewCount: reviews.length,
        averageRating: avgRating,
        positiveReviews,
        reputationEarned: reviews.length * 5,
        createdAt: sub.createdAt
      };
    }));

    res.json({
      success: true,
      data: { submissions: formatted }
    });
  } catch (error) {
    console.error('Error fetching my submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your submissions'
    });
  }
});

// Get user's reviews
router.get('/my-reviews', async (req, res) => {
  try {
    const reviews = await PeerReview.find({
      reviewerId: req.user.userId
    })
      .populate('submissionId', 'title')
      .sort({ createdAt: -1 });

    const formatted = reviews.map(review => ({
      _id: review._id,
      submissionTitle: review.submissionId?.title || 'Deleted Submission',
      rating: review.rating,
      strengths: review.strengths,
      improvements: review.improvements,
      detailedFeedback: review.detailedFeedback,
      helpfulCount: review.helpfulVotes || 0,
      reputationEarned: 10,
      timeAgo: getTimeAgo(review.createdAt)
    }));

    res.json({
      success: true,
      data: { reviews: formatted }
    });
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews'
    });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const reviewsGiven = await PeerReview.countDocuments({
      reviewerId: req.user.userId
    });

    const mySubmissions = await PeerReviewSubmission.find({
      userId: req.user.userId
    });

    const reviewsReceived = await PeerReview.countDocuments({
      submissionId: { $in: mySubmissions.map(s => s._id) }
    });

    const myReviews = await PeerReview.find({
      reviewerId: req.user.userId
    });

    const averageRatingGiven = myReviews.length > 0
      ? myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length
      : 0;

    const helpfulReviews = await PeerReview.countDocuments({
      reviewerId: req.user.userId,
      helpfulVotes: { $gte: 3 }
    });

    const reputationPoints = (reviewsGiven * 10) + (helpfulReviews * 20);

    res.json({
      success: true,
      data: {
        stats: {
          reviewsGiven,
          reviewsReceived,
          reputationPoints,
          averageRatingGiven,
          helpfulReviews
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// Submit a review
router.post('/submit-review', [
  body('submissionId').notEmpty().withMessage('Submission ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('strengths').trim().notEmpty().withMessage('Strengths are required'),
  body('improvements').trim().notEmpty().withMessage('Improvements are required'),
  body('detailedFeedback').optional().trim(),
  body('isHelpful').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { submissionId, rating, strengths, improvements, detailedFeedback, isHelpful } = req.body;

    // Check if user already reviewed this submission
    const existingReview = await PeerReview.findOne({
      submissionId,
      reviewerId: req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this submission'
      });
    }

    // Create review
    const review = new PeerReview({
      submissionId,
      reviewerId: req.user.userId,
      rating,
      strengths,
      improvements,
      detailedFeedback: detailedFeedback || '',
      isHelpful: isHelpful !== false,
      helpfulVotes: 0
    });

    await review.save();

    // Update submission
    await PeerReviewSubmission.findByIdAndUpdate(submissionId, {
      $push: { reviews: review._id },
      $inc: { requiredReviews: -1 }
    });

    // Award reputation points to reviewer
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { reputationPoints: 10 }
    });

    res.json({
      success: true,
      data: { review },
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

// Submit work for review
router.post('/submit', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('content').optional().trim(),
  body('fileUrl').optional().trim(),
  body('requiredReviews').optional().isInt({ min: 1, max: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { title, description, category, content, fileUrl, requiredReviews } = req.body;

    const submission = new PeerReviewSubmission({
      userId: req.user.userId,
      title,
      description,
      category,
      content: content || '',
      fileUrl: fileUrl || '',
      requiredReviews: requiredReviews || 3,
      status: 'pending',
      reviews: []
    });

    await submission.save();

    res.json({
      success: true,
      data: { submission },
      message: 'Work submitted for review successfully'
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit work'
    });
  }
});

// Helper function
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

module.exports = router;
