import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Zap,
  Flame,
  Star,
  Send,
  Image,
  Video,
  Smile,
  MoreVertical,
  Globe,
  Lock,
  ThumbsUp,
  MessageSquare,
  Eye,
  Filter,
  Bell,
  Settings,
  UserMinus,
  Trophy,
  Calendar,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedSocialHub = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', visibility: 'public', tags: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data for demonstration
  const [mockPosts, setMockPosts] = useState([
    {
      id: 1,
      author: {
        id: 'user1',
        name: 'Sarah Johnson',
        avatar: 'SJ',
        level: 28,
        badge: 'Quick Learner'
      },
      content: 'Just completed the Advanced React course! 🎉 The hooks section was challenging but totally worth it. Anyone else working through it?',
      timestamp: '2025-10-19T10:30:00',
      likes: 24,
      comments: 8,
      shares: 3,
      tags: ['React', 'WebDev', 'Achievement'],
      visibility: 'public',
      liked: false,
      bookmarked: false,
      type: 'achievement'
    },
    {
      id: 2,
      author: {
        id: 'user2',
        name: 'Mike Chen',
        avatar: 'MC',
        level: 35,
        badge: 'Code Master'
      },
      content: 'Looking for study partners for the Data Structures & Algorithms course. Planning to dedicate 2 hours daily. DM me if interested! 💪',
      timestamp: '2025-10-19T09:15:00',
      likes: 15,
      comments: 12,
      shares: 5,
      tags: ['DSA', 'StudyGroup', 'LookingForPartners'],
      visibility: 'public',
      liked: true,
      bookmarked: true,
      type: 'collaboration'
    },
    {
      id: 3,
      author: {
        id: 'user3',
        name: 'Emily Davis',
        avatar: 'ED',
        level: 22,
        badge: 'Team Player'
      },
      content: '100-day streak achieved! 🔥 Consistency is key. Here\'s my secret: wake up early, study for 1 hour before work, and review notes before bed.',
      timestamp: '2025-10-19T08:00:00',
      likes: 56,
      comments: 18,
      shares: 12,
      tags: ['Streak', 'Motivation', 'DailyHabits'],
      visibility: 'public',
      liked: true,
      bookmarked: false,
      type: 'milestone'
    },
    {
      id: 4,
      author: {
        id: 'user4',
        name: 'David Lee',
        avatar: 'DL',
        level: 31,
        badge: 'Full Stack Pro'
      },
      content: 'Just deployed my first full-stack app! Used MERN stack with Redux. Check it out and let me know what you think! Link in comments 👇',
      timestamp: '2025-10-18T18:45:00',
      likes: 42,
      comments: 15,
      shares: 8,
      tags: ['MERN', 'Project', 'Portfolio'],
      visibility: 'public',
      liked: false,
      bookmarked: true,
      type: 'project'
    }
  ]);

  const [suggestedUsers, setSuggestedUsers] = useState([
    {
      id: 'user5',
      name: 'Anna Kumar',
      avatar: 'AK',
      level: 27,
      badge: 'Data Wizard',
      mutualConnections: 8,
      courses: ['Python', 'Data Science', 'ML'],
      isFollowing: false
    },
    {
      id: 'user6',
      name: 'Tom Wilson',
      avatar: 'TW',
      level: 24,
      badge: 'UI/UX Expert',
      mutualConnections: 5,
      courses: ['Design', 'Figma', 'Frontend'],
      isFollowing: false
    },
    {
      id: 'user7',
      name: 'Lisa Brown',
      avatar: 'LB',
      level: 29,
      badge: 'Cloud Architect',
      mutualConnections: 12,
      courses: ['AWS', 'DevOps', 'Docker'],
      isFollowing: false
    }
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Alex Rivera', avatar: 'AR', xp: 18500, level: 42, trend: 'up' },
    { rank: 2, name: 'Sophie Chen', avatar: 'SC', xp: 17200, level: 39, trend: 'same' },
    { rank: 3, name: 'Marcus Johnson', avatar: 'MJ', xp: 16800, level: 38, trend: 'down' },
    { rank: 4, name: 'Nina Patel', avatar: 'NP', xp: 15900, level: 36, trend: 'up' },
    { rank: 5, name: `${user.firstName} ${user.lastName}`, avatar: `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`, xp: 15420, level: 28, trend: 'up', isCurrentUser: true }
  ]);

  const handleLikePost = (postId) => {
    setMockPosts(posts =>
      posts.map(post =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
    toast.success(!mockPosts.find(p => p.id === postId).liked ? 'Post liked!' : 'Like removed');
  };

  const handleBookmarkPost = (postId) => {
    setMockPosts(posts =>
      posts.map(post =>
        post.id === postId
          ? { ...post, bookmarked: !post.bookmarked }
          : post
      )
    );
    toast.success(!mockPosts.find(p => p.id === postId).bookmarked ? 'Post bookmarked!' : 'Bookmark removed');
  };

  const handleFollowUser = (userId) => {
    setSuggestedUsers(users =>
      users.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
    toast.success('Following updated!');
  };

  const handleCreatePost = () => {
    if (!newPost.content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    const post = {
      id: mockPosts.length + 1,
      author: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`,
        level: 28,
        badge: 'Learner'
      },
      content: newPost.content,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      tags: newPost.tags,
      visibility: newPost.visibility,
      liked: false,
      bookmarked: false,
      type: 'post'
    };

    setMockPosts([post, ...mockPosts]);
    setNewPost({ content: '', visibility: 'public', tags: [] });
    setShowCreatePost(false);
    toast.success('Post created successfully!');
  };

  const getPostIcon = (type) => {
    switch (type) {
      case 'achievement': return Award;
      case 'milestone': return Trophy;
      case 'project': return Target;
      case 'collaboration': return Users;
      default: return MessageSquare;
    }
  };

  const getPostColor = (type) => {
    switch (type) {
      case 'achievement': return 'from-blue-500 to-cyan-500';
      case 'milestone': return 'from-yellow-500 to-orange-500';
      case 'project': return 'from-purple-500 to-pink-500';
      case 'collaboration': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
  <div className="space-y-6">
      {/* Header */}
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <Users className="w-10 h-10" />
              <span>Social Hub</span>
            </h1>
            <p className="text-purple-100 text-lg">
              Connect, share, and grow together with the learning community
            </p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="px-6 py-3 bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-300 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Quick Stats */}
  <div className="grid grid-cols-4 gap-4 mt-6 bg-white/10 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <p className="text-3xl font-bold">1,247</p>
            <p className="text-sm text-purple-100">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">45</p>
            <p className="text-sm text-purple-100">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">892</p>
            <p className="text-sm text-purple-100">Interactions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">#5</p>
            <p className="text-sm text-purple-100">Leaderboard</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {['feed', 'discover', 'leaderboard', 'bookmarks'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {mockPosts.map((post, index) => {
                const PostIcon = getPostIcon(post.type);
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                  >
                    {/* Post Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getPostColor(post.type)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                          {/* Avatar gradient supports dark mode via parent */}
                            {post.author.avatar}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">{post.author.name}</h3>
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                Lvl {post.author.level}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{formatTimeAgo(post.timestamp)}</span>
                              <span></span>
                              <div className="flex items-center space-x-1">
                                {post.visibility === 'public' ? (
                                  <Globe className="w-3 h-3 dark:text-gray-300" />
                                ) : (
                                  <Lock className="w-3 h-3 dark:text-gray-300" />
                                )}
                                <span className="capitalize">{post.visibility}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>
                      </div>

                      {/* Post Type Badge */}
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r ${getPostColor(post.type)} rounded-full text-white text-xs font-medium mb-3`}>
                      {/* Badge gradient supports dark mode via parent */}
                        <PostIcon className="w-3 h-3" />
                        <span className="capitalize">{post.type}</span>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{post.content}</p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Share2 className="w-4 h-4" />
                            <span>{post.shares}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                            post.liked
                              ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                          <span>Like</span>
                        </button>
                        <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center space-x-2">
                          <MessageCircle className="w-5 h-5" />
                          <span>Comment</span>
                        </button>
                        <button
                          onClick={() => handleBookmarkPost(post.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            post.bookmarked
                              ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Bookmark className={`w-5 h-5 ${post.bookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Suggested Connections</h2>
                <div className="space-y-4">
                  {suggestedUsers.map((suggestedUser, index) => (
                    <motion.div
                      key={suggestedUser.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {suggestedUser.avatar}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white">{suggestedUser.name}</h3>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                              Lvl {suggestedUser.level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{suggestedUser.badge}</p>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {suggestedUser.mutualConnections} mutual connections
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestedUser.courses.slice(0, 3).map((course, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                                {course}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollowUser(suggestedUser.id)}
                        className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                          suggestedUser.isFollowing
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 text-white hover:shadow-lg'
                        }`}
                      >
                        {suggestedUser.isFollowing ? (
                          <>
                            <UserCheck className="w-5 h-5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Trophy className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                <span>Community Leaderboard</span>
              </h2>
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                      player.isCurrentUser
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border-2 border-purple-300 dark:border-purple-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 flex items-center justify-center font-bold text-xl rounded-full ${
                        player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 dark:from-yellow-700 dark:to-orange-700 text-white' :
                        player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-white' :
                        player.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 dark:from-orange-700 dark:to-orange-800 text-white' :
                        'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        #{player.rank}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {/* Avatar gradient supports dark mode via parent */}
                        {player.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900">{player.name}</h3>
                          <h3 className="font-bold text-gray-900 dark:text-white">{player.name}</h3>
                          {player.isCurrentUser && (
                            <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Level {player.level}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Level {player.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{player.xp.toLocaleString()}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{player.xp.toLocaleString()}</p>
                      <div className="flex items-center justify-end space-x-1 text-sm">
                        {player.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-gray-500">XP</span>
                        <span className="text-gray-500 dark:text-gray-400">XP</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
  <div className="space-y-6">
          {/* Active Now */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span>Active Now</span>
            </h3>
            <div className="space-y-3">
              {suggestedUsers.slice(0, 5).map((activeUser, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 dark:from-green-900 dark:to-teal-900 rounded-full flex items-center justify-center text-white font-semibold">
                      {activeUser.avatar}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>Trending Topics</span>
            </h3>
            <div className="space-y-3">
              {['#ReactJS', '#DataScience', '#100DaysOfCode', '#WebDev', '#AI'].map((tag, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <span className="font-semibold text-gray-900 dark:text-white">{tag}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.floor(Math.random() * 500 + 100)} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 p-6 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold">Create Post</h2>
                <p className="text-purple-100 dark:text-purple-300">Share your thoughts with the community</p>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's on your mind?"
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-700 focus:outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />

                <div className="flex items-center space-x-4">
                  <select
                    value={newPost.visibility}
                    onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-700 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Image className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className="px-6 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSocialHub;
