import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  User,
  Award,
  Loader,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const CertificateVerification = ({ verificationCode }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (verificationCode) {
      verifyCertificate();
    }
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5001/api/certificates/verify/${verificationCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Certificate not found');
        }
        throw new Error('Verification failed');
      }

      const data = await response.json();
      setCertificate(data.certificate);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verifying certificate...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verification Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={verifyCertificate}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Verification Success Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 mb-6 flex items-center gap-4"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Certificate Verified!</h2>
            <p className="text-green-300">
              This certificate is authentic and has been issued by EduKanban
            </p>
          </div>
        </motion.div>

        {/* Certificate Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Certificate of Completion
                </h3>
                <p className="text-purple-100">EduKanban Learning Platform</p>
              </div>
            </div>
          </div>

          {/* Certificate Information */}
          <div className="p-6 space-y-6">
            {/* Student Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Awarded To
                </label>
              </div>
              <p className="text-2xl font-bold text-white">{certificate.userName}</p>
            </div>

            {/* Course Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Course Title
                </label>
              </div>
              <p className="text-xl font-semibold text-white">{certificate.courseName}</p>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Issue Date */}
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Issue Date
                  </label>
                </div>
                <p className="text-white font-semibold">
                  {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Completion Date */}
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Completed On
                  </label>
                </div>
                <p className="text-white font-semibold">
                  {new Date(certificate.completionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Duration */}
              {certificate.duration && (
                <div className="bg-black/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Course Duration
                    </label>
                  </div>
                  <p className="text-white font-semibold">{certificate.duration}</p>
                </div>
              )}

              {/* Grade */}
              {certificate.grade && (
                <div className="bg-black/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Grade
                    </label>
                  </div>
                  <p className="text-white font-semibold">{certificate.grade}</p>
                </div>
              )}
            </div>

            {/* Skills */}
            {certificate.skills && certificate.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Skills Acquired
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate ID */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                  Certificate ID
                </label>
              </div>
              <p className="text-white font-mono text-sm break-all">{certificate.certificateId}</p>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-semibold">
                Verified by EduKanban Security System
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-semibold mb-2">About This Certificate</h4>
              <p className="text-gray-300 text-sm">
                This certificate has been issued by EduKanban and represents successful completion 
                of the course. The certificate includes a unique verification code and QR code for 
                instant authenticity verification. All certificates are stored securely and can be 
                verified at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CertificateVerification;
