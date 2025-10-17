import React from 'react';
import { motion } from 'framer-motion';
import { Phone, VideoIcon, MoreVertical, Search, Pin, Users, Settings, X } from 'lucide-react';

const ChatHeader = ({ 
  chat, 
  chatType,
  onlineStatus = false,
  onBack,
  onVoiceCall,
  onVideoCall,
  onSearch,
  onShowInfo,
  onShowPinned,
  pinnedCount = 0
}) => {
  
  const getChatName = () => {
    if (!chat) return 'Select a chat';
    
    if (chatType === 'friend' || chatType === 'user') {
      return `${chat.firstName} ${chat.lastName}`;
    } else if (chatType === 'group') {
      return chat.name || 'Group Chat';
    } else if (chatType === 'channel') {
      return `#${chat.name}`;
    } else if (chatType === 'community') {
      return chat.name;
    }
    return 'Chat';
  };

  const getChatSubtitle = () => {
    if (!chat) return '';
    
    if (chatType === 'friend' || chatType === 'user') {
      return onlineStatus ? '🟢 Online' : '⚫ Offline';
    } else if (chatType === 'group') {
      return `${chat.members?.length || 0} members`;
    } else if (chatType === 'channel' || chatType === 'community') {
      return chat.description || `${chat.members?.length || 0} members`;
    }
    return '';
  };

  const getAvatar = () => {
    if (!chat) return null;
    
    if (chatType === 'friend' || chatType === 'user') {
      return (
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
            {chat.firstName?.[0]}{chat.lastName?.[0]}
          </div>
          {onlineStatus && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
          {chatType === 'group' && <Users className="w-5 h-5" />}
          {chatType === 'channel' && <span className="text-lg">#</span>}
          {chatType === 'community' && <span className="text-lg">{chat.name?.[0]}</span>}
        </div>
      );
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Back Button (Mobile) */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Avatar */}
          {getAvatar()}

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {getChatName()}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {getChatSubtitle()}
            </p>
          </div>
        </div>

        {/* Right Section - Actions */}
        {chat && (
          <div className="flex items-center space-x-2">
            {/* Search */}
            <button
              onClick={onSearch}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search messages"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Pinned Messages */}
            {pinnedCount > 0 && (
              <button
                onClick={onShowPinned}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Pinned messages"
              >
                <Pin className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pinnedCount}
                </span>
              </button>
            )}

            {/* Voice Call (for direct chats) */}
            {(chatType === 'friend' || chatType === 'user') && onVoiceCall && (
              <button
                onClick={onVoiceCall}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
            )}

            {/* Video Call (for direct chats) */}
            {(chatType === 'friend' || chatType === 'user') && onVideoCall && (
              <button
                onClick={onVideoCall}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Video call"
              >
                <VideoIcon className="w-5 h-5" />
              </button>
            )}

            {/* More Options */}
            <button
              onClick={onShowInfo}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
