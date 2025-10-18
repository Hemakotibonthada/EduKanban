import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  ZoomIn,
  Maximize2,
  Play,
  Pause
} from 'lucide-react';

const getBackendURL = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

/**
 * FilePreview Component
 * Displays file attachments with appropriate preview based on file type
 * 
 * Props:
 * - file: File object with { _id, filename, originalName, mimetype, size, path, url }
 * - inline: Boolean to show inline preview vs download button (default: true)
 * - maxHeight: Max height for preview (default: '400px')
 * - showDownload: Show download button (default: true)
 * - lazyLoad: Enable lazy loading for images (default: true)
 * 
 * Features:
 * - Image preview with lazy loading
 * - Video player with controls
 * - Audio player
 * - Document icons with download
 * - Lightbox view for images (click to expand)
 * - File size formatting
 * - Download functionality
 * - Responsive design
 */
const FilePreview = ({ 
  file, 
  inline = true,
  maxHeight = '400px',
  showDownload = true,
  lazyLoad = true
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoElement, setVideoElement] = useState(null);

  if (!file) return null;

  const fileUrl = file.url || `${getBackendURL()}${file.path}`;
  const mimetype = file.mimetype || '';
  const isImage = mimetype.startsWith('image/');
  const isVideo = mimetype.startsWith('video/');
  const isAudio = mimetype.startsWith('audio/');
  const isPDF = mimetype === 'application/pdf';
  const isCode = [
    'text/javascript', 
    'text/x-python', 
    'text/x-java', 
    'application/json',
    'text/html',
    'text/css'
  ].includes(mimetype);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Get file icon based on type
  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="w-8 h-8" />;
    if (isVideo) return <Video className="w-8 h-8" />;
    if (isAudio) return <Music className="w-8 h-8" />;
    if (isPDF) return <FileText className="w-8 h-8" />;
    if (isCode) return <FileCode className="w-8 h-8" />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) {
      return <Archive className="w-8 h-8" />;
    }
    return <FileIcon className="w-8 h-8" />;
  };

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.originalName || file.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle video play/pause
  const toggleVideoPlay = () => {
    if (videoElement) {
      if (isVideoPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Image Preview with Lightbox
  if (isImage && inline) {
    return (
      <>
        <div className="relative inline-block">
          {/* Image Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0 }}
            className="relative group cursor-pointer"
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={fileUrl}
              alt={file.originalName}
              loading={lazyLoad ? 'lazy' : 'eager'}
              onLoad={() => setIsImageLoaded(true)}
              className="rounded-lg max-w-full h-auto object-contain shadow-md hover:shadow-xl transition-shadow"
              style={{ maxHeight }}
            />
            
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                className="opacity-0 group-hover:opacity-100"
              >
                <ZoomIn className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Loading Skeleton */}
          {!isImageLoaded && (
            <div 
              className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              style={{ maxHeight }}
            />
          )}

          {/* Download Button */}
          {showDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {showLightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
              onClick={() => setShowLightbox(false)}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Download Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <Download className="w-6 h-6 text-white" />
              </button>

              {/* Full Size Image */}
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={fileUrl}
                alt={file.originalName}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Filename */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg inline-block">
                  {file.originalName} • {formatFileSize(file.size)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Video Preview
  if (isVideo && inline) {
    return (
      <div className="relative inline-block">
        <video
          ref={setVideoElement}
          src={fileUrl}
          controls
          className="rounded-lg max-w-full h-auto shadow-md"
          style={{ maxHeight }}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
        >
          Your browser does not support video playback.
        </video>

        {showDownload && (
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>
    );
  }

  // Audio Preview
  if (isAudio && inline) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-md">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.originalName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
          <audio 
            src={fileUrl} 
            controls 
            className="w-full mt-2"
            style={{ height: '32px' }}
          >
            Your browser does not support audio playback.
          </audio>
        </div>

        {showDownload && (
          <button
            onClick={handleDownload}
            className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  // File Download Card (for documents and other files)
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.originalName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="flex-shrink-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
        title="Download"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Download</span>
      </button>
    </div>
  );
};

/**
 * FileAttachmentList Component
 * Displays multiple file attachments in a grid
 */
export const FileAttachmentList = ({ files, columns = 2 }) => {
  if (!files || files.length === 0) return null;

  return (
    <div 
      className="grid gap-3 mt-2"
      style={{ 
        gridTemplateColumns: `repeat(${Math.min(columns, files.length)}, 1fr)` 
      }}
    >
      {files.map((file) => (
        <FilePreview key={file._id || file.filename} file={file} />
      ))}
    </div>
  );
};

export default FilePreview;
