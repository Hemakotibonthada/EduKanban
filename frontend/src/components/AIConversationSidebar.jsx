import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Plus, Search, Archive, Trash2, MoreVertical,
  Clock, MessageSquare, ChevronDown, Filter, X
} from 'lucide-react';

const AIConversationSidebar = ({ 
  conversations = [], 
  currentConversation,
  isLoading,
  onSelectConversation,
  onNewConversation,
  onArchiveConversation,
  onDeleteConversation,
  onSearchConversations
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // active, archived, all
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(null);

  // Filter conversations based on search and status
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.metadata?.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? conv.status !== 'deleted' :
      conv.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleArchive = async (convId, isArchived) => {
    setShowConversationMenu(null);
    await onArchiveConversation(convId, !isArchived);
  };

  const handleDelete = async (convId) => {
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      setShowConversationMenu(null);
      await onDeleteConversation(convId);
    }
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI Conversations
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="capitalize">{filterStatus}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilterMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden"
                >
                  {['active', 'archived', 'all'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        filterStatus === status ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No conversations yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Start chatting with AI Guide!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredConversations.map((conversation) => {
              const isActive = currentConversation?._id === conversation._id;
              const isArchived = conversation.status === 'archived';

              return (
                <div
                  key={conversation._id}
                  className={`relative p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    isActive ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600 dark:border-l-purple-400' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isArchived && (
                          <Archive className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </h3>
                      </div>
                      
                      {conversation.lastMessage?.content && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                          {conversation.lastMessage.content.substring(0, 60)}
                          {conversation.lastMessage.content.length > 60 ? '...' : ''}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLastActivity(conversation.lastActivity)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {conversation.messageCount || 0}
                        </span>
                      </div>

                      {conversation.metadata?.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                          {conversation.metadata.category}
                        </span>
                      )}
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConversationMenu(
                            showConversationMenu === conversation._id ? null : conversation._id
                          );
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>

                      <AnimatePresence>
                        {showConversationMenu === conversation._id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowConversationMenu(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(conversation._id, isArchived);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                              >
                                <Archive className="w-4 h-4" />
                                {isArchived ? 'Restore' : 'Archive'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(conversation._id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default AIConversationSidebar;
