import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

/**
 * PinnedMessagesPanel Component
 * Collapsible panel displaying all pinned messages in a conversation
 * 
 * Props:
 * - conversationId: ID of the conversation
 * - onMessageClick: Callback(messageId) to scroll/jump to a message
 * - onUnpin: Callback(messageId) when a message is unpinned
 * - initiallyExpanded: Boolean to start expanded/collapsed (default: false)
 * 
 * Features:
 * - Collapsible panel at top of conversation
 * - List all pinned messages with timestamps
 * - Show who pinned each message and when
 * - Quick jump to message in conversation
 * - Unpin individual messages
 * - Auto-refresh when new pins added
 * - Loading and empty states
 */
const PinnedMessagesPanel = ({ 
  conversationId, 
  onMessageClick,
  onUnpin,
  initiallyExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pinned messages
  const fetchPinnedMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversationId}/pinned`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch pinned messages');
      }

      setPinnedMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pinned messages on mount and when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchPinnedMessages();
    }
  }, [conversationId]);

  // Handle unpin message
  const handleUnpin = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/messages/${messageId}/pin`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isPinned: false })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unpin message');
      }

      // Remove from local state
      setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message unpinned');

      // Notify parent component
      if (onUnpin) {
        onUnpin(messageId);
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error(error.message || 'Failed to unpin message');
    }
  };

  // Handle message click
  const handleMessageClick = (messageId) => {
    if (onMessageClick) {
      onMessageClick(messageId);
    }
  };

  // Format message preview
  const formatPreview = (content) => {
    const maxLength = 100;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Format timestamp
  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Don't render if no pinned messages
  if (!isLoading && pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Pinned Messages
          </span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
            {pinnedMessages.length}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Loading pinned messages...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="py-6 px-4">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
                <button
                  onClick={fetchPinnedMessages}
                  className="mt-2 mx-auto block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Pinned Messages List */}
            {!isLoading && !error && pinnedMessages.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pinnedMessages.map((message, index) => (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-4 py-3 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors group"
                    >
                      <div className="flex gap-3">
                        {/* Pin Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <Pin className="w-4 h-4 text-blue-500" />
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          {/* Message Preview (Clickable) */}
                          <button
                            onClick={() => handleMessageClick(message._id)}
                            className="w-full text-left group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          >
                            <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                              {formatPreview(message.content)}
                            </p>
                          </button>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {/* Sender */}
                            <span className="font-medium">
                              {message.sender?.name || 'Unknown'}
                            </span>

                            {/* Message Timestamp */}
                            <span>
                              {formatTimestamp(message.createdAt)}
                            </span>

                            {/* Pin Info */}
                            {message.pinnedBy && (
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">•</span>
                                Pinned by {message.pinnedBy.name || 'Someone'}
                                {message.pinnedAt && (
                                  <span className="text-gray-400">
                                    {' '}on {formatTimestamp(message.pinnedAt)}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unpin Button */}
                        <button
                          onClick={() => handleUnpin(message._id)}
                          className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                          title="Unpin message"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State (shouldn't show due to parent condition, but just in case) */}
            {!isLoading && !error && pinnedMessages.length === 0 && (
              <div className="py-8 text-center">
                <Pin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No pinned messages
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * PinMessageButton Component
 * Helper button to pin/unpin a message
 * Can be used in message action menus
 */
export const PinMessageButton = ({ message, onPinToggle }) => {
  const [isPinned, setIsPinned] = useState(message.isPinned || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePin = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/messages/${message._id}/pin`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isPinned: !isPinned })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle pin');
      }

      const newPinStatus = !isPinned;
      setIsPinned(newPinStatus);
      toast.success(newPinStatus ? 'Message pinned' : 'Message unpinned');

      if (onPinToggle) {
        onPinToggle(message._id, newPinStatus);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(error.message || 'Failed to toggle pin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePin}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
      title={isPinned ? 'Unpin message' : 'Pin message'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Pin className={`w-4 h-4 ${isPinned ? 'text-blue-500' : 'text-gray-500'}`} />
      )}
      <span className="text-sm">{isPinned ? 'Unpin' : 'Pin'} Message</span>
    </button>
  );
};

export default PinnedMessagesPanel;
