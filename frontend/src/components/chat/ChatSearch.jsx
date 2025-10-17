import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

const ChatSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  onSearch,
  placeholder = "Search messages...",
  showResults = false,
  results = [],
  onSelectResult,
  onClear
}) => {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onClear?.();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
          >
            <div className="p-2 space-y-1">
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectResult?.(result)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {result.sender && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {result.sender.firstName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {result.sender && (
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {result.sender.firstName} {result.sender.lastName}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {result.content}
                      </div>
                      {result.createdAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(result.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results Message */}
      {showResults && results.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
        >
          <p className="text-center text-gray-500">
            No messages found for "{searchQuery}"
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ChatSearch;
