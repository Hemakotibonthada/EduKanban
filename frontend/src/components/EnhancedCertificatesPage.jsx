import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Download,
  Search,
  Calendar,
  BookOpen,
  CheckCircle,
  Trash2,
  ExternalLink,
  Share2,
  Eye,
  Star,
  TrendingUp,
  Filter,
  Loader,
  Grid,
  List,
  Medal,
  Trophy,
  Crown,
  Sparkles,
  FileText,
  Link,
  Copy,
  CheckSquare,
  BarChart3,
  Target,
  Zap,
  Globe,
  Lock,
  Linkedin,
  Twitter,
  Facebook,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedCertificatesPage = ({ token, user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock certificates data
  const [mockCertificates, setMockCertificates] = useState([
    {
      id: 1,
      courseTitle: 'Full Stack Web Development',
      courseThumbnail: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Full+Stack',
      issueDate: '2025-09-15',
      completionDate: '2025-09-14',
      instructor: 'Sarah Johnson',
      grade: 'A+',
      score: 95,
      hours: 120,
      skills: ['React', 'Node.js', 'MongoDB', 'Express'],
      certificateUrl: 'https://certificates.edukanban.com/cert-123456',
      verificationCode: 'EK-2025-FS-123456',
      type: 'completion',
      level: 'Advanced',
      credentialId: 'CRED-FS-2025-001',
      blockchain: true,
      shareCount: 24,
      views: 156
    },
    {
      id: 2,
      courseTitle: 'Data Science with Python',
      courseThumbnail: 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Data+Science',
      issueDate: '2025-08-20',
      completionDate: '2025-08-19',
      instructor: 'Dr. Michael Chen',
      grade: 'A',
      score: 92,
      hours: 80,
      skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
      certificateUrl: 'https://certificates.edukanban.com/cert-123457',
      verificationCode: 'EK-2025-DS-123457',
      type: 'completion',
      level: 'Intermediate',
      credentialId: 'CRED-DS-2025-002',
      blockchain: true,
      shareCount: 18,
      views: 98
    },
    {
      id: 3,
      courseTitle: 'UI/UX Design Masterclass',
      courseThumbnail: 'https://via.placeholder.com/400x300/4facfe/ffffff?text=UI+UX+Design',
      issueDate: '2025-10-10',
      completionDate: '2025-10-09',
      instructor: 'Emily Davis',
      grade: 'A+',
      score: 98,
      hours: 60,
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
      certificateUrl: 'https://certificates.edukanban.com/cert-123458',
      verificationCode: 'EK-2025-UX-123458',
      type: 'excellence',
      level: 'Advanced',
      credentialId: 'CRED-UX-2025-003',
      blockchain: true,
      shareCount: 32,
      views: 210
    },
    {
      id: 4,
      courseTitle: 'Advanced JavaScript',
      courseThumbnail: 'https://via.placeholder.com/400x300/00d2ff/ffffff?text=JavaScript',
      issueDate: '2025-07-15',
      completionDate: '2025-07-14',
      instructor: 'David Lee',
      grade: 'B+',
      score: 88,
      hours: 45,
      skills: ['JavaScript', 'ES6+', 'Async/Await', 'Closures'],
      certificateUrl: 'https://certificates.edukanban.com/cert-123459',
      verificationCode: 'EK-2025-JS-123459',
      type: 'completion',
      level: 'Advanced',
      credentialId: 'CRED-JS-2025-004',
      blockchain: false,
      shareCount: 12,
      views: 67
    }
  ]);

  const stats = {
    total: mockCertificates.length,
    thisYear: mockCertificates.filter(c => new Date(c.issueDate).getFullYear() === 2025).length,
    totalHours: mockCertificates.reduce((sum, c) => sum + c.hours, 0),
    avgScore: Math.round(mockCertificates.reduce((sum, c) => sum + c.score, 0) / mockCertificates.length),
    excellence: mockCertificates.filter(c => c.type === 'excellence').length,
    totalSkills: [...new Set(mockCertificates.flatMap(c => c.skills))].length
  };

  const filteredCertificates = mockCertificates.filter(cert => {
    const matchesSearch = cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'excellence' && cert.type === 'excellence') ||
                         (filterBy === 'blockchain' && cert.blockchain) ||
                         (filterBy === 'recent' && new Date(cert.issueDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (cert) => {
    toast.success(`Downloading certificate for ${cert.courseTitle}`);
    // Simulate download
  };

  const handleShare = (cert) => {
    setSelectedCertificate(cert);
    setShowShareModal(true);
  };

  const handleCopyLink = (cert) => {
    navigator.clipboard.writeText(cert.certificateUrl);
    toast.success('Certificate link copied to clipboard!');
  };

  const handleCopyCredential = (cert) => {
    navigator.clipboard.writeText(cert.credentialId);
    toast.success('Credential ID copied to clipboard!');
  };

  const shareToSocial = (platform) => {
    const cert = selectedCertificate;
    const message = `I just earned a certificate in ${cert.courseTitle}! 🎉`;
    const url = cert.certificateUrl;

    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
    }
    toast.success(`Sharing to ${platform}!`);
  };

  const getCertificateIcon = (type) => {
    switch (type) {
      case 'excellence':
        return Crown;
      case 'completion':
        return Award;
      default:
        return Medal;
    }
  };

  const getCertificateColor = (type) => {
    switch (type) {
      case 'excellence':
        return 'from-yellow-500 to-orange-500';
      case 'completion':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-green-500 to-teal-500';
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <Award className="w-10 h-10" />
              <span>My Certificates</span>
            </h1>
            <p className="text-purple-100 text-lg">
              Your achievements and credentials in one place
            </p>
          </div>
          <Trophy className="w-16 h-16 text-purple-200" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-purple-100">Total Certs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.thisYear}</p>
            <p className="text-sm text-purple-100">This Year</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.totalHours}h</p>
            <p className="text-sm text-purple-100">Total Hours</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.avgScore}%</p>
            <p className="text-sm text-purple-100">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.excellence}</p>
            <p className="text-sm text-purple-100">Excellence</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.totalSkills}</p>
            <p className="text-sm text-purple-100">Skills</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search certificates or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Certificates</option>
            <option value="recent">Recent (90 days)</option>
            <option value="excellence">Excellence Only</option>
            <option value="blockchain">Blockchain Verified</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Grid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert, index) => {
            const CertIcon = getCertificateIcon(cert.type);
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
              >
                {/* Certificate Header */}
                <div className={`bg-gradient-to-r ${getCertificateColor(cert.type)} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <CertIcon className="w-12 h-12" />
                      {cert.blockchain && (
                        <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg flex items-center space-x-1">
                          <CheckSquare className="w-3 h-3" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{cert.courseTitle}</h3>
                    <p className="text-sm text-white/80">by {cert.instructor}</p>
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="p-6">
                  {/* Score & Grade */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Final Score</p>
                      <p className="text-2xl font-bold text-gray-900">{cert.score}%</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(cert.grade)}`}>
                      {cert.grade}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{cert.hours} hours completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Level: {cert.level}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills Gained:</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {cert.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          +{cert.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{cert.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{cert.shareCount}</span>
                    </div>
                  </div>

                  {/* Credential ID */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Credential ID</p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-gray-900">{cert.credentialId}</code>
                      <button
                        onClick={() => handleCopyCredential(cert)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopyLink(cert)}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredCertificates.map((cert, index) => {
            const CertIcon = getCertificateIcon(cert.type);
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 bg-gradient-to-br ${getCertificateColor(cert.type)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <CertIcon className="w-10 h-10 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{cert.courseTitle}</h3>
                        <p className="text-sm text-gray-600">by {cert.instructor}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-4 py-2 rounded-full font-bold ${getGradeColor(cert.grade)}`}>
                          {cert.grade}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">{cert.score}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{cert.hours} hours</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{cert.level}</span>
                      </div>
                      {cert.blockchain && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckSquare className="w-4 h-4" />
                          <span>Blockchain Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {cert.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-gray-500">{cert.credentialId}</code>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(cert)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleShare(cert)}
                          className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold mb-2">Share Certificate</h2>
                <p className="text-purple-100">{selectedCertificate.courseTitle}</p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600">Share your achievement with the world!</p>

                {/* Social Media Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => shareToSocial('linkedin')}
                    className="w-full px-6 py-3 bg-[#0A66C2] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span>Share on LinkedIn</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="w-full px-6 py-3 bg-[#1DA1F2] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                  >
                    <Twitter className="w-5 h-5" />
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="w-full px-6 py-3 bg-[#1877F2] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                  >
                    <Facebook className="w-5 h-5" />
                    <span>Share on Facebook</span>
                  </button>
                </div>

                {/* Copy Link */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Certificate Link</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedCertificate.certificateUrl}
                      readOnly
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => handleCopyLink(selectedCertificate)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredCertificates.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Certificates Found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search' : 'Complete courses to earn certificates!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedCertificatesPage;
