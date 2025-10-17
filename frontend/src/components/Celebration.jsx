import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Zap, 
  Sparkles,
  Gift,
  Crown,
  Medal,
  Flame,
  Heart,
  CheckCircle
} from 'lucide-react';

const Confetti = ({ show, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      generateParticles();
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const generateParticles = () => {
    const newParticles = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2
        }
      });
    }
    setParticles(newParticles);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: particle.x + particle.velocity.x * 100,
              y: window.innerHeight + 100,
              rotate: particle.rotation + 720,
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 3,
              ease: "easeOut"
            }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const CelebrationModal = ({ 
  show, 
  type = 'task', 
  title, 
  message,
  achievements = [],
  onClose 
}) => {
  const [confettiShow, setConfettiShow] = useState(false);

  useEffect(() => {
    if (show) {
      setConfettiShow(true);
    }
  }, [show]);

  const getIcon = () => {
    switch (type) {
      case 'course-complete':
        return <Trophy className="w-16 h-16 text-yellow-500" />;
      case 'assessment-pass':
        return <Award className="w-16 h-16 text-green-500" />;
      case 'streak':
        return <Flame className="w-16 h-16 text-orange-500" />;
      case 'level-up':
        return <Crown className="w-16 h-16 text-purple-500" />;
      case 'achievement':
        return <Medal className="w-16 h-16 text-blue-500" />;
      case 'task':
      default:
        return <CheckCircle className="w-16 h-16 text-green-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'course-complete':
        return 'from-yellow-400 to-orange-500';
      case 'assessment-pass':
        return 'from-green-400 to-blue-500';
      case 'streak':
        return 'from-orange-400 to-red-500';
      case 'level-up':
        return 'from-purple-400 to-pink-500';
      case 'achievement':
        return 'from-blue-400 to-purple-500';
      case 'task':
      default:
        return 'from-green-400 to-blue-500';
    }
  };

  return (
    <>
      <Confetti show={confettiShow} onComplete={() => setConfettiShow(false)} />
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className={`bg-gradient-to-br ${getGradient()} rounded-2xl p-8 max-w-md w-full text-white text-center relative overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sparkle Effects */}
              <div className="absolute top-4 left-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 opacity-70" />
                </motion.div>
              </div>
              <div className="absolute top-4 right-4">
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-5 h-5 opacity-70" />
                </motion.div>
              </div>
              <div className="absolute bottom-4 left-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 opacity-70" />
                </motion.div>
              </div>
              <div className="absolute bottom-6 right-6">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                >
                  <Heart className="w-5 h-5 opacity-70" />
                </motion.div>
              </div>

              {/* Main Content */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="mb-6"
              >
                {getIcon()}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-4"
              >
                {title || 'Congratulations!'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg mb-6 opacity-90"
              >
                {message || 'You\'ve completed another milestone in your learning journey!'}
              </motion.p>

              {/* Achievements */}
              {achievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <h3 className="text-lg font-semibold mb-3">New Achievements</h3>
                  <div className="space-y-2">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="bg-white bg-opacity-20 rounded-lg p-3 flex items-center space-x-3"
                      >
                        <Award className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm opacity-80">{achievement.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Continue Learning
              </motion.button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Hook for triggering celebrations
export const useCelebration = () => {
  const [celebration, setCelebration] = useState({
    show: false,
    type: 'task',
    title: '',
    message: '',
    achievements: []
  });

  const celebrate = (config) => {
    setCelebration({
      show: true,
      type: config.type || 'task',
      title: config.title || 'Congratulations!',
      message: config.message || 'Great job!',
      achievements: config.achievements || []
    });
  };

  const closeCelebration = () => {
    setCelebration(prev => ({ ...prev, show: false }));
  };

  return {
    celebration,
    celebrate,
    closeCelebration
  };
};

// Pre-configured celebration triggers
export const celebrationTriggers = {
  taskComplete: (taskName) => ({
    type: 'task',
    title: 'Task Completed!',
    message: `You've successfully completed "${taskName}". Keep up the great work!`
  }),

  courseComplete: (courseName) => ({
    type: 'course-complete',
    title: 'Course Completed!',
    message: `Congratulations! You've finished "${courseName}". You're one step closer to mastering your goals!`,
    achievements: [
      { name: 'Course Finisher', description: 'Completed a full course' }
    ]
  }),

  assessmentPass: (score, courseName) => ({
    type: 'assessment-pass',
    title: 'Assessment Passed!',
    message: `Excellent! You scored ${score}% on the "${courseName}" assessment.`,
    achievements: score >= 90 ? [
      { name: 'High Achiever', description: 'Scored 90% or higher on an assessment' }
    ] : []
  }),

  learningStreak: (days) => ({
    type: 'streak',
    title: `${days}-Day Streak!`,
    message: `Amazing! You've been learning consistently for ${days} days straight!`,
    achievements: [
      { name: 'Consistent Learner', description: `Maintained a ${days}-day learning streak` }
    ]
  }),

  levelUp: (newLevel) => ({
    type: 'level-up',
    title: 'Level Up!',
    message: `You've reached Level ${newLevel}! Your dedication is paying off!`,
    achievements: [
      { name: `Level ${newLevel}`, description: 'Reached a new experience level' }
    ]
  }),

  firstCourse: () => ({
    type: 'achievement',
    title: 'Welcome to Learning!',
    message: 'You\'ve created your first course! This is the beginning of an amazing journey.',
    achievements: [
      { name: 'Getting Started', description: 'Created your first learning course' }
    ]
  })
};

// Main Celebration Component
const Celebration = ({ celebration, onClose }) => {
  return (
    <CelebrationModal
      show={celebration.show}
      type={celebration.type}
      title={celebration.title}
      message={celebration.message}
      achievements={celebration.achievements}
      onClose={onClose}
    />
  );
};

export default Celebration;