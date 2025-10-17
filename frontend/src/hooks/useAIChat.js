import { useState, useCallback, useRef, useEffect } from 'react';
import { getBackendURL } from '../config/api';
import toast from 'react-hot-toast';

const API_URL = getBackendURL();

/**
 * Enhanced custom hook for AI chat functionality
 * Provides chat state management, message streaming, conversation persistence, and typing indicators
 */
export const useAIChat = (token, conversationId = null) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [conversationState, setConversationState] = useState({
    id: conversationId,
    title: 'AI Assistant Chat',
    lastMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const abortControllerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Add a new message to the chat
  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Load conversation history
  const loadMessages = useCallback(async (convId) => {
    const conversationIdToLoad = convId || conversationState?.id;
    
    if (!conversationIdToLoad || !token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/ai/conversations/${conversationIdToLoad}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load messages' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the API response structure: { success: true, data: { conversation, messages, page, hasMore } }
      const data = result.success ? result.data : result;
      
      setMessages(data.messages || []);
      
      if (data.conversation) {
        setConversationState(prev => ({
          ...prev,
          id: data.conversation._id,
          ...data.conversation
        }));
      }
    } catch (err) {
      console.error('Load messages error:', err);
      setError(err.message);
      toast.error(`Failed to load messages: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Create a new AI conversation
  const createConversation = useCallback(async (initialMessage = null) => {
    if (!token) {
      setError('Authentication required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/ai/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'AI Assistant Chat',
          initialMessage: initialMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create conversation' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the API response structure: { success: true, data: { conversation, messages } }
      if (data.success && data.data && data.data.conversation) {
        const conv = data.data.conversation;
        setConversationState({
          id: conv._id,
          title: conv.title,
          ...conv
        });
        setMessages(data.data.messages || []);
        return conv._id;
      } else if (data.conversation) {
        // Fallback for direct conversation response
        setConversationState({
          id: data.conversation._id,
          title: data.conversation.title,
          ...data.conversation
        });
        setMessages(data.messages || []);
        return data.conversation._id;
      } else {
        throw new Error('Invalid conversation response from server');
      }
    } catch (err) {
      console.error('Create conversation error:', err);
      setError(err.message);
      toast.error(`Failed to create conversation: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Send a message to the AI
  const sendMessage = useCallback(async (content, user = null) => {
    if (!content.trim() || isLoading) return null;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    const messageId = Date.now().toString();
    const userMessage = {
      _id: messageId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending',
      sender: user ? {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        type: 'user'
      } : {
        _id: 'current-user',
        firstName: 'You',
        lastName: '',
        type: 'user'
      }
    };

    try {
      setIsLoading(true);
      setIsTyping(false);
      setError(null);

      // Add user message immediately
      addMessage(userMessage);

      // Ensure we have a conversation
      let currentConvId = conversationState?.id;
      if (!currentConvId) {
        currentConvId = await createConversation(content);
        if (!currentConvId) {
          throw new Error('Failed to create conversation');
        }
      }

      // Send message to backend with conversation support
      const response = await fetch(`${API_URL}/ai/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          role: 'user'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        // Fallback to simple AI chat endpoint
        const fallbackResponse = await fetch(`${API_URL}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: content.trim() }),
          signal: abortControllerRef.current.signal
        });

        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
        }

        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success) {
          // Update user message status
          setMessages(prev => prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, status: 'sent' }
              : msg
          ));

          // Show AI typing indicator
          setIsTyping(true);
          
          // Add AI response with typing delay
          typingTimeoutRef.current = setTimeout(() => {
            const aiMessage = {
              _id: `ai-${Date.now()}`,
              role: 'assistant',
              content: fallbackData.data.response,
              timestamp: new Date(fallbackData.data.timestamp),
              sender: {
                _id: 'ai-guide',
                firstName: 'AI',
                lastName: 'Guide',
                type: 'ai'
              }
            };
            addMessage(aiMessage);
            setIsTyping(false);
          }, Math.min(fallbackData.data.response.length * 20, 2000));

          return fallbackData.data;
        } else {
          throw new Error(fallbackData.message || 'Failed to get AI response');
        }
      }

      const result = await response.json();
      
      // Handle the API response structure: { success: true, data: { userMessage, aiMessage, conversation } }
      const data = result.success ? result.data : result;

      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'sent', _id: data.userMessage?._id || messageId }
          : msg
      ));

      // Show AI typing indicator
      setIsTyping(true);
      
      // Add AI response
      if (data.aiMessage) {
        typingTimeoutRef.current = setTimeout(() => {
          addMessage({
            ...data.aiMessage,
            role: 'assistant',
            timestamp: new Date(data.aiMessage.createdAt || data.aiMessage.timestamp),
            sender: {
              _id: 'ai-guide',
              firstName: 'AI',
              lastName: 'Guide',
              type: 'ai'
            }
          });
          setIsTyping(false);
        }, Math.min(data.aiMessage.content.length * 20, 2000));
      } else {
        setIsTyping(false);
      }

      // Update conversation state
      if (data.conversation) {
        setConversationState(prev => ({
          ...prev,
          id: data.conversation.id || data.conversation._id,
          ...data.conversation
        }));
      }

      return data.aiMessage;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
        return null;
      }

      console.error('AI chat error:', err);
      setError(err.message);

      // Update user message with error status
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'error', error: err.message }
          : msg
      ));

      // Add error message
      const errorMessage = {
        _id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        sender: {
          _id: 'ai-guide',
          firstName: 'AI',
          lastName: 'Guide',
          type: 'ai'
        },
        isError: true
      };
      
      addMessage(errorMessage);
      toast.error(`Failed to send message: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [token, conversationState, isLoading, addMessage, createConversation]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    if (!token || !conversationState?.id) return false;

    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationState.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success('Message deleted');
        return true;
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Delete message error:', err);
      toast.error(`Failed to delete message: ${err.message}`);
      return false;
    }
  }, [token, conversationState]);

  // Retry sending a failed message
  const retryMessage = useCallback((message, user) => {
    if (message.status === 'error') {
      sendMessage(message.content, user);
    }
  }, [sendMessage]);

  // Get conversation list
  const getConversations = useCallback(async () => {
    if (!token) return [];

    try {
      const response = await fetch(`${API_URL}/ai/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.conversations || [];
      } else {
        throw new Error('Failed to fetch conversations');
      }
    } catch (err) {
      console.error('Get conversations error:', err);
      toast.error(`Failed to load conversations: ${err.message}`);
      return [];
    }
  }, [token]);

  // Load specific conversation
  const loadConversation = useCallback((convId) => {
    setConversationState(prev => ({ ...prev, id: convId }));
    setMessages([]);
    setError(null);
  }, []);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsTyping(false);
    }
  }, []);

  // Clear chat history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Retry last message
  const retry = useCallback((user) => {
    if (messages.length === 0) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, user);
    }
  }, [messages, sendMessage]);

  // Load initial conversation if ID provided
  useEffect(() => {
    if (conversationState?.id && token) {
      loadMessages(conversationState.id);
    }
  }, [token, loadMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,
    conversationState,

    // Actions
    sendMessage,
    loadMessages,
    clearMessages,
    deleteMessage,
    retryMessage,
    createConversation,
    getConversations,
    loadConversation,
    cancelRequest,
    retry,
    addMessage,

    // Utilities
    hasMessages: messages.length > 0,
    lastMessage: messages[messages.length - 1] || null,
    messageCount: messages.length
  };
};

export default useAIChat;
