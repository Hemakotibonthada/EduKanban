import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const MessageList = ({ 
  messages = [], 
  isLoading = false,
  hasMore = false,
  onLoadMore,
  children,
  autoScroll = true
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Handle scroll events
  const handleScroll = (e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
    setIsUserScrolling(!isNearBottom);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  // Auto-scroll on new messages if user is not scrolling
  useEffect(() => {
    if (autoScroll && !isUserScrolling && messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length, autoScroll, isUserScrolling]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('instant');
    }
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Loading More Indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-lg mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </motion.div>
            </div>
          ) : (
            children
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => {
              scrollToBottom('smooth');
              setIsUserScrolling(false);
            }}
            className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
            title="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
