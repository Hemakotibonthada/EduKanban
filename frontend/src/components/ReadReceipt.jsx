import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
};

/**
 * ReadReceipt Component
 * Displays message delivery/read status with animated icons
 * Uses Intersection Observer to auto-mark messages as read
 * 
 * Props:
 * - message: Message object with _id, sender, status, readBy array
 * - currentUserId: ID of current logged-in user
 * - conversationId: ID of the conversation (for marking as read)
 * - isAIMessage: Boolean - AI messages don't need read receipts
 * - onMessageRead: Callback(messageId) when message is marked as read
 * - socket: Socket.IO instance for real-time updates (optional)
 * 
 * Status Icons:
 * - ⏳ Clock: Sending (pending)
 * - ✓ Single Check: Sent/Delivered
 * - ✓✓ Double Check (gray): Delivered
 * - ✓✓ Double Check (blue): Read
 * 
 * Features:
 * - Auto-mark as read when visible (Intersection Observer)
 * - Real-time status updates via Socket.IO
 * - Visual feedback with color coding
 * - Only sender sees read receipts
 * - Disabled for AI messages
 */
const ReadReceipt = ({ 
  message, 
  currentUserId, 
  conversationId,
  isAIMessage = false,
  onMessageRead,
  socket 
}) => {
  const [status, setStatus] = useState('sent'); // 'sending', 'sent', 'delivered', 'read'
  const [readBy, setReadBy] = useState(message.readBy || []);
  const messageRef = useRef(null);
  const hasMarkedAsRead = useRef(false);

  // AI messages don't need read receipts
  if (isAIMessage) return null;

  // Only show read receipts for sender
  const isSender = message.sender?._id === currentUserId || message.sender === currentUserId;
  
  // Determine status based on message data
  useEffect(() => {
    if (message.status) {
      setStatus(message.status);
    } else if (readBy.length > 0) {
      setStatus('read');
    } else if (message._id) {
      setStatus('delivered');
    } else {
      setStatus('sending');
    }
  }, [message.status, message._id, readBy.length]);

  // Update readBy when message changes
  useEffect(() => {
    if (message.readBy) {
      setReadBy(message.readBy);
    }
  }, [message.readBy]);

  // Listen for real-time read receipt events via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleMessageRead = (data) => {
      if (data.messageId === message._id) {
        setStatus('read');
        setReadBy(prev => {
          // Add userId if not already in array
          if (!prev.some(id => id === data.userId || id._id === data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:read', handleMessageRead);
    };
  }, [socket, message._id]);

  // Auto-mark as read using Intersection Observer
  useEffect(() => {
    // Only mark as read if:
    // 1. User is NOT the sender (receivers mark as read)
    // 2. Message hasn't been read yet
    // 3. Haven't already marked it
    if (isSender || hasMarkedAsRead.current || status === 'read') {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        
        // Mark as read when message is visible and hasn't been marked yet
        if (entry.isIntersecting && !hasMarkedAsRead.current) {
          hasMarkedAsRead.current = true;
          
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(
              `${getBackendURL()}/api/chat/messages/${message._id}/read`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ conversationId })
              }
            );

            const data = await response.json();

            if (!response.ok) {
              console.error('Failed to mark message as read:', data.message);
              hasMarkedAsRead.current = false; // Reset to allow retry
              return;
            }

            // Update local state
            setStatus('read');
            setReadBy(prev => {
              if (!prev.some(id => id === currentUserId || id._id === currentUserId)) {
                return [...prev, currentUserId];
              }
              return prev;
            });

            // Notify parent component
            if (onMessageRead) {
              onMessageRead(message._id);
            }

          } catch (error) {
            console.error('Error marking message as read:', error);
            hasMarkedAsRead.current = false; // Reset to allow retry
          }
        }
      },
      {
        threshold: 0.5, // Mark as read when 50% visible
        rootMargin: '0px'
      }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current);
      }
    };
  }, [message._id, conversationId, currentUserId, isSender, status, onMessageRead]);

  // Render appropriate icon based on status
  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            title="Sending..."
          >
            <Clock className="w-3 h-3 text-gray-400" />
          </motion.div>
        );

      case 'sent':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            title="Sent"
          >
            <Check className="w-3 h-3 text-gray-400" />
          </motion.div>
        );

      case 'delivered':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="relative"
            title="Delivered"
          >
            <CheckCheck className="w-3 h-3 text-gray-400" />
          </motion.div>
        );

      case 'read':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="relative"
            title={`Read by ${readBy.length} ${readBy.length === 1 ? 'person' : 'people'}`}
          >
            <CheckCheck className="w-3 h-3 text-blue-500" />
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Only render for sender's messages
  if (!isSender) {
    // Return invisible element for Intersection Observer to work
    return <span ref={messageRef} className="hidden" />;
  }

  return (
    <span 
      ref={messageRef}
      className="inline-flex items-center ml-1"
    >
      {renderStatusIcon()}
    </span>
  );
};

/**
 * ReadReceiptBulk Component
 * Helper component to mark all messages in a conversation as read
 * Used when opening a conversation or scrolling to bottom
 */
export const ReadReceiptBulk = ({ conversationId, onSuccess }) => {
  const [isMarking, setIsMarking] = useState(false);

  const markAllAsRead = async () => {
    if (isMarking) return;

    setIsMarking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getBackendURL()}/api/chat/conversations/${conversationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark messages as read');
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error marking all messages as read:', error);
      toast.error('Failed to mark messages as read');
    } finally {
      setIsMarking(false);
    }
  };

  // Auto-mark all as read when component mounts
  useEffect(() => {
    markAllAsRead();
  }, [conversationId]);

  return null;
};

export default ReadReceipt;
