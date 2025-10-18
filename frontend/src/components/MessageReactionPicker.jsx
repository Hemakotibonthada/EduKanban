import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendURL } from '../config/api';

const API_URL = getBackendURL();

// Common reaction emojis
const QUICK_REACTIONS = [
  { emoji: '❤️', name: 'Heart' },
  { emoji: '👍', name: 'Thumbs Up' },
  { emoji: '😂', name: 'Laughing' },
  { emoji: '😮', name: 'Surprised' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '🙏', name: 'Prayer' },
  { emoji: '🔥', name: 'Fire' },
  { emoji: '🎉', name: 'Party' },
  { emoji: '💯', name: '100' },
  { emoji: '👏', name: 'Clap' },
  { emoji: '🤔', name: 'Thinking' },
  { emoji: '😍', name: 'Love' }
];

const MessageReactionPicker = ({ 
  messageId, 
  token, 
  onReactionAdded,
  onClose,
  existingReactions = [],
  currentUserId 
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleReaction = async (emoji) => {
    // Check if user already reacted with this emoji
    const userReacted = existingReactions.some(
      r => r.user._id === currentUserId && r.emoji === emoji
    );

    if (userReacted) {
      // Remove reaction
      await removeReaction(emoji);
    } else {
      // Add reaction
      await addReaction(emoji);
    }
  };

  const addReaction = async (emoji) => {
    if (isAdding) return;

    setIsAdding(true);
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      });

      const data = await response.json();

      if (data.success) {
        onReactionAdded && onReactionAdded(data.data.reactions);
        toast.success('Reaction added', { duration: 1000 });
        onClose && onClose();
      } else {
        if (data.message.includes('already reacted')) {
          toast.error('You already reacted with this emoji');
        } else {
          throw new Error(data.message);
        }
      }
    } catch (error) {
      console.error('Add reaction error:', error);
      toast.error('Failed to add reaction');
    } finally {
      setIsAdding(false);
    }
  };

  const removeReaction = async (emoji) => {
    if (isAdding) return;

    setIsAdding(true);
    try {
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
        onReactionAdded && onReactionAdded(data.data.reactions);
        toast.success('Reaction removed', { duration: 1000 });
        onClose && onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Remove reaction error:', error);
      toast.error('Failed to remove reaction');
    } finally {
      setIsAdding(false);
    }
  };

  // Check if user reacted with specific emoji
  const hasUserReacted = (emoji) => {
    return existingReactions.some(
      r => r.user._id === currentUserId && r.emoji === emoji
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 mb-2 z-50"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-600 uppercase">React</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Reactions Grid */}
        <div className="grid grid-cols-6 gap-2">
          {QUICK_REACTIONS.map(({ emoji, name }) => {
            const userReacted = hasUserReacted(emoji);
            
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={isAdding}
                className={`
                  relative group p-2 rounded-lg transition-all duration-150
                  ${userReacted 
                    ? 'bg-blue-100 scale-110 shadow-md' 
                    : 'hover:bg-gray-100 hover:scale-125'
                  }
                  ${isAdding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={name}
              >
                <span className="text-2xl">{emoji}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {name}
                </div>

                {/* Check mark if user reacted */}
                {userReacted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Click again to remove your reaction
          </p>
        </div>
      </div>

      {/* Arrow pointing down */}
      <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
    </motion.div>
  );
};

export default MessageReactionPicker;
