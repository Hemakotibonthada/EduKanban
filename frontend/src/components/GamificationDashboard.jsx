import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Award, Target, Zap, Crown, Medal, Flame,
  TrendingUp, Calendar, Clock, BookOpen, CheckCircle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const GamificationDashboard = ({ user, token }) => {
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    level: 1,
    streak: 0,
    badges: [],
    achievements: [],
    rank: 'Novice'
  });
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);

  useEffect(() => {
    fetchGamificationStats();
    fetchLeaderboard();
  }, []);

  // Check for new achievements and show notifications
  useEffect(() => {
    if (recentAchievements.length > 0) {
      // Show toast for most recent achievement
      const latestAchievement = recentAchievements[0];
      const badge = allBadges.find(b => b.id === latestAchievement.badgeId);
      
      if (badge && latestAchievement.earnedAt) {
        const earnedDate = new Date(latestAchievement.earnedAt);
        const now = new Date();
        const hoursSinceEarned = (now - earnedDate) / (1000 * 60 * 60);
        
        // Only show toast if earned within last 5 minutes
        if (hoursSinceEarned < 0.083) { // 5 minutes
          toast.success(
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center`}>
                <badge.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">🎉 Achievement Unlocked!</p>
                <p className="text-sm">{badge.name} - +{badge.xp} XP</p>
              </div>
            </div>,
            { duration: 5000, position: 'top-center' }
          );
        }
      }
    }
  }, [recentAchievements]);

  // Poll for achievement updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGamificationStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchGamificationStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/gamification/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
        setRecentAchievements(data.recentAchievements || []);
      }
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/gamification/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const allBadges = [
    { id: 'first_course', name: 'First Steps', description: 'Complete your first course', icon: BookOpen, color: 'from-blue-500 to-cyan-500', xp: 100 },
    { id: 'week_streak', name: 'Consistent Learner', description: '7-day learning streak', icon: Flame, color: 'from-orange-500 to-red-500', xp: 250 },
    { id: 'ten_courses', name: 'Knowledge Seeker', description: 'Complete 10 courses', icon: Trophy, color: 'from-purple-500 to-pink-500', xp: 500 },
    { id: 'perfect_score', name: 'Perfectionist', description: 'Get 100% on a quiz', icon: Star, color: 'from-yellow-500 to-orange-500', xp: 150 },
    { id: 'month_streak', name: 'Dedicated', description: '30-day learning streak', icon: Calendar, color: 'from-green-500 to-teal-500', xp: 1000 },
    { id: 'early_bird', name: 'Early Bird', description: 'Study before 7 AM', icon: Clock, color: 'from-indigo-500 to-purple-500', xp: 200 },
    { id: 'night_owl', name: 'Night Owl', description: 'Study after 10 PM', icon: Crown, color: 'from-pink-500 to-rose-500', xp: 200 },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a course in under 24 hours', icon: Zap, color: 'from-yellow-500 to-red-500', xp: 300 },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Connect with 10 friends', icon: Users, color: 'from-blue-500 to-purple-500', xp: 150 },
    { id: 'task_master', name: 'Task Master', description: 'Complete 100 tasks', icon: CheckCircle, color: 'from-green-500 to-emerald-500', xp: 750 },
    { id: 'legendary', name: 'Legendary Learner', description: 'Reach Level 50', icon: Medal, color: 'from-yellow-400 to-yellow-600', xp: 5000 },
    { id: 'rising_star', name: 'Rising Star', description: 'Reach top 10 on leaderboard', icon: TrendingUp, color: 'from-red-500 to-pink-500', xp: 1500 }
  ];

  const getRankInfo = (xp) => {
    if (xp >= 10000) return { name: 'Legend', color: 'from-yellow-400 to-yellow-600' };
    if (xp >= 5000) return { name: 'Master', color: 'from-purple-500 to-pink-500' };
    if (xp >= 2500) return { name: 'Expert', color: 'from-blue-500 to-purple-500' };
    if (xp >= 1000) return { name: 'Advanced', color: 'from-green-500 to-teal-500' };
    if (xp >= 500) return { name: 'Intermediate', color: 'from-orange-500 to-red-500' };
    return { name: 'Novice', color: 'from-gray-500 to-gray-600' };
  };

  const getLevelFromXP = (xp) => {
    return Math.floor(xp / 100) + 1;
  };

  const getXPForNextLevel = (xp) => {
    const currentLevel = getLevelFromXP(xp);
    return currentLevel * 100;
  };

  const rank = getRankInfo(userStats.totalXP);
  const level = getLevelFromXP(userStats.totalXP);
  const nextLevelXP = getXPForNextLevel(userStats.totalXP);
  const currentLevelXP = (level - 1) * 100;
  const progressToNextLevel = ((userStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Your Achievements
          </h1>
          <p className="text-gray-600 mt-2">Track your learning progress and earn rewards!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Level Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${rank.color} rounded-xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8" />
              <span className="text-sm font-semibold opacity-90">RANK</span>
            </div>
            <div className="text-3xl font-bold mb-2">{rank.name}</div>
            <div className="text-sm opacity-90">Level {level}</div>
          </motion.div>

          {/* XP Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-600">TOTAL XP</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{userStats.totalXP}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {nextLevelXP - userStats.totalXP} XP to Level {level + 1}
            </div>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8" />
              <span className="text-sm font-semibold opacity-90">STREAK</span>
            </div>
            <div className="text-3xl font-bold mb-2">{userStats.streak} Days</div>
            <div className="text-sm opacity-90">Keep it going! 🔥</div>
          </motion.div>

          {/* Badges Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8" />
              <span className="text-sm font-semibold opacity-90">BADGES</span>
            </div>
            <div className="text-3xl font-bold mb-2">{userStats.badges?.length || 0}</div>
            <div className="text-sm opacity-90">/{allBadges.length} Collected</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Badges Collection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Badge Collection</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allBadges.map((badge) => {
                  const Icon = badge.icon;
                  const isEarned = userStats.badges?.includes(badge.id);
                  
                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className={`rounded-lg p-4 border-2 transition-all ${
                        isEarned
                          ? `bg-gradient-to-br ${badge.color} text-white border-transparent shadow-lg`
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-3 rounded-full mb-3 ${
                          isEarned ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                        <p className={`text-xs ${isEarned ? 'opacity-90' : 'text-gray-500'}`}>
                          {badge.description}
                        </p>
                        <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                          isEarned ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                        }`}>
                          +{badge.xp} XP
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    entry.userId === user._id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : index === 1
                      ? 'bg-gray-300 text-gray-800'
                      : index === 2
                      ? 'bg-orange-400 text-orange-900'
                      : entry.userId === user._id
                      ? 'bg-white/20'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      entry.userId === user._id ? '' : 'text-gray-900'
                    }`}>
                      {entry.name}
                      {entry.userId === user._id && ' (You)'}
                    </div>
                    <div className={`text-xs ${
                      entry.userId === user._id ? 'opacity-90' : 'text-gray-600'
                    }`}>
                      Level {getLevelFromXP(entry.xp)}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    entry.userId === user._id ? '' : 'text-blue-600'
                  }`}>
                    {entry.xp} XP
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <span className="text-xs text-green-600 font-semibold">
                        +{achievement.xp} XP
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationDashboard;
