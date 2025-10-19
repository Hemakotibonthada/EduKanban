import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Lock,
  Unlock,
  BookOpen,
  Target,
  TrendingUp,
  ChevronRight,
  UserPlus,
  Settings,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudyRooms = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [myRooms, setMyRooms] = useState([]);

  // Mock study rooms data
  const [studyRooms, setStudyRooms] = useState([
    {
      id: 1,
      name: 'React Study Group',
      description: 'Learning React hooks and state management together',
      host: { id: '1', name: 'Sarah Johnson', avatar: 'SJ' },
      category: 'Web Development',
      participants: [
        { id: '1', name: 'Sarah Johnson', avatar: 'SJ', status: 'active' },
        { id: '2', name: 'Mike Chen', avatar: 'MC', status: 'active' },
        { id: '3', name: 'Emily Davis', avatar: 'ED', status: 'idle' }
      ],
      maxParticipants: 10,
      isPrivate: false,
      scheduledTime: '2025-10-20T14:00:00',
      duration: 120,
      features: ['video', 'screen-share', 'notes', 'chat'],
      tags: ['React', 'JavaScript', 'Frontend'],
      createdAt: '2025-10-15T10:00:00',
      status: 'active'
    },
    {
      id: 2,
      name: 'Python Data Science Workshop',
      description: 'Working through pandas and matplotlib tutorials',
      host: { id: '4', name: 'David Lee', avatar: 'DL' },
      category: 'Data Science',
      participants: [
        { id: '4', name: 'David Lee', avatar: 'DL', status: 'active' },
        { id: '5', name: 'Anna Kumar', avatar: 'AK', status: 'active' },
        { id: '6', name: 'Tom Wilson', avatar: 'TW', status: 'active' },
        { id: '7', name: 'Lisa Brown', avatar: 'LB', status: 'active' }
      ],
      maxParticipants: 8,
      isPrivate: false,
      scheduledTime: '2025-10-20T16:00:00',
      duration: 90,
      features: ['video', 'screen-share', 'notes'],
      tags: ['Python', 'Data Science', 'Pandas'],
      createdAt: '2025-10-16T09:00:00',
      status: 'active'
    },
    {
      id: 3,
      name: 'DSA Interview Prep',
      description: 'Practice coding problems and algorithms for interviews',
      host: { id: '8', name: 'James Park', avatar: 'JP' },
      category: 'Computer Science',
      participants: [
        { id: '8', name: 'James Park', avatar: 'JP', status: 'active' },
        { id: '9', name: 'Rachel Green', avatar: 'RG', status: 'active' }
      ],
      maxParticipants: 6,
      isPrivate: true,
      scheduledTime: '2025-10-21T10:00:00',
      duration: 180,
      features: ['video', 'screen-share', 'chat', 'notes'],
      tags: ['Algorithms', 'Data Structures', 'Interview Prep'],
      createdAt: '2025-10-17T14:00:00',
      status: 'scheduled'
    },
    {
      id: 4,
      name: 'Mobile App Development',
      description: 'Building React Native apps together',
      host: { id: '10', name: 'Sophie Martin', avatar: 'SM' },
      category: 'Mobile Development',
      participants: [
        { id: '10', name: 'Sophie Martin', avatar: 'SM', status: 'active' }
      ],
      maxParticipants: 12,
      isPrivate: false,
      scheduledTime: '2025-10-22T15:00:00',
      duration: 120,
      features: ['video', 'screen-share', 'notes', 'chat'],
      tags: ['React Native', 'Mobile', 'JavaScript'],
      createdAt: '2025-10-18T11:00:00',
      status: 'scheduled'
    }
  ]);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    category: 'Web Development',
    maxParticipants: 10,
    isPrivate: false,
    scheduledTime: '',
    duration: 60,
    features: ['video', 'chat'],
    tags: []
  });

  const categories = [
    'All',
    'Web Development',
    'Data Science',
    'Mobile Development',
    'Computer Science',
    'Design',
    'Other'
  ];

  const filteredRooms = studyRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || room.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateRoom = () => {
    if (!newRoom.name || !newRoom.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const room = {
      id: studyRooms.length + 1,
      ...newRoom,
      host: { id: user._id, name: `${user.firstName} ${user.lastName}`, avatar: `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}` },
      participants: [
        { id: user._id, name: `${user.firstName} ${user.lastName}`, avatar: `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`, status: 'active' }
      ],
      createdAt: new Date().toISOString(),
      status: newRoom.scheduledTime ? 'scheduled' : 'active'
    };

    setStudyRooms([room, ...studyRooms]);
    setMyRooms([room, ...myRooms]);
    setShowCreateModal(false);
    toast.success('Study room created successfully!');

    // Reset form
    setNewRoom({
      name: '',
      description: '',
      category: 'Web Development',
      maxParticipants: 10,
      isPrivate: false,
      scheduledTime: '',
      duration: 60,
      features: ['video', 'chat'],
      tags: []
    });
  };

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      toast.error('This is a private room. You need an invitation to join.');
      return;
    }

    if (room.participants.length >= room.maxParticipants) {
      toast.error('This room is full');
      return;
    }

    toast.success(`Joined ${room.name}!`);
    setSelectedRoom(room);
  };

  const handleCopyInviteLink = (roomId) => {
    const inviteLink = `https://edukanban.com/rooms/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Study Rooms</h1>
            <p className="text-purple-100">Collaborate, learn, and grow together</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
        <div className="flex items-center space-x-2">
          {['browse', 'myRooms', 'scheduled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'browse' ? 'Browse Rooms' : tab === 'myRooms' ? 'My Rooms' : 'Scheduled'}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'browse' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search study rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group border dark:border-gray-700"
          >
            {/* Room Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold">{room.name}</h3>
                    {room.isPrivate ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Unlock className="w-5 h-5" />
                    )}
                  </div>
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {room.category}
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(room.status)} animate-pulse`} />
              </div>

              <p className="text-purple-100 text-sm line-clamp-2">{room.description}</p>
            </div>

            {/* Room Details */}
            <div className="p-6 space-y-4">
              {/* Host */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {room.host.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{room.host.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Host</p>
                </div>
              </div>

              {/* Schedule */}
              {room.scheduledTime && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTime(room.scheduledTime)}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{room.duration} min</span>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {room.participants.length}/{room.maxParticipants} participants
                  </span>
                </div>
              </div>

              {/* Participant Avatars */}
              <div className="flex items-center -space-x-2">
                {room.participants.slice(0, 5).map((participant, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                    title={participant.name}
                  >
                    {participant.avatar}
                  </div>
                ))}
                {room.participants.length > 5 && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                    +{room.participants.length - 5}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {room.features.includes('video') && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Video</span>
                  </span>
                )}
                {room.features.includes('screen-share') && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center space-x-1">
                    <Share2 className="w-3 h-3" />
                    <span>Screen Share</span>
                  </span>
                )}
                {room.features.includes('notes') && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Notes</span>
                  </span>
                )}
                {room.features.includes('chat') && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {room.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => handleJoinRoom(room)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {room.status === 'active' ? 'Join Now' : 'Join When Ready'}
                </button>
                <button
                  onClick={() => handleCopyInviteLink(room.id)}
                  className="p-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                  title="Copy invite link"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <h2 className="text-2xl font-bold">Create Study Room</h2>
                <p className="text-purple-100">Set up a collaborative learning space</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="e.g., React Study Group"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What will you be studying?"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Category and Max Participants */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newRoom.category}
                      onChange={(e) => setNewRoom({ ...newRoom, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    >
                      {categories.filter(cat => cat !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={newRoom.maxParticipants}
                      onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: parseInt(e.target.value) })}
                      min="2"
                      max="50"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={newRoom.scheduledTime}
                      onChange={(e) => setNewRoom({ ...newRoom, scheduledTime: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newRoom.duration}
                      onChange={(e) => setNewRoom({ ...newRoom, duration: parseInt(e.target.value) })}
                      min="15"
                      max="480"
                      step="15"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Room Features
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'video', label: 'Video Call', icon: Video },
                      { id: 'screen-share', label: 'Screen Share', icon: Share2 },
                      { id: 'notes', label: 'Collaborative Notes', icon: FileText },
                      { id: 'chat', label: 'Text Chat', icon: MessageSquare }
                    ].map(feature => {
                      const Icon = feature.icon;
                      return (
                        <label
                          key={feature.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            newRoom.features.includes(feature.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={newRoom.features.includes(feature.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoom({ ...newRoom, features: [...newRoom.features, feature.id] });
                              } else {
                                setNewRoom({ ...newRoom, features: newRoom.features.filter(f => f !== feature.id) });
                              }
                            }}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoom.isPrivate}
                      onChange={(e) => setNewRoom({ ...newRoom, isPrivate: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Make this room private</p>
                      <p className="text-sm text-gray-500">Only people with invite link can join</p>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyRooms;
