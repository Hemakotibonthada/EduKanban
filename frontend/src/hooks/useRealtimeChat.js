import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * useRealtimeChat Hook
 * Manages all Socket.IO real-time events for chat functionality
 * 
 * @param {object} socket - Socket.IO instance
 * @param {object} callbacks - Object containing callback functions for each event
 * @param {string} currentUserId - ID of current logged-in user
 * 
 * Callbacks:
 * - onReactionAdded: (data: { messageId, reaction, userId }) => void
 * - onReactionRemoved: (data: { messageId, reaction, userId }) => void
 * - onMessageEdited: (data: { messageId, content, editedAt }) => void
 * - onMessageDeleted: (data: { messageId, conversationId }) => void
 * - onMessageRead: (data: { messageId, userId, conversationId }) => void
 * - onConversationReadAll: (data: { conversationId, userId }) => void
 * - onThreadReply: (data: { threadId, reply, parentMessageId }) => void
 * - onMessagePinned: (data: { messageId, isPinned, pinnedBy }) => void
 * - onNewMessage: (data: { message, conversationId }) => void (optional)
 * - onTyping: (data: { userId, conversationId, isTyping }) => void (optional)
 * 
 * Features:
 * - Auto-connect/disconnect Socket.IO events
 * - Centralized event handling
 * - Toast notifications for real-time updates
 * - Error handling and reconnection
 * - Clean event listener management
 * 
 * Events Handled:
 * 1. message:reaction:add - Someone added a reaction
 * 2. message:reaction:remove - Someone removed a reaction
 * 3. message:edited - Message was edited
 * 4. message:deleted - Message was deleted
 * 5. message:read - Message was read by someone
 * 6. conversation:read:all - All messages in conversation marked as read
 * 7. message:thread:reply - New reply in a thread
 * 8. message:pinned - Message was pinned/unpinned
 */
