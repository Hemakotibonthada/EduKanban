import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Hash, Globe } from 'lucide-react';

const ChatList = ({ 
  items, 
  type, // 'friends', 'groups', 'communities'
  onSelectChat,
  selectedChat,
  onlineUsers = new Set()
}) => {
  
  const getIcon = (type) => {
    switch (type) {
      case 'friends':
        return MessageCircle;
      case 'groups':
        return Users;
      case 'communities':
        return Globe;
      default:
        return MessageCircle;
    }
  };

  const Icon = getIcon(type);

  const isOnline = (userId) => onlineUsers.has(userId);

  const getLastMessagePreview = (item) => {
    if (item.lastMessage) {
      const content = item.lastMessage.content || '';
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    return 'No messages yet';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Icon className="w-16 h-16 mb-4" />
        <p className="text-center">
          No {type} yet.<br />
          Start connecting with others!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isSelected = selectedChat === item._id;
        const hasUnread = item.unreadCount > 0;

        return (
          <motion.button
            key={item._id}
            onClick={() => onSelectChat(item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 rounded-lg transition-colors flex items-center space-x-3 ${
              isSelected
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Avatar/Icon */}
            <div className="relative flex-shrink-0">
              {type === 'friends' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                    {item.firstName?.[0]}{item.lastName?.[0]}
                  </div>
                  {isOnline(item._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                  <Icon className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              {/* Name */}
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {type === 'friends' 
                    ? `${item.firstName} ${item.lastName}`
                    : item.name || item.title
                  }
                </h4>
                {item.lastMessage && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(item.lastMessage.createdAt)}
                  </span>
                )}
              </div>

              {/* Last Message / Info */}
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${
                  hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'
                }`}>
                  {type === 'communities' && item.description ? (
                    <span className="flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      {item.description}
                    </span>
                  ) : (
                    getLastMessagePreview(item)
                  )}
                </p>

                {/* Unread Badge */}
                {hasUnread && (
                  <span className="flex-shrink-0 ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </span>
                )}
              </div>

              {/* Status Text for Friends */}
              {type === 'friends' && (
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    isOnline(item._id) ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {isOnline(item._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}

              {/* Member Count for Groups/Communities */}
              {(type === 'groups' || type === 'communities') && item.memberCount && (
                <div className="flex items-center mt-1">
                  <Users className="w-3 h-3 mr-1 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {item.memberCount} members
                  </span>
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ChatList;
