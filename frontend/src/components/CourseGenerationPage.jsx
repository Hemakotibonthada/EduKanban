import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Play,
  Calendar,
  Award,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';

const CourseGenerationPage = ({ user, token, onCourseCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    knowledgeLevel: user.profile?.knowledgeLevel || 'Beginner',
    timeCommitment: user.profile?.timeCommitment || '5 hours per week',
    learningGoals: user.profile?.learningGoals || [],
    preferredLearningStyle: user.profile?.preferredLearningStyle || 'Visual',
    specificTopics: [],
    duration: '4 weeks',
    difficulty: 'Intermediate'
  });
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [subjects] = useState([
    'Web Development',
    'Data Science',
    'Machine Learning',
    'Mobile Development',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'UI/UX Design',
    'Digital Marketing',
    'Business Analytics',
    'Project Management',
    'Python Programming',
    'JavaScript',
    'React.js',
    'Node.js',
    'Database Design',
    'Other'
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'learningGoals') {
        setFormData(prev => ({
          ...prev,
          learningGoals: checked 
            ? [...prev.learningGoals, value]
            : prev.learningGoals.filter(goal => goal !== value)
        }));
      } else if (name === 'specificTopics') {
        setFormData(prev => ({
          ...prev,
          specificTopics: checked 
            ? [...prev.specificTopics, value]
            : prev.specificTopics.filter(topic => topic !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.title || !formData.subject)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const generateCourse = async () => {
    setGenerating(true);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/ai/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseTopic: formData.subject || formData.title,
          knowledgeLevel: formData.knowledgeLevel,
          timeCommitment: formData.timeCommitment,
          userId: user._id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedCourse(data.data.course);
        setStep(4);
        toast.success(data.message || 'Course generated successfully!');
        
        // Notify parent component if callback provided
        if (onCourseCreated) {
          onCourseCreated(data.data.course);
        }
      } else {
        toast.error(data.message || 'Failed to generate course');
      }
    } catch (error) {
      console.error('Course generation error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const regenerateCourse = async () => {
    setGenerating(true);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/ai/regenerate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseTopic: formData.subject || formData.title,
          knowledgeLevel: formData.knowledgeLevel,
          timeCommitment: formData.timeCommitment,
          userId: user._id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedCourse(data.data.course);
        toast.success(data.generatedWithAI 
          ? '✨ Fresh course generated with AI!'
          : 'New course created!');
        
        // Notify parent component if callback provided
        if (onCourseCreated) {
          onCourseCreated(data.data.course);
        }
      } else {
        toast.error(data.message || 'Failed to regenerate course');
      }
    } catch (error) {
      console.error('Course regeneration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleStartLearning = () => {
    if (generatedCourse && onCourseCreated) {
      toast.success('Course is ready! Redirecting to your dashboard...');
      onCourseCreated(generatedCourse);
    } else if (generatedCourse) {
      toast.success('Course created successfully!');
      // Optionally navigate to dashboard or course page
      window.location.href = `/courses/${generatedCourse._id}`;
    }
  };

  const createCourse = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...generatedCourse,
          isAIGenerated: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Course created successfully!');
        if (onCourseCreated) {
          onCourseCreated(data.data.course);
        }
      } else {
        toast.error(data.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Course creation error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const getSubjectTopics = (subject) => {
    const topicMap = {
      'Web Development': ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases', 'API Development'],
      'Data Science': ['Python', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL', 'Pandas'],
      'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Deep Learning', 'NLP', 'Computer Vision'],
      'Mobile Development': ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Cross-platform', 'App Store'],
      'Cybersecurity': ['Network Security', 'Ethical Hacking', 'Cryptography', 'Security Protocols', 'Incident Response', 'Risk Assessment'],
      'Cloud Computing': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Serverless'],
      'DevOps': ['CI/CD', 'Docker', 'Kubernetes', 'Monitoring', 'Infrastructure as Code', 'Git'],
      'UI/UX Design': ['User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Figma', 'User Testing'],
    };
    return topicMap[subject] || ['Fundamentals', 'Best Practices', 'Advanced Concepts', 'Real-world Projects'];
  };

  return (
  <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create AI-Powered Course</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Step {step} of 4</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 h-2 rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Course Details</span>
          <span>Learning Preferences</span>
          <span>Generate Course</span>
          <span>Review & Create</span>
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
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete Web Development Bootcamp"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="2 weeks">2 weeks</option>
                    <option value="4 weeks">4 weeks</option>
                    <option value="6 weeks">6 weeks</option>
                    <option value="8 weeks">8 weeks</option>
                    <option value="12 weeks">12 weeks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {formData.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Specific Topics (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getSubjectTopics(formData.subject).map(topic => (
                      <label key={topic} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="specificTopics"
                          value={topic}
                          checked={formData.specificTopics.includes(topic)}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 dark:text-blue-300 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-700"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
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
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Preferences</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Knowledge Level
                  </label>
                  <select
                    name="knowledgeLevel"
                    value={formData.knowledgeLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Commitment
                  </label>
                  <input
                    type="text"
                    name="timeCommitment"
                    value={formData.timeCommitment}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 hours per week"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Learning Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Visual', 'Auditory', 'Kinesthetic', 'Reading'].map(style => (
                    <label key={style} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="preferredLearningStyle"
                        value={style}
                        checked={formData.preferredLearningStyle === style}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 dark:text-blue-300 border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:focus:ring-blue-700"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{style}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Learning Goals
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Career Change',
                    'Skill Enhancement',
                    'Personal Growth',
                    'Academic Requirements',
                    'Certification',
                    'Entrepreneurship'
                  ].map(goal => (
                    <label key={goal} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="learningGoals"
                        value={goal}
                        checked={formData.learningGoals.includes(goal)}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 dark:text-blue-300 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-700"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generate Course */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700"
          >
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Brain className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Course Generation</h2>
              </div>

              {!generating ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Course Summary</h3>
                    <div className="text-left space-y-2">
                      <p className="text-gray-900 dark:text-gray-300"><strong>Title:</strong> {formData.title}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Subject:</strong> {formData.subject}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Duration:</strong> {formData.duration}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Difficulty:</strong> {formData.difficulty}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Your Level:</strong> {formData.knowledgeLevel}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Learning Style:</strong> {formData.preferredLearningStyle}</p>
                      {formData.specificTopics.length > 0 && (
                        <p className="text-gray-900 dark:text-gray-300"><strong>Topics:</strong> {formData.specificTopics.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Zap className="w-5 h-5 dark:text-blue-300" />
                    <span className="text-sm font-medium dark:text-blue-200">
                      Our AI will create a personalized learning path just for you!
                    </span>
                  </div>

                  <button
                    onClick={generateCourse}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-900 dark:to-blue-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 mx-auto"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span>Generate My Course</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      AI is crafting your personalized course...
                    </h3>
                    <p className="text-gray-600">
                      This may take a few moments as we analyze your preferences and create the perfect learning path.
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>✓ Analyzing your learning style</p>
                    <p>✓ Structuring course modules</p>
                    <p>✓ Creating practice exercises</p>
                    <p>✓ Generating assessments</p>
                  </div>
                </div>
              )}

              {!generating && (
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Create */}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Course</h2>
            </div>

            {!generatedCourse ? (
              <div className="text-center py-12">
                <div className="space-y-6">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">Generating your personalized course...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a few moments</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto border dark:border-blue-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Course Preview</h3>
                    <div className="text-left space-y-2 text-sm">
                      <p className="text-gray-900 dark:text-gray-300"><strong>Topic:</strong> {formData.subject || formData.title}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Level:</strong> {formData.knowledgeLevel}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Time Commitment:</strong> {formData.timeCommitment}</p>
                      <p className="text-gray-900 dark:text-gray-300"><strong>Duration:</strong> {formData.duration}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-900 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    Regenerate Course
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border dark:border-blue-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{generatedCourse.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{generatedCourse.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-900 dark:text-gray-300">{generatedCourse.duration || formData.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-gray-900 dark:text-gray-300">{generatedCourse.difficulty || formData.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-900 dark:text-gray-300">{generatedCourse.modules?.length || 0} Modules</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                      <span className="dark:text-gray-300">Certificate</span>
                    </div>
                  </div>
                </div>

                {generatedCourse.modules && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Course Modules</h4>
                    <div className="space-y-3">
                      {generatedCourse.modules.map((module, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              Module {index + 1}: {module.title}
                            </h5>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {module.estimatedTime || '2-3 hours'}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{module.description}</p>
                          
                          {module.topics && (
                            <div className="flex flex-wrap gap-2">
                              {module.topics.map((topic, topicIndex) => (
                                <span
                                  key={topicIndex}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-xs"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedCourse.learningOutcomes && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Learning Outcomes</h4>
                    <ul className="space-y-2">
                      {generatedCourse.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    onClick={regenerateCourse}
                    disabled={generating}
                    className="px-6 py-3 border border-blue-600 dark:border-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate with AI</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStartLearning}
                    disabled={loading || !generatedCourse}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-900 dark:to-blue-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Learning</span>
                  </button>
                </div>
              </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseGenerationPage;