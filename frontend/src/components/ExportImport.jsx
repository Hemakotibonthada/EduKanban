import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  FileJson,
  FileText,
  Database,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader,
  Package,
  FolderDown,
  FolderUp,
  FileCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExportImport = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Export complete data as JSON
  const exportCompleteData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/export/data/complete', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const result = await response.json();
      
      // Download JSON file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edukanban-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Complete data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Export progress report as PDF
  const exportProgressReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/export/progress-report/pdf', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      // Download PDF file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progress-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Progress report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export progress report');
    } finally {
      setLoading(false);
    }
  };

  // Export single course
  const exportCourse = async (courseId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/export/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const result = await response.json();
      
      // Download JSON file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `course-${result.data.course.title.replace(/\s+/g, '-')}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Course exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export course');
    } finally {
      setLoading(false);
    }
  };

  // Import complete data
  const handleImportComplete = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileText = await file.text();
      const importData = JSON.parse(fileText);

      const response = await fetch('http://localhost:5001/api/export/import/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      setImportResults(result.results);
      
      toast.success('Data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data: ' + error.message);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Import single course
  const handleImportCourse = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileText = await file.text();
      const importData = JSON.parse(fileText);

      const response = await fetch('http://localhost:5001/api/export/import/course', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      toast.success('Course imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import course: ' + error.message);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
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
            <Package className="w-10 h-10" />
            Export & Import
          </h1>
          <p className="text-gray-300">
            Backup your data, generate reports, and import content
          </p>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderDown className="w-6 h-6" />
            Export Data
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Complete Backup */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Complete Backup
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Export all your data including courses, tasks, progress, and rehabilitation programs as JSON
                  </p>
                  <button
                    onClick={exportCompleteData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Complete Data
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileJson className="w-4 h-4" />
                <span>JSON Format</span>
              </div>
            </motion.div>

            {/* Progress Report */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-lg border border-green-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Progress Report
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Generate a comprehensive PDF report of your learning progress, achievements, and statistics
                  </p>
                  <button
                    onClick={exportProgressReport}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Generate PDF Report
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileText className="w-4 h-4" />
                <span>PDF Format</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Import Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderUp className="w-6 h-6" />
            Import Data
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Import Complete Backup */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Restore Backup
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Import previously exported backup data to restore your courses, tasks, and progress
                  </p>
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer">
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Import Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportComplete}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileJson className="w-4 h-4" />
                <span>Accepts JSON files</span>
              </div>
            </motion.div>

            {/* Import Course */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg border border-orange-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Import Course
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Import a single course from a JSON file to add it to your collection
                  </p>
                  <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer">
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Import Course
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportCourse}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileJson className="w-4 h-4" />
                <span>Accepts JSON files</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Import Results */}
        {importResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-lg border border-green-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-6 h-6" />
              Import Results
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>{importResults.courses} courses imported</span>
              </div>
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>{importResults.tasks} tasks imported</span>
              </div>
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-lg border border-gray-500/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Information
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Exported JSON files contain all your data in a structured format</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Progress reports are generated as PDF files for easy sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Importing data will not overwrite existing content with the same title</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Keep your backup files safe - they contain sensitive information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Imported courses will be set as drafts until you publish them</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default ExportImport;
