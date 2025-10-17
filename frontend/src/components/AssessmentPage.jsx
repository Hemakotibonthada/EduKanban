import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  RefreshCw,
  Award,
  Target,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Star,
  BookOpen,
  FileText,
  HelpCircle,
  Zap,
  Trophy,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const AssessmentPage = ({ user, token, assessmentId, courseId, onBack, onComplete }) => {
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !isSubmitted) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(
        assessmentId 
          ? `http://localhost:5001/api/assessments/${assessmentId}`
          : `http://localhost:5001/api/courses/${courseId}/generate-assessment`,
        {
          method: assessmentId ? 'GET' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const assessmentData = data.data.assessment;
        setAssessment(assessmentData);
        
        if (assessmentData.timeLimit) {
          setTimeLeft(assessmentData.timeLimit * 60); // Convert minutes to seconds
        }
      } else {
        toast.error('Failed to load assessment');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Network error loading assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/assessments/${assessment._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data.results);
        setIsSubmitted(true);
        toast.success('Assessment submitted successfully!');
        
        if (onComplete) {
          onComplete(data.data.results);
        }
      } else {
        toast.error(data.message || 'Failed to submit assessment');
      }
    } catch (error) {
      console.error('Assessment submission error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple-choice': return <CheckCircle className="w-5 h-5" />;
      case 'true-false': return <HelpCircle className="w-5 h-5" />;
      case 'short-answer': return <FileText className="w-5 h-5" />;
      case 'essay': return <BookOpen className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const renderQuestion = (question, index) => {
    const userAnswer = answers[index];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  userAnswer === optionIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                } ${isSubmitted ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={optionIndex}
                  checked={userAnswer === optionIndex}
                  onChange={() => !isSubmitted && handleAnswerChange(index, optionIndex)}
                  disabled={isSubmitted}
                  className="mt-1"
                />
                <span className="flex-1">{option}</span>
                {isSubmitted && results && (
                  <div className="flex items-center">
                    {optionIndex === question.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {userAnswer === optionIndex && optionIndex !== question.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  userAnswer === optionIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                } ${isSubmitted ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={optionIndex}
                  checked={userAnswer === optionIndex}
                  onChange={() => !isSubmitted && handleAnswerChange(index, optionIndex)}
                  disabled={isSubmitted}
                />
                <span className="flex-1">{option}</span>
                {isSubmitted && results && (
                  <div className="flex items-center">
                    {optionIndex === question.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {userAnswer === optionIndex && optionIndex !== question.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <div>
            <textarea
              value={userAnswer || ''}
              onChange={(e) => !isSubmitted && handleAnswerChange(index, e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer here..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={4}
            />
            {isSubmitted && question.sampleAnswer && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Sample Answer:</p>
                <p className="text-sm text-green-700">{question.sampleAnswer}</p>
              </div>
            )}
          </div>
        );

      case 'essay':
        return (
          <div>
            <textarea
              value={userAnswer || ''}
              onChange={(e) => !isSubmitted && handleAnswerChange(index, e.target.value)}
              disabled={isSubmitted}
              placeholder="Write your essay here..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={8}
            />
            {isSubmitted && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Essay questions are reviewed manually. You'll receive feedback within 24-48 hours.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-gray-500">Question type not supported</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600">Assessment not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Results View
  if (isSubmitted && results) {
    const { score, percentage, correctAnswers, totalQuestions, passed, certificate } = results;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Results Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-8 mb-8 text-white ${
              passed ? 'bg-gradient-to-r from-green-600 to-blue-600' : 'bg-gradient-to-r from-red-600 to-orange-600'
            }`}
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {passed ? (
                  <Trophy className="w-10 h-10" />
                ) : (
                  <RefreshCw className="w-10 h-10" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                {passed ? 'Congratulations!' : 'Keep Learning!'}
              </h1>
              <p className="text-xl mb-4">
                You scored {correctAnswers} out of {totalQuestions} ({percentage}%)
              </p>
              <p className="text-lg opacity-90">
                {passed 
                  ? 'You have successfully completed this assessment!'
                  : 'You can retake this assessment to improve your score.'
                }
              </p>
              
              {certificate && (
                <button
                  onClick={() => window.open(certificate.url, '_blank')}
                  className="mt-6 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Certificate</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{correctAnswers}</div>
                <div className="text-sm text-blue-800">Correct Answers</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-purple-800">Incorrect Answers</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{percentage}%</div>
                <div className="text-sm text-green-800">Final Score</div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Question Review</h3>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {showExplanation ? 'Hide' : 'Show'} Explanations
                </button>
              </div>

              {assessment.questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = question.type === 'multiple-choice' || question.type === 'true-false'
                  ? userAnswer === question.correctAnswer
                  : null; // For essay/short answer, we can't automatically determine correctness

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        isCorrect === true ? 'bg-green-100' :
                        isCorrect === false ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {getQuestionTypeIcon(question.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {index + 1}: {question.question}
                        </h4>
                        
                        {question.type === 'multiple-choice' && (
                          <div className="text-sm text-gray-600">
                            <p>Your answer: {question.options[userAnswer] || 'Not answered'}</p>
                            <p>Correct answer: {question.options[question.correctAnswer]}</p>
                          </div>
                        )}
                        
                        {question.type === 'true-false' && (
                          <div className="text-sm text-gray-600">
                            <p>Your answer: {userAnswer === 0 ? 'True' : userAnswer === 1 ? 'False' : 'Not answered'}</p>
                            <p>Correct answer: {question.correctAnswer === 0 ? 'True' : 'False'}</p>
                          </div>
                        )}
                        
                        {(question.type === 'short-answer' || question.type === 'essay') && userAnswer && (
                          <div className="text-sm text-gray-600 mt-2">
                            <p className="font-medium">Your answer:</p>
                            <div className="bg-gray-50 p-2 rounded mt-1">
                              {userAnswer}
                            </div>
                          </div>
                        )}
                        
                        {showExplanation && question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                            <p className="text-sm text-blue-700">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isCorrect === true && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {isCorrect === false && <XCircle className="w-6 h-6 text-red-600" />}
                        {isCorrect === null && <Clock className="w-6 h-6 text-gray-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Course
            </button>
            
            {!passed && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retake Assessment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionObj = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{assessment.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {assessment.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {timeLeft !== null && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(timeLeft)}</span>
                </div>
              )}
              
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl p-8 shadow-sm border"
          >
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                {getQuestionTypeIcon(currentQuestionObj.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                    {currentQuestionObj.type.replace('-', ' ')}
                  </span>
                  {currentQuestionObj.points && (
                    <span className="text-sm text-gray-500">({currentQuestionObj.points} points)</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestionObj.question}
                </h2>
                
                {currentQuestionObj.context && (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-4 mb-6">
                    <p className="text-gray-700">{currentQuestionObj.context}</p>
                  </div>
                )}
                
                {renderQuestion(currentQuestionObj, currentQuestion)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {assessment.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === assessment.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>Submit Assessment</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(assessment.questions.length - 1, currentQuestion + 1))}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;