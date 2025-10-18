import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBackendURL } from '../config/api';

const API_URL = getBackendURL();

/**
 * MessageReactions Component
 * Displays emoji reactions on a message with user avatars and counts
 */
const MessageReactions = ({ 
  messageId, 
  reactions = [], 
  currentUserId,
  token,
  onReactionsUpdate,
  compact = false 
}) => {
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    const groups = {};
    
    reactions.forEach(reaction => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false
        };
      }
      
      groups[reaction.emoji].count++;
      groups[reaction.emoji].users.push(reaction.user);
      
      if (reaction.user._id === currentUserId || reaction.user === currentUserId) {
        groups[reaction.emoji].hasCurrentUser = true;
      }
    });
    
    return Object.values(groups);
  }, [reactions, currentUserId]);

  const toggleReaction = async (emoji, hasCurrentUser) => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (hasCurrentUser) {
        // Remove reaction
        const response = await fetch(
          `${API_URL}/chat-enhanced/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        if (data.success) {
          onReactionsUpdate && onReactionsUpdate(data.data.reactions);
          toast.success('Reaction removed', { duration: 1000 });
        } else {
          throw new Error(data.message);
        }
      } else {
        // Add reaction
        const response = await fetch(
          `${API_URL}/chat-enhanced/messages/${messageId}/reactions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ emoji })
          }
        );

        const data = await response.json();
        if (data.success) {
          onReactionsUpdate && onReactionsUpdate(data.data.reactions);
          toast.success('Reaction added', { duration: 1000 });
        } else {
          throw new Error(data.message);
        }
      }
    } catch (error) {
      console.error('Toggle reaction error:', error);
      toast.error('Failed to update reaction');
    } finally {
      setIsToggling(false);
    }
  };

  if (groupedReactions.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
      <AnimatePresence>
        {groupedReactions.map((group) => (
          <motion.button
            key={group.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleReaction(group.emoji, group.hasCurrentUser)}
            onMouseEnter={() => setHoveredReaction(group.emoji)}
            onMouseLeave={() => setHoveredReaction(null)}
            disabled={isToggling}
            className={`
              relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
              transition-all duration-150 border
              ${group.hasCurrentUser
                ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }
              ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${compact ? 'text-xs' : ''}
            `}
          >
            <span className={compact ? 'text-base' : 'text-lg'}>{group.emoji}</span>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
              {group.count}
            </span>

            {/* Hover tooltip showing users */}
            <AnimatePresence>
              {hoveredReaction === group.emoji && group.users.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap"
                >
                  <div className="max-w-xs">
                    {group.users.slice(0, 5).map((user, idx) => (
                      <div key={idx} className="text-left">
                        {user.firstName || user.username || 'User'} {user.lastName || ''}
                      </div>
                    ))}
                    {group.users.length > 5 && (
                      <div className="text-gray-400 mt-1">
                        +{group.users.length - 5} more
                      </div>
                    )}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageReactions;
