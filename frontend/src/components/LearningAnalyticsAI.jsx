import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  Calendar,
  Award,
  AlertCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Users,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * LearningAnalyticsAI Component
 * AI-powered learning analytics with personalized insights
 * Features:
 * - Learning pattern analysis
 * - Productivity insights
 * - Personalized recommendations
 * - Optimal study time predictions
 * - Performance trends
 * - Goal progress tracking
 */
const LearningAnalyticsAI = ({ user, token }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [analytics, setAnalytics] = useState({
    weeklyProgress: [],
    studyTimeByHour: [],
    performanceBySubject: [],
    productivityScore: 0,
    focusScore: 0,
    consistencyScore: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [optimalStudyTimes, setOptimalStudyTimes] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Helper to get chart colors based on theme
  const getChartTextColor = () => {
    return document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
  };

  const getChartGridColor = () => {
    return document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb';
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data.insights);
        setAnalytics(data.data.analytics);
        setRecommendations(data.data.recommendations);
        setOptimalStudyTimes(data.data.optimalStudyTimes);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const weeklyProgressData = {
    labels: analytics.weeklyProgress.map(d => d.day),
    datasets: [
      {
        label: 'Study Time (hours)',
        data: analytics.weeklyProgress.map(d => d.hours),
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgb(139, 92, 246)',
        tension: 0.4,
      },
      {
        label: 'Tasks Completed',
        data: analytics.weeklyProgress.map(d => d.tasksCompleted),
        fill: true,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: 'rgb(236, 72, 153)',
        tension: 0.4,
      }
    ]
  };

  const studyTimeByHourData = {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
    datasets: [{
      label: 'Productivity Score',
      data: analytics.studyTimeByHour,
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(99, 102, 241, 0.8)',
      ]
    }]
  };

  const performanceData = {
    labels: analytics.performanceBySubject.map(s => s.subject),
    datasets: [{
      label: 'Performance %',
      data: analytics.performanceBySubject.map(s => s.score),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
      ]
    }]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Learning Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Personalized analytics powered by machine learning
              </p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-xl hover:shadow-lg transition-shadow"
          >
            Refresh Insights
          </button>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ScoreCard
            title="Productivity Score"
            score={analytics.productivityScore}
            icon={Zap}
            color="from-yellow-500 to-orange-500"
            description="Based on focus time and task completion"
          />
          <ScoreCard
            title="Focus Score"
            score={analytics.focusScore}
            icon={Target}
            color="from-blue-500 to-cyan-500"
            description="Ability to maintain concentration"
          />
          <ScoreCard
            title="Consistency Score"
            score={analytics.consistencyScore}
            icon={Calendar}
            color="from-green-500 to-teal-500"
            description="Regular study habit formation"
          />
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI-Powered Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Progress
            </h3>
            <Line
              data={weeklyProgressData}
              options={{
                responsive: true,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: { color: getChartTextColor() }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: getChartTextColor() },
                    grid: { color: getChartGridColor() }
                  },
                  y: { 
                    beginAtZero: true,
                    ticks: { color: getChartTextColor() },
                    grid: { color: getChartGridColor() }
                  }
                }
              }}
            />
          </div>

          {/* Study Time by Hour */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Productivity by Time of Day
            </h3>
            <Bar
              data={studyTimeByHourData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    ticks: { color: getChartTextColor() },
                    grid: { color: getChartGridColor() }
                  },
                  y: { 
                    beginAtZero: true, 
                    max: 100,
                    ticks: { color: getChartTextColor() },
                    grid: { color: getChartGridColor() }
                  }
                }
              }}
            />
          </div>

          {/* Performance by Subject */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Performance by Subject
            </h3>
            <Doughnut
              data={performanceData}
              options={{
                responsive: true,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: { color: getChartTextColor() }
                  }
                }
              }}
            />
          </div>

          {/* Optimal Study Times */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              <Clock className="w-5 h-5 inline mr-2 dark:text-blue-400" />
              Your Optimal Study Times
            </h3>
            <div className="space-y-3">
              {optimalStudyTimes.map((time, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {time.timeRange}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {time.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {time.efficiency}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">efficiency</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Personalized Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Score Card Component
const ScoreCard = ({ title, score, icon: Icon, color, description }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border dark:border-gray-700"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {score}
          <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
        </p>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      {description}
    </p>
    <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${color}`}
      />
    </div>
  </motion.div>
);

// Insight Card Component
const InsightCard = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'neutral':
        return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getBgColor = () => {
    switch (insight.type) {
      case 'positive':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
      case 'negative':
        return 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20';
      default:
        return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
    }
  };

  return (
    <div className={`p-4 bg-gradient-to-r ${getBgColor()} rounded-xl`}>
      <div className="flex items-start space-x-3">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {insight.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {insight.message}
          </p>
          {insight.action && (
            <button className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline">
              {insight.action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation }) => (
  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white">
        {recommendation.title}
      </h4>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
      {recommendation.description}
    </p>
    <div className="flex items-center justify-between">
      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
        {recommendation.category}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Impact: {recommendation.impact}
      </span>
    </div>
  </div>
);

export default LearningAnalyticsAI;
