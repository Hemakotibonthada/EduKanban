import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Award,
  BookOpen,
  TrendingUp,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Loader,
  ExternalLink,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SocialHub = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [activities, setActivities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchActivityFeed();
    } else if (activeTab === 'discover') {
      fetchSuggestions();
    } else if (activeTab === 'followers') {
      fetchFollowers();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
  }, [activeTab]);

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/social/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Fetch feed error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/social/suggestions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Fetch suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/social/followers/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error('Fetch followers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/social/following/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Fetch following error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/social/follow/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Successfully followed user');
        fetchSuggestions();
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/social/unfollow/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Successfully unfollowed user');
        fetchFollowing();
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/social/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const viewProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/social/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedProfile(data.profile);
      }
    } catch (error) {
      console.error('View profile error:', error);
      toast.error('Failed to load profile');
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'course_completed': return <BookOpen className="w-5 h-5 text-green-400" />;
      case 'course_created': return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'badge_earned': return <Award className="w-5 h-5 text-yellow-400" />;
      case 'level_up': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      default: return <Heart className="w-5 h-5 text-pink-400" />;
    }
  };

  const tabs = [
    { id: 'feed', label: 'Activity Feed', icon: TrendingUp },
    { id: 'discover', label: 'Discover', icon: Users },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'following', label: 'Following', icon: UserPlus }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10" />
            Social Hub
          </h1>
          <p className="text-gray-300">
            Connect with learners, share your progress, and discover new courses
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white/10 backdrop-blur-lg border border-gray-600 rounded-xl max-h-64 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => viewProfile(u._id)}
                  className="p-4 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-gray-700 last:border-0"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{u.firstName} {u.lastName}</p>
                    <p className="text-gray-400 text-sm">@{u.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 text-sm font-semibold">Level {u.level}</p>
                    <p className="text-gray-400 text-xs">{u.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex gap-2 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {activities.length === 0 ? (
                  <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-lg border border-gray-500/20 rounded-xl p-12 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Activity Yet</h3>
                    <p className="text-gray-400">
                      Follow users to see their activities in your feed
                    </p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-white font-semibold">
                                {activity.user?.firstName} {activity.user?.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">@{activity.user?.username}</p>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{activity.description}</p>
                          {activity.course && (
                            <div className="bg-black/20 rounded-lg p-3 mb-3">
                              <p className="text-purple-400 font-semibold text-sm">
                                {activity.course.title}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {activity.course.category}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{activity.likes?.length || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{activity.comments?.length || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                              <Share2 className="w-4 h-4" />
                              <span className="text-sm">Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {suggestions.map((suggestion) => (
                  <UserCard
                    key={suggestion._id}
                    user={suggestion}
                    onFollow={handleFollow}
                    onViewProfile={viewProfile}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'followers' && (
              <motion.div
                key="followers"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {followers.map((follower) => (
                  <UserCard
                    key={follower._id}
                    user={follower}
                    onViewProfile={viewProfile}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'following' && (
              <motion.div
                key="following"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {following.map((followed) => (
                  <UserCard
                    key={followed._id}
                    user={followed}
                    onUnfollow={handleUnfollow}
                    onViewProfile={viewProfile}
                    isFollowing
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

const UserCard = ({ user, onFollow, onUnfollow, onViewProfile, isFollowing }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
    >
      <div className="text-center mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-gray-400 text-sm mb-3">@{user.username}</p>
        
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-purple-400 font-bold">{user.level}</p>
            <p className="text-gray-400 text-xs">Level</p>
          </div>
          <div className="text-center">
            <p className="text-purple-400 font-bold">{user.xp}</p>
            <p className="text-gray-400 text-xs">XP</p>
          </div>
          <div className="text-center">
            <p className="text-purple-400 font-bold">{user.coursesCompleted || 0}</p>
            <p className="text-gray-400 text-xs">Courses</p>
          </div>
        </div>

        {user.badges && user.badges.length > 0 && (
          <div className="flex justify-center gap-2 mb-4">
            {user.badges.slice(0, 3).map((badge, idx) => (
              <div
                key={idx}
                className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center"
                title={badge.name}
              >
                <Award className="w-4 h-4 text-yellow-400" />
              </div>
            ))}
            {user.badges.length > 3 && (
              <div className="w-8 h-8 bg-gray-500/20 rounded-full flex items-center justify-center text-xs text-gray-400">
                +{user.badges.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewProfile(user._id)}
          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
        >
          View Profile
        </button>
        {isFollowing ? (
          <button
            onClick={() => onUnfollow(user._id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        ) : onFollow && (
          <button
            onClick={() => onFollow(user._id)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const ProfileModal = ({ profile, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-500/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-purple-100">@{profile.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {profile.bio && (
            <p className="text-purple-100 mb-4">{profile.bio}</p>
          )}

          <div className="flex gap-6 text-sm">
            {profile.location && (
              <div className="flex items-center gap-2 text-purple-100">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-100 hover:text-white"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{profile.stats?.followers || 0}</p>
            <p className="text-gray-400 text-sm">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{profile.stats?.following || 0}</p>
            <p className="text-gray-400 text-sm">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{profile.stats?.coursesCreated || 0}</p>
            <p className="text-gray-400 text-sm">Courses</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Public Courses</h3>
          <div className="space-y-3">
            {profile.courses?.map((course) => (
              <div
                key={course._id}
                className="bg-white/5 rounded-lg p-4"
              >
                <h4 className="text-white font-semibold mb-1">{course.title}</h4>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{course.category}</span>
                  <span>•</span>
                  <span>{course.difficulty}</span>
                  {course.estimatedDuration && (
                    <>
                      <span>•</span>
                      <span>{course.estimatedDuration}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!profile.courses || profile.courses.length === 0) && (
              <p className="text-gray-400 text-center py-4">No public courses yet</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialHub;
