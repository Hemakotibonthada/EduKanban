import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Star,
  Users,
  Clock,
  Award,
  BookOpen,
  Filter,
  ChevronDown,
  Heart,
  Share2,
  Play,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const CourseMarketplace = ({ user, token, onCourseSelect, onEnroll }) => {
  const [courses, setCourses] = useState([]);
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All Courses', icon: BookOpen },
    { id: 'programming', label: 'Programming', icon: Target },
    { id: 'data-science', label: 'Data Science', icon: TrendingUp },
    { id: 'design', label: 'Design', icon: Sparkles },
    { id: 'business', label: 'Business', icon: Users },
    { id: 'language', label: 'Languages', icon: MessageSquare },
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: 'Beginner', color: 'green' },
    { id: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { id: 'advanced', label: 'Advanced', color: 'red' },
  ];

  useEffect(() => {
    fetchMarketplaceCourses();
  }, [selectedCategory, selectedDifficulty, sortBy]);

  const fetchMarketplaceCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch public/shared courses
      const response = await fetch(`${API_BASE_URL}/courses/marketplace?category=${selectedCategory}&difficulty=${selectedDifficulty}&sort=${sortBy}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ json: () => ({ courses: [] }) }));

      const data = await response.json();
      
      // Mock data for demonstration
      const mockCourses = generateMockCourses();
      setCourses(mockCourses);
      
      // Get trending (most enrollments in last week)
      setTrendingCourses(mockCourses.filter(c => c.trending).slice(0, 6));
      
      // Get recommended (based on user's interests)
      setRecommendedCourses(mockCourses.filter(c => c.recommended).slice(0, 4));
      
    } catch (error) {
      console.error('Error fetching marketplace courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const generateMockCourses = () => {
    const subjects = ['JavaScript', 'Python', 'React', 'Machine Learning', 'UI/UX Design', 'Digital Marketing', 'Data Analytics', 'Node.js', 'Flutter', 'AWS'];
    const instructors = ['Dr. Sarah Chen', 'Prof. James Wilson', 'Maria Rodriguez', 'Alex Thompson', 'David Kim'];
    
    return subjects.map((subject, index) => ({
      _id: `course_${index}`,
      title: `Complete ${subject} Masterclass 2025`,
      description: `Learn ${subject} from scratch to advanced level with hands-on projects and real-world examples.`,
      instructor: instructors[index % instructors.length],
      category: index % 5 === 0 ? 'programming' : index % 5 === 1 ? 'data-science' : index % 5 === 2 ? 'design' : index % 5 === 3 ? 'business' : 'language',
      difficulty: index % 3 === 0 ? 'beginner' : index % 3 === 1 ? 'intermediate' : 'advanced',
      rating: (4 + Math.random()).toFixed(1),
      reviews: Math.floor(Math.random() * 5001) + 100,
      students: Math.floor(Math.random() * 50010) + 1000,
      duration: `${Math.floor(Math.random() * 30) + 10}h`,
      modules: Math.floor(Math.random() * 50) + 10,
      price: index % 2 === 0 ? 'Free' : `$${(Math.random() * 100 + 49).toFixed(0)}`,
      thumbnail: `https://via.placeholder.com/400x225/667eea/ffffff?text=${encodeURIComponent(subject)}`,
      trending: index < 6,
      recommended: index % 2 === 0,
      tags: ['Best Seller', 'Updated 2025', 'Certificate'],
      lastUpdated: '2025-10',
      language: 'English',
      prerequisites: index === 0 ? [] : ['Basic programming knowledge']
    }));
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Successfully enrolled in course!');
        onEnroll?.(courseId);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll. Please try again.');
    }
  };

  const handleShare = async (course) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: course.title,
          text: course.description,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Course link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const CourseCard = ({ course }) => {
    const difficultyColor = {
      beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
      >
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
          
          {/* Trending Badge */}
          {course.trending && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Trending</span>
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900 dark:text-white">
            {course.price}
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button className="p-4 bg-white dark:bg-gray-800 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${difficultyColor[course.difficulty]}`}>
              {course.difficulty}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              {course.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{course.instructor}</span>
          </p>

          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{course.rating}</span>
              <span className="text-gray-400 dark:text-gray-500">({course.reviews})</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{(course.students / 1000).toFixed(1)}k</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEnroll(course._id)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleShare(course)}
              className="p-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              className="p-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-all"
              title="Save to favorites"
            >
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
            <Sparkles className="w-10 h-10" />
            <span>Course Marketplace</span>
          </h1>
          <p className="text-blue-100 text-lg">
            Discover thousands of courses from expert instructors
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search courses, instructors, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-white/30 dark:focus:ring-purple-500/30 text-lg"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          {/* Categories */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map(diff => (
                  <option key={diff.id} value={diff.id}>{diff.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="trending">Trending</option>
                <option value="rating">Highest Rated</option>
                <option value="students">Most Popular</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Courses */}
      {trendingCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-orange-600" />
            <span>Trending This Week</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Courses */}
      {recommendedCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Zap className="w-7 h-7 text-purple-600" />
            <span>Recommended For You</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          All Courses ({filteredCourses.length})
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse border dark:border-gray-700">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border dark:border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCourses.map(course => (
                <CourseCard key={course._id} course={course} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMarketplace;
