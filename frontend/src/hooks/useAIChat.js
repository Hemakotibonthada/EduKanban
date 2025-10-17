import { useState, useCallback, useRef, useEffect } from 'react';
import { getBackendURL } from '../config/api';

const API_URL = getBackendURL();

/**
 * Custom hook for AI chat functionality
 * Provides chat state management and message streaming
 */
export const useAIChat = (token) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Add a new message to the chat
  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Send a message to the AI
  const sendMessage = useCallback(async (content, user) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      _id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      sender: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        type: 'user'
      }
    };
    
    addMessage(userMessage);
    setIsLoading(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: content.trim() }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Add AI response
        const aiMessage = {
          _id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(data.data.timestamp),
          sender: {
            _id: 'ai-guide',
            firstName: 'AI',
            lastName: 'Guide',
            type: 'ai'
          }
        };
        
        addMessage(aiMessage);
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }

      console.error('AI chat error:', err);
      setError(err.message);

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
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [token, addMessage]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Clear chat history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Retry last message
  const retry = useCallback((user) => {
    if (messages.length === 0) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, user);
    }
  }, [messages, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearMessages,
    retry,
    addMessage
  };
};

export default useAIChat;
