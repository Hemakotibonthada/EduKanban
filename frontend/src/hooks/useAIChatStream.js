import { useState, useCallback, useRef, useEffect } from 'react';
import { getBackendURL } from '../config/api';
import toast from 'react-hot-toast';

const API_URL = getBackendURL();

/**
 * Enhanced custom hook for AI chat functionality with streaming support
 * Provides chat state management, message streaming, markdown support, real-time typing,
 * and conversation persistence
 */
export const useAIChatStream = (token, options = {}) => {
  const { autoSave = true, conversationId: initialConversationId = null } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [error, setError] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  const abortControllerRef = useRef(null);
  const eventSourceRef = useRef(null);
  const conversationIdRef = useRef(initialConversationId);

  // Add a new message to the chat
  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Fetch all conversations for the user
  const loadConversations = useCallback(async (filters = {}) => {
    if (!token) return;

    try {
      setIsLoadingConversations(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_URL}/ai/conversations?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle nested data structure
        const conversations = data.conversations || (data.data && data.data.conversations) || [];
        setConversations(conversations);
        return conversations;
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  // Load messages from a specific conversation
  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId || !token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle nested data structure
        const conversation = data.conversation || (data.data && data.data.conversation) || data.data;
        const messages = data.messages || (data.data && data.data.messages) || [];
        
        // Transform AIMessage format to match current message format
        const transformedMessages = messages.map(msg => ({
          _id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          sender: msg.role === 'user' ? {
            _id: msg.metadata?.userId || 'current-user',
            firstName: 'You',
            lastName: '',
            type: 'user'
          } : {
            _id: 'ai-guide',
            firstName: 'AI',
            lastName: 'Guide',
            type: 'ai'
          },
          metadata: msg.metadata
        }));

        setMessages(transformedMessages);
        if (conversation) {
          setCurrentConversation(conversation);
          conversationIdRef.current = conversationId;
        }
        return data;
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      toast.error('Failed to load conversation');
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Create a new conversation
  const createConversation = useCallback(async (metadata = {}) => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/ai/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Create conversation response:', data); // Debug log
      
      // Handle both response formats: data.conversation or data.data.conversation
      const conversation = data.conversation || (data.data && data.data.conversation) || data.data;
      
      if (conversation && conversation._id) {
        setCurrentConversation(conversation);
        conversationIdRef.current = conversation._id;
        console.log('Conversation created successfully:', conversation._id);
        return conversation;
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format: conversation data missing');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast.error('Failed to create conversation');
      return null;
    }
  }, [token]);

  // Save a message to the current conversation
  const saveMessage = useCallback(async (role, content, metadata = {}) => {
    if (!conversationIdRef.current || !token) return null;

    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationIdRef.current}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          content,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error saving message:', err);
      // Don't show error toast for auto-save failures
      if (!autoSave) {
        toast.error('Failed to save message');
      }
      return null;
    }
  }, [token, autoSave]);

  // Update conversation metadata
  const updateConversation = useCallback(async (conversationId, updates) => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle nested data structure
        const conversation = data.conversation || (data.data && data.data.conversation) || data.data;
        
        if (conversation && conversationId === conversationIdRef.current) {
          setCurrentConversation(conversation);
        }
        toast.success('Conversation updated');
        return conversation;
      }
    } catch (err) {
      console.error('Error updating conversation:', err);
      toast.error('Failed to update conversation');
      return null;
    }
  }, [token]);

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId, archive = true) => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ archive })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success(archive ? 'Conversation archived' : 'Conversation restored');
        await loadConversations(); // Refresh list
        return true;
      }
    } catch (err) {
      console.error('Error archiving conversation:', err);
      toast.error('Failed to archive conversation');
      return false;
    }
  }, [token, loadConversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/ai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Conversation deleted');
        
        // Clear current conversation if it was deleted
        if (conversationId === conversationIdRef.current) {
          setMessages([]);
          setCurrentConversation(null);
          conversationIdRef.current = null;
        }
        
        await loadConversations(); // Refresh list
        return true;
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
      return false;
    }
  }, [token, loadConversations]);

  // Start a new conversation
  const startNewConversation = useCallback(async (title = 'New Conversation') => {
    const conversation = await createConversation({ title });
    if (conversation) {
      setMessages([]);
      setCurrentConversation(conversation);
      conversationIdRef.current = conversation._id;
      // Reload conversations list to show the new conversation immediately
      await loadConversations();
    }
    return conversation;
  }, [createConversation, loadConversations]);

  // Update the current streaming message
  const updateStreamMessage = useCallback((content) => {
    setCurrentStreamMessage(content);
  }, []);

  // Send a message to the AI with streaming
  const sendMessageStream = useCallback(async (content, user = null) => {
    if (!content.trim() || isLoading || isStreaming) return null;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    const messageId = `user-${Date.now()}`;
    const userMessage = {
      _id: messageId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
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
      setIsStreaming(true);
      setError(null);
      setCurrentStreamMessage('');

      // Add user message immediately
      addMessage(userMessage);

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`;
      
      // Make streaming request
      const response = await fetch(`${API_URL}/ai/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: content.trim()
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Process complete lines, keep incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.substring(7).trim();
            continue; // We'll handle the data line next
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.content) {
                streamedContent += data.content;
                updateStreamMessage(streamedContent);
              }
              
              if (data.error) {
                throw new Error(data.message || 'Streaming error');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Add completed AI message
      const aiMessage = {
        _id: aiMessageId,
        role: 'assistant',
        content: streamedContent,
        timestamp: new Date(),
        sender: {
          _id: 'ai-guide',
          firstName: 'AI',
          lastName: 'Guide',
          type: 'ai'
        }
      };
      
      addMessage(aiMessage);
      setCurrentStreamMessage('');

      // Auto-save messages to conversation if enabled
      if (autoSave && token) {
        try {
          // Create conversation if it doesn't exist
          if (!conversationIdRef.current) {
            const newConversation = await createConversation({ 
              title: content.trim().substring(0, 50) + (content.trim().length > 50 ? '...' : '')
            });
            if (newConversation && newConversation._id) {
              conversationIdRef.current = newConversation._id;
              // Reload conversations list to show the new conversation immediately
              await loadConversations();
            } else {
              console.warn('Failed to create conversation - auto-save disabled for this session');
            }
          }

          // Save both user and AI messages
          if (conversationIdRef.current) {
            await saveMessage('user', content.trim());
            await saveMessage('assistant', streamedContent);
          }
        } catch (saveError) {
          console.error('Error auto-saving messages:', saveError);
          // Don't block UI for save errors
        }
      }
      
      return aiMessage;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
        return null;
      }

      console.error('AI streaming chat error:', err);
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
      toast.error(`Failed to send message: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamMessage('');
    }
  }, [token, isLoading, isStreaming, addMessage, updateStreamMessage]);

  // Fallback to non-streaming chat
  const sendMessage = useCallback(async (content, user = null) => {
    if (!content.trim() || isLoading) return null;

    const messageId = `user-${Date.now()}`;
    const userMessage = {
      _id: messageId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
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
      setError(null);

      // Add user message immediately
      addMessage(userMessage);

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: content.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
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
        return aiMessage;
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setError(err.message);

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
    }
  }, [token, isLoading, addMessage]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentStreamMessage('');
  }, []);

  // Clear chat history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStreamMessage('');
    setError(null);
    cancelRequest();
  }, [cancelRequest]);

  // Retry last message
  const retry = useCallback((user) => {
    if (messages.length === 0) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      sendMessageStream(lastUserMessage.content, user);
    }
  }, [messages, sendMessageStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, [cancelRequest]);

  // Load conversations on mount if token is available
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token, loadConversations]);

  // Load initial conversation if provided
  useEffect(() => {
    if (initialConversationId && token) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, token, loadConversation]);

  return {
    // State
    messages,
    isLoading,
    isStreaming,
    currentStreamMessage,
    error,
    currentConversation,
    conversations,
    isLoadingConversations,

    // Chat Actions
    sendMessage,              // Non-streaming fallback
    sendMessageStream,        // Streaming version (with auto-save)
    clearMessages,
    cancelRequest,
    retry,
    addMessage,

    // Conversation Management
    loadConversations,        // Fetch all conversations
    loadConversation,         // Load specific conversation
    createConversation,       // Create new conversation
    startNewConversation,     // Start fresh conversation
    updateConversation,       // Update conversation metadata
    archiveConversation,      // Archive/unarchive conversation
    deleteConversation,       // Delete conversation
    saveMessage,              // Manually save a message

    // Utilities
    hasMessages: messages?.length > 0,
    lastMessage: messages?.[messages.length - 1] || null,
    messageCount: messages?.length || 0,
    hasStreamingMessage: (currentStreamMessage || '')?.length > 0,
    hasConversations: conversations?.length > 0,
    conversationId: conversationIdRef.current
  };
};

export default useAIChatStream;
