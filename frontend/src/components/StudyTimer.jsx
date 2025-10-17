import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Timer, Coffee, Target, TrendingUp,
  Settings, X, CheckCircle, Clock, BarChart3, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudyTimer = ({ user, token, onClose }) => {
  // Timer modes
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak', 'custom'
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer settings (in minutes)
  const [settings, setSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    notificationsEnabled: true
  });
  
  // Current timer state
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [totalTime, setTotalTime] = useState(settings.pomodoro * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  
  // Stats
  const [todayStats, setTodayStats] = useState({
    pomodorosCompleted: 0,
    totalStudyTime: 0,
    totalBreakTime: 0,
    longestStreak: 0
  });
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Load stats from backend
  useEffect(() => {
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-timer/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTodayStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 0) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    playNotificationSound();
    
    if (mode === 'pomodoro') {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Save pomodoro completion to backend
      await saveStudySession();
      
      toast.success('Pomodoro completed! Great work! 🎉', {
        duration: 5000,
        icon: '🍅'
      });
      
      // Decide next mode
      if (newCompletedPomodoros % settings.sessionsUntilLongBreak === 0) {
        switchMode('longBreak', settings.autoStartBreaks);
        toast('Time for a long break! Stretch and relax 😊', {
          icon: '☕',
          duration: 4000
        });
      } else {
        switchMode('shortBreak', settings.autoStartBreaks);
        toast('Time for a short break! 💫', {
          icon: '🧘',
          duration: 4000
        });
      }
    } else {
      // Break completed
      toast.success('Break finished! Ready to focus? 💪', {
        duration: 4000,
        icon: '🎯'
      });
      switchMode('pomodoro', settings.autoStartPomodoros);
    }
    
    fetchTodayStats();
  };

  const saveStudySession = async () => {
    try {
      await fetch(`http://localhost:5001/api/study-timer/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          duration: settings.pomodoro,
          mode: 'pomodoro',
          completedAt: new Date()
        })
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const switchMode = (newMode, autoStart = false) => {
    setMode(newMode);
    const duration = settings[newMode] * 60;
    setTimeLeft(duration);
    setTotalTime(duration);
    
    if (autoStart) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsActive(false);
      setIsPaused(false);
    }
  };

  const handlePlayPause = () => {
    if (isActive) {
      setIsPaused(!isPaused);
    } else {
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    const duration = settings[mode] * 60;
    setTimeLeft(duration);
    setTotalTime(duration);
  };

  const playNotificationSound = () => {
    if (settings.notificationsEnabled) {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'pomodoro':
        return {
          name: 'Focus Time',
          color: 'from-red-500 to-orange-500',
          bgColor: 'bg-red-50',
          icon: Target,
          emoji: '🍅'
        };
      case 'shortBreak':
        return {
          name: 'Short Break',
          color: 'from-green-500 to-teal-500',
          bgColor: 'bg-green-50',
          icon: Coffee,
          emoji: '☕'
        };
      case 'longBreak':
        return {
          name: 'Long Break',
          color: 'from-blue-500 to-purple-500',
          bgColor: 'bg-blue-50',
          icon: Coffee,
          emoji: '🧘'
        };
      default:
        return {
          name: 'Custom',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50',
          icon: Timer,
          emoji: '⏱️'
        };
    }
  };

  const config = getModeConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${config.bgColor} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.color} text-white p-6 flex items-center justify-between rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{config.name}</h2>
              <p className="text-sm opacity-90">
                Session {currentSession} • {completedPomodoros} completed today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Timer Display */}
        <div className="p-8">
          {/* Mode Selector */}
          <div className="flex gap-2 mb-8">
            {[
              { key: 'pomodoro', label: 'Focus', emoji: '🍅' },
              { key: 'shortBreak', label: 'Short Break', emoji: '☕' },
              { key: 'longBreak', label: 'Long Break', emoji: '🧘' }
            ].map((modeBtn) => (
              <button
                key={modeBtn.key}
                onClick={() => switchMode(modeBtn.key)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === modeBtn.key
                    ? 'bg-white shadow-md scale-105'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              >
                <span className="mr-2">{modeBtn.emoji}</span>
                {modeBtn.label}
              </button>
            ))}
          </div>

          {/* Circular Timer */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgressPercentage() / 100)}`}
                  className={`bg-gradient-to-r ${config.color} text-blue-600 transition-all duration-1000`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-gray-900">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  {isActive && !isPaused ? 'In Progress' : isPaused ? 'Paused' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handlePlayPause}
              className={`p-4 rounded-full bg-gradient-to-r ${config.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
            >
              {isActive && !isPaused ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-4 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-4 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <Settings className="w-8 h-8" />
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-4 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <BarChart3 className="w-8 h-8" />
            </button>
          </div>

          {/* Today's Stats Quick View */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {todayStats.pomodorosCompleted}
              </div>
              <div className="text-xs text-gray-600 mt-1">Pomodoros</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.floor(todayStats.totalStudyTime / 60)}m
              </div>
              <div className="text-xs text-gray-600 mt-1">Study Time</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {todayStats.longestStreak}
              </div>
              <div className="text-xs text-gray-600 mt-1">Streak</div>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white rounded-lg p-6 mb-4 overflow-hidden"
              >
                <h3 className="font-semibold text-lg mb-4">Timer Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pomodoro Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.pomodoro}
                      onChange={(e) => setSettings({...settings, pomodoro: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Break (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.shortBreak}
                      onChange={(e) => setSettings({...settings, shortBreak: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Long Break (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.longBreak}
                      onChange={(e) => setSettings({...settings, longBreak: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-start Breaks
                    </span>
                    <button
                      onClick={() => setSettings({...settings, autoStartBreaks: !settings.autoStartBreaks})}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        settings.autoStartBreaks
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {settings.autoStartBreaks ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Sound Notifications
                    </span>
                    <button
                      onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        settings.notificationsEnabled
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {settings.notificationsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white rounded-lg p-6 overflow-hidden"
              >
                <h3 className="font-semibold text-lg mb-4">Today's Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium">Completed Pomodoros</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {todayStats.pomodorosCompleted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium">Total Study Time</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {Math.floor(todayStats.totalStudyTime / 60)}m
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium">Current Streak</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {todayStats.longestStreak} days
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default StudyTimer;
