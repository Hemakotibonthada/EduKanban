import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';

const ExamResultsModal = ({ results, onClose, onRetry, onViewCertificate }) => {
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificate, setCertificate] = useState(null);

  const { attempt, detailedResults, attemptsRemaining } = results;
  const passed = attempt.passed;

  // Generate certificate when user passes
  const handleGenerateCertificate = async () => {
    setGeneratingCertificate(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/certificates/generate-from-exam/${attempt.attemptId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate certificate');
      }

      const data = await response.json();
      setCertificate(data.certificate);
      toast.success('Certificate generated successfully!');
      
      if (onViewCertificate) {
        onViewCertificate(data.certificate);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Get color scheme based on pass/fail
  const getColorScheme = () => {
    if (passed) {
      return {
        bg: 'from-green-500 to-emerald-600',
        icon: '🎉',
        title: 'Congratulations!',
        message: 'You passed the exam!'
      };
    } else {
      return {
        bg: 'from-orange-500 to-red-600',
        icon: '📚',
        title: 'Keep Learning!',
        message: 'You didn\'t pass this time, but don\'t give up!'
      };
    }
  };

  const colorScheme = getColorScheme();

  // Get grade color
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${colorScheme.bg} text-white p-8 text-center`}>
          <div className="text-6xl mb-4">{colorScheme.icon}</div>
          <h2 className="text-3xl font-bold mb-2">{colorScheme.title}</h2>
          <p className="text-lg text-white text-opacity-90">{colorScheme.message}</p>
        </div>

        {/* Results Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {/* Score Display */}
          <div className="text-center mb-8">
            <div className={`text-7xl font-bold mb-2 ${getScoreColor(attempt.percentage)}`}>
              {attempt.percentage}%
            </div>
            <p className="text-gray-600 text-lg">
              {attempt.score} out of {detailedResults.totalPoints} points
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Passing score: {detailedResults.passingScore}%
            </p>
          </div>

          {/* Attempt Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Attempt {attempt.attemptNumber}</span>
              <span className="text-gray-600">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </div>

          {/* Pass Actions */}
          {passed && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-800 mb-2">✓ Exam Passed!</h3>
                <p className="text-green-700 text-sm">
                  Congratulations on passing the exam! You can now generate your certificate to showcase your achievement.
                </p>
              </div>

              {certificate ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Certificate Generated!</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Certificate ID: {certificate.certificateId}
                  </p>
                  <button
                    onClick={() => onViewCertificate && onViewCertificate(certificate)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Certificate
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateCertificate}
                  disabled={generatingCertificate}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {generatingCertificate ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    '🏆 Generate Certificate'
                  )}
                </button>
              )}
            </div>
          )}

          {/* Weak Areas */}
          {attempt.weakAreas && attempt.weakAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                📊 Areas for Improvement
              </h3>
              <div className="space-y-3">
                {attempt.weakAreas.map((area, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-orange-900">{area.category}</h4>
                      <span className="text-orange-700 text-sm font-semibold">
                        {area.percentageWrong}% incorrect
                      </span>
                    </div>
                    <p className="text-orange-700 text-sm mb-2">
                      {area.incorrectCount} out of {area.totalQuestions} questions incorrect
                    </p>
                    {area.remediationTopics && area.remediationTopics.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold text-orange-800">Suggested Actions:</p>
                        {area.remediationTopics.map((topic, idx) => (
                          <p key={idx} className="text-xs text-orange-700 pl-4">
                            • {topic}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance by Category */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              📈 Performance Breakdown
            </h3>
            <div className="space-y-2">
              {detailedResults.answers && (() => {
                const categories = {};
                detailedResults.answers.forEach(answer => {
                  if (!categories[answer.category]) {
                    categories[answer.category] = { correct: 0, total: 0 };
                  }
                  categories[answer.category].total++;
                  if (answer.isCorrect) {
                    categories[answer.category].correct++;
                  }
                });

                return Object.entries(categories).map(([category, stats]) => {
                  const percentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={category} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                        <span className="text-sm text-gray-600">
                          {stats.correct}/{stats.total} correct
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 70 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3">
            {!passed && attemptsRemaining > 0 && onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                🔄 Retry Exam ({attemptsRemaining} left)
              </button>
            )}
            
            {!passed && attemptsRemaining === 0 && (
              <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3 text-center">
                <p className="text-gray-700 text-sm">
                  No attempts remaining. Please contact your instructor.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className={`${
                passed || attemptsRemaining === 0 ? 'flex-1' : ''
              } px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold`}
            >
              {passed ? 'Close' : 'Review & Study'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExamResultsModal;
