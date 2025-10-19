import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  CheckCircle,
  Settings,
  X,
  TrendingUp
} from 'lucide-react';

const TaskPomodoroTimer = ({ task, onComplete, onUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [currentSession, setCurrentSession] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`pomodoro_${task._id}`);
    if (savedProgress) {
      const data = JSON.parse(savedProgress);
      setSessionsCompleted(data.sessionsCompleted || 0);
      setTotalFocusTime(data.totalFocusTime || 0);
    }

    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Create audio element for completion sound
    audioRef.current = new Audio();
  }, [task._id]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Save progress periodically
  useEffect(() => {
    if (currentSession === 'focus' && isRunning) {
      const saveInterval = setInterval(() => {
        const progress = {
          sessionsCompleted,
          totalFocusTime: totalFocusTime + 1
        };
        localStorage.setItem(`pomodoro_${task._id}`, JSON.stringify(progress));
      }, 60000); // Save every minute

      return () => clearInterval(saveInterval);
    }
  }, [isRunning, currentSession, sessionsCompleted, totalFocusTime, task._id]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    if (currentSession === 'focus') {
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);
      setTotalFocusTime(prev => prev + settings.focusDuration);

      // Save progress
      const progress = {
        sessionsCompleted: newSessionCount,
        totalFocusTime: totalFocusTime + settings.focusDuration
      };
      localStorage.setItem(`pomodoro_${task._id}`, JSON.stringify(progress));

      // Notify parent component
      onUpdate?.({
        pomodoroSessions: newSessionCount,
        focusTime: totalFocusTime + settings.focusDuration
      });

      // Check if long break is due
      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        startSession('longBreak');
      } else {
        startSession('shortBreak');
      }
    } else {
      // Break completed, back to focus
      if (settings.autoStartFocus) {
        startSession('focus');
      } else {
        setCurrentSession('focus');
        setTimeLeft(settings.focusDuration * 60);
      }
    }
  };

  const startSession = (sessionType) => {
    setCurrentSession(sessionType);
    
    let duration;
    switch (sessionType) {
      case 'focus':
        duration = settings.focusDuration;
        break;
      case 'shortBreak':
        duration = settings.shortBreakDuration;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration;
        break;
      default:
        duration = settings.focusDuration;
    }
    
    setTimeLeft(duration * 60);
    
    if ((sessionType !== 'focus' && settings.autoStartBreaks) ||
        (sessionType === 'focus' && settings.autoStartFocus)) {
      setIsRunning(true);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = currentSession === 'focus' ? settings.focusDuration :
                     currentSession === 'shortBreak' ? settings.shortBreakDuration :
                     settings.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalDuration = (currentSession === 'focus' ? settings.focusDuration :
                          currentSession === 'shortBreak' ? settings.shortBreakDuration :
                          settings.longBreakDuration) * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const sessionConfig = {
    focus: {
      label: 'Focus Time',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    shortBreak: {
      label: 'Short Break',
      icon: Coffee,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    longBreak: {
      label: 'Long Break',
      icon: Coffee,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  };

  const config = sessionConfig[currentSession];
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Compact Timer Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${config.bgColor} rounded-lg p-3 border border-gray-200`}
      >
        <div className="flex items-center justify-between space-x-3">
          {/* Session Info */}
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.color}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{config.label}</p>
              <p className={`text-lg font-bold ${config.textColor}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTimer}
              className={`p-2 rounded-lg ${config.textColor} hover:bg-white/50 transition-colors`}
              title={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={resetTimer}
              className={`p-2 rounded-lg ${config.textColor} hover:bg-white/50 transition-colors`}
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg ${config.textColor} hover:bg-white/50 transition-colors`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${config.color}`}
            style={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>{sessionsCompleted} sessions</span>
          </span>
          <span className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{Math.round(totalFocusTime / 60)}h {totalFocusTime % 60}m focus</span>
          </span>
        </div>

        {/* Session Type Switcher */}
        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={() => startSession('focus')}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentSession === 'focus'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => startSession('shortBreak')}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentSession === 'shortBreak'
                ? 'bg-white shadow-sm text-green-600'
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            Break
          </button>
          <button
            onClick={() => startSession('longBreak')}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentSession === 'longBreak'
                ? 'bg-white shadow-sm text-purple-600'
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            Long Break
          </button>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Pomodoro Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Focus Duration (min)</label>
                <input
                  type="number"
                  value={settings.focusDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, focusDuration: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Short Break (min)</label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Long Break (min)</label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-medium text-gray-700">Auto-start breaks</label>
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-medium text-gray-700">Auto-start focus</label>
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoStartFocus: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
                  setShowSettings(false);
                }}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskPomodoroTimer;
