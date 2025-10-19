import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize,
  Star,
  Users,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Code,
  Image,
  Video,
  Headphones,
  PenTool,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CourseContentPage = ({ user, token, courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [completedModules, setCompletedModules] = useState(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set([0]));

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.data.course);
      } else {
        toast.error('Failed to load course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Network error loading course');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const progress = data.data.progress;
        if (progress && progress.completedLessons) {
          setCompletedLessons(new Set(progress.completedLessons));
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const markLessonComplete = async (moduleIndex, lessonIndex) => {
    const lessonId = `${moduleIndex}-${lessonIndex}`;
    
    try {
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleIndex,
          lessonIndex,
          completed: true
        })
      });

      if (response.ok) {
        setCompletedLessons(prev => new Set([...prev, lessonId]));
        toast.success('Lesson completed! 🎉');
        
        // Auto-advance to next lesson
        const currentLessonObj = course.modules[moduleIndex].lessons[lessonIndex];
        const nextLesson = getNextLesson(moduleIndex, lessonIndex);
        if (nextLesson && currentLessonObj.autoAdvance !== false) {
          setTimeout(() => {
            setCurrentModule(nextLesson.moduleIndex);
            setCurrentLesson(nextLesson.lessonIndex);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to save progress');
    }
  };

  const getNextLesson = (moduleIndex, lessonIndex) => {
    if (!course?.modules?.[moduleIndex]?.lessons) return null;
    
    const currentModuleLessons = course.modules[moduleIndex].lessons;
    
    // Check if there's a next lesson in current module
    if (lessonIndex + 1 < currentModuleLessons.length) {
      return { moduleIndex, lessonIndex: lessonIndex + 1 };
    }
    
    // Check if there's a next module
    if (moduleIndex + 1 < course.modules.length) {
      return { moduleIndex: moduleIndex + 1, lessonIndex: 0 };
    }
    
    return null;
  };

  const getPreviousLesson = (moduleIndex, lessonIndex) => {
    if (!course?.modules?.[moduleIndex]) return null;
    
    // Check if there's a previous lesson in current module
    if (lessonIndex > 0) {
      return { moduleIndex, lessonIndex: lessonIndex - 1 };
    }
    
    // Check if there's a previous module
    if (moduleIndex > 0) {
      const prevModuleLessons = course.modules[moduleIndex - 1].lessons;
      return { 
        moduleIndex: moduleIndex - 1, 
        lessonIndex: prevModuleLessons.length - 1 
      };
    }
    
    return null;
  };

  const toggleModule = (moduleIndex) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'interactive': return <PenTool className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const renderContent = (lesson) => {
    if (!lesson) return null;

    switch (lesson.type) {
      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {lesson.videoUrl ? (
                <video
                  className="w-full h-full"
                  controls
                  poster={lesson.thumbnail}
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                >
                  <source src={lesson.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{lesson.title}</p>
                  <p className="text-sm opacity-75">Video content will be available soon</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border dark:border-gray-700">
              {lesson.content && (
                <div className="dark:text-gray-300" dangerouslySetInnerHTML={{ __html: lesson.content }} />
              )}
              {!lesson.content && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Content for "{lesson.title}" will be available soon</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
            <div className="text-center">
              <PenTool className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Interactive Exercise</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{lesson.description}</p>
              
              {lesson.exercise && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left border dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Exercise:</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{lesson.exercise.instructions}</p>
                  
                  {lesson.exercise.codeTemplate && (
                    <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg font-mono text-sm">
                      <pre>{lesson.exercise.codeTemplate}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border dark:border-gray-700">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Content loading...</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600 dark:text-gray-400">Course not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentModule = course?.modules?.[currentModuleIndex];
  const nextModule = currentModuleIndex + 1 < course?.modules?.length ? currentModuleIndex + 1 : null;
  const previousModule = currentModuleIndex > 0 ? currentModuleIndex - 1 : null;
  const isModuleCompleted = completedModules.has(currentModuleIndex);

  // If modules don't exist, show a message
  if (!course?.modules || course.modules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md border dark:border-gray-700">
          <BookOpen className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Content Loading</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This course is being prepared. Please check back soon!
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 320 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-r dark:border-gray-700 flex-shrink-0"
      >
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back to Dashboard</span>
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {course.modules?.length || 0} modules • {course.estimatedDuration || 'Self-paced'}
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {course.modules?.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border rounded-lg">
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        moduleIndex === currentModule ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-sm font-medium">{moduleIndex + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{module.title}</p>
                        <p className="text-xs text-gray-500">
                          {module.lessons?.length || 0} lessons
                        </p>
                      </div>
                    </div>
                    {expandedModules.has(moduleIndex) ? 
                      <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                  </button>

                  <AnimatePresence>
                    {expandedModules.has(moduleIndex) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pb-2">
                          {module.lessons?.map((lesson, lessonIndex) => {
                            const lessonId = `${moduleIndex}-${lessonIndex}`;
                            const isCompleted = completedLessons.has(lessonId);
                            const isCurrent = moduleIndex === currentModule && lessonIndex === currentLesson;

                            return (
                              <button
                                key={lessonIndex}
                                onClick={() => {
                                  setCurrentModule(moduleIndex);
                                  setCurrentLesson(lessonIndex);
                                }}
                                className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                  isCurrent 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    getContentTypeIcon(lesson.type)
                                  )}
                                  <span className="text-sm font-medium truncate">
                                    {lesson.title}
                                  </span>
                                </div>
                                {lesson.duration && (
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {lesson.duration}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentLessonObj?.title || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Module {currentModule + 1} • Lesson {currentLesson + 1}
                {currentLessonObj?.duration && ` • ${currentLessonObj.duration}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Toggle Notes"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              
              {!isLessonCompleted && (
                <button
                  onClick={() => markLessonComplete(currentModule, currentLesson)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Complete</span>
                </button>
              )}
              
              {isLessonCompleted && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Lesson Description */}
            {currentLessonObj?.description && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-300">{currentLessonObj.description}</p>
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {currentLessonObj?.objectives && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border dark:border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Learning Objectives</span>
                </h3>
                <ul className="space-y-2">
                  {currentLessonObj.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Content */}
            <div className="mb-8">
              {renderContent(currentLessonObj)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (previousLesson) {
                    setCurrentModule(previousLesson.moduleIndex);
                    setCurrentLesson(previousLesson.lessonIndex);
                  }
                }}
                disabled={!previousLesson}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lesson {currentLesson + 1} of {course.modules[currentModule]?.lessons?.length || 0}
                </p>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentLesson + 1) / (course.modules[currentModule]?.lessons?.length || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (nextLesson) {
                    setCurrentModule(nextLesson.moduleIndex);
                    setCurrentLesson(nextLesson.lessonIndex);
                  }
                }}
                disabled={!nextLesson}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notes Panel */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 200 }}
              exit={{ height: 0 }}
              className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Lesson Notes</h3>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes about this lesson..."
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseContentPage;