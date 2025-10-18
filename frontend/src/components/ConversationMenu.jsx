import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Pin, 
  PinOff, 
  Bell, 
  BellOff, 
  Archive, 
  ArchiveRestore,
  Trash2,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

/**
 * ConversationMenu Component
 * Dropdown menu for conversation actions (pin, mute, archive, delete)
 * Shows visual indicators for pinned/muted conversations
 * 
 * Props:
 * - conversation: Conversation object with _id, isPinned, isMuted, isArchived
 * - onUpdate: Callback(conversationId, updates) when conversation is updated
 * - onDelete: Callback(conversationId) when conversation is deleted
 * - onSearch: Callback() to open search in this conversation
 * - showSearchOption: Boolean to show/hide search option (default: true)
 * - position: 'left' or 'right' for menu positioning (default: 'right')
 * 
 * Features:
 * - Pin/unpin conversations (📌 indicator)
 * - Mute/unmute notifications (🔇 indicator)
 * - Archive/unarchive conversations
 * - Delete conversation with confirmation
 * - Search within conversation
 * - Click outside to close
 * - Keyboard navigation (Escape to close)
 */
const ConversationMenu = ({ 
  conversation, 
  onUpdate, 
  onDelete,
  onSearch,
  showSearchOption = true,
  position = 'right'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowDeleteModal(false);
      }
    };

    if (showMenu || showDeleteModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showMenu, showDeleteModal]);

  // Toggle pin status
  const handlePin = async () => {
    setIsLoading(true);
    setShowMenu(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversation._id}/pin`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isPinned: !conversation.isPinned })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pin status');
      }

      toast.success(conversation.isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      
      if (onUpdate) {
        onUpdate(conversation._id, { isPinned: !conversation.isPinned });
      }
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast.error(error.message || 'Failed to update pin status');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle mute status
  const handleMute = async () => {
    setIsLoading(true);
    setShowMenu(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversation._id}/mute`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isMuted: !conversation.isMuted })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update mute status');
      }

      toast.success(conversation.isMuted ? 'Notifications enabled' : 'Notifications muted');
      
      if (onUpdate) {
        onUpdate(conversation._id, { isMuted: !conversation.isMuted });
      }
    } catch (error) {
      console.error('Error updating mute status:', error);
      toast.error(error.message || 'Failed to update mute status');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle archive status
  const handleArchive = async () => {
    setIsLoading(true);
    setShowMenu(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversation._id}/archive`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isArchived: !conversation.isArchived })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update archive status');
      }

      toast.success(conversation.isArchived ? 'Conversation unarchived' : 'Conversation archived');
      
      if (onUpdate) {
        onUpdate(conversation._id, { isArchived: !conversation.isArchived });
      }
    } catch (error) {
      console.error('Error updating archive status:', error);
      toast.error(error.message || 'Failed to update archive status');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete conversation
  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversation._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete conversation');
      }

      toast.success('Conversation deleted');
      setShowDeleteModal(false);
      
      if (onDelete) {
        onDelete(conversation._id);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const menuPositionClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <>
      {/* Menu Button with Indicators */}
      <div className="relative inline-flex items-center gap-1" ref={menuRef}>
        {/* Visual Indicators */}
        {conversation.isPinned && (
          <span className="text-xs" title="Pinned">
            📌
          </span>
        )}
        {conversation.isMuted && (
          <span className="text-xs" title="Muted">
            🔇
          </span>
        )}

        {/* Menu Trigger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Conversation options"
          disabled={isLoading}
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className={`absolute ${menuPositionClass} top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden`}
            >
              {/* Search Option */}
              {showSearchOption && onSearch && (
                <>
                  <button
                    onClick={() => {
                      onSearch();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Search in conversation
                    </span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                </>
              )}

              {/* Pin/Unpin */}
              <button
                onClick={handlePin}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {conversation.isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Unpin conversation
                    </span>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Pin conversation
                    </span>
                  </>
                )}
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={handleMute}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {conversation.isMuted ? (
                  <>
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Unmute notifications
                    </span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Mute notifications
                    </span>
                  </>
                )}
              </button>

              {/* Archive/Unarchive */}
              <button
                onClick={handleArchive}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {conversation.isArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Unarchive conversation
                    </span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Archive conversation
                    </span>
                  </>
                )}
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Delete */}
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete conversation</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                  Delete Conversation
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this conversation? All messages will be permanently removed. This action cannot be undone.
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

export default ConversationMenu;
