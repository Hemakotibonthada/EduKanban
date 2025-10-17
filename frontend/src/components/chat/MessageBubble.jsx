import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Reply, Trash2, Edit3, Pin, Forward, MoreVertical } from 'lucide-react';

const MessageBubble = ({ 
  message, 
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
  showMenu,
  onToggleMenu,
  user
}) => {
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (message.status === 'sent') return <Check className="w-3 h-3" />;
    if (message.status === 'delivered') return <Check className="w-3 h-3" />;
    if (message.status === 'read') return <Check className="w-3 h-3 text-blue-600" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {message.sender?.firstName?.[0] || 'U'}
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender Name (for group chats) */}
        {!isOwnMessage && message.sender && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sender.firstName} {message.sender.lastName}
          </span>
        )}

        {/* Reply Reference */}
        {message.replyTo && (
          <div className="mb-1 px-3 py-1 bg-gray-100 rounded-t-lg text-xs text-gray-600 border-l-2 border-blue-500">
            <div className="font-medium">Replying to:</div>
            <div className="truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message Content */}
        <div className="relative">
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            } ${message.replyTo ? 'rounded-tl-none' : ''}`}
          >
            {/* Edited Indicator */}
            {message.isEdited && (
              <span className="text-xs opacity-70 italic">edited</span>
            )}
            
            {/* Message Text */}
            <p className="break-words whitespace-pre-wrap">{message.content}</p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded ${
                      isOwnMessage ? 'bg-blue-700' : 'bg-gray-200'
                    }`}
                  >
                    {attachment.type?.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt="attachment"
                        className="max-w-full rounded cursor-pointer"
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 hover:underline"
                      >
                        <span>📎</span>
                        <span className="text-sm">{attachment.filename}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp and Status */}
            <div className={`flex items-center space-x-1 mt-1 text-xs ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>{formatTime(message.createdAt)}</span>
              {isOwnMessage && getStatusIcon()}
              {message.isPinned && <Pin className="w-3 h-3" />}
            </div>
          </div>

          {/* Message Menu */}
          <div className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button
              onClick={() => onToggleMenu(message._id)}
              className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu === message._id && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                <button
                  onClick={() => onReply(message)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                
                <button
                  onClick={() => onForward(message)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Forward className="w-4 h-4" />
                  <span>Forward</span>
                </button>

                <button
                  onClick={() => onPin(message)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Pin className="w-4 h-4" />
                  <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                </button>

                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => onEdit(message)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    
                    <button
                      onClick={() => onDelete(message)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
