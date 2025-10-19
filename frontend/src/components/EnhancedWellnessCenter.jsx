import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,
  Flame,
  Smile,
  Frown,
  Meh,
  Sun,
  Moon,
  Coffee,
  Zap,
  CheckCircle,
  Plus,
  BarChart3,
  Book,
  Music,
  Wind,
  Droplet,
  Eye,
  EyeOff,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles,
  Shield,
  MessageCircle,
  PhoneCall,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedWellnessCenter = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [moodHistory, setMoodHistory] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const [meditationTimer, setMeditationTimer] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);

  // Mock wellness data
  const [wellnessStats, setWellnessStats] = useState({
    currentStreak: 7,
    totalMeditations: 45,
    totalMinutes: 320,
    moodScore: 8.2,
    stressLevel: 'low',
    sleepQuality: 'good',
    weeklyGoal: 5,
    completedSessions: 3
  });

  const [upcomingActivities, setUpcomingActivities] = useState([
    {
      id: 1,
      title: 'Morning Meditation',
      time: '08:00 AM',
      duration: 15,
      type: 'meditation',
      icon: Brain,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 2,
      title: 'Breathing Exercise',
      time: '12:00 PM',
      duration: 5,
      type: 'breathing',
      icon: Wind,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      title: 'Evening Reflection',
      time: '06:00 PM',
      duration: 10,
      type: 'journaling',
      icon: Book,
      color: 'from-orange-500 to-red-500'
    }
  ]);

  const [quickExercises, setQuickExercises] = useState([
    {
      id: 1,
      title: '4-7-8 Breathing',
      description: 'Calm your nervous system in minutes',
      duration: 5,
      icon: Wind,
      color: 'from-blue-500 to-cyan-500',
      steps: ['Breathe in for 4 seconds', 'Hold for 7 seconds', 'Exhale for 8 seconds', 'Repeat 4 times']
    },
    {
      id: 2,
      title: 'Body Scan',
      description: 'Release tension and relax',
      duration: 10,
      icon: Activity,
      color: 'from-green-500 to-teal-500',
      steps: ['Lie down comfortably', 'Focus on each body part', 'Notice any tension', 'Breathe and release']
    },
    {
      id: 3,
      title: 'Gratitude Practice',
      description: 'Cultivate positive emotions',
      duration: 5,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      steps: ['Think of 3 things you\'re grateful for', 'Feel the appreciation', 'Write them down', 'Smile']
    },
    {
      id: 4,
      title: 'Progressive Relaxation',
      description: 'Reduce physical tension',
      duration: 15,
      icon: Droplet,
      color: 'from-purple-500 to-indigo-500',
      steps: ['Tense muscle group', 'Hold for 5 seconds', 'Release slowly', 'Move to next group']
    }
  ]);

  const [moodOptions, setMoodOptions] = useState([
    { emoji: '😄', label: 'Great', value: 5, color: 'from-green-500 to-emerald-500' },
    { emoji: '😊', label: 'Good', value: 4, color: 'from-blue-500 to-cyan-500' },
    { emoji: '😐', label: 'Okay', value: 3, color: 'from-yellow-500 to-orange-500' },
    { emoji: '😟', label: 'Not Great', value: 2, color: 'from-orange-500 to-red-500' },
    { emoji: '😢', label: 'Difficult', value: 1, color: 'from-red-500 to-pink-500' }
  ]);

  const [resources, setResources] = useState([
    {
      id: 1,
      title: 'Dealing with Study Stress',
      description: 'Evidence-based techniques for managing academic pressure',
      category: 'Article',
      readTime: 8,
      icon: Book,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Sleep Hygiene for Students',
      description: 'Improve your sleep quality and wake up refreshed',
      category: 'Guide',
      readTime: 12,
      icon: Moon,
      color: 'purple'
    },
    {
      id: 3,
      title: 'Mindful Study Sessions',
      description: 'Combine mindfulness with learning for better retention',
      category: 'Video',
      readTime: 15,
      icon: PlayCircle,
      color: 'green'
    }
  ]);

  // Breathing exercise timer
  useEffect(() => {
    if (breathingActive) {
      const phases = {
        inhale: { duration: 4000, next: 'hold' },
        hold: { duration: 7000, next: 'exhale' },
        exhale: { duration: 8000, next: 'inhale' }
      };

      const timer = setTimeout(() => {
        const currentPhase = phases[breathingPhase];
        setBreathingPhase(currentPhase.next);
        if (currentPhase.next === 'inhale') {
          setBreathingCount(prev => prev + 1);
          if (breathingCount >= 3) {
            setBreathingActive(false);
            setBreathingCount(0);
            toast.success('Great job! Breathing exercise completed! 🎉');
          }
        }
      }, phases[breathingPhase].duration);

      return () => clearTimeout(timer);
    }
  }, [breathingActive, breathingPhase, breathingCount]);

  // Meditation timer
  useEffect(() => {
    let interval;
    if (isMeditating) {
      interval = setInterval(() => {
        setMeditationTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMeditating]);

  const handleMoodSelect = (mood) => {
    setTodayMood(mood);
    setMoodHistory([
      ...moodHistory,
      { date: new Date().toISOString(), mood: mood.value, label: mood.label }
    ]);
    setShowMoodTracker(false);
    toast.success(`Mood tracked: ${mood.label}`);
  };

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase('inhale');
    setBreathingCount(0);
    toast.success('Starting 4-7-8 breathing exercise...');
  };

  const startMeditation = () => {
    setIsMeditating(true);
    setMeditationTimer(0);
    toast.success('Meditation session started');
  };

  const stopMeditation = () => {
    setIsMeditating(false);
    const minutes = Math.floor(meditationTimer / 60);
    toast.success(`Great session! Meditated for ${minutes} minutes`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <Heart className="w-10 h-10" />
              <span>Wellness Center</span>
            </h1>
            <p className="text-pink-100 text-lg">
              Your mental health and wellbeing companion
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMoodTracker(true)}
              className="px-6 py-3 bg-white text-pink-600 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
            >
              <Smile className="w-5 h-5" />
              <span>Track Mood</span>
            </button>
          </div>
        </div>

        {/* Wellness Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-6 h-6 text-orange-300" />
            </div>
            <p className="text-2xl font-bold">{wellnessStats.currentStreak}</p>
            <p className="text-sm text-pink-100">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Brain className="w-6 h-6 text-purple-300" />
            </div>
            <p className="text-2xl font-bold">{wellnessStats.totalMeditations}</p>
            <p className="text-sm text-pink-100">Sessions</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-6 h-6 text-blue-300" />
            </div>
            <p className="text-2xl font-bold">{wellnessStats.totalMinutes}</p>
            <p className="text-sm text-pink-100">Minutes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Heart className="w-6 h-6 text-pink-300" />
            </div>
            <p className="text-2xl font-bold">{wellnessStats.moodScore}/10</p>
            <p className="text-sm text-pink-100">Avg Mood</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-6 h-6 text-green-300" />
            </div>
            <p className="text-2xl font-bold">{wellnessStats.completedSessions}/{wellnessStats.weeklyGoal}</p>
            <p className="text-sm text-pink-100">Weekly Goal</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {['dashboard', 'exercises', 'mood', 'resources'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Activities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Breathing Exercise Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Guided Breathing</h2>
                  <p className="text-gray-600">4-7-8 technique for instant calm</p>
                </div>
                <Wind className="w-12 h-12 text-blue-600" />
              </div>

              {breathingActive ? (
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: breathingPhase === 'inhale' ? 1.3 : breathingPhase === 'exhale' ? 0.7 : 1,
                    }}
                    transition={{ duration: breathingPhase === 'inhale' ? 4 : breathingPhase === 'hold' ? 0 : 8 }}
                    className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <Wind className="w-16 h-16 text-white" />
                  </motion.div>
                  <p className="text-3xl font-bold text-gray-900 capitalize mb-2">{breathingPhase}</p>
                  <p className="text-gray-600">Round {breathingCount + 1} of 4</p>
                  <button
                    onClick={() => setBreathingActive(false)}
                    className="mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={startBreathing}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center space-x-3 mx-auto"
                  >
                    <PlayCircle className="w-6 h-6" />
                    <span>Start Exercise</span>
                  </button>
                  <p className="mt-4 text-sm text-gray-600">
                    Perfect for reducing anxiety and improving focus
                  </p>
                </div>
              )}
            </div>

            {/* Meditation Timer */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Meditation Timer</h2>
                  <p className="text-gray-600">Find your inner peace</p>
                </div>
                <Brain className="w-12 h-12 text-purple-600" />
              </div>

              <div className="text-center">
                <div className="text-6xl font-bold text-gray-900 mb-6">
                  {formatTime(meditationTimer)}
                </div>
                <div className="flex items-center justify-center space-x-4">
                  {!isMeditating ? (
                    <button
                      onClick={startMeditation}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center space-x-3"
                    >
                      <PlayCircle className="w-6 h-6" />
                      <span>Start Meditation</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={stopMeditation}
                        className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center space-x-3"
                      >
                        <PauseCircle className="w-6 h-6" />
                        <span>End Session</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Activities */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
              <div className="space-y-3">
                {upcomingActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${activity.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{activity.title}</h3>
                          <p className="text-sm text-gray-600">{activity.duration} minutes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{activity.time}</p>
                        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                          Start now →
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Mood */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Mood</h3>
              {todayMood ? (
                <div className="text-center">
                  <div className="text-6xl mb-3">{todayMood.emoji}</div>
                  <p className="text-xl font-bold text-gray-900">{todayMood.label}</p>
                  <p className="text-sm text-gray-600 mt-2">Keep up the great work!</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowMoodTracker(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Track Your Mood
                </button>
              )}
            </div>

            {/* Wellness Tips */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-900">Daily Tip</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Take a 5-minute break every hour to stretch and rest your eyes. Your mind and body will thank you! 🌟
              </p>
            </div>

            {/* Emergency Support */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">Need Support?</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">
                If you're experiencing a crisis, please reach out:
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                  <PhoneCall className="w-5 h-5" />
                  <span>Crisis Hotline</span>
                </button>
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat Support</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickExercises.map((exercise, index) => {
            const Icon = exercise.icon;
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className={`bg-gradient-to-r ${exercise.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-12 h-12" />
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {exercise.duration} min
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{exercise.title}</h3>
                  <p className="text-white/90">{exercise.description}</p>
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-gray-900 mb-3">Steps:</h4>
                  <ol className="space-y-2 mb-6">
                    {exercise.steps.map((step, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <button className={`w-full px-6 py-3 bg-gradient-to-r ${exercise.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}>
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Exercise</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-cyan-500',
              purple: 'from-purple-500 to-indigo-500',
              green: 'from-green-500 to-teal-500'
            };
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[resource.color]} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {resource.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{resource.readTime} min read</span>
                  <button className="text-purple-600 font-semibold hover:text-purple-700">
                    Read more →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Mood Tracker Modal */}
      <AnimatePresence>
        {showMoodTracker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowMoodTracker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How are you feeling?</h2>
              <p className="text-gray-600 mb-6">Select your current mood</p>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className={`flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                      todayMood?.value === mood.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-4xl">{mood.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowMoodTracker(false)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedWellnessCenter;
