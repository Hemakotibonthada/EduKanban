import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Users,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  Activity,
  Flame
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const LearningStatsComparison = ({ user, token }) => {
  const [stats, setStats] = useState({
    thisWeek: {
      studyTime: 0,
      coursesCompleted: 0,
      tasksCompleted: 0,
      xpEarned: 0
    },
    lastWeek: {
      studyTime: 0,
      coursesCompleted: 0,
      tasksCompleted: 0,
      xpEarned: 0
    },
    thisMonth: {
      studyTime: 0,
      modulesCompleted: 0,
      streak: 0
    },
    lastMonth: {
      studyTime: 0,
      modulesCompleted: 0,
      streak: 0
    },
    monthlyGoal: {
      target: 40, // hours
      current: 0
    },
    peerComparison: {
      yourRank: 0,
      totalUsers: 0,
      averageStudyTime: 0,
      optedIn: false
    },
    productivityHeatmap: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week' or 'month'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisonStats();
  }, []);

  const fetchComparisonStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user's activity logs and courses
      const [activityRes, coursesRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/activity/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => ({ data: {} }) })),
        fetch(`${API_BASE_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const activityData = await activityRes.json();
      const coursesData = await coursesRes.json();
      const tasksData = await tasksRes.json();

      // Calculate this week's stats
      const thisWeekStats = calculateWeekStats(activityData, coursesData, tasksData, 0);
      const lastWeekStats = calculateWeekStats(activityData, coursesData, tasksData, 1);

      // Calculate monthly stats
      const thisMonthStats = calculateMonthStats(activityData, coursesData, 0);
      const lastMonthStats = calculateMonthStats(activityData, coursesData, 1);

      // Generate productivity heatmap (last 12 weeks)
      const heatmap = generateProductivityHeatmap(activityData);

      setStats({
        thisWeek: thisWeekStats,
        lastWeek: lastWeekStats,
        thisMonth: thisMonthStats,
        lastMonth: lastMonthStats,
        monthlyGoal: {
          target: 40,
          current: thisMonthStats.studyTime
        },
        peerComparison: {
          yourRank: 12,
          totalUsers: 150,
          averageStudyTime: 8.5,
          optedIn: true
        },
        productivityHeatmap: heatmap
      });
    } catch (error) {
      console.error('Error fetching comparison stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeekStats = (activityData, coursesData, tasksData, weeksAgo) => {
    // Mock calculation for now - would use actual activity logs
    const baseValue = weeksAgo === 0 ? 1 : 0.85;
    return {
      studyTime: Math.round(12 * baseValue),
      coursesCompleted: Math.round(2 * baseValue),
      tasksCompleted: Math.round(15 * baseValue),
      xpEarned: Math.round(450 * baseValue)
    };
  };

  const calculateMonthStats = (activityData, coursesData, monthsAgo) => {
    const baseValue = monthsAgo === 0 ? 1 : 0.82;
    return {
      studyTime: Math.round(35 * baseValue),
      modulesCompleted: Math.round(8 * baseValue),
      streak: Math.round(12 * baseValue)
    };
  };

  const generateProductivityHeatmap = (activityData) => {
    // Generate last 12 weeks of data
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        days.push({
          date: new Date(Date.now() - (i * 7 + j) * 24 * 60 * 60 * 1000),
          value: Math.floor(Math.random() * 5) // 0-4 intensity
        });
      }
      weeks.push(days);
    }
    return weeks;
  };

  const calculateChange = (current, previous) => {
    if (previous === 0) return { value: 100, trend: 'up' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    };
  };

  const currentStats = selectedPeriod === 'week' ? stats.thisWeek : stats.thisMonth;
  const previousStats = selectedPeriod === 'week' ? stats.lastWeek : stats.lastMonth;

  const comparisonMetrics = selectedPeriod === 'week' ? [
    {
      label: 'Study Time',
      current: currentStats.studyTime,
      previous: previousStats.studyTime,
      unit: 'hrs',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Courses Completed',
      current: currentStats.coursesCompleted,
      previous: previousStats.coursesCompleted,
      unit: '',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Tasks Completed',
      current: currentStats.tasksCompleted,
      previous: previousStats.tasksCompleted,
      unit: '',
      icon: CheckCircle,
      color: 'from-green-500 to-teal-500'
    },
    {
      label: 'XP Earned',
      current: currentStats.xpEarned,
      previous: previousStats.xpEarned,
      unit: 'XP',
      icon: Award,
      color: 'from-yellow-500 to-orange-500'
    }
  ] : [
    {
      label: 'Study Time',
      current: currentStats.studyTime,
      previous: previousStats.studyTime,
      unit: 'hrs',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Modules Completed',
      current: currentStats.modulesCompleted,
      previous: previousStats.modulesCompleted,
      unit: '',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Study Streak',
      current: currentStats.streak,
      previous: previousStats.streak,
      unit: 'days',
      icon: Flame,
      color: 'from-orange-500 to-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Learning Progress</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Compare your progress over time
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {comparisonMetrics.map((metric, index) => {
            const change = calculateChange(metric.current, metric.previous);
            const Icon = metric.icon;
            const TrendIcon = change.trend === 'up' ? TrendingUp : change.trend === 'down' ? TrendingDown : Minus;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all hover:shadow-md">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Current Value */}
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.current}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                        {metric.unit}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                  </div>

                  {/* Change Indicator */}
                  <div className={`flex items-center space-x-1 text-xs font-medium ${
                    change.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    change.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{change.value}%</span>
                    <span className="text-gray-400 dark:text-gray-500">
                      vs last {selectedPeriod}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Monthly Goal Progress */}
        {selectedPeriod === 'month' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-5 mb-6 border border-blue-100 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Goal</h3>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {stats.monthlyGoal.current} / {stats.monthlyGoal.target} hours
              </div>
            </div>
            
            <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.monthlyGoal.current / stats.monthlyGoal.target) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {stats.monthlyGoal.target - stats.monthlyGoal.current} hours remaining to reach your goal
            </p>
          </motion.div>
        )}

        {/* Productivity Heatmap */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span>Activity Heatmap</span>
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: level === 0 ? '#e5e7eb' :
                      level === 1 ? '#bfdbfe' :
                      level === 2 ? '#60a5fa' :
                      level === 3 ? '#3b82f6' :
                      '#1d4ed8'
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex space-x-1">
              {stats.productivityHeatmap.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-blue-500 cursor-pointer"
                      style={{
                        backgroundColor: day.value === 0 ? '#e5e7eb' :
                          day.value === 1 ? '#bfdbfe' :
                          day.value === 2 ? '#60a5fa' :
                          day.value === 3 ? '#3b82f6' :
                          '#1d4ed8'
                      }}
                      title={`${day.date.toLocaleDateString()}: ${day.value} hours`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peer Comparison */}
        {stats.peerComparison.optedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Community Ranking</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Your learning pace compared to peers
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    #{stats.peerComparison.yourRank}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    out of {stats.peerComparison.totalUsers} learners
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Avg. Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.peerComparison.averageStudyTime}h
                </p>
                <p className="text-xs text-gray-500">this week</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LearningStatsComparison;
