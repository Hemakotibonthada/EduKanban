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
  Shield,
  Users,
  BookOpen,
  CheckCircle,
  Plus,
  BarChart3,
  MessageCircle,
  PhoneCall,
  AlertCircle,
  Zap,
  Coffee,
  Moon,
  Sun,
  Wind,
  Droplet,
  Eye,
  PlayCircle,
  Settings,
  Edit,
  Trash2,
  TrendingDown,
  ArrowRight,
  Star,
  Lock,
  Unlock,
  FileText,
  Video,
  Headphones,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedRehabilitationCenter = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('programs');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [myPrograms, setMyPrograms] = useState([]);

  // Mock rehabilitation programs
  const [rehabilitationPrograms, setRehabilitationPrograms] = useState([
    {
      id: 1,
      title: 'Screen Time Detox',
      category: 'Digital Wellness',
      description: 'Reduce excessive screen time and develop healthier digital habits',
      duration: '30 days',
      difficulty: 'Medium',
      participants: 234,
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
      progress: 65,
      enrolled: true,
      currentDay: 19,
      totalDays: 30,
      streak: 5,
      goals: [
        { id: 1, title: 'Limit social media to 30 min/day', completed: true },
        { id: 2, title: 'No screens 1 hour before bed', completed: true },
        { id: 3, title: 'Take 5-minute breaks every hour', completed: false },
        { id: 4, title: 'Practice mindful scrolling', completed: false }
      ],
      checkIns: [
        { date: '2025-10-19', mood: 4, screenTime: 3.5, notes: 'Feeling better!' },
        { date: '2025-10-18', mood: 3, screenTime: 4.2, notes: 'Made progress' },
        { date: '2025-10-17', mood: 3, screenTime: 5.1, notes: 'Challenging day' }
      ],
      resources: [
        { type: 'article', title: 'Digital Minimalism Guide', duration: '10 min read' },
        { type: 'video', title: 'Screen Time Awareness', duration: '15 min' },
        { type: 'podcast', title: 'Tech-Life Balance', duration: '30 min' }
      ]
    },
    {
      id: 2,
      title: 'Sleep Restoration',
      category: 'Sleep Health',
      description: 'Establish healthy sleep patterns and overcome insomnia',
      duration: '21 days',
      difficulty: 'Easy',
      participants: 456,
      icon: Moon,
      color: 'from-purple-500 to-indigo-500',
      progress: 0,
      enrolled: false,
      currentDay: 0,
      totalDays: 21,
      streak: 0,
      goals: [
        { id: 1, title: 'Consistent sleep schedule', completed: false },
        { id: 2, title: 'Create bedtime routine', completed: false },
        { id: 3, title: 'Optimize sleep environment', completed: false },
        { id: 4, title: 'Track sleep quality daily', completed: false }
      ],
      checkIns: [],
      resources: [
        { type: 'article', title: 'Sleep Hygiene Essentials', duration: '8 min read' },
        { type: 'video', title: 'Better Sleep Techniques', duration: '20 min' },
        { type: 'audio', title: 'Sleep Meditation', duration: '25 min' }
      ]
    },
    {
      id: 3,
      title: 'Stress Management',
      category: 'Mental Health',
      description: 'Learn effective techniques to manage and reduce chronic stress',
      duration: '45 days',
      difficulty: 'Medium',
      participants: 789,
      icon: Brain,
      color: 'from-green-500 to-teal-500',
      progress: 33,
      enrolled: true,
      currentDay: 15,
      totalDays: 45,
      streak: 3,
      goals: [
        { id: 1, title: 'Daily 10-min meditation', completed: true },
        { id: 2, title: 'Identify stress triggers', completed: true },
        { id: 3, title: 'Practice deep breathing', completed: false },
        { id: 4, title: 'Weekly stress journal', completed: false }
      ],
      checkIns: [
        { date: '2025-10-19', mood: 4, stressLevel: 3, notes: 'Better coping' },
        { date: '2025-10-18', mood: 3, stressLevel: 4, notes: 'Tough day' }
      ],
      resources: [
        { type: 'article', title: 'Stress Management 101', duration: '12 min read' },
        { type: 'video', title: 'Breathing Exercises', duration: '10 min' },
        { type: 'audio', title: 'Guided Relaxation', duration: '20 min' }
      ]
    },
    {
      id: 4,
      title: 'Social Anxiety Recovery',
      category: 'Social Wellness',
      description: 'Build confidence and overcome social anxiety step by step',
      duration: '60 days',
      difficulty: 'Hard',
      participants: 321,
      icon: Users,
      color: 'from-orange-500 to-red-500',
      progress: 0,
      enrolled: false,
      currentDay: 0,
      totalDays: 60,
      streak: 0,
      goals: [
        { id: 1, title: 'Practice small talk daily', completed: false },
        { id: 2, title: 'Attend social events weekly', completed: false },
        { id: 3, title: 'Join support group', completed: false },
        { id: 4, title: 'Challenge negative thoughts', completed: false }
      ],
      checkIns: [],
      resources: [
        { type: 'article', title: 'Understanding Social Anxiety', duration: '15 min read' },
        { type: 'video', title: 'Confidence Building', duration: '25 min' },
        { type: 'workbook', title: 'CBT Exercises', duration: '30 min' }
      ]
    },
    {
      id: 5,
      title: 'Physical Activity Routine',
      category: 'Physical Health',
      description: 'Establish and maintain a consistent exercise routine',
      duration: '30 days',
      difficulty: 'Easy',
      participants: 567,
      icon: Activity,
      color: 'from-pink-500 to-rose-500',
      progress: 0,
      enrolled: false,
      currentDay: 0,
      totalDays: 30,
      streak: 0,
      goals: [
        { id: 1, title: '30 min daily movement', completed: false },
        { id: 2, title: 'Stretch morning & evening', completed: false },
        { id: 3, title: 'Track workouts', completed: false },
        { id: 4, title: 'Stay hydrated', completed: false }
      ],
      checkIns: [],
      resources: [
        { type: 'article', title: 'Exercise for Mental Health', duration: '10 min read' },
        { type: 'video', title: 'Home Workout Basics', duration: '20 min' },
        { type: 'plan', title: '30-Day Fitness Plan', duration: 'Ongoing' }
      ]
    },
    {
      id: 6,
      title: 'Mindful Eating Recovery',
      category: 'Nutrition',
      description: 'Develop a healthy relationship with food and eating',
      duration: '90 days',
      difficulty: 'Medium',
      participants: 234,
      icon: Coffee,
      color: 'from-yellow-500 to-orange-500',
      progress: 0,
      enrolled: false,
      currentDay: 0,
      totalDays: 90,
      streak: 0,
      goals: [
        { id: 1, title: 'Practice mindful eating', completed: false },
        { id: 2, title: 'No emotional eating', completed: false },
        { id: 3, title: 'Regular meal schedule', completed: false },
        { id: 4, title: 'Food journal daily', completed: false }
      ],
      checkIns: [],
      resources: [
        { type: 'article', title: 'Mindful Eating Guide', duration: '12 min read' },
        { type: 'video', title: 'Nutrition Basics', duration: '18 min' },
        { type: 'workbook', title: 'Food & Mood Journal', duration: 'Daily' }
      ]
    }
  ]);

  const [newProgram, setNewProgram] = useState({
    title: '',
    category: 'Custom',
    description: '',
    duration: '30',
    goals: ['', '', '', '']
  });

  const categories = [
    { name: 'Digital Wellness', icon: Eye, color: 'blue' },
    { name: 'Sleep Health', icon: Moon, color: 'purple' },
    { name: 'Mental Health', icon: Brain, color: 'green' },
    { name: 'Social Wellness', icon: Users, color: 'orange' },
    { name: 'Physical Health', icon: Activity, color: 'pink' },
    { name: 'Nutrition', icon: Coffee, color: 'yellow' }
  ];

  const [checkInData, setCheckInData] = useState({
    mood: 3,
    energyLevel: 3,
    sleepQuality: 3,
    stressLevel: 3,
    notes: ''
  });

  const handleEnrollProgram = (program) => {
    setRehabilitationPrograms(programs =>
      programs.map(p =>
        p.id === program.id
          ? { ...p, enrolled: true, currentDay: 1, progress: 3 }
          : p
      )
    );
    toast.success(`Enrolled in ${program.title}!`);
  };

  const handleCreateProgram = () => {
    if (!newProgram.title || !newProgram.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const program = {
      id: rehabilitationPrograms.length + 1,
      ...newProgram,
      duration: `${newProgram.duration} days`,
      difficulty: 'Custom',
      participants: 1,
      icon: Target,
      color: 'from-indigo-500 to-purple-500',
      progress: 0,
      enrolled: true,
      currentDay: 1,
      totalDays: parseInt(newProgram.duration),
      streak: 0,
      goals: newProgram.goals.filter(g => g.trim()).map((g, i) => ({
        id: i + 1,
        title: g,
        completed: false
      })),
      checkIns: [],
      resources: []
    };

    setRehabilitationPrograms([program, ...rehabilitationPrograms]);
    setShowCreateProgram(false);
    setNewProgram({
      title: '',
      category: 'Custom',
      description: '',
      duration: '30',
      goals: ['', '', '', '']
    });
    toast.success('Custom program created!');
  };

  const handleCheckIn = () => {
    if (!selectedProgram) return;

    const checkIn = {
      date: new Date().toISOString().split('T')[0],
      ...checkInData
    };

    setRehabilitationPrograms(programs =>
      programs.map(p =>
        p.id === selectedProgram.id
          ? {
              ...p,
              checkIns: [checkIn, ...p.checkIns],
              streak: p.streak + 1,
              currentDay: p.currentDay + 1,
              progress: Math.min(100, ((p.currentDay + 1) / p.totalDays) * 100)
            }
          : p
      )
    );

    setShowCheckIn(false);
    setCheckInData({
      mood: 3,
      energyLevel: 3,
      sleepQuality: 3,
      stressLevel: 3,
      notes: ''
    });
    toast.success('Check-in recorded! Keep it up! 🎉');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'article': return BookOpen;
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'podcast': return Headphones;
      case 'workbook': return FileText;
      case 'plan': return Target;
      default: return BookOpen;
    }
  };

  const enrolledPrograms = rehabilitationPrograms.filter(p => p.enrolled);
  const availablePrograms = rehabilitationPrograms.filter(p => !p.enrolled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <Shield className="w-10 h-10" />
              <span>Rehabilitation Center</span>
            </h1>
            <p className="text-teal-100 text-lg">
              Structured programs for recovery and personal growth
            </p>
          </div>
          <button
            onClick={() => setShowCreateProgram(true)}
            className="px-6 py-3 bg-white text-teal-600 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Program</span>
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{enrolledPrograms.length}</p>
            <p className="text-sm text-teal-100">Active Programs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {enrolledPrograms.reduce((sum, p) => sum + p.streak, 0)}
            </p>
            <p className="text-sm text-teal-100">Total Streak Days</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {Math.round(enrolledPrograms.reduce((sum, p) => sum + p.progress, 0) / (enrolledPrograms.length || 1))}%
            </p>
            <p className="text-sm text-teal-100">Avg Progress</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {enrolledPrograms.reduce((sum, p) => sum + p.checkIns.length, 0)}
            </p>
            <p className="text-sm text-teal-100">Total Check-ins</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {['programs', 'my-programs', 'progress', 'resources'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePrograms.map((program, index) => {
            const Icon = program.icon;
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className={`bg-gradient-to-r ${program.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-12 h-12" />
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty)} text-white bg-white/20`}>
                      {program.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{program.title}</h3>
                  <p className="text-sm text-white/90 mb-2">{program.category}</p>
                  <p className="text-white/80 text-sm">{program.description}</p>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{program.participants} enrolled</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnrollProgram(program)}
                    className={`w-full px-6 py-3 bg-gradient-to-r ${program.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                  >
                    <Target className="w-5 h-5" />
                    <span>Enroll Now</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My Programs Tab */}
      {activeTab === 'my-programs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledPrograms.map((program, index) => {
            const Icon = program.icon;
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${program.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-10 h-10" />
                      <div>
                        <h3 className="text-xl font-bold">{program.title}</h3>
                        <p className="text-sm text-white/80">{program.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{program.currentDay}</p>
                      <p className="text-xs text-white/80">of {program.totalDays}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(program.progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${program.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                    <Flame className="w-5 h-5 text-orange-300" />
                    <span className="font-semibold">{program.streak} Day Streak</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Goals */}
                  <h4 className="font-bold text-gray-900 mb-3">Goals</h4>
                  <div className="space-y-2 mb-4">
                    {program.goals.map(goal => (
                      <div
                        key={goal.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          goal.completed ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        {goal.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <span className={`text-sm ${goal.completed ? 'text-green-900 line-through' : 'text-gray-700'}`}>
                          {goal.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowCheckIn(true);
                      }}
                      className={`flex-1 px-4 py-3 bg-gradient-to-r ${program.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Check In</span>
                    </button>
                    <button
                      onClick={() => setSelectedProgram(program)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
                    >
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && selectedProgram && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Check-in History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check-in History</h2>
              <div className="space-y-3">
                {selectedProgram.checkIns.map((checkIn, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {new Date(checkIn.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {checkIn.mood >= 4 ? '😊' : checkIn.mood >= 3 ? '😐' : '😟'}
                        </span>
                      </div>
                    </div>
                    {checkIn.notes && (
                      <p className="text-sm text-gray-600">{checkIn.notes}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="font-bold text-gray-900">{Math.round(selectedProgram.progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${selectedProgram.color}`}
                      style={{ width: `${selectedProgram.progress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-gray-900">{selectedProgram.streak} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-ins</p>
                  <p className="text-3xl font-bold text-gray-900">{selectedProgram.checkIns.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {enrolledPrograms.flatMap(program =>
            program.resources.map((resource, index) => {
              const ResourceIcon = getResourceIcon(resource.type);
              return (
                <motion.div
                  key={`${program.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <ResourceIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium capitalize">
                    {resource.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">From: {program.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{resource.duration}</span>
                    <button className="text-teal-600 font-semibold hover:text-teal-700 flex items-center space-x-1">
                      <span>Open</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create Program Modal */}
      <AnimatePresence>
        {showCreateProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateProgram(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 text-white">
                <h2 className="text-2xl font-bold">Create Custom Program</h2>
                <p className="text-teal-100">Design your personalized rehabilitation journey</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    value={newProgram.title}
                    onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                    placeholder="e.g., Morning Routine Builder"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newProgram.category}
                    onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Custom">Custom</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    placeholder="Describe your program goals..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                    min="7"
                    max="365"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goals (up to 4)
                  </label>
                  {newProgram.goals.map((goal, index) => (
                    <input
                      key={index}
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...newProgram.goals];
                        newGoals[index] = e.target.value;
                        setNewProgram({ ...newProgram, goals: newGoals });
                      }}
                      placeholder={`Goal ${index + 1}`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none mb-2"
                    />
                  ))}
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateProgram(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProgram}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Create Program
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckIn && selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCheckIn(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className={`bg-gradient-to-r ${selectedProgram.color} p-6 text-white`}>
                <h2 className="text-2xl font-bold">Daily Check-in</h2>
                <p className="text-white/80">Day {selectedProgram.currentDay} of {selectedProgram.totalDays}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How are you feeling? (1-5)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setCheckInData({ ...checkInData, mood: num })}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                          checkInData.mood === num
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Energy Level (1-5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={checkInData.energyLevel}
                    onChange={(e) => setCheckInData({ ...checkInData, energyLevel: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={checkInData.notes}
                    onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                    placeholder="How did today go?"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setShowCheckIn(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckIn}
                    className={`flex-1 px-6 py-3 bg-gradient-to-r ${selectedProgram.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
                  >
                    Submit
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

export default EnhancedRehabilitationCenter;
