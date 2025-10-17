import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Award,
  MessageCircle,
  Search,
  Heart,
  TrendingUp,
  Calendar,
  Target,
  X,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

const WelcomeTour = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem(`tour_completed_${user._id}`);
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, [user._id]);

  const tourSteps = [
    {
      icon: BookOpen,
      title: 'Welcome to EduKanban!',
      description: 'Your AI-powered learning companion is ready to help you achieve your goals.',
      color: 'from-blue-500 to-purple-600',
      features: [
        'Create courses with AI assistance',
        'Track your progress in real-time',
        'Earn certificates and badges',
        'Connect with other learners'
      ]
    },
    {
      icon: MessageCircle,
      title: 'AI Learning Assistant',
      description: 'Chat with our AI to generate personalized courses and get instant help.',
      color: 'from-indigo-500 to-purple-600',
      features: [
        'Generate custom learning paths',
        'Ask questions anytime',
        'Get study recommendations',
        '24/7 AI support'
      ]
    },
    {
      icon: Users,
      title: 'Social Learning Hub',
      description: 'Connect with learners worldwide, share progress, and stay motivated together.',
      color: 'from-cyan-500 to-blue-600',
      features: [
        'Follow other learners',
        'Share your achievements',
        'View activity feeds',
        'Discover new courses'
      ]
    },
    {
      icon: Heart,
      title: 'Wellness Center',
      description: 'Take care of your mental health with meditation, mood tracking, and AI wellness coach.',
      color: 'from-pink-500 to-rose-600',
      features: [
        'Daily mood tracking',
        'Guided meditation',
        'Stress management tools',
        'AI wellness support'
      ]
    },
    {
      icon: Award,
      title: 'Gamification & Rewards',
      description: 'Level up, earn badges, and get certificates as you complete your learning journey.',
      color: 'from-yellow-500 to-orange-600',
      features: [
        'Earn XP and level up',
        'Collect achievement badges',
        'Get verified certificates',
        'Climb the leaderboard'
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem(`tour_completed_${user._id}`, 'true');
    setShowTour(false);
    if (onComplete) onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!showTour) return null;

  const currentStepData = tourSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentStepData.color} p-8 text-white relative`}>
          <button
            onClick={skipTour}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm mb-1">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
            </div>
          </div>

          <p className="text-white/90 text-lg">{currentStepData.description}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features:</h3>
          <div className="space-y-3 mb-8">
            {currentStepData.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={`w-6 h-6 bg-gradient-to-r ${currentStepData.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700">{feature}</p>
              </motion.div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={skipTour}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Skip Tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              <button
                onClick={handleNext}
                className={`px-6 py-3 bg-gradient-to-r ${currentStepData.color} text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2`}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Get Started
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeTour;
