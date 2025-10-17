import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Users, 
  Search, 
  Plus,
  Hash,
  Lock,
  Globe,
  Smile,
  Paperclip,
  Image,
  FileText,
  MoreVertical,
  Settings,
  Star,
  Reply,
  Trash2,
  Edit3,
  Pin,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChatPortal = ({ user, token }) => {
  const [activeChat, setActiveChat] = useState('ai-tutor');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock socket connection (in real implementation, use socket.io-client)
  const socket = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    initializeSocket();
    fetchChannels();
    fetchMessages();
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat]);

  const initializeSocket = () => {
    // Mock socket implementation
    console.log('Socket connected');
    
    // Simulate real-time message updates
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // Occasionally add a message
        const mockMessage = {
          _id: Date.now().toString(),
          content: "This is a simulated real-time message",
          sender: { _id: 'other', firstName: 'Demo', lastName: 'User' },
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, mockMessage]);
      }
    }, 10000);

    socket.current = { disconnect: () => clearInterval(interval) };
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChannels([
          {
            _id: 'ai-tutor',
            name: 'AI Tutor',
            type: 'ai',
            description: 'Get instant help from our AI assistant',
            icon: <Bot className="w-5 h-5" />,
            isOnline: true
          },
          ...(data.data.channels || [])
        ]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async () => {
    if (!activeChat) return;
    
    setLoading(true);
    try {
      if (activeChat === 'ai-tutor') {
        // Load AI tutor conversation
        setMessages([
          {
            _id: '1',
            content: "Hello! I'm your AI learning assistant. How can I help you today?",
            sender: { _id: 'ai', firstName: 'AI', lastName: 'Tutor' },
            timestamp: new Date(Date.now() - 60000),
            type: 'text',
            isAI: true
          }
        ]);
      } else {
        const response = await fetch(`http://localhost:5001/api/chat/conversations/${activeChat}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempMessage = {
      _id: Date.now().toString(),
      content: newMessage,
      sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
      timestamp: new Date(),
      type: 'text',
      isTemporary: true
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage;
    setNewMessage('');
    setReplyingTo(null);

    try {
      if (activeChat === 'ai-tutor') {
        // Handle AI response
        setLoading(true);
        
        // Simulate AI thinking
        setTimeout(async () => {
          const aiResponse = await getAIResponse(messageContent);
          const aiMessage = {
            _id: (Date.now() + 1).toString(),
            content: aiResponse,
            sender: { _id: 'ai', firstName: 'AI', lastName: 'Tutor' },
            timestamp: new Date(),
            type: 'text',
            isAI: true
          };
          
          setMessages(prev => 
            prev.map(msg => msg.isTemporary ? { ...msg, isTemporary: false } : msg)
              .concat(aiMessage)
          );
          setLoading(false);
        }, 1000);
      } else {
        const response = await fetch(`http://localhost:5001/api/chat/conversations/${activeChat}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content: messageContent,
            type: 'text',
            replyTo: replyingTo?._id
          })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => 
            prev.map(msg => msg.isTemporary ? data.data.message : msg)
          );
        } else {
          toast.error('Failed to send message');
          setMessages(prev => prev.filter(msg => !msg.isTemporary));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Network error');
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
    }
  };

  const getAIResponse = async (message) => {
    // Simulate AI responses based on message content
    const responses = {
      'help': "I'm here to help! You can ask me about your courses, assignments, study tips, or any learning-related questions.",
      'course': "I can help you with course content! Which specific topic or course are you working on?",
      'quiz': "Need help with a quiz? I can explain concepts, provide study strategies, or help you understand difficult questions.",
      'study': "Here are some effective study techniques: 1) Active recall, 2) Spaced repetition, 3) Practice testing, 4) Creating visual aids. Which would you like to know more about?",
      'time': "Time management is crucial for learning success! Try the Pomodoro technique: 25 minutes focused study, 5 minute break. Would you like me to set up a study schedule for you?",
      'default': "That's an interesting question! Based on your learning profile, I'd recommend breaking this down into smaller concepts. Can you tell me more about what specifically you're struggling with?"
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return responses.default;
  };

  const handleFileUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('channelId', activeChat);

    try {
      const response = await fetch('http://localhost:5001/api/chat/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const fileMessage = {
          _id: Date.now().toString(),
          content: file.name,
          sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
          timestamp: new Date(),
          type: 'file',
          fileUrl: data.data.fileUrl,
          fileName: file.name,
          fileSize: file.size
        };
        
        setMessages(prev => [...prev, fileMessage]);
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Network error during upload');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Now';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Now' : date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageComponent = ({ message, isOwn }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          {message.isAI ? (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {message.sender.firstName?.[0]}{message.sender.lastName?.[0]}
              </span>
            </div>
          )}
        </div>
        
        <div className={`px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : message.isAI 
              ? 'bg-blue-50 border border-blue-200 text-blue-900'
              : 'bg-gray-100 text-gray-900'
        } ${message.isTemporary ? 'opacity-70' : ''}`}>
          {message.replyTo && (
            <div className="text-xs opacity-70 mb-1 p-2 bg-black bg-opacity-10 rounded">
              Replying to: {message.replyTo.content?.substring(0, 50)}...
            </div>
          )}
          
          {message.type === 'text' && (
            <p className="text-sm">{message.content}</p>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{message.fileName}</span>
            </div>
          )}
          
          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
            {message.isTemporary && <Clock className="w-3 h-3 inline ml-1" />}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[600px] bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Channels
              </div>
              
              {filteredChannels.map(channel => (
                <button
                  key={channel._id}
                  onClick={() => setActiveChat(channel._id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeChat === channel._id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {channel.icon || <Hash className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{channel.name}</div>
                    {channel.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {channel.description}
                      </div>
                    )}
                  </div>
                  {channel.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Online Users */}
          <div className="border-t p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Online ({onlineUsers.length + 1})
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">You</span>
              </div>
              {onlineUsers.map(user => (
                <div key={user._id} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">{user.firstName} {user.lastName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {channels.find(c => c._id === activeChat)?.icon || <MessageCircle className="w-5 h-5" />}
              <div>
                <h2 className="font-semibold text-gray-900">
                  {channels.find(c => c._id === activeChat)?.name || 'Select a channel'}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeChat === 'ai-tutor' ? 'AI-powered learning assistant' : 'Group discussion'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <Star className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map(message => (
                  <MessageComponent
                    key={message._id}
                    message={message}
                    isOwn={message.sender._id === user._id}
                  />
                ))}
                
                {loading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is typing...</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Banner */}
          {replyingTo && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Replying to: {replyingTo.content?.substring(0, 50)}...
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={activeChat === 'ai-tutor' ? 'Ask your AI tutor anything...' : 'Type a message...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {activeChat === 'ai-tutor' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {['Help with course', 'Study tips', 'Quiz assistance', 'Time management'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setNewMessage(suggestion);
                      setTimeout(sendMessage, 100);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPortal;