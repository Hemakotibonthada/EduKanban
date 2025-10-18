import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

/**
 * MessageSearch Component
 * Full-featured search within a conversation with result navigation
 * 
 * Props:
 * - conversationId: ID of the conversation to search in
 * - onClose: Callback() when search is closed
 * - onMessageSelect: Callback(messageId) to scroll/jump to a message
 * - isOpen: Boolean to control visibility
 * 
 * Features:
 * - Debounced search input (500ms delay)
 * - Real-time result count
 * - Navigate through results with up/down arrows
 * - Highlight current result
 * - Jump to message in conversation
 * - Keyboard shortcuts (Enter, Escape, Arrow keys)
 * - Empty state when no results
 * - Loading state during search
 */
const MessageSearch = ({ 
  conversationId, 
  onClose, 
  onMessageSelect,
  isOpen = true 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search function
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setCurrentIndex(0);
      return;
    }

    setIsSearching(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversationId}/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      setResults(data.messages || []);
      setTotalCount(data.messages?.length || 0);
      setCurrentIndex(0);

    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error(error.message || 'Failed to search messages');
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 500ms debounce
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  // Navigate to previous result
  const goToPrevious = () => {
    if (results.length === 0) return;
    
    const newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    setCurrentIndex(newIndex);
    
    if (onMessageSelect && results[newIndex]) {
      onMessageSelect(results[newIndex]._id);
    }
  };

  // Navigate to next result
  const goToNext = () => {
    if (results.length === 0) return;
    
    const newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    
    if (onMessageSelect && results[newIndex]) {
      onMessageSelect(results[newIndex]._id);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      goToPrevious();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      goToNext();
    }
  };

  // Clear search and close
  const handleClose = () => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setCurrentIndex(0);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Jump to specific result
  const handleResultClick = (message, index) => {
    setCurrentIndex(index);
    if (onMessageSelect) {
      onMessageSelect(message._id);
    }
  };

  // Format message preview (truncate if too long)
  const formatPreview = (content) => {
    const maxLength = 80;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Highlight search query in result text
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md"
    >
      {/* Search Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Loading Spinner */}
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Result Count & Navigation */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">
                {currentIndex + 1} / {totalCount}
              </span>
              
              <div className="flex gap-1">
                <button
                  onClick={goToPrevious}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Previous result (↑)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Next result (↓)"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close search (Esc)"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-2 text-xs text-gray-400 flex gap-4">
          <span>↑↓ Navigate</span>
          <span>Enter Next</span>
          <span>Esc Close</span>
        </div>
      </div>

      {/* Search Results List */}
      <AnimatePresence>
        {query.trim() && !isSearching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
          >
            {results.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((message, index) => (
                  <motion.button
                    key={message._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleResultClick(message, index)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      index === currentIndex 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : ''
                    }`}
                  >
                    {/* Sender Name */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.sender?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Message Content with Highlight */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {highlightText(formatPreview(message.content), query)}
                    </p>
                  </motion.button>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No messages found for "{query}"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageSearch;
