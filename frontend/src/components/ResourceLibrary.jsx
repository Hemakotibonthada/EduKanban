import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  Video,
  Link2,
  CreditCard,
  Lightbulb,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Trash2,
  Edit,
  Download,
  Eye,
  Plus,
  X,
  Tag,
  Calendar,
  BookOpen,
  Share2,
  Copy,
  Check,
  File,
  Image,
  Music,
  Archive
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const ResourceLibrary = ({ user, token }) => {
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const resourceTypes = [
    { id: 'all', label: 'All Resources', icon: FolderOpen, color: 'blue' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'purple' },
    { id: 'videos', label: 'Videos', icon: Video, color: 'red' },
    { id: 'links', label: 'Links', icon: Link2, color: 'cyan' },
    { id: 'flashcards', label: 'Flashcards', icon: CreditCard, color: 'green' },
    { id: 'notes', label: 'Notes', icon: Lightbulb, color: 'yellow' },
  ];

  const availableTags = [
    'Important', 'Review', 'Exam', 'Project', 'Reference', 
    'Tutorial', 'Quick Read', 'Practice', 'Theory', 'Code'
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ json: () => ({ resources: [] }) }));

      const data = await response.json();
      
      // Mock data for demonstration
      const mockResources = generateMockResources();
      setResources(mockResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockResources = () => {
    return [
      {
        _id: '1',
        type: 'documents',
        title: 'JavaScript Advanced Concepts.pdf',
        description: 'Comprehensive guide to advanced JavaScript patterns',
        url: '#',
        size: '2.5 MB',
        tags: ['Important', 'Theory'],
        course: 'JavaScript Masterclass',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        favorite: true,
        views: 45
      },
      {
        _id: '2',
        type: 'videos',
        title: 'React Hooks Tutorial',
        description: 'Complete guide to React Hooks with examples',
        url: 'https://youtube.com/watch?v=example',
        duration: '45:32',
        tags: ['Tutorial', 'Code'],
        course: 'React Complete Course',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        favorite: false,
        views: 23
      },
      {
        _id: '3',
        type: 'links',
        title: 'MDN JavaScript Reference',
        description: 'Official JavaScript documentation',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        tags: ['Reference'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        favorite: true,
        views: 67
      },
      {
        _id: '4',
        type: 'flashcards',
        title: 'React Interview Questions',
        description: 'Common React interview questions and answers',
        cards: 25,
        tags: ['Exam', 'Practice'],
        course: 'React Complete Course',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        favorite: false,
        views: 31
      },
      {
        _id: '5',
        type: 'notes',
        title: 'Project Architecture Notes',
        description: 'Design patterns and architecture decisions',
        tags: ['Project', 'Important'],
        course: 'System Design',
        createdAt: new Date(),
        favorite: true,
        views: 12
      }
    ];
  };

  const handleUpload = async (file, metadata) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`${API_BASE_URL}/resources/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        toast.success('Resource uploaded successfully!');
        fetchResources();
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setResources(prev => prev.filter(r => r._id !== resourceId));
      toast.success('Resource deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resource');
    }
  };

  const toggleFavorite = async (resourceId) => {
    try {
      await fetch(`${API_BASE_URL}/resources/${resourceId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      setResources(prev => prev.map(r => 
        r._id === resourceId ? { ...r, favorite: !r.favorite } : r
      ));
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = activeTab === 'all' || resource.type === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => resource.tags?.includes(tag));
    
    return matchesType && matchesSearch && matchesTags;
  });

  const getResourceIcon = (type) => {
    const icons = {
      documents: FileText,
      videos: Video,
      links: Link2,
      flashcards: CreditCard,
      notes: Lightbulb
    };
    return icons[type] || File;
  };

  const ResourceCard = ({ resource }) => {
    const Icon = getResourceIcon(resource.type);
    
    return (
            <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 group"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(resource.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => toggleFavorite(resource._id)}
              className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Star 
                className={`w-5 h-5 ${resource.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {resource.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {resource.size && (
              <span className="flex items-center space-x-1">
                <Archive className="w-3 h-3" />
                <span>{resource.size}</span>
              </span>
            )}
            {resource.duration && (
              <span className="flex items-center space-x-1">
                <Video className="w-3 h-3" />
                <span>{resource.duration}</span>
              </span>
            )}
            {resource.cards && (
              <span className="flex items-center space-x-1">
                <CreditCard className="w-3 h-3" />
                <span>{resource.cards} cards</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{resource.views} views</span>
            </span>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Course */}
          {resource.course && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <BookOpen className="w-3 h-3" />
              <span>{resource.course}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedResource(resource)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => handleDelete(resource._id)}
              className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const UploadModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowUploadModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Resource</h2>
          <button
            onClick={() => setShowUploadModal(false)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/50">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Supports PDF, DOC, PPT, images, videos</p>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov"
            />
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Resource Type
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="documents">Document</option>
              <option value="videos">Video</option>
              <option value="links">Link</option>
              <option value="notes">Note</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter resource title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Brief description of the resource"
            ></textarea>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Course Association */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Associated Course (Optional)
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">None</option>
              <option value="course1">JavaScript Masterclass</option>
              <option value="course2">React Complete Course</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Upload Resource
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <FolderOpen className="w-10 h-10" />
              <span>Resource Library</span>
            </h1>
            <p className="text-blue-100 text-lg">
              Organize and access all your learning materials in one place
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {resourceTypes.slice(1).map(type => {
            const Icon = type.icon;
            const count = resources.filter(r => r.type === type.id).length;
            return (
              <div key={type.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Icon className="w-6 h-6" />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-blue-100">{type.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
          {resourceTypes.map(type => {
            const Icon = type.icon;
            const count = type.id === 'all' ? resources.length : resources.filter(r => r.type === type.id).length;
            
            return (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === type.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === type.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters */}
        {selectedTags.length > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or upload your first resource</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Resource</span>
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          <AnimatePresence>
            {filteredResources.map(resource => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showUploadModal && <UploadModal />}
      </AnimatePresence>
    </div>
  );
};

export default ResourceLibrary;