const useRealtimeChat = (socket, callbacks = {}, currentUserId) => {
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // 1. Handle Reaction Added
  const handleReactionAdded = useCallback((data) => {
    console.log('Reaction added:', data);
    
    if (callbacksRef.current.onReactionAdded) {
      callbacksRef.current.onReactionAdded(data);
    }

    // Show toast if someone else reacted
    if (data.userId !== currentUserId) {
      const emoji = data.reaction || '👍';
      toast(`${emoji} New reaction`, {
        duration: 2000,
        icon: emoji
      });
    }
  }, [currentUserId]);

  // 2. Handle Reaction Removed
  const handleReactionRemoved = useCallback((data) => {
    console.log('Reaction removed:', data);
    
    if (callbacksRef.current.onReactionRemoved) {
      callbacksRef.current.onReactionRemoved(data);
    }
  }, []);

  // 3. Handle Message Edited
  const handleMessageEdited = useCallback((data) => {
    console.log('Message edited:', data);
    
    if (callbacksRef.current.onMessageEdited) {
      callbacksRef.current.onMessageEdited(data);
    }

    // Show toast if someone else edited (in group chats)
    if (data.userId && data.userId !== currentUserId) {
      toast('Message was edited', {
        duration: 2000,
        icon: '✏️'
      });
    }
  }, [currentUserId]);

  // 4. Handle Message Deleted
  const handleMessageDeleted = useCallback((data) => {
    console.log('Message deleted:', data);
    
    if (callbacksRef.current.onMessageDeleted) {
      callbacksRef.current.onMessageDeleted(data);
    }

    // Show toast if someone else deleted
    if (data.userId && data.userId !== currentUserId) {
      toast('A message was deleted', {
        duration: 2000,
        icon: '🗑️'
      });
    }
  }, [currentUserId]);

  // 5. Handle Message Read
  const handleMessageRead = useCallback((data) => {
    console.log('Message read:', data);
    
    if (callbacksRef.current.onMessageRead) {
      callbacksRef.current.onMessageRead(data);
    }

    // No toast for read receipts (too spammy)
  }, []);

  // 6. Handle Conversation Read All
  const handleConversationReadAll = useCallback((data) => {
    console.log('Conversation read all:', data);
    
    if (callbacksRef.current.onConversationReadAll) {
      callbacksRef.current.onConversationReadAll(data);
    }
  }, []);

  // 7. Handle Thread Reply
  const handleThreadReply = useCallback((data) => {
    console.log('Thread reply:', data);
    
    if (callbacksRef.current.onThreadReply) {
      callbacksRef.current.onThreadReply(data);
    }

    // Show toast for new replies in threads you're following
    if (data.reply?.sender?._id !== currentUserId) {
      toast('New reply in thread', {
        duration: 3000,
        icon: '💬'
      });
    }
  }, [currentUserId]);

  // 8. Handle Message Pinned
  const handleMessagePinned = useCallback((data) => {
    console.log('Message pinned:', data);
    
    if (callbacksRef.current.onMessagePinned) {
      callbacksRef.current.onMessagePinned(data);
    }

    // Show toast if someone else pinned
    if (data.pinnedBy?._id !== currentUserId) {
      toast(data.isPinned ? 'Message pinned' : 'Message unpinned', {
        duration: 2000,
        icon: data.isPinned ? '📌' : '📍'
      });
    }
  }, [currentUserId]);

  // Optional: Handle New Message
  const handleNewMessage = useCallback((data) => {
    console.log('New message:', data);
    
    if (callbacksRef.current.onNewMessage) {
      callbacksRef.current.onNewMessage(data);
    }
  }, []);

  // Optional: Handle Typing Indicator
  const handleTyping = useCallback((data) => {
    if (callbacksRef.current.onTyping) {
      callbacksRef.current.onTyping(data);
    }
  }, []);

  // Socket.IO Connection Management
  useEffect(() => {
    if (!socket) {
      console.warn('Socket instance not provided to useRealtimeChat');
      return;
    }

    // Connection event handlers
    const handleConnect = () => {
      console.log('Socket.IO connected:', socket.id);
    };

    const handleDisconnect = (reason) => {
      console.log('Socket.IO disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    };

    const handleConnectError = (error) => {
      console.error('Socket.IO connection error:', error);
      toast.error('Connection error. Retrying...');
    };

    const handleReconnect = (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      toast.success('Reconnected!');
    };

    // Register connection event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect', handleReconnect);

    // Register chat event listeners
    socket.on('message:reaction:add', handleReactionAdded);
    socket.on('message:reaction:remove', handleReactionRemoved);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:read', handleMessageRead);
    socket.on('conversation:read:all', handleConversationReadAll);
    socket.on('message:thread:reply', handleThreadReply);
    socket.on('message:pinned', handleMessagePinned);
    
    // Optional events
    if (callbacksRef.current.onNewMessage) {
      socket.on('new:message', handleNewMessage);
    }
    if (callbacksRef.current.onTyping) {
      socket.on('user:typing', handleTyping);
    }

    // Cleanup function
    return () => {
      // Remove connection listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect', handleReconnect);

      // Remove chat event listeners
      socket.off('message:reaction:add', handleReactionAdded);
      socket.off('message:reaction:remove', handleReactionRemoved);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:read', handleMessageRead);
      socket.off('conversation:read:all', handleConversationReadAll);
      socket.off('message:thread:reply', handleThreadReply);
      socket.off('message:pinned', handleMessagePinned);
      socket.off('new:message', handleNewMessage);
      socket.off('user:typing', handleTyping);
    };
  }, [
    socket,
    handleReactionAdded,
    handleReactionRemoved,
    handleMessageEdited,
    handleMessageDeleted,
    handleMessageRead,
    handleConversationReadAll,
    handleThreadReply,
    handleMessagePinned,
    handleNewMessage,
    handleTyping
  ]);

  // Helper function to emit typing indicator
  const emitTyping = useCallback((conversationId, isTyping) => {
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  }, [socket]);

  // Helper function to join a conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socket && socket.connected) {
      socket.emit('join:conversation', { conversationId });
      console.log('Joined conversation room:', conversationId);
    }
  }, [socket]);

  // Helper function to leave a conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socket && socket.connected) {
      socket.emit('leave:conversation', { conversationId });
      console.log('Left conversation room:', conversationId);
    }
  }, [socket]);

  // Return helper functions
  return {
    emitTyping,
    joinConversation,
    leaveConversation,
    isConnected: socket?.connected || false
  };
};

export default useRealtimeChat;
