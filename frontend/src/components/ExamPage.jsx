import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';

const ExamPage = ({ examId, courseId, onClose, onComplete }) => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [attemptsInfo, setAttemptsInfo] = useState(null);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch exam');
        }

        const data = await response.json();
        setExam(data.exam);
        setAttemptsInfo({
          previous: data.previousAttempts || [],
          remaining: data.attemptsRemaining || 0
        });
        setTimeRemaining(data.exam.duration * 60); // Convert minutes to seconds
        setExamStartTime(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        toast.error('Failed to load exam');
        onClose();
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId, onClose]);

  // Timer countdown
  useEffect(() => {
    if (!exam || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeRemaining]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Navigate questions
  const goToNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit exam
  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < exam.questions.length) {
        const confirm = window.confirm(
          `You have only answered ${answeredCount} out of ${exam.questions.length} questions. Do you want to submit anyway?`
        );
        if (!confirm) return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const timeSpent = Math.floor((new Date() - examStartTime) / 1000);

      // Format answers for submission
      const formattedAnswers = exam.questions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || ''
      }));

      const response = await fetch(`${API_BASE_URL}/exams/${examId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          startedAt: examStartTime.toISOString(),
          timeSpent: timeSpent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit exam');
      }

      const data = await response.json();
      
      if (autoSubmit) {
        toast.error('Time is up! Exam auto-submitted.');
      } else {
        toast.success('Exam submitted successfully!');
      }

      // Call onComplete with results
      if (onComplete) {
        onComplete(data);
      }

    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error(error.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  // Check if question is answered
  const isQuestionAnswered = (questionId) => {
    return answers.hasOwnProperty(questionId) && answers[questionId] !== '';
  };

  // Calculate progress
  const getProgress = () => {
    const answeredCount = Object.keys(answers).filter(key => answers[key] !== '').length;
    return (answeredCount / exam.questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = getProgress();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{exam.title}</h2>
              <p className="text-blue-100 mt-1">{exam.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-4">
              <span>📝 {exam.questions.length} Questions</span>
              <span>⏱️ {formatTime(timeRemaining)}</span>
              <span>🎯 Pass: {exam.passingScore}%</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 rounded ${viewMode === 'single' ? 'bg-white text-blue-600' : 'bg-blue-700'}`}
              >
                One at a time
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded ${viewMode === 'all' ? 'bg-white text-blue-600' : 'bg-blue-700'}`}
              >
                Show all
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress: {Math.round(progress)}%</span>
              <span>{Object.keys(answers).length} / {exam.questions.length} answered</span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-2">
              <motion.div
                className="bg-white h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'single' ? (
            // Single Question View
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Question {currentQuestionIndex + 1} of {exam.questions.length}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Category: {currentQuestion.category}
                  </span>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-lg text-gray-800 mb-6">{currentQuestion.questionText}</p>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const optionKey = option.text;
                      const isSelected = answers[currentQuestion._id] === optionKey;

                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswerSelect(currentQuestion._id, optionKey)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                              {option.text}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  {currentQuestionIndex === exam.questions.length - 1 ? (
                    <button
                      onClick={() => handleSubmit(false)}
                      disabled={submitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                  ) : (
                    <button
                      onClick={goToNext}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            // All Questions View
            <div className="space-y-6">
              {exam.questions.map((question, index) => (
                <div key={question._id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Question {index + 1}
                      {isQuestionAnswered(question._id) && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </h3>
                    <span className="text-sm text-gray-500">{question.category}</span>
                  </div>

                  <p className="text-gray-800 mb-4">{question.questionText}</p>

                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const optionKey = option.text;
                      const isSelected = answers[question._id] === optionKey;

                      return (
                        <button
                          key={optIndex}
                          onClick={() => handleAnswerSelect(question._id, optionKey)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                              {option.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Question Navigator (single view only) */}
        {viewMode === 'single' && (
          <div className="border-t p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">Jump to question:</p>
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : isQuestionAnswered(exam.questions[index]._id)
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExamPage;
