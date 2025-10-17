import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  Award, 
  Users,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Star,
  Zap,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = ({ user, token }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/analytics/dashboard?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Network error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/analytics/export?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning-analytics-${timeRange}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Analytics report exported!');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Network error during export');
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'blue', subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <TrendingUp className={`w-4 h-4 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-sm font-medium ml-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% from last period
          </span>
        </div>
      )}
    </motion.div>
  );

  const ProgressChart = ({ data, title }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data?.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                <span className="text-xs text-gray-500">{item.count || ''}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`bg-${item.color || 'blue'}-600 h-2 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ActivityHeatmap = ({ data }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Activity</h3>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs text-gray-500 text-center p-1">{day}</div>
        ))}
        {data?.activityHeatmap?.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`aspect-square rounded-sm ${
                day === 0 ? 'bg-gray-100' :
                day <= 2 ? 'bg-green-200' :
                day <= 4 ? 'bg-green-400' :
                'bg-green-600'
              }`}
              title={`${day} activities`}
            />
          ))
        )}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-100 rounded-sm" />
          <div className="w-2 h-2 bg-green-200 rounded-sm" />
          <div className="w-2 h-2 bg-green-400 rounded-sm" />
          <div className="w-2 h-2 bg-green-600 rounded-sm" />
        </div>
        <span>More</span>
      </div>
    </div>
  );

  const LearningStreak = ({ data }) => (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Learning Streak</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{data?.currentStreak || 0}</span>
            <span className="text-orange-100">days</span>
          </div>
          <p className="text-orange-100 text-sm mt-1">
            Best: {data?.longestStreak || 0} days
          </p>
        </div>
        <div className="text-right">
          <Zap className="w-12 h-12 opacity-80" />
        </div>
      </div>
    </div>
  );

  const RecentAchievements = ({ achievements }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
      <div className="space-y-3">
        {achievements?.slice(0, 5).map((achievement, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <Award className="w-6 h-6 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{achievement.title}</p>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>
            <span className="text-xs text-gray-500">
              {achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
        ))}
        {!achievements?.length && (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Complete courses and tasks to earn achievements!</p>
          </div>
        )}
      </div>
    </div>
  );

  const SkillProgress = ({ skills }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Development</h3>
      <div className="space-y-4">
        {skills?.map((skill, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{skill.name}</span>
              <span className="text-sm text-gray-600">{skill.level}/5</span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded-full ${
                    level <= skill.level ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
        {!skills?.length && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Start learning to track your skill progress!</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const stats = analyticsData?.stats || {};
  const timeSpent = analyticsData?.timeSpent || {};
  const courseProgress = analyticsData?.courseProgress || [];
  const skillProgress = analyticsData?.skillProgress || [];
  const achievements = analyticsData?.achievements || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600">Track your progress and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Time Spent Learning"
          value={`${Math.round((timeSpent.total || 0) / 60)}h`}
          change={timeSpent.change}
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          color="blue"
          subtitle={`${Math.round((timeSpent.daily || 0) / 60)}h daily avg`}
        />
        
        <StatCard
          title="Courses Completed"
          value={stats.completedCourses || 0}
          change={stats.coursesChange}
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          color="green"
          subtitle={`${stats.activeCourses || 0} in progress`}
        />
        
        <StatCard
          title="Tasks Completed"
          value={stats.completedTasks || 0}
          change={stats.tasksChange}
          icon={<CheckCircle className="w-6 h-6 text-purple-600" />}
          color="purple"
          subtitle={`${stats.completionRate || 0}% success rate`}
        />
        
        <StatCard
          title="Assessments Passed"
          value={stats.passedAssessments || 0}
          change={stats.assessmentsChange}
          icon={<Award className="w-6 h-6 text-orange-600" />}
          color="orange"
          subtitle={`${stats.avgScore || 0}% avg score`}
        />
      </div>

      {/* Learning Activity and Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityHeatmap data={analyticsData} />
        </div>
        <LearningStreak data={analyticsData} />
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart
          title="Course Progress"
          data={courseProgress.map(course => ({
            label: course.title,
            value: course.progress,
            count: `${course.completedLessons}/${course.totalLessons}`,
            color: course.progress >= 80 ? 'green' : course.progress >= 50 ? 'yellow' : 'blue'
          }))}
        />
        
        <SkillProgress skills={skillProgress} />
      </div>

      {/* Study Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Patterns</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Most Active Day</span>
                <span className="text-sm font-medium text-gray-900">
                  {timeSpent.mostActiveDay || 'Monday'}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Peak Learning Hour</span>
                <span className="text-sm font-medium text-gray-900">
                  {timeSpent.peakHour || '9:00 AM'}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Avg Session Length</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((timeSpent.avgSession || 0) / 60)} minutes
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Learning Consistency</span>
                <span className="text-sm font-medium text-gray-900">
                  {timeSpent.consistency || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${timeSpent.consistency || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <RecentAchievements achievements={achievements} />
      </div>

      {/* Detailed Insights */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <PlayCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.videosWatched || 0}</div>
            <div className="text-sm text-blue-800">Videos Watched</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.lessonsViewed || 0}</div>
            <div className="text-sm text-green-800">Lessons Viewed</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.achievementsEarned || 0}</div>
            <div className="text-sm text-purple-800">Achievements Earned</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analyticsData?.recommendations && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
          <div className="space-y-3">
            {analyticsData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{rec.title}</p>
                  <p className="text-sb text-gray-600">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;