import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image as ImageIcon, FileText, Music, Video, AlertCircle } from 'lucide-react';

const FileUploader = ({ 
  onFilesSelected, 
  maxFiles = 5, 
  maxSizeMB = 10,
  acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/*': ['.txt', '.md']
  }
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setErrors([]);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(rejection => {
        const reasons = rejection.errors.map(e => e.message).join(', ');
        return `${rejection.file.name}: ${reasons}`;
      });
      setErrors(newErrors);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > maxSize) {
          setErrors(prev => [...prev, `${file.name}: File too large (max ${maxSizeMB}MB)`]);
          return false;
        }
        return true;
      });

      if (selectedFiles.length + validFiles.length > maxFiles) {
        setErrors(prev => [...prev, `Maximum ${maxFiles} files allowed`]);
        return;
      }

      const filesWithPreview = validFiles.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substring(7)
      }));

      setSelectedFiles(prev => [...prev, ...filesWithPreview]);
      onFilesSelected([...selectedFiles, ...filesWithPreview].map(f => f.file));
    }
  }, [selectedFiles, maxFiles, maxSizeMB, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    multiple: true
  });

  const removeFile = (id) => {
    const newFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles.map(f => f.file));
    
    // Revoke preview URL to avoid memory leaks
    const fileToRemove = selectedFiles.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the files here...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-400">
              Max {maxFiles} files, {maxSizeMB}MB each
            </p>
          </>
        )}
      </div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">{error}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Files */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedFiles.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                {/* File Preview/Icon */}
                {fileObj.preview ? (
                  <img
                    src={fileObj.preview}
                    alt={fileObj.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                    {getFileIcon(fileObj.file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileObj.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
