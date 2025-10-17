import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, CheckSquare, Hash, Filter, Clock, Target, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const GlobalSearch = ({ user, token, onSelectCourse, onSelectTask }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    courses: [],
    tasks: [],
    modules: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, courses, tasks, modules
    difficulty: 'all', // all, beginner, intermediate, advanced
    status: 'all', // all, active, completed
    sortBy: 'relevance' // relevance, recent, alphabetical
  });
  
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus search input when component mounts
    searchInputRef.current?.focus();
    
    // Add keyboard shortcut (Cmd/Ctrl + K)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults({ courses: [], tasks: [], modules: [] });
      setIsSearching(false);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, filters]);

  const performSearch = async (query) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/search?q=${encodeURIComponent(query)}&type=${filters.type}&difficulty=${filters.difficulty}&status=${filters.status}&sortBy=${filters.sortBy}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || { courses: [], tasks: [], modules: [] });
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Network error during search');
    } finally {
      setIsSearching(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const totalResults = searchResults.courses.length + searchResults.tasks.length + searchResults.modules.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Search className="w-8 h-8 text-blue-600" />
          <span>Global Search</span>
        </h1>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, tasks, modules... (⌘K)"
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full flex flex-wrap gap-3 pt-3 border-t"
            >
              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Types</option>
                <option value="courses">Courses Only</option>
                <option value="tasks">Tasks Only</option>
                <option value="modules">Modules Only</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              {/* Sort By */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              >
                <option value="relevance">Most Relevant</option>
                <option value="recent">Most Recent</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              <button
                onClick={() => setFilters({ type: 'all', difficulty: 'all', status: 'all', sortBy: 'relevance' })}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mt-4 text-sm text-gray-600">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>Found {totalResults} result{totalResults !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <AnimatePresence>
          {isSearching ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : totalResults === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Courses */}
              {searchResults.courses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Courses ({searchResults.courses.length})</span>
                  </h2>
                  <div className="grid gap-4">
                    {searchResults.courses.map((course) => (
                      <button
                        key={course._id}
                        onClick={() => onSelectCourse && onSelectCourse(course._id)}
                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {highlightText(course.title, searchQuery)}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {highlightText(course.description?.substring(0, 150) + '...', searchQuery)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {course.difficulty && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {course.difficulty}
                            </span>
                          )}
                          {course.estimatedDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {course.estimatedDuration}h
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            course.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {course.status || 'active'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tasks */}
              {searchResults.tasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <span>Tasks ({searchResults.tasks.length})</span>
                  </h2>
                  <div className="grid gap-4">
                    {searchResults.tasks.map((task) => (
                      <button
                        key={task._id}
                        onClick={() => onSelectTask && onSelectTask(task._id)}
                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {highlightText(task.title, searchQuery)}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {highlightText(task.description?.substring(0, 150) + '...', searchQuery)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {task.difficulty && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {task.difficulty}
                            </span>
                          )}
                          {task.estimatedTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {task.estimatedTime}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status || 'todo'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Modules */}
              {searchResults.modules.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-600" />
                    <span>Modules ({searchResults.modules.length})</span>
                  </h2>
                  <div className="grid gap-4">
                    {searchResults.modules.map((module) => (
                      <div
                        key={module._id}
                        className="p-4 border-2 border-gray-200 rounded-lg"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {highlightText(module.title, searchQuery)}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {highlightText(module.description?.substring(0, 150) + '...', searchQuery)}
                        </p>
                        <div className="text-sm text-gray-500">
                          <span className="text-purple-600 font-medium">
                            Module {module.moduleNumber}
                          </span>
                          {module.courseName && <span> • {module.courseName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!searchQuery && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Searching</h3>
          <p className="text-gray-600 mb-4">Type in the search box to find courses, tasks, and modules</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">Try "React"</span>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">Try "Python basics"</span>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">Try "Task planning"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
