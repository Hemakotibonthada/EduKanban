import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendURL } from '../config/api';
import MessageReactions from './MessageReactions';

const API_URL = getBackendURL();

/**
 * ThreadView Component
 * Displays message thread with replies in a sidebar
 */
const ThreadView = ({ 
  parentMessageId, 
  currentUser,
  token,
  onClose 
}) => {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load thread data
  useEffect(() => {
    if (parentMessageId) {
      loadThread();
    }
  }, [parentMessageId]);

  // Auto-scroll to bottom when new replies added
  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const loadThread = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/chat-enhanced/messages/${parentMessageId}/thread`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setThread(data.data.parentMessage);
        setReplies(data.data.replies);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Load thread error:', error);
      toast.error('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `${API_URL}/chat-enhanced/messages/${parentMessageId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content: replyText.trim()
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setReplies(prev => [...prev, data.data]);
        setReplyText('');
        toast.success('Reply sent');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Send reply error:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Thread</h3>
            <p className="text-xs text-gray-500">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Parent Message */}
            {thread && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {thread.sender?.firstName?.[0]}{thread.sender?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {thread.sender?.firstName} {thread.sender?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(thread.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                      {thread.content}
                    </p>
                    {thread.reactions && thread.reactions.length > 0 && (
                      <MessageReactions
                        messageId={thread._id}
                        reactions={thread.reactions}
                        currentUserId={currentUser._id}
                        token={token}
                        onReactionsUpdate={(newReactions) => {
                          setThread(prev => ({ ...prev, reactions: newReactions }));
                        }}
                        compact
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            {replies.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-500 font-medium">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            )}

            {/* Replies */}
            {replies.map((reply) => {
              const isOwn = reply.sender?._id === currentUser._id;
              
              return (
                <div key={reply._id} className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOwn
                      ? 'bg-gradient-to-br from-green-500 to-blue-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    <span className="text-white text-xs font-semibold">
                      {reply.sender?.firstName?.[0]}{reply.sender?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {isOwn ? 'You' : `${reply.sender?.firstName} ${reply.sender?.lastName}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    <div className={`mt-1 px-3 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>
                    </div>
                    {reply.reactions && reply.reactions.length > 0 && (
                      <MessageReactions
                        messageId={reply._id}
                        reactions={reply.reactions}
                        currentUserId={currentUser._id}
                        token={token}
                        onReactionsUpdate={(newReactions) => {
                          setReplies(prev => prev.map(r => 
                            r._id === reply._id ? { ...r, reactions: newReactions } : r
                          ));
                        }}
                        compact
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {replies.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No replies yet</p>
                <p className="text-xs text-gray-400">Be the first to reply!</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={sendReply} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendReply(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!replyText.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
};

export default ThreadView;
