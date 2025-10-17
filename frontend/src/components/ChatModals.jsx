import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Globe, Lock, Hash, Plus, Search, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBackendURL } from '../config/api';

const API_URL = getBackendURL();

// Create Community Modal
export const CreateCommunityModal = ({ isOpen, onClose, token, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    category: 'study-group',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat-enhanced/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Community created successfully!');
        onSuccess && onSuccess(data.data.community);
        onClose();
        setFormData({ name: '', description: '', type: 'public', category: 'study-group', tags: '' });
      } else {
        toast.error(data.message || 'Failed to create community');
      }
    } catch (error) {
      console.error('Create community error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create Community</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., React Developers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this community about?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'public' })}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                    formData.type === 'public'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'private' })}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                    formData.type === 'private'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Private</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="study-group">Study Group</option>
                <option value="course-community">Course Community</option>
                <option value="project-team">Project Team</option>
                <option value="interest-based">Interest Based</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., react, javascript, frontend"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Create Group Modal
export const CreateGroupModal = ({ isOpen, onClose, token, friends, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: []
  });
  const [loading, setLoading] = useState(false);

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.memberIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat-enhanced/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Group created successfully!');
        onSuccess && onSuccess(data.data.group);
        onClose();
        setFormData({ name: '', description: '', memberIds: [] });
      } else {
        toast.error(data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Create group error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Study Squad"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this group for?"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Members ({formData.memberIds.length} selected)
              </label>
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {friends && friends.length > 0 ? (
                  friends.map(friend => (
                    <button
                      key={friend._id}
                      type="button"
                      onClick={() => toggleMember(friend._id)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                        formData.memberIds.includes(friend._id) ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {friend.firstName[0]}{friend.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                      {formData.memberIds.includes(friend._id) && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No friends to add</p>
                    <p className="text-xs">Add friends first to create groups</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name || formData.memberIds.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// User Search Modal
export const UserSearchModal = ({ isOpen, onClose, token, onSendRequest }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast.error('Search query must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/chat-enhanced/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    setSendingTo(userId);
    try {
      const response = await fetch(`${API_URL}/chat-enhanced/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          message: '',
          connectionReason: 'search'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Friend request sent!');
        onSendRequest && onSendRequest();
      } else {
        toast.error(data.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Send request error:', error);
      toast.error('Network error');
    } finally {
      setSendingTo(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Find Users</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, username..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.primaryReason && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0
                            ${user.primaryReason.type === 'course' ? 'bg-blue-100 text-blue-700' :
                              user.primaryReason.type === 'email' ? 'bg-purple-100 text-purple-700' :
                              user.primaryReason.type === 'name' ? 'bg-green-100 text-green-700' :
                              user.primaryReason.type === 'username' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'}
                          `}>
                            {user.primaryReason.type === 'course' ? '🎓 Same course' :
                             user.primaryReason.type === 'email' ? '✉️ Email' :
                             user.primaryReason.type === 'name' ? '👤 Name' :
                             user.primaryReason.type === 'username' ? '@' :
                             '👋'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      {user.matchReasons && user.matchReasons.length > 0 && user.matchReasons[0].label && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate" title={user.matchReasons[0].label}>
                          {user.matchReasons[0].label}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user._id)}
                      disabled={sendingTo === user._id}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {sendingTo === user._id ? '...' : 'Add Friend'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No results</p>
                  <p className="text-xs">Try searching for a different name, email, or username</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
