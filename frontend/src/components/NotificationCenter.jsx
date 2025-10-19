import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, Trash2, User, MessageCircle, Users, BookOpen,
  Target, Gift, AlertCircle, CheckCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { getSocketURL } from '../config/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const NotificationCenter = ({ user, token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initialize Socket.IO for real-time notifications
  useEffect(() => {
    const socket = io(getSocketURL(), {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ Notification socket connected');
    });

      socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md border dark:border-gray-700"
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ), { duration: 4000 });
    });    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getIcon = (type) => {
    const icons = {
      friend_request: <User className="w-5 h-5" />,
      friend_accepted: <CheckCircle className="w-5 h-5" />,
      message: <MessageCircle className="w-5 h-5" />,
      mention: <AlertCircle className="w-5 h-5" />,
      reaction: <Gift className="w-5 h-5" />,
      community_invite: <Users className="w-5 h-5" />,
      group_invite: <Users className="w-5 h-5" />,
      course_update: <BookOpen className="w-5 h-5" />,
      task_assigned: <Target className="w-5 h-5" />,
      task_due: <AlertCircle className="w-5 h-5" />,
      achievement: <Gift className="w-5 h-5" />,
      system: <Bell className="w-5 h-5" />
    };
    return icons[type] || icons.system;
  };

  const getIconColor = (type) => {
    const colors = {
      friend_request: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      friend_accepted: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      message: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      mention: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      reaction: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      community_invite: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      group_invite: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
      course_update: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      task_assigned: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      task_due: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      achievement: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      system: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    };
    return colors[type] || colors.system;
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col w-[calc(100vw-2rem)] max-w-sm md:w-96 max-h-[70vh] md:max-h-[500px] fixed md:absolute top-16 md:top-auto left-4 md:left-auto right-4 md:right-0 md:mt-2"
          >
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
              <h3 className="font-bold text-base md:text-lg text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs md:text-sm text-white hover:text-blue-100 font-medium transition-colors px-2 py-1 rounded hover:bg-white/20 dark:hover:bg-black/20"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1.5 text-white hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                          {notification.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 md:p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 md:p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 md:p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to notifications page if exists
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
