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
  QrCode,
  Shield,
  Star,
  TrendingUp,
  Filter,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CertificatesPage = ({ token }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [generatingCertId, setGeneratingCertId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/certificates/my-certificates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch certificates');

      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Fetch certificates error:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (courseId) => {
    try {
      setGeneratingCertId(courseId);
      const response = await fetch(`http://localhost:5001/api/certificates/generate/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Download PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Certificate downloaded successfully!');
      fetchCertificates(); // Refresh list
    } catch (error) {
      console.error('Generate certificate error:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertId(null);
    }
  };

  const deleteCertificate = async (certificateId) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete certificate');

      toast.success('Certificate deleted successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Delete certificate error:', error);
      toast.error('Failed to delete certificate');
    }
  };

  const openVerification = (verificationCode) => {
    window.open(`/verify/${verificationCode}`, '_blank');
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && new Date(cert.issueDate) > thirtyDaysAgo;
    }
    
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: certificates.length,
    thisMonth: certificates.filter(cert => {
      const issueDate = new Date(cert.issueDate);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && 
             issueDate.getFullYear() === now.getFullYear();
    }).length,
    avgGrade: certificates.length > 0 
      ? certificates.filter(c => c.grade).length / certificates.length * 100 
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Award className="w-10 h-10" />
            My Certificates
          </h1>
          <p className="text-gray-300">
            Download and manage your course completion certificates
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-blue-400">{stats.total}</span>
            </div>
            <h3 className="text-white font-semibold mb-1">Total Certificates</h3>
            <p className="text-gray-400 text-sm">All earned certificates</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg border border-green-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-green-400">{stats.thisMonth}</span>
            </div>
            <h3 className="text-white font-semibold mb-1">This Month</h3>
            <p className="text-gray-400 text-sm">Recently earned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-purple-400">
                {stats.avgGrade.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1">Success Rate</h3>
            <p className="text-gray-400 text-sm">Graded certificates</p>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Certificates</option>
            <option value="recent">Recent (30 days)</option>
          </select>
        </motion.div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredCertificates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-lg border border-gray-500/20 rounded-xl p-12 text-center"
          >
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Certificates Yet</h3>
            <p className="text-gray-400">
              Complete courses to earn certificates and showcase your achievements
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCertificates.map((certificate, index) => (
                <motion.div
                  key={certificate._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all"
                >
                  {/* Certificate Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Award className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openVerification(certificate.verificationCode)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        title="Verify Certificate"
                      >
                        <Shield className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => deleteCertificate(certificate.certificateId)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {certificate.courseName}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {new Date(certificate.issueDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {certificate.duration && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{certificate.duration}</span>
                      </div>
                    )}

                    {certificate.grade && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">
                          {certificate.grade}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certificate ID */}
                  <div className="mb-4 p-2 bg-black/20 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Certificate ID</p>
                    <p className="text-xs text-gray-300 font-mono break-all">
                      {certificate.certificateId}
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => generateCertificate(certificate.course._id)}
                    disabled={generatingCertId === certificate.course._id}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingCertId === certificate.course._id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Certificate Features
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Each certificate includes a unique QR code for instant verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Professional PDF format suitable for printing and sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Tamper-proof verification system with blockchain-ready architecture</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Certificates include course details, completion date, and performance grade</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default CertificatesPage;
