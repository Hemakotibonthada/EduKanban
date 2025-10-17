import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, CheckCircle } from 'lucide-react';

const VideoPlayer = ({ videoUrl, onComplete, lesson, courseId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [hasWatched90Percent, setHasWatched90Percent] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);
  const isYouTube = !!videoId;

  // YouTube Player API
  useEffect(() => {
    if (!isYouTube || !videoId) return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (videoRef.current) {
        new window.YT.Player(videoRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }
  }, [videoId, isYouTube]);

  const onPlayerReady = (event) => {
    setDuration(event.target.getDuration());
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      trackProgress();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  };

  const trackProgress = () => {
    if (videoRef.current && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        const current = player.getCurrentTime();
        const total = player.getDuration();
        setCurrentTime(current);
        
        // Check if 90% watched
        if (current / total >= 0.9 && !hasWatched90Percent) {
          setHasWatched90Percent(true);
          if (onComplete) {
            onComplete(lesson, courseId);
          }
        }
        
        if (isPlaying) {
          setTimeout(trackProgress, 1000);
        }
      }
    }
  };

  // Regular video controls
  const togglePlayPause = () => {
    if (isYouTube && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        if (isPlaying) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isYouTube) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Check if 90% watched
      const progress = videoRef.current.currentTime / videoRef.current.duration;
      if (progress >= 0.9 && !hasWatched90Percent) {
        setHasWatched90Percent(true);
        if (onComplete) {
          onComplete(lesson, courseId);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isYouTube) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current && !isYouTube) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isYouTube && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        if (isMuted) {
          player.unMute();
        } else {
          player.mute();
        }
      }
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleProgressBarClick = (e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    if (isYouTube && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        player.seekTo(newTime);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const skip = (seconds) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    
    if (isYouTube && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        player.seekTo(newTime);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current && !isYouTube) {
      videoRef.current.playbackRate = rate;
    } else if (isYouTube && window.YT) {
      const player = window.YT.get(videoRef.current.id);
      if (player) {
        player.setPlaybackRate(rate);
      }
    }
    setShowSettings(false);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Video Element */}
      {isYouTube ? (
        <div 
          ref={videoRef}
          id={`youtube-player-${videoId}`}
          className="w-full h-full"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlayPause}
        />
      )}

      {/* Completion Badge */}
      {hasWatched90Percent && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Completed!</span>
        </motion.div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Play/Pause Overlay Button */}
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-white/20 backdrop-blur-sm rounded-full p-4"
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-1" />
            )}
          </motion.div>
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleProgressBarClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full relative group-hover/progress:h-2 transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button onClick={togglePlayPause} className="hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button onClick={() => skip(-10)} className="hover:scale-110 transition-transform">
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button onClick={() => skip(10)} className="hover:scale-110 transition-transform">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="hover:scale-110 transition-transform">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>

              <span className="text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  {playbackRate}x
                </button>
                
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full mb-2 right-0 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[120px]"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors ${
                          playbackRate === rate ? 'bg-blue-500 text-white' : ''
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
