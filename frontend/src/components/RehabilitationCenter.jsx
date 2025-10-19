import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Brain, Shield, Target, TrendingUp, Calendar, MessageCircle,
  Plus, CheckCircle, AlertTriangle, Phone, Clock, Award, Flame,
  Activity, Smile, Frown, Meh, User, Users, Book, Lightbulb,
  X, Send, BarChart3, ThumbsUp, Star, Zap, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const RehabilitationCenter = ({ user, token }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAISupportModal, setShowAISupportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // AI Chat state
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramStats(selectedProgram._id);
    }
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/rehab/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPrograms(data.programs);
        if (data.programs.length > 0 && !selectedProgram) {
          setSelectedProgram(data.programs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramStats = async (programId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/rehab/programs/${programId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createProgram = async (programData) => {
    try {
      const response = await fetch('http://localhost:5001/api/rehab/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(programData)
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Recovery program created successfully!');
        setPrograms([data.program, ...programs]);
        setSelectedProgram(data.program);
        setShowCreateModal(false);
      } else {
        toast.error(data.message || 'Failed to create program');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Network error');
    }
  };

  const submitCheckIn = async (checkInData) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/rehab/programs/${selectedProgram._id}/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(checkInData)
        }
      );
      
      const data = await response.json();
      if (data.success) {
        toast.success('Check-in recorded!');
        setSelectedProgram(data.program);
        setShowCheckInModal(false);
        
        // Show milestone celebrations
        if (data.newMilestones && data.newMilestones.length > 0) {
          data.newMilestones.forEach(milestone => {
            toast.success(
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-bold">{milestone.milestone}</p>
                  <p className="text-sm">{milestone.celebrationMessage}</p>
                </div>
              </div>,
              { duration: 5000 }
            );
          });
        }
        
        fetchPrograms();
        fetchProgramStats(selectedProgram._id);
      } else {
        toast.error(data.message || 'Failed to record check-in');
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
      toast.error('Network error');
    }
  };

  const getAISupport = async (message, context = 'chat') => {
    setAiLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/rehab/programs/${selectedProgram._id}/ai-support`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message, context })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setAiMessages([
          ...aiMessages,
          { role: 'user', content: message },
          { role: 'assistant', content: data.response }
        ]);
        setAiInput('');
      } else {
        toast.error('Failed to get AI support');
      }
    } catch (error) {
      console.error('Error getting AI support:', error);
      toast.error('Network error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Rehabilitation Center
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Your journey to recovery and wellness</p>
              </div>
            </div>
            
            {programs.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>New Program</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {programs.length === 0 ? (
          <WelcomeScreen onCreateProgram={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Program Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Programs</h2>
                <div className="space-y-2">
                  {programs.map((program) => (
                    <button
                      key={program._id}
                      onClick={() => setSelectedProgram(program)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedProgram?._id === program._id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide opacity-75">
                          {program.addictionType.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedProgram?._id === program._id
                            ? 'bg-white/20'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {program.status}
                        </span>
                      </div>
                      <p className="font-semibold">{program.specificAddiction || 'General'}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Flame className="w-4 h-4" />
                        <span>{program.currentStreak} days</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Daily Check-in</p>
                      <p className="text-xs text-green-700">Track your progress</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowAISupportModal(true)}
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left"
                  >
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-300">AI Support</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">Get guidance</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => toast.info('Crisis support: Call 988')}
                    className="w-full flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-left"
                  >
                    <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-300">Crisis Hotline</p>
                      <p className="text-xs text-red-700 dark:text-red-400">988 - Available 24/7</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {selectedProgram && (
                <>
                  {/* Progress Overview */}
                  <ProgressOverview program={selectedProgram} stats={stats} />
                  
                  {/* Recovery Plan */}
                  <RecoveryPlan program={selectedProgram} token={token} onUpdate={fetchPrograms} />
                  
                  {/* Recent Activity */}
                  <RecentActivity program={selectedProgram} />
                  
                  {/* Milestones */}
                  <Milestones program={selectedProgram} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProgramModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createProgram}
          />
        )}
        
        {showCheckInModal && selectedProgram && (
          <CheckInModal
            onClose={() => setShowCheckInModal(false)}
            onSubmit={submitCheckIn}
          />
        )}
        
        {showAISupportModal && selectedProgram && (
          <AISupportModal
            onClose={() => setShowAISupportModal(false)}
            messages={aiMessages}
            input={aiInput}
            setInput={setAiInput}
            onSend={getAISupport}
            loading={aiLoading}
            program={selectedProgram}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen = ({ onCreateProgram }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center max-w-3xl mx-auto border dark:border-gray-700"
  >
    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Heart className="w-10 h-10 text-white" />
    </div>
    
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      Welcome to Your Recovery Journey
    </h2>
    
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
      This is a safe, supportive space designed to help you overcome addiction and build a healthier future. 
      Our AI-powered tools, evidence-based strategies, and compassionate support will guide you every step of the way.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border dark:border-blue-800/30">
        <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Support</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">24/7 guidance from our compassionate AI counselor</p>
      </div>
      
      <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border dark:border-purple-800/30">
        <Target className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized Plan</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Custom recovery roadmap tailored to your needs</p>
      </div>
      
      <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border dark:border-pink-800/30">
        <Shield className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Complete Privacy</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Your journey is confidential and secure</p>
      </div>
    </div>
    
    <button
      onClick={onCreateProgram}
      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all flex items-center gap-3 mx-auto"
    >
      <Plus className="w-6 h-6" />
      <span>Start Your Recovery Journey</span>
    </button>
    
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
      Crisis? Call <strong>988</strong> for immediate support (24/7)
    </p>
  </motion.div>
);

// Progress Overview Component
const ProgressOverview = ({ program, stats }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-700">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Progress Overview</h2>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
        <Flame className="w-6 h-6 mb-2" />
        <p className="text-2xl font-bold">{program.currentStreak}</p>
        <p className="text-sm opacity-90">Day Streak</p>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
        <CheckCircle className="w-6 h-6 mb-2" />
        <p className="text-2xl font-bold">{program.soberDays}</p>
        <p className="text-sm opacity-90">Sober Days</p>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
        <Award className="w-6 h-6 mb-2" />
        <p className="text-2xl font-bold">{program.milestones.length}</p>
        <p className="text-sm opacity-90">Milestones</p>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
        <TrendingUp className="w-6 h-6 mb-2" />
        <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
        <p className="text-sm opacity-90">Success Rate</p>
      </div>
    </div>
  </div>
);

// Recovery Plan Component (continued in next message due to length)
const RecoveryPlan = ({ program, token, onUpdate }) => {
  const [expandedPhase, setExpandedPhase] = useState(0);

  const completePhase = async (phaseIndex) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/rehab/programs/${program._id}/phase/${phaseIndex}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        toast.success('Phase completed! 🎉');
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update phase');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recovery Plan</h2>
      
      <div className="space-y-3">
        {program.recoveryPlan.phases.map((phase, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg overflow-hidden transition-all ${
              phase.completed ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <button
              onClick={() => setExpandedPhase(expandedPhase === index ? -1 : index)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  phase.completed ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {phase.completed ? <CheckCircle className="w-5 h-5" /> : phase.phase}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{phase.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{phase.duration}</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedPhase === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedPhase === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Goals
                      </h4>
                      <ul className="space-y-1">
                        {phase.goals.map((goal, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        Strategies
                      </h4>
                      <ul className="space-y-1">
                        {phase.strategies.map((strategy, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {!phase.completed && (
                      <button
                        onClick={() => completePhase(index)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Phase Complete</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ program }) => {
  const recentEntries = program.dailyEntries.slice(-7).reverse();
  
  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'excellent': return <Smile className="w-5 h-5 text-green-600" />;
      case 'good': return <Smile className="w-5 h-5 text-blue-600" />;
      case 'neutral': return <Meh className="w-5 h-5 text-gray-600" />;
      case 'poor': return <Frown className="w-5 h-5 text-orange-600" />;
      case 'very_poor': return <Frown className="w-5 h-5 text-red-600" />;
      default: return <Meh className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Check-ins</h2>
      
      {recentEntries.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No check-ins yet. Start your first one!</p>
      ) : (
        <div className="space-y-3">
          {recentEntries.map((entry, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMoodIcon(entry.mood)}
                  <span className="font-medium capitalize text-gray-900 dark:text-white">{entry.mood.replace('_', ' ')}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
              
              {entry.cravingLevel !== undefined && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="w-4 h-4" />
                    <span>Craving Level: {entry.cravingLevel}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                      style={{ width: `${(entry.cravingLevel / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {entry.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">&quot;{entry.notes}&quot;</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Milestones Component
const Milestones = ({ program }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Award className="w-6 h-6 text-yellow-500" />
      Milestones Achieved
    </h2>
    
    {program.milestones.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">Keep going! Your first milestone is coming soon.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {program.milestones.map((milestone, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700"
          >
            <div className="flex items-start gap-3">
              <Star className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{milestone.milestone}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.celebrationMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {new Date(milestone.achievedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

// Create Program Modal (truncated - continued in next file)
const CreateProgramModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    addictionType: 'social_media',
    specificAddiction: '',
    severity: 'moderate',
    primaryGoal: '',
    secondaryGoals: [],
    targetCompletionDate: ''
  });

  const addictionTypes = [
    { value: 'social_media', label: 'Social Media' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'internet', label: 'Internet' },
    { value: 'smartphone', label: 'Smartphone' },
    { value: 'video_streaming', label: 'Video Streaming' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'gambling', label: 'Gambling' },
    { value: 'substance', label: 'Substance' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Start Recovery Program</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Addiction Type
            </label>
            <select
              value={formData.addictionType}
              onChange={(e) => setFormData({ ...formData, addictionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {addictionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Specific Addiction (e.g., Instagram, Call of Duty)
            </label>
            <input
              type="text"
              value={formData.specificAddiction}
              onChange={(e) => setFormData({ ...formData, specificAddiction: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['mild', 'moderate', 'severe'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: level })}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    formData.severity === level
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Goal
            </label>
            <textarea
              value={formData.primaryGoal}
              onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="What do you want to achieve through this recovery program?"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Completion Date (Optional)
            </label>
            <input
              type="date"
              value={formData.targetCompletionDate}
              onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Create Program
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Check-in Modal
const CheckInModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    mood: 'neutral',
    cravingLevel: 5,
    triggers: '',
    copingStrategies: '',
    notes: '',
    successfulResistance: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      triggers: formData.triggers.split(',').map(t => t.trim()).filter(Boolean),
      copingStrategies: formData.copingStrategies.split(',').map(c => c.trim()).filter(Boolean)
    });
  };

  const moods = [
    { value: 'very_poor', label: 'Very Poor', icon: Frown, color: 'text-red-600' },
    { value: 'poor', label: 'Poor', icon: Frown, color: 'text-orange-600' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-600' },
    { value: 'good', label: 'Good', icon: Smile, color: 'text-blue-600' },
    { value: 'excellent', label: 'Excellent', icon: Smile, color: 'text-green-600' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Check-in</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How are you feeling today?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map(mood => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.mood === mood.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto ${mood.color}`} />
                    <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">{mood.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Craving Level (0-10)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={formData.cravingLevel}
              onChange={(e) => setFormData({ ...formData, cravingLevel: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>None</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{formData.cravingLevel}</span>
              <span>Intense</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Triggers Today (comma-separated)
            </label>
            <input
              type="text"
              value={formData.triggers}
              onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., stress, boredom, social pressure"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coping Strategies Used (comma-separated)
            </label>
            <input
              type="text"
              value={formData.copingStrategies}
              onChange={(e) => setFormData({ ...formData, copingStrategies: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., exercise, meditation, called friend"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any additional thoughts or reflections..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="successfulResistance"
              checked={formData.successfulResistance}
              onChange={(e) => setFormData({ ...formData, successfulResistance: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="successfulResistance" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              I successfully resisted my addiction today
            </label>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Submit Check-in
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// AI Support Modal
const AISupportModal = ({ onClose, messages, input, setInput, onSend, loading, program }) => {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input);
    }
  };

  const quickMessages = [
    "I'm feeling overwhelmed right now",
    "How can I resist cravings?",
    "I need motivation to continue",
    "What should I do when triggered?"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col border dark:border-gray-700"
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Support Counselor</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Here to help 24/7</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="mb-4">I'm here to support you on your recovery journey.</p>
              <p className="text-sm mb-4">Quick responses:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickMessages.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(msg);
                      onSend(msg);
                    }}
                    className="p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setInput("I'm in crisis and need immediate help");
              onSend("I'm in crisis and need immediate help", 'crisis');
            }}
            className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Crisis Support
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default RehabilitationCenter;
