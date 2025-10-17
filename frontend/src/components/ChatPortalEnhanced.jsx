import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, Search, Plus, Hash, Users, UserPlus, Settings,
  Smile, Paperclip, Image, Video, FileText, X, Check, Clock, MoreVertical,
  Star, Reply, Trash2, Edit3, Pin, LogOut, UserCheck, UserX, Globe, Lock,
  ChevronDown, ChevronRight, Phone, VideoIcon, Mic, Shield, Crown, AlertCircle,
  Menu, ArrowLeft, Forward, Home
} from 'lucide-react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { getBackendURL, getSocketURL } from '../config/api';
import { CreateCommunityModal, CreateGroupModal, UserSearchModal } from './ChatModals';
import { useAIChat } from '../hooks/useAIChat';

const API_URL = getBackendURL();
const SOCKET_URL = getSocketURL();

const ChatPortalEnhanced = ({ user, token, onNavigateHome }) => {
  // Navigation state
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('chatActiveTab') || 'friends';
  });
  const [selectedChat, setSelectedChat] = useState(() => {
    return localStorage.getItem('chatSelectedChat') || null;
  });
  const [selectedChatType, setSelectedChatType] = useState(() => {
    return localStorage.getItem('chatSelectedChatType') || null;
  });
  
  // Data state
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  
  // AI Chat hook
  const {
    messages: aiMessages,
    isLoading: aiIsTyping,
    error: aiError,
    sendMessage: sendAIMessage,
    clearMessages: clearAIMessages
  } = useAIChat(token);
  
  // UI state
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map()); // Map userId -> { name, timestamp }
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Advanced features state
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Modals
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Persist chat state to localStorage
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('chatSelectedChat', selectedChat);
    } else {
      localStorage.removeItem('chatSelectedChat');
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChatType) {
      localStorage.setItem('chatSelectedChatType', selectedChatType);
    } else {
      localStorage.removeItem('chatSelectedChatType');
    }
  }, [selectedChatType]);

  useEffect(() => {
    localStorage.setItem('chatActiveTab', activeTab);
  }, [activeTab]);

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      console.log('🔌 Socket ID:', socket.id);
      // Request online status refresh after connection
      setTimeout(() => {
        loadFriends(); // Refresh to get latest online status
      }, 500);
    });

    socket.on('new_message', (message) => {
      console.log('📨 Received new message:', message);
      setMessages(prev => {
        // Avoid duplicates - check if message already exists
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    socket.on('message_sent', ({ tempId, message }) => {
      console.log('✅ Message confirmed by server:', tempId, message);
      setMessages(prev => {
        // Check if real message already exists (from new_message event)
        const realExists = prev.some(msg => msg._id === message._id);
        if (realExists) {
          console.log('⚠️ Real message already exists, removing temp');
          // Just remove the temp message
          return prev.filter(msg => msg._id !== `temp-${tempId}`);
        }
        // Replace temporary message with real one
        return prev.map(msg => 
          msg._id === `temp-${tempId}` ? message : msg
        );
      });
      scrollToBottom();
    });

    socket.on('message_error', ({ tempId, error }) => {
      console.error('❌ Message failed:', tempId, error);
      toast.error(`Failed to send message: ${error}`);
      setMessages(prev => {
        // Remove failed temporary message
        return prev.filter(msg => msg._id !== `temp-${tempId}`);
      });
    });

    socket.on('user_typing', ({ userId, userName, isTyping }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(userId, { name: userName || 'Someone', timestamp: Date.now() });
        } else {
          newMap.delete(userId);
        }
        return newMap;
      });
      
      // Auto-remove after 5 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            const userInfo = newMap.get(userId);
            if (userInfo && Date.now() - userInfo.timestamp > 4000) {
              newMap.delete(userId);
            }
            return newMap;
          });
        }, 5000);
      }
    });

    socket.on('friend_online', ({ userId }) => {
      console.log('🟢 Friend came online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('friend_offline', ({ userId }) => {
      console.log('⚫ Friend went offline:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on('reaction_added', ({ messageId, userId, emoji }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { user: userId, emoji }]
          };
        }
        return msg;
      }));
    });

    socket.on('message_deleted', ({ messageId }) => {
      console.log('🗑️ Message deleted:', messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    socket.on('message_edited', ({ messageId, content }) => {
      console.log('✏️ Message edited:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, content, edited: true } : msg
      ));
    });

    socket.on('pin_message', ({ messageId, pinned }) => {
      console.log('📌 Message pin status changed:', messageId, pinned);
      if (pinned) {
        setPinnedMessages(prev => [...prev, messageId]);
      } else {
        setPinnedMessages(prev => prev.filter(id => id !== messageId));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadConversations();
    loadCommunities();
    loadGroups();
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && selectedChatType) {
      loadMessages();
    }
  }, [selectedChat, selectedChatType]);

  const loadFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/users/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends);
        
        // Initialize online users from friends' onlineStatus
        const onlineFriendIds = data.data.friends
          .filter(friend => friend.onlineStatus?.isOnline === true)
          .map(friend => friend._id);
        setOnlineUsers(new Set(onlineFriendIds));
        console.log('✅ Initialized online users:', onlineFriendIds.length, 'friends online');
      }
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFriendRequests(data.data);
      }
    } catch (error) {
      console.error('Load friend requests error:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadCommunities = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/communities/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCommunities(data.data.communities);
      }
    } catch (error) {
      console.error('Load communities error:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGroups(data.data.groups);
      }
    } catch (error) {
      console.error('Load groups error:', error);
    }
  };

  const loadMessages = async () => {
    // Skip loading messages for AI chat - it uses its own message management
    if (selectedChatType === 'ai') {
      return;
    }

    // Skip if no valid chat is selected
    if (!selectedChat || !selectedChatType) {
      return;
    }

    setLoading(true);
    try {
      let url = '';
      if (selectedChatType === 'user') {
        // Use direct messages endpoint with user ID
        url = `${API_URL}/chat-enhanced/direct-messages/${selectedChat}`;
      } else if (selectedChatType === 'channel') {
        url = `${API_URL}/chat-enhanced/channels/${selectedChat}/messages`;
      } else if (selectedChatType === 'group') {
        url = `${API_URL}/chat-enhanced/groups/${selectedChat}/messages`;
      }

      // Double-check we have a valid URL
      if (!url) {
        console.warn('⚠️ No valid URL for loading messages');
        return;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
        console.log('✅ Loaded', data.data.messages.length, 'messages');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToAI = async () => {
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    await sendAIMessage(messageContent, user);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && uploadingFiles.length === 0) return;

    // Handle AI chat separately
    if (selectedChatType === 'ai' && selectedChat === 'ai-guide') {
      await sendMessageToAI();
      return;
    }

    // Check if we're editing a message
    if (editingMessage) {
      await editMessage(editingMessage._id, newMessage.trim());
      setNewMessage('');
      setEditingMessage(null);
      return;
    }

    const tempId = Date.now();
    const messageData = {
      targetType: selectedChatType,
      targetId: selectedChat,
      content: newMessage.trim(),
      messageType: 'text',
      replyTo: replyingTo?._id,
      tempId
    };

    console.log('📤 Sending message:', messageData);

    // Optimistic update
    const optimisticMessage = {
      _id: `temp-${tempId}`,
      sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar },
      content: newMessage,
      createdAt: new Date(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyingTo(null);

    // Send via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
      console.log('✅ Message emitted via Socket.IO');
    } else {
      console.error('❌ Socket not connected!');
      toast.error('Not connected to chat server');
    }
  };

  const handleTyping = () => {
    if (socketRef.current && selectedChat) {
      socketRef.current.emit('typing', {
        targetType: selectedChatType,
        targetId: selectedChat,
        isTyping: true
      });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', {
          targetType: selectedChatType,
          targetId: selectedChat,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleFileUpload = async (files) => {
    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', selectedChatType);
      formData.append('targetId', selectedChat);

      try {
        setUploadingFiles(prev => [...prev, file.name]);
        const response = await fetch(`${API_URL}/chat-enhanced/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          toast.success(`${file.name} uploaded`);
          // You can send a message with the file attachment here
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Error uploading ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    noClick: true,
    noKeyboard: true,
    accept: {
      // Images
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico', '.heic', '.heif'],
      
      // Videos
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.3gp', '.3g2', '.mpeg', '.mkv'],
      
      // Audio (including voice recordings and music)
      'audio/*': ['.mp3', '.wav', '.ogg', '.webm', '.aac', '.flac', '.m4a', '.opus', '.amr', '.wma', '.midi'],
      
      // Documents
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      
      // Text files
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/html': ['.html'],
      'text/css': ['.css'],
      'text/javascript': ['.js'],
      'application/json': ['.json'],
      'text/xml': ['.xml'],
      'text/markdown': ['.md'],
      'text/rtf': ['.rtf'],
      
      // OpenDocument
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
      'application/vnd.oasis.opendocument.presentation': ['.odp'],
      
      // Archives
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'application/x-tar': ['.tar'],
      'application/gzip': ['.gz'],
      
      // Code files
      'text/x-python': ['.py'],
      'text/x-java-source': ['.java'],
      'text/x-c': ['.c'],
      'text/x-c++': ['.cpp'],
      'text/x-csharp': ['.cs'],
      'application/x-httpd-php': ['.php']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const addReaction = async (messageId, emoji) => {
    try {
      // Emit via Socket.IO for real-time update
      if (socketRef.current) {
        socketRef.current.emit('add_reaction', { messageId, emoji });
        // Optimistically update UI
        setMessages(prev => prev.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            return { ...msg, reactions: [...reactions, { user: user._id, emoji }] };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Add reaction error:', error);
      toast.error('Failed to add reaction');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success('Message deleted');
        // Emit Socket.IO event to notify other users
        socketRef.current?.emit('delete_message', { messageId });
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Failed to delete message');
    }
  };

  const editMessage = async (messageId, newContent) => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? updatedMessage : msg
        ));
        toast.success('Message updated');
        // Emit Socket.IO event
        socketRef.current?.emit('edit_message', { messageId, content: newContent });
      }
    } catch (error) {
      console.error('Edit message error:', error);
      toast.error('Failed to edit message');
    }
  };

  // Pin/Unpin message
  const togglePinMessage = async (messageId) => {
    try {
      const isPinned = pinnedMessages.includes(messageId);
      const response = await fetch(`${API_URL}/chat-enhanced/messages/${messageId}/pin`, {
        method: isPinned ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        if (isPinned) {
          setPinnedMessages(prev => prev.filter(id => id !== messageId));
          toast.success('Message unpinned');
        } else {
          setPinnedMessages(prev => [...prev, messageId]);
          toast.success('Message pinned');
        }
        socketRef.current?.emit('pin_message', { messageId, pinned: !isPinned });
      }
    } catch (error) {
      console.error('Pin message error:', error);
      toast.error('Failed to pin message');
    }
  };

  // Forward message
  const forwardMessage = async (messageId, targetChats) => {
    try {
      const message = messages.find(m => m._id === messageId);
      if (!message) return;

      for (const chat of targetChats) {
        const messageData = {
          targetType: chat.type,
          targetId: chat.id,
          content: message.content,
          messageType: message.messageType,
          forwarded: true,
          originalSender: message.sender._id
        };

        socketRef.current?.emit('send_message', messageData);
      }
      
      toast.success(`Message forwarded to ${targetChats.length} chat(s)`);
      setForwardingMessage(null);
      setShowForwardModal(false);
    } catch (error) {
      console.error('Forward message error:', error);
      toast.error('Failed to forward message');
    }
  };

  // Search messages
  const searchMessages = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const filtered = messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadVoiceMessage(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingVoice(true);
      
      // Start timer
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        if (seconds >= 300) { // Max 5 minutes
          stopVoiceRecording();
          clearInterval(timer);
        }
      }, 1000);
      
      recorder.timer = timer;
    } catch (error) {
      console.error('Voice recording error:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(mediaRecorder.timer);
      setIsRecordingVoice(false);
      setRecordingTime(0);
    }
  };

  const uploadVoiceMessage = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, `voice_${Date.now()}.webm`);
    formData.append('targetType', selectedChatType);
    formData.append('targetId', selectedChat);
    formData.append('messageType', 'voice');

    try {
      const response = await fetch(`${API_URL}/chat-enhanced/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Voice message sent');
      }
    } catch (error) {
      console.error('Upload voice error:', error);
      toast.error('Failed to send voice message');
    }
  };

  // Video recording
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadVideoMessage(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingVideo(true);
      
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        if (seconds >= 180) { // Max 3 minutes
          stopVideoRecording();
          clearInterval(timer);
        }
      }, 1000);
      
      recorder.timer = timer;
    } catch (error) {
      console.error('Video recording error:', error);
      toast.error('Could not access camera');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(mediaRecorder.timer);
      setIsRecordingVideo(false);
      setRecordingTime(0);
    }
  };

  const uploadVideoMessage = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, `video_${Date.now()}.webm`);
    formData.append('targetType', selectedChatType);
    formData.append('targetId', selectedChat);
    formData.append('messageType', 'video');

    try {
      const response = await fetch(`${API_URL}/chat-enhanced/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Video message sent');
      }
    } catch (error) {
      console.error('Upload video error:', error);
      toast.error('Failed to send video message');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/friend-requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Friend request accepted!');
        loadFriendRequests();
        loadFriends();
      }
    } catch (error) {
      console.error('Accept friend request error:', error);
      toast.error('Failed to accept request');
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/friend-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Friend request rejected');
        loadFriendRequests();
      }
    } catch (error) {
      console.error('Reject friend request error:', error);
      toast.error('Failed to reject request');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Message component
  const MessageComponent = ({ message, isOwn }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`flex max-w-xl ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        {!isOwn && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col">
          {!isOwn && (
            <span className="text-xs text-gray-500 mb-1 px-3">
              {message.sender?.firstName} {message.sender?.lastName}
            </span>
          )}
          
          <div className={`relative px-4 py-2 rounded-2xl ${
            isOwn 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}>
            {message.replyTo && (
              <div className={`text-xs mb-2 p-2 rounded ${
                isOwn ? 'bg-blue-700' : 'bg-gray-200'
              }`}>
                <Reply className="w-3 h-3 inline mr-1" />
                Replying to message
              </div>
            )}
            
            <span className="text-sm whitespace-pre-wrap break-words">{message.content}</span>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{file.originalName}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.createdAt)}
              </span>
              {message.edited && (
                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>(edited)</span>
              )}
              {isOwn && (
                <div className="flex items-center">
                  {message.status === 'read' ? (
                    <div className="relative">
                      <Check className="w-3 h-3 text-blue-200" />
                      <Check className="w-3 h-3 text-blue-200 absolute -right-1" />
                    </div>
                  ) : message.status === 'delivered' ? (
                    <div className="relative">
                      <Check className="w-3 h-3 text-blue-200" />
                      <Check className="w-3 h-3 text-blue-200 absolute -right-1 opacity-50" />
                    </div>
                  ) : (
                    <Clock className="w-3 h-3 text-blue-200" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 px-2">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200"
                  onClick={() => addReaction(message._id, emoji)}
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Message actions */}
        <div className={`relative opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setReplyingTo(message)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-gray-500" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
              className="p-1 hover:bg-gray-200 rounded"
              title="React"
            >
              <Smile className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Quick Reactions Picker */}
            {showEmojiPicker === message._id && (
              <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 bg-white rounded-lg shadow-lg border p-2 z-50 flex gap-1`}>
                {['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      addReaction(message._id, emoji);
                      setShowEmojiPicker(null);
                    }}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMessageMenu(showMessageMenu === message._id ? null : message._id)}
              className="p-1 hover:bg-gray-200 rounded" 
              title="More"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Dropdown Menu */}
            {showMessageMenu === message._id && (
              <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-50 min-w-[150px]`}>
                {isOwn && (
                  <>
                    <button
                      onClick={() => {
                        setEditingMessage(message);
                        setNewMessage(message.content);
                        setShowMessageMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Message
                    </button>
                    <button
                      onClick={() => {
                        deleteMessage(message._id);
                        setShowMessageMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Message
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    togglePinMessage(message._id);
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  {pinnedMessages.includes(message._id) ? 'Unpin' : 'Pin'} Message
                </button>
                <button
                  onClick={() => {
                    setForwardingMessage(message);
                    setShowForwardModal(true);
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    toast.success('Message copied!');
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(message);
                    setShowMessageMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col overflow-hidden" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Top Header Bar with Logo */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-2 md:gap-3">
          {onNavigateHome && (
            <button 
              onClick={onNavigateHome}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold">EduKanban Chat</h1>
            <p className="text-xs text-blue-100 hidden md:block">Connect, Collaborate, Learn Together</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${selectedChat ? 'hidden md:flex' : 'flex'}
          w-full md:w-80 lg:w-96 bg-white border-r flex-col
          overflow-hidden
        `}>
        {/* Tabs */}
        <div className="p-2 md:p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="grid grid-cols-5 gap-1 md:gap-2">
            {[
              { id: 'ai-guide', label: 'AI Guide', icon: Globe },
              { id: 'friends', label: 'Friends', icon: UserPlus },
              { id: 'dms', label: 'DMs', icon: MessageCircle },
              { id: 'communities', label: 'Communities', icon: Users },
              { id: 'groups', label: 'Groups', icon: Hash }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'ai-guide') {
                    setSelectedChat('ai-guide');
                    setSelectedChatType('ai');
                  }
                }}
                className={`px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-blue-500/20 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4 mx-auto md:hidden" />
                <span className="hidden md:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'friends' && (
            <div className="p-3 space-y-2">
              {/* Add Friend Button */}
              <button
                onClick={() => setShowUserSearch(true)}
                className="w-full flex items-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Friend</span>
              </button>

              {/* Friend requests */}
              {friendRequests.received.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                    Pending Requests ({friendRequests.received.length})
                  </h3>
                  {friendRequests.received.map(request => (
                    <div key={request._id} className="bg-white p-3 rounded-lg border mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {request.sender.firstName[0]}{request.sender.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.sender.firstName} {request.sender.lastName}
                          </p>
                          <p className="text-xs text-gray-500">@{request.sender.username}</p>
                        </div>
                      </div>
                      {request.message && (
                        <p className="text-xs text-gray-600 mb-2 italic">"{request.message}"</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptFriendRequest(request._id)}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          <Check className="w-3 h-3 inline mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(request._id)}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                        >
                          <X className="w-3 h-3 inline mr-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Friends list */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                Friends ({friends.length})
              </h3>
              {friends.map(friend => (
                <button
                  key={friend._id}
                  onClick={() => {
                    // Find or create conversation with this friend
                    setSelectedChat(friend._id);
                    setSelectedChatType('user');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {friend.firstName[0]}{friend.lastName[0]}
                      </span>
                    </div>
                    {onlineUsers.has(friend._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-50"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {friend.firstName} {friend.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {onlineUsers.has(friend._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'ai-guide' && (
            <div className="p-4 space-y-4">
              {/* AI Guide Header */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">AI Learning Guide</h3>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Always Available</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Your personal AI assistant for learning support, course guidance, and instant answers to your questions.
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedChat('ai-guide');
                      setSelectedChatType('ai');
                      setNewMessage("Help me understand a topic");
                    }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-xs font-medium text-gray-900">Explain Topic</div>
                    <div className="text-xs text-gray-500">Get explanations</div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChat('ai-guide');
                      setSelectedChatType('ai');
                      setNewMessage("I need help with my course");
                    }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="text-xs font-medium text-gray-900">Course Help</div>
                    <div className="text-xs text-gray-500">Course guidance</div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChat('ai-guide');
                      setSelectedChatType('ai');
                      setNewMessage("Give me study tips");
                    }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="text-2xl mb-1">💡</div>
                    <div className="text-xs font-medium text-gray-900">Study Tips</div>
                    <div className="text-xs text-gray-500">Learning strategies</div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChat('ai-guide');
                      setSelectedChatType('ai');
                      setNewMessage("Suggest a learning path");
                    }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="text-2xl mb-1">🗺️</div>
                    <div className="text-xs font-medium text-gray-900">Learning Path</div>
                    <div className="text-xs text-gray-500">Personalized plan</div>
                  </button>
                </div>
              </div>

              {/* Example Questions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Example Questions</h4>
                <div className="space-y-2">
                  {[
                    "What's the best way to learn programming?",
                    "Explain the concept of machine learning",
                    "How can I improve my study habits?",
                    "What career paths are available in tech?"
                  ].map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedChat('ai-guide');
                        setSelectedChatType('ai');
                        setNewMessage(question);
                      }}
                      className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat with AI Button */}
              <button
                onClick={() => {
                  setSelectedChat('ai-guide');
                  setSelectedChatType('ai');
                }}
                className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Start Chatting with AI</span>
              </button>
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="p-3 space-y-2">
              <button
                onClick={() => setShowCreateCommunity(true)}
                className="w-full flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create Community</span>
              </button>

              {communities.map(community => (
                <CommunityItem
                  key={community._id}
                  community={community}
                  onSelectChannel={(channelId) => {
                    setSelectedChat(channelId);
                    setSelectedChatType('channel');
                  }}
                />
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="p-3 space-y-2">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create Group</span>
              </button>

              {groups.map(group => (
                <button
                  key={group._id}
                  onClick={() => {
                    setSelectedChat(group._id);
                    setSelectedChatType('group');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors ${
                    selectedChat === group._id && selectedChatType === 'group' ? 'bg-white' : ''
                  }`}
                >
                  <Hash className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members.length} members</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="p-3 border-t bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-green-600">● Online</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCommunityModal
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        token={token}
        onSuccess={() => loadCommunities()}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        token={token}
        friends={friends}
        onSuccess={() => loadGroups()}
      />

      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        token={token}
        onSendRequest={() => loadFriendRequests()}
      />

      {/* Main chat area */}
      <div className={`
        ${selectedChat ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col bg-gray-50
        h-full overflow-hidden
      `}>
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className={`px-3 md:px-6 py-3 md:py-4 border-b flex items-center justify-between shadow-sm ${
              selectedChatType === 'ai' ? 'bg-gradient-to-r from-purple-50 to-blue-50' : 'bg-white'
            }`}>
              {/* Back button for mobile */}
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg mr-2"
              >
                <ChevronDown className="w-5 h-5 text-gray-600 transform rotate-90" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                {selectedChatType === 'ai' ? (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 truncate text-sm md:text-base">AI Learning Guide</h2>
                      <div className="text-xs text-purple-600 truncate flex items-center gap-1">
                        {aiIsTyping ? (
                          <>
                            <span className="inline-flex gap-0.5">
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                            <span>AI is typing...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Always available to help</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Hash className="w-5 h-5 text-gray-500 hidden md:block" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 truncate text-sm md:text-base">Chat</h2>
                      <p className="text-xs text-gray-500 truncate">
                        {typingUsers.size > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-flex gap-0.5">
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                            {Array.from(typingUsers.values()).map(u => u.name).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                          </span>
                        ) : 'Active now'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                {selectedChatType === 'ai' && aiMessages.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Clear all AI chat messages?')) {
                        clearAIMessages();
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {selectedChatType !== 'ai' && (
                  <>
                    <button 
                      onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                      className={`p-2 hover:bg-gray-100 rounded-lg ${pinnedMessages.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}
                      title={`${pinnedMessages.length} pinned messages`}
                    >
                      <Pin className="w-5 h-5" />
                      {pinnedMessages.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {pinnedMessages.length}
                        </span>
                      )}
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                      <VideoIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => setShowSearch(!showSearch)}
                      className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block"
                    >
                      <Search className="w-5 h-5 text-gray-500" />
                    </button>
                  </>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Search bar */}
            {showSearch && (
              <div className="px-3 md:px-6 py-3 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    onChange={(e) => searchMessages(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Pinned messages */}
            {showPinnedMessages && pinnedMessages.length > 0 && (
              <div className="px-3 md:px-6 py-3 border-b bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    Pinned Messages
                  </h3>
                  <button
                    onClick={() => setShowPinnedMessages(false)}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pinnedMessages.map(msgId => {
                    const msg = messages.find(m => m._id === msgId);
                    if (!msg) return null;
                    return (
                      <div key={msgId} className="bg-white p-2 rounded text-sm">
                        <p className="text-gray-800 truncate">{msg.content}</p>
                        <span className="text-xs text-gray-500">{msg.sender?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-50 relative">
              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50 m-2"
                >
                  <div className="text-center p-8">
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Paperclip className="w-16 md:w-20 h-16 md:h-20 text-blue-600 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-xl md:text-2xl font-bold text-blue-900 mb-2">Drop files here to upload</p>
                    <p className="text-sm md:text-base text-gray-700 mb-2">Supports:</p>
                    <div className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
                      <div className="mb-1">📸 <strong>Images:</strong> JPG, PNG, GIF, WebP, SVG, BMP, HEIC</div>
                      <div className="mb-1">🎥 <strong>Videos:</strong> MP4, WebM, MOV, AVI, MKV, FLV</div>
                      <div className="mb-1">🎵 <strong>Audio:</strong> MP3, WAV, OGG, AAC, FLAC, M4A, Opus</div>
                      <div className="mb-1">🎤 <strong>Voice:</strong> AMR, 3GP, WebM (voice recordings)</div>
                      <div className="mb-1">📄 <strong>Documents:</strong> PDF, DOC/X, XLS/X, PPT/X, TXT, CSV</div>
                      <div className="mb-1">💻 <strong>Code:</strong> JS, PY, JAVA, C/C++, PHP, JSON, XML</div>
                      <div className="mb-1">📦 <strong>Archives:</strong> ZIP, RAR, 7Z, TAR, GZ</div>
                      <div className="mt-2 text-gray-500">Maximum file size: 100MB</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : selectedChatType === 'ai' && selectedChat === 'ai-guide' ? (
                <>
                  {/* AI Chat Welcome Message */}
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Globe className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Learning Guide!</h3>
                      <div className="text-gray-600 text-center max-w-md mb-6">
                        I'm your personal AI assistant. Ask me anything about your courses, get study tips, or explore new topics!
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                        {[
                          { icon: "🎓", text: "Explain a concept", question: "Can you explain machine learning?" },
                          { icon: "💡", text: "Get study tips", question: "What are effective study techniques?" },
                          { icon: "📚", text: "Course guidance", question: "How should I approach learning programming?" },
                          { icon: "🚀", text: "Career advice", question: "What skills do I need for a tech career?" }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setNewMessage(item.question)}
                            className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all text-left group"
                          >
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                              {item.text}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* AI Chat Messages */}
                  {aiMessages.map(message => {
                    const isUser = message.role === 'user' || message.sender?.type === 'user';
                    return (
                      <div
                        key={message._id}
                        className={`flex items-start gap-2 md:gap-3 mb-4 ${
                          isUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isUser
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-gradient-to-br from-purple-500 to-blue-500'
                        }`}>
                          {isUser ? (
                            <span className="text-white text-xs md:text-sm font-semibold">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          ) : (
                            <Globe className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          )}
                        </div>
                        
                        <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${
                          isUser ? 'items-end' : 'items-start'
                        }`}>
                          <div className={`px-4 py-2 md:py-3 rounded-2xl ${
                            isUser
                              ? 'bg-blue-600 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border border-purple-100'
                        }`}>
                          <div className="text-sm md:text-base whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 px-2">
                          {new Date(message.timestamp || message.createdAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    );
                  })}

                  {/* AI Typing Indicator */}
                  {aiIsTyping && (
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              ) : (
                <>
                  {messages.map(message => (
                    <MessageComponent
                      key={message._id}
                      message={message}
                      isOwn={message.sender._id === user._id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply/Edit banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Replying to {replyingTo.sender?.firstName}
                  </span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-blue-600 hover:text-blue-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {editingMessage && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Editing message
                  </span>
                </div>
                <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-amber-600 hover:text-amber-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AI Error Banner */}
            {selectedChatType === 'ai' && aiError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    Connection error: {aiError}
                  </span>
                </div>
                <button onClick={() => sendMessageToAI()} className="text-red-600 hover:text-red-800 text-sm font-medium">
                  Retry
                </button>
              </div>
            )}

            {/* Message input */}
            <div className="p-2 md:p-4 border-t bg-white">
              {uploadingFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {uploadingFiles.map(file => (
                    <div key={file} className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span className="truncate max-w-[100px] md:max-w-none">{file}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-1 md:gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 md:w-5 h-4 md:h-5" />
                </button>
                
                <button
                  onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecordingVoice 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isRecordingVoice ? 'Stop recording' : 'Record voice message'}
                >
                  <Mic className="w-4 md:w-5 h-4 md:h-5" />
                </button>
                
                <button
                  onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecordingVideo 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isRecordingVideo ? 'Stop recording' : 'Record video message'}
                >
                  <VideoIcon className="w-4 md:w-5 h-4 md:h-5" />
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.md,.rtf,.odt,.ods,.odp,.zip,.rar,.7z,.tar,.gz,.py,.java,.c,.cpp,.cs,.php,.js,.html,.css"
                  title="Upload images, videos, audio, documents, code files up to 100MB"
                />

                <div className="flex-1 relative">
                  {(isRecordingVoice || isRecordingVideo) && (
                    <div className="absolute -top-10 left-0 right-0 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-between">
                      <span className="font-semibold">
                        {isRecordingVoice ? '🎤 Recording voice...' : '📹 Recording video...'}
                      </span>
                      <span className="font-mono">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm md:text-base"
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <Smile className="w-4 md:w-5 h-4 md:h-5 text-gray-500" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                      <div className="scale-75 md:scale-100 origin-bottom-right">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setNewMessage(prev => prev + emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-md">
              <MessageCircle className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">Select a chat to start messaging</h3>
              <p className="text-sm md:text-base text-gray-500">Choose from your friends, communities, or groups</p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Forward Message Modal */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Forward Message</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingMessage(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b bg-gray-50">
              <p className="text-sm text-gray-700 line-clamp-3">{forwardingMessage.content}</p>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Select recipients:</h4>
              
              {/* Friends list */}
              <div className="space-y-2">
                {friends.map(friend => (
                  <button
                    key={friend._id}
                    onClick={() => {
                      forwardMessage(forwardingMessage._id, [
                        { type: 'direct', id: friend._id }
                      ]);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {friend.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                    <Forward className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>

              {friends.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No friends to forward to</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Community item component with channels
const CommunityItem = ({ community, onSelectChannel }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Users className="w-5 h-5 text-gray-500" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">{community.name}</p>
          <p className="text-xs text-gray-500">{community.stats?.totalMembers || 0} members</p>
        </div>
      </button>

      {expanded && community.channels && (
        <div className="ml-6 mt-1 space-y-1">
          {community.channels.map(channel => (
            <button
              key={channel._id}
              onClick={() => onSelectChannel(channel._id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
            >
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{channel.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPortalEnhanced;
