import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Zap, 
  Target, 
  Clock, 
  User, 
  Brain,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Star,
  Play,
  Sparkles,
  Award,
  Lightbulb,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProgressiveCourseGeneration = ({ user, token, onCourseCreated }) => {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [modules, setModules] = useState([]);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    knowledgeLevel: user?.profile?.knowledgeLevel || 'Beginner',
    timeCommitment: user?.profile?.timeCommitment || '5 hours per week',
    duration: '4 weeks',
    difficulty: 'Intermediate'
  });
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const eventSourceRef = useRef(null);
  const [subjects] = useState([
    'Python Programming',
    'Web Development',
    'Data Science',
    'Machine Learning',
    'Mobile Development',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'UI/UX Design',
    'Digital Marketing',
    'JavaScript',
    'React.js',
    'Node.js',
    'Database Design',
    'Other'
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'subject') {
      console.log('Subject changed to:', value);
      if (value === 'Other') {
        console.log('Showing custom input');
        setShowCustomInput(true);
        setFormData(prev => ({
          ...prev,
          subject: customSubject || '' // Use existing custom subject or empty
        }));
      } else {
        console.log('Hiding custom input');
        setShowCustomInput(false);
        setCustomSubject('');
        setFormData(prev => ({
          ...prev,
          subject: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomSubjectChange = (e) => {
    const value = e.target.value;
    console.log('Custom subject changed to:', value);
    setCustomSubject(value);
    // Update formData.subject with the custom input
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.title || !formData.subject || (showCustomInput && !customSubject.trim()))) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const generateCourseProgressive = async () => {
    setGenerating(true);
    setProgress(0);
    setModules([]);
    setCurrentStatus('Starting course generation...');

    try {
      const url = `http://localhost:5001/api/ai/generate-course-progressive`;
      
      eventSourceRef.current = new EventSource(
        `${url}?courseTopic=${encodeURIComponent(formData.subject || formData.title)}&timeCommitment=${encodeURIComponent(formData.timeCommitment)}&knowledgeLevel=${encodeURIComponent(formData.knowledgeLevel)}&token=${token}`,
        { withCredentials: false }
      );

      // Using fetch with streaming instead
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseTopic: formData.subject || formData.title,
          timeCommitment: formData.timeCommitment,
          knowledgeLevel: formData.knowledgeLevel,
          userId: user._id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start course generation');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              handleProgressUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Course generation error:', error);
      toast.error('Failed to generate course. Please try again.');
      setGenerating(false);
    }
  };

  const handleProgressUpdate = (data) => {
    console.log('Progress update:', data);

    switch (data.type) {
      case 'status':
        setCurrentStatus(data.message);
        setProgress(data.progress);
        break;

      case 'course_created':
        setGeneratedCourse({
          _id: data.courseId,
          title: data.title,
          totalModules: data.totalModules
        });
        setProgress(data.progress);
        break;

      case 'module_creating':
        setCurrentStatus(`Creating Module ${data.moduleNumber}/${data.totalModules}: ${data.title}`);
        setProgress(data.progress);
        
        // Add placeholder module
        setModules(prev => [
          ...prev,
          {
            moduleNumber: data.moduleNumber,
            title: data.title,
            status: 'creating',
            progress: data.progress
          }
        ]);
        break;

      case 'module_created':
        setCurrentStatus(`Module ${data.moduleNumber} created successfully!`);
        setProgress(data.progress);
        
        // Update module status
        setModules(prev => prev.map(m => 
          m.moduleNumber === data.moduleNumber
            ? { ...m, status: 'completed', _id: data.moduleId, tasksCount: data.tasksCount }
            : m
        ));
        break;

      case 'completed':
        setCurrentStatus('Course created successfully!');
        setProgress(100);
        setGeneratedCourse(data.course);
        setGenerating(false);
        setStep(4);
        
        // Show detailed success notification
        toast.success(
          '🎉 Course Generation Complete!\nYour personalized course is ready to start learning.',
          {
            duration: 5000,
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '500',
              padding: '16px',
            },
          }
        );

        // Optional: Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Course Ready! 🎓', {
            body: `Your course "${data.course.title}" has been created successfully!`,
            icon: '/favicon.ico'
          });
        }
        
        if (onCourseCreated) {
          onCourseCreated(data.course);
        }
        break;

      case 'error':
        setCurrentStatus(`Error: ${data.message}`);
        toast.error(data.message);
        setGenerating(false);
        break;

      default:
        console.log('Unknown progress type:', data.type);
    }
  };

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const moduleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Create AI-Powered Course</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Step {step} of 4</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Course Details</span>
          <span>Preferences</span>
          <span>Generate</span>
          <span>Complete</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Course Details */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-xl p-8 shadow-lg border"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={
                    showCustomInput && customSubject
                      ? `e.g., Complete ${customSubject} Mastery`
                      : "e.g., Complete Python Programming"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showCustomInput && customSubject && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Suggested: "Complete {customSubject} Mastery" or "Advanced {customSubject} Course"
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={showCustomInput ? 'Other' : formData.subject}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    showCustomInput 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                
                {/* Custom Subject Input - appears when "Other" is selected */}
                {showCustomInput && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                      What do you want to learn? *
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={handleCustomSubjectChange}
                      placeholder="e.g., Advanced Quantum Computing, Digital Art Creation, Sustainable Agriculture, Blockchain Development..."
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      autoFocus
                    />
                    <div className="mt-2 p-3 bg-blue-100 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium mb-1">
                        🚀 AI Course Generation Tips:
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• Be specific about your learning goals</li>
                        <li>• Include any particular tools or technologies you want to focus on</li>
                        <li>• Mention your preferred application areas or use cases</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="2 weeks">2 weeks</option>
                    <option value="4 weeks">4 weeks</option>
                    <option value="6 weeks">6 weeks</option>
                    <option value="8 weeks">8 weeks</option>
                    <option value="12 weeks">12 weeks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Learning Preferences */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-xl p-8 shadow-lg border"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Learning Preferences</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Knowledge Level
                  </label>
                  <select
                    name="knowledgeLevel"
                    value={formData.knowledgeLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Commitment
                  </label>
                  <input
                    type="text"
                    name="timeCommitment"
                    value={formData.timeCommitment}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 hours per week"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <span>Generate Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Progressive Generation */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-xl p-8 shadow-lg border"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Generating Your Course</h2>
              </div>

              {!generating ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Course Summary</h3>
                    <div className="text-left space-y-2">
                      <p><strong>Title:</strong> {formData.title}</p>
                      <p><strong>Subject:</strong> {formData.subject}</p>
                      <p><strong>Duration:</strong> {formData.duration}</p>
                      <p><strong>Your Level:</strong> {formData.knowledgeLevel}</p>
                      <p><strong>Time Commitment:</strong> {formData.timeCommitment}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Watch your course come to life, module by module!
                    </span>
                  </div>

                  <button
                    onClick={generateCourseProgressive}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 mx-auto"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span>Generate My Course</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-700">{progress}% Complete</div>

                  {/* Current Status */}
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-medium text-gray-900">{currentStatus}</h3>
                      <p className="text-sm text-gray-600">Please wait while we craft your course...</p>
                    </div>
                  </div>

                  {/* Information Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4"
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Course Generation in Progress
                        </h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          This may take a little longer based on response time and course complexity. 
                          We're creating comprehensive content with modules, tasks, and resources tailored to your needs. 
                          <span className="font-medium"> We'll notify you once the course is completed!</span>
                        </p>
                        <p className="text-xs text-blue-700 mt-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Estimated time: 1-3 minutes
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Module Creation Progress */}
                  {modules.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Modules Being Created</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        <AnimatePresence>
                          {modules.map((module, index) => (
                            <motion.div
                              key={module.moduleNumber}
                              variants={moduleVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className={`p-4 rounded-lg border-2 ${
                                module.status === 'completed' 
                                  ? 'bg-green-50 border-green-500' 
                                  : 'bg-blue-50 border-blue-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {module.status === 'completed' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                  )}
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      Module {module.moduleNumber}: {module.title}
                                    </h5>
                                    {module.status === 'completed' && module.tasksCount > 0 && (
                                      <p className="text-xs text-gray-600">
                                        {module.tasksCount} tasks created
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {module.status === 'completed' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-green-500 text-white p-2 rounded-full"
                                  >
                                    <Check className="w-4 h-4" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!generating && (
                <div className="flex justify-start mt-8">
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Start Learning */}
        {step === 4 && generatedCourse && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-xl p-8 shadow-lg border"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="p-4 bg-green-100 rounded-full">
                  <Award className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Course Created Successfully!</h2>
              <p className="text-gray-600 mb-8">
                Your personalized learning journey is ready to begin
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{generatedCourse.title}</h3>
                <p className="text-gray-600 mb-4">{generatedCourse.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>{generatedCourse.totalModules || modules.length} Modules</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span>{formData.difficulty}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{formData.duration}</span>
                  </div>
                </div>
              </div>

              {modules.length > 0 && (
                <div className="mb-8 text-left">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Modules</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {modules.filter(m => m.status === 'completed').map((module) => (
                      <div
                        key={module.moduleNumber}
                        className="p-3 bg-gray-50 rounded-lg border flex items-center space-x-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">
                            Module {module.moduleNumber}: {module.title}
                          </span>
                          {module.tasksCount > 0 && (
                            <span className="text-xs text-gray-600 ml-2">
                              ({module.tasksCount} tasks)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  toast.success('Redirecting to your course...');
                  if (onCourseCreated) {
                    onCourseCreated(generatedCourse);
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 mx-auto"
              >
                <Play className="w-5 h-5" />
                <span>Start Learning Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressiveCourseGeneration;
