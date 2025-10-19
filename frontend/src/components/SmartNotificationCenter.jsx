import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  Clock,
  Target,
  Users,
  Award,
  Flame,
  Calendar,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  BookOpen,
  Brain,
  Settings,
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const SmartNotificationCenter = ({ user, token, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [settings, setSettings] = useState({
    aiSuggestions: true,
    deadlineWarnings: true,
    streakReminders: true,
    peerInvites: true,
    achievementAlerts: true,
    soundEnabled: true,
    emailNotifications: false,
    pushNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  const notificationTypes = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'ai-suggestions', label: 'AI Suggestions', icon: Brain },
    { id: 'deadlines', label: 'Deadlines', icon: Clock },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Mark as read after viewing
      setTimeout(() => markAllAsRead(), 2000);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.notifications) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications([]);
        }
      } else {
        console.error('Failed to fetch notifications:', response.status);
        setNotifications([]);
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      toast.error('Unable to connect to notification service');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleAction = async (notificationId, action) => {
    console.log('Action:', action, 'for notification:', notificationId);
    
    // Handle different actions
    switch (action) {
      case 'schedule':
        toast.success('Study session scheduled!');
        break;
      case 'view':
        toast.success('Opening task...');
        break;
      case 'join':
        toast.success('Joined study group!');
        break;
      default:
        break;
    }
    
    // Remove notification after action
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      
      setSettings(newSettings);
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ai-suggestions':
        return Brain;
      case 'deadlines':
        return Clock;
      case 'social':
        return Users;
      case 'achievements':
        return Award;
      default:
        return Bell;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' || n.type === activeTab
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-7 h-7" />
                <div>
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-blue-100">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {notificationTypes.map(type => {
                const Icon = type.icon;
                const count = type.id === 'all' 
                  ? notifications.length 
                  : notifications.filter(n => n.type === type.id).length;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveTab(type.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === type.id
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{type.label}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === type.id ? 'bg-blue-100' : 'bg-white/20'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gray-50 border-b border-gray-200 overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Notification Settings</h3>
                  
                  {[
                    { key: 'aiSuggestions', label: 'AI Study Suggestions', icon: Brain },
                    { key: 'deadlineWarnings', label: 'Deadline Warnings', icon: Clock },
                    { key: 'streakReminders', label: 'Streak Reminders', icon: Flame },
                    { key: 'peerInvites', label: 'Peer Invites', icon: Users },
                    { key: 'achievementAlerts', label: 'Achievement Alerts', icon: Award },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings[item.key]}
                          onChange={(e) => updateSettings({ ...settings, [item.key]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-gray-600" /> : <VolumeX className="w-4 h-4 text-gray-600" />}
                      <span className="text-sm text-gray-700">Sound Alerts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ ...settings, soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bell className="w-16 h-16 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  
                  return (
                    <motion.div
                      key={notification._id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`rounded-xl border-l-4 p-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'shadow-md' : 'opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-white rounded-lg">
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      {notification.actions && (
                        <div className="flex items-center space-x-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleAction(notification._id, action.action)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                action.action === 'dismiss'
                                  ? 'bg-white text-gray-700 hover:bg-gray-100'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={clearAll}
                className="w-full py-2 text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center justify-center space-x-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Notifications</span>
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartNotificationCenter;
