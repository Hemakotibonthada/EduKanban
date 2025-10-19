import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Target,
  Award,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from './VideoPlayer';

const CourseContentPage = ({ user, token, courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set([0]));

  useEffect(() => {
    fetchCourse();
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

  const toggleModuleExpanded = (index) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  const markModuleComplete = (index) => {
    const newCompleted = new Set(completedModules);
    newCompleted.add(index);
    setCompletedModules(newCompleted);
    toast.success('Module marked as complete!');
  };

  const completeCourse = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/courses/${courseId}/complete`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (response.ok) {
        toast.success('🎉 Congratulations! Course completed!', {
          duration: 5000,
          icon: '🏆',
        });
        // Mark all modules as complete
        const allModules = new Set(course.modules.map((_, idx) => idx));
        setCompletedModules(allModules);
        
        // Navigate back after a short delay
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        toast.error('Failed to complete course');
      }
    } catch (error) {
      console.error('Error completing course:', error);
      toast.error('Network error completing course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center max-w-md">
          <BookOpen className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Unable to load course details.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center max-w-md">
          <BookOpen className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Content Loading</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This course is being prepared. Please check back soon!
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const progress = Math.round((completedModules.size / course.modules.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Target className="w-4 h-4" />
              <span>{course.difficulty || 'Beginner'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedDuration || 0} hours</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <BookOpen className="w-4 h-4" />
              <span>{course.modules.length} modules</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Module List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Modules</h2>
              <div className="space-y-2">
                {course.modules.map((module, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentModuleIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentModuleIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                        : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Module {module.moduleNumber}
                          </span>
                          {completedModules.has(index) && (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{module.title}</h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentModuleIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Module {currentModule.moduleNumber}
                  </span>
                  {currentModule.estimatedDuration && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{currentModule.estimatedDuration} hours</span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{currentModule.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{currentModule.description}</p>
              </div>

              {/* Video Player */}
              {currentModule.videoUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Video Lesson</span>
                  </h3>
                  <VideoPlayer 
                    videoUrl={currentModule.videoUrl}
                    lesson={currentModule}
                    courseId={courseId}
                    onComplete={(lesson) => {
                      if (!completedModules.has(currentModuleIndex)) {
                        markModuleComplete(currentModuleIndex);
                      }
                    }}
                  />
                </div>
              )}

              {/* Module Content */}
              {currentModule.content && (
                <div className="prose max-w-none mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Content</h3>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{currentModule.content}</div>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {currentModule.learningObjectives && currentModule.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {currentModule.learningObjectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {currentModule.resources && currentModule.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resources</h3>
                  <div className="grid gap-3">
                    {currentModule.resources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{resource.title}</div>
                          {resource.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</div>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {resource.type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t dark:border-gray-800">
                <button
                  onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                  disabled={currentModuleIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Module</span>
                </button>

                {!completedModules.has(currentModuleIndex) && (
                  <button
                    onClick={() => markModuleComplete(currentModuleIndex)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </button>
                )}

                {/* Show Complete Course button on last module, otherwise Next Module */}
                {currentModuleIndex === course.modules.length - 1 ? (
                  <button
                    onClick={completeCourse}
                    className="flex items-center space-x-2 px-4 py-2 text-white bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-700 dark:to-blue-700 rounded-lg hover:from-green-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">Complete Course</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentModuleIndex(currentModuleIndex + 1)}
                    className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    <span>Next Module</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContentPage;
