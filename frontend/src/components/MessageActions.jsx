import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, MoreVertical, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
};

/**
 * MessageActions Component
 * Displays edit/delete action buttons for user's own messages
 * Includes inline editor with 15-minute edit window enforcement
 * 
 * Props:
 * - message: Message object with _id, content, sender, createdAt, edited
 * - currentUserId: ID of current logged-in user
 * - onEdit: Callback(messageId, newContent) when message is edited
 * - onDelete: Callback(messageId) when message is deleted
 * - isAIMessage: Boolean indicating if this is an AI message (disables actions)
 * 
 * Features:
 * - Hover to reveal action buttons
 * - Inline editing with Enter to save, Escape to cancel
 * - 15-minute edit window enforcement
 * - Delete confirmation modal
 * - "edited" indicator for edited messages
 * - API integration for edit/delete operations
 */
const MessageActions = ({ 
  message, 
  currentUserId, 
  onEdit, 
  onDelete,
  isAIMessage = false 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  // Check if message is within 15-minute edit window
  const canEdit = () => {
    if (isAIMessage) return false;
    if (message.sender?._id !== currentUserId && message.sender !== currentUserId) return false;
    
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    return (currentTime - messageTime) <= fifteenMinutes;
  };

  const canDelete = () => {
    if (isAIMessage) return false;
    return message.sender?._id === currentUserId || message.sender === currentUserId;
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      // Move cursor to end
      editInputRef.current.selectionStart = editInputRef.current.value.length;
      editInputRef.current.selectionEnd = editInputRef.current.value.length;
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Handle edit submission
  const handleEdit = async () => {
    if (!editedContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    if (!canEdit()) {
      toast.error('Edit window (15 minutes) has expired');
      setIsEditing(false);
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getBackendURL()}/api/chat-enhanced/messages/${message._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editedContent })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to edit message');
      }

      toast.success('Message updated');
      setIsEditing(false);
      
      if (onEdit) {
        onEdit(message._id, editedContent);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error.message || 'Failed to edit message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!canDelete()) {
      toast.error('You cannot delete this message');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getBackendURL()}/api/chat-enhanced/messages/${message._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete message');
      }

      toast.success('Message deleted');
      setShowDeleteModal(false);
      
      if (onDelete) {
        onDelete(message._id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts in edit mode
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditedContent(message.content);
      setIsEditing(false);
    }
  };

  // Don't show actions if AI message or not user's message
  if (isAIMessage || (message.sender?._id !== currentUserId && message.sender !== currentUserId)) {
    // Still show "edited" indicator if applicable
    if (message.edited) {
      return (
        <span className="text-xs text-gray-400 italic ml-2">
          (edited)
        </span>
      );
    }
    return null;
  }

  return (
    <>
      {/* Actions Menu */}
      <div className="relative inline-block" ref={menuRef}>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Message actions"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              {canEdit() && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                >
                  <Edit2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Edit Message</span>
                  <span className="text-xs text-gray-400 ml-auto">15 min</span>
                </button>
              )}
              
              {canDelete() && (
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete Message</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edited Indicator */}
      {message.edited && !isEditing && (
        <span className="text-xs text-gray-400 italic ml-2">
          (edited)
        </span>
      )}

      {/* Inline Editor */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 mb-2"
          >
            <div className="relative">
              <textarea
                ref={editInputRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-3 pr-20 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isLoading}
              />
              
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  disabled={isLoading || !editedContent.trim()}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditedContent(message.content);
                    setIsEditing(false);
                  }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  Enter to save • Esc to cancel
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => !isLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Message
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageActions;
