import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Edit3, 
  Save, 
  X, 
  Camera,
  BookOpen,
  Target,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = ({ user, token }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    profile: {
      knowledgeLevel: user.profile?.knowledgeLevel || 'Beginner',
      timeCommitment: user.profile?.timeCommitment || '5 hours per week',
      learningGoals: user.profile?.learningGoals || [],
      preferredLearningStyle: user.profile?.preferredLearningStyle || 'Visual'
    },
    preferences: {
      theme: user.preferences?.theme || 'system',
      notifications: {
        email: user.preferences?.notifications?.email ?? true,
        push: user.preferences?.notifications?.push ?? true,
        reminders: user.preferences?.notifications?.reminders ?? true
      },
      language: user.preferences?.language || 'en'
    }
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: subchild ? {
            ...prev[parent][child],
            [subchild]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleGoalsChange = (e) => {
    const goals = e.target.value.split(',').map(goal => goal.trim()).filter(goal => goal);
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        learningGoals: goals
      }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('http://localhost:5001/api/users/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Profile picture updated successfully!');
        setProfilePicture(data.data.profilePicture);
        
        // Update localStorage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...savedUser, profilePicture: data.data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        // Update localStorage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...savedUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      profile: {
        knowledgeLevel: user.profile?.knowledgeLevel || 'Beginner',
        timeCommitment: user.profile?.timeCommitment || '5 hours per week',
        learningGoals: user.profile?.learningGoals || [],
        preferredLearningStyle: user.profile?.preferredLearningStyle || 'Visual'
      },
      preferences: {
        theme: user.preferences?.theme || 'system',
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          push: user.preferences?.notifications?.push ?? true,
          reminders: user.preferences?.notifications?.reminders ?? true
        },
        language: user.preferences?.language || 'en'
      }
    });
    setIsEditing(false);
  };

  const StatCard = ({ icon, label, value, color = 'blue' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="profilePictureInput"
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </label>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-blue-100 text-lg">@{user.username}</p>
              <p className="text-blue-200 text-sm">{user.email}</p>
              <p className="text-blue-200 text-sm">
                Member since {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Recently'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Edit3 className="w-5 h-5" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-blue-600" />}
            label="Active Courses"
            value={stats.activeCourses}
            color="blue"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-green-600" />}
            label="Tasks Completed"
            value={stats.completedTasks}
            color="green"
          />
          <StatCard
            icon={<Award className="w-6 h-6 text-purple-600" />}
            label="Courses Done"
            value={stats.completedCourses}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Success Rate"
            value={`${stats.completionRate}%`}
            color="orange"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white py-2">{user.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white py-2">{user.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">@{user.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <p className="text-gray-900 dark:text-white py-2 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Learning Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Learning Preferences</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Knowledge Level
              </label>
              {isEditing ? (
                <select
                  name="profile.knowledgeLevel"
                  value={formData.profile.knowledgeLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{user.profile?.knowledgeLevel || 'Beginner'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Commitment
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="profile.timeCommitment"
                  value={formData.profile.timeCommitment}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 hours per week"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{user.profile?.timeCommitment || '5 hours per week'}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Style
              </label>
              {isEditing ? (
                <select
                  name="profile.preferredLearningStyle"
                  value={formData.profile.preferredLearningStyle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Visual">Visual</option>
                  <option value="Auditory">Auditory</option>
                  <option value="Kinesthetic">Kinesthetic</option>
                  <option value="Reading">Reading</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{user.profile?.preferredLearningStyle || 'Visual'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Goals
              </label>
              {isEditing ? (
                <textarea
                  value={formData.profile.learningGoals.join(', ')}
                  onChange={handleGoalsChange}
                  placeholder="e.g., Web Development, Data Science, Machine Learning"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              ) : (
                <div className="py-2">
                  {user.profile?.learningGoals?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.profile.learningGoals.map((goal, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No learning goals set</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Preferences</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            {isEditing ? (
              <select
                name="preferences.theme"
                value={formData.preferences.theme}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            ) : (
              <p className="text-gray-900 dark:text-white py-2 capitalize">{user.preferences?.theme || 'system'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            {isEditing ? (
              <select
                name="preferences.language"
                value={formData.preferences.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            ) : (
              <p className="text-gray-900 dark:text-white py-2">
                {user.preferences?.language === 'en' ? 'English' : 
                 user.preferences?.language === 'es' ? 'Spanish' :
                 user.preferences?.language === 'fr' ? 'French' :
                 user.preferences?.language === 'de' ? 'German' : 'English'}
              </p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            {['email', 'push', 'reminders'].map((type) => (
              <div key={type} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {type === 'push' ? 'Push Notifications' : 
                   type === 'reminders' ? 'Learning Reminders' : 
                   'Email Notifications'}
                </label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    name={`preferences.notifications.${type}`}
                    checked={formData.preferences.notifications[type]}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.preferences?.notifications?.[type] 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.preferences?.notifications?.[type] ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end space-x-4"
        >
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;