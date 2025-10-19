import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * PeerReviewSystem Component
 * Collaborative peer review system for assignments and projects
 * Features:
 * - Submit work for peer review
 * - Review others' submissions
 * - Rating and feedback system
 * - Reputation points
 * - Review quality scoring
 */
const PeerReviewSystem = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'submitted', 'my-reviews'
  const [submissions, setSubmissions] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    strengths: '',
    improvements: '',
    detailedFeedback: '',
    isHelpful: true
  });

  const [stats, setStats] = useState({
    reviewsGiven: 0,
    reviewsReceived: 0,
    reputationPoints: 0,
    averageRatingGiven: 0,
    helpfulReviews: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'available') {
        await fetchAvailableSubmissions();
      } else if (activeTab === 'submitted') {
        await fetchMySubmissions();
      } else {
        await fetchMyReviews();
      }
      await fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/peer-review/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/peer-review/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMySubmissions(data.data.submissions);
      }
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      toast.error('Failed to load your submissions');
    }
  };

  const fetchMyReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/peer-review/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyReviews(data.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      toast.error('Failed to load your reviews');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/peer-review/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const submitReview = async () => {
    if (reviewForm.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (!reviewForm.strengths || !reviewForm.improvements) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/peer-review/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId: selectedSubmission._id,
          ...reviewForm
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewForm({
          rating: 0,
          strengths: '',
          improvements: '',
          detailedFeedback: '',
          isHelpful: true
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const startReview = (submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Peer Review System
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Learn together through collaborative feedback
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Star}
            label="Reputation"
            value={stats.reputationPoints}
            color="from-yellow-500 to-orange-500"
          />
          <StatCard
            icon={MessageSquare}
            label="Reviews Given"
            value={stats.reviewsGiven}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={FileText}
            label="Reviews Received"
            value={stats.reviewsReceived}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={ThumbsUp}
            label="Helpful Reviews"
            value={stats.helpfulReviews}
            color="from-green-500 to-teal-500"
          />
          <StatCard
            icon={Award}
            label="Avg Rating"
            value={stats.averageRatingGiven.toFixed(1)}
            color="from-indigo-500 to-purple-500"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <TabButton
              active={activeTab === 'available'}
              onClick={() => setActiveTab('available')}
              icon={Eye}
              label="Available for Review"
              count={submissions.length}
            />
            <TabButton
              active={activeTab === 'submitted'}
              onClick={() => setActiveTab('submitted')}
              icon={Upload}
              label="My Submissions"
              count={mySubmissions.length}
            />
            <TabButton
              active={activeTab === 'my-reviews'}
              onClick={() => setActiveTab('my-reviews')}
              icon={MessageSquare}
              label="My Reviews"
              count={myReviews.length}
            />
          </div>

          {/* Filter and Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="research">Research</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'available' && (
                  <motion.div
                    key="available"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {submissions.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No submissions available for review at the moment
                        </p>
                      </div>
                    ) : (
                      submissions.map(submission => (
                        <SubmissionCard
                          key={submission._id}
                          submission={submission}
                          onReview={startReview}
                        />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'submitted' && (
                  <motion.div
                    key="submitted"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {mySubmissions.length === 0 ? (
                      <div className="text-center py-12">
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          You haven't submitted any work for review yet
                        </p>
                        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-shadow">
                          Submit Your Work
                        </button>
                      </div>
                    ) : (
                      mySubmissions.map(submission => (
                        <MySubmissionCard
                          key={submission._id}
                          submission={submission}
                        />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'my-reviews' && (
                  <motion.div
                    key="my-reviews"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {myReviews.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          You haven't reviewed any submissions yet
                        </p>
                      </div>
                    ) : (
                      myReviews.map(review => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                        />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Submission
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSubmission?.title}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Overall Rating *
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Strengths *
                  </label>
                  <textarea
                    value={reviewForm.strengths}
                    onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="What did this person do well?"
                  />
                </div>

                {/* Improvements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Areas for Improvement *
                  </label>
                  <textarea
                    value={reviewForm.improvements}
                    onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="What could be improved?"
                  />
                </div>

                {/* Detailed Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Feedback (Optional)
                  </label>
                  <textarea
                    value={reviewForm.detailedFeedback}
                    onChange={(e) => setReviewForm({ ...reviewForm, detailedFeedback: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    placeholder="Provide detailed, constructive feedback..."
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <Send className="w-5 h-5 inline mr-2" />
                    Submit Review
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Components
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center mb-3`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 transition-colors ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-semibold">{label}</span>
    {count > 0 && (
      <span className={`px-2 py-1 rounded-full text-xs ${
        active ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const SubmissionCard = ({ submission, onReview }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        {submission.title}
      </h3>
      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
        {submission.category}
      </span>
    </div>

    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
      {submission.description}
    </p>

    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span>{submission.timeAgo}</span>
      </div>
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {submission.reviewCount} reviews
        </span>
      </div>
    </div>

    <button
      onClick={() => onReview(submission)}
      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-shadow"
    >
      Start Review
    </button>
  </motion.div>
);

const MySubmissionCard = ({ submission }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {submission.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {submission.description}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {submission.averageRating.toFixed(1)}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {submission.reviewCount}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">Reviews</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">
          {submission.positiveReviews}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">Positive</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-600">
          +{submission.reputationEarned}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">Reputation</p>
      </div>
    </div>
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {review.submissionTitle}
        </h4>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{review.timeAgo}</span>
        </div>
      </div>
    </div>

    <div className="space-y-3 mb-4">
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">
          Strengths:
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {review.strengths}
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">
          Improvements:
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {review.improvements}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">{review.helpfulCount}</span>
        </button>
      </div>
      <span className="text-xs text-purple-600 dark:text-purple-400">
        +{review.reputationEarned} reputation
      </span>
    </div>
  </div>
);

export default PeerReviewSystem;
