import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  CheckCircle,
  Lock,
  Play,
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  Zap,
  ArrowRight,
  Star,
  Sparkles,
  Map,
  Compass,
  Flag
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const LearningPathVisualizer = ({ user, token, onNavigate }) => {
  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/learning-paths`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ json: () => ({ paths: [] }) }));

      const data = await response.json();
      
      // Generate mock learning paths
      const mockPaths = generateMockLearningPaths();
      setLearningPaths(mockPaths);
      setSelectedPath(mockPaths[0]);
      
      // Mock user progress
      setUserProgress({
        'web-dev-path': {
          completedNodes: ['html-basics', 'css-fundamentals', 'js-intro', 'react-basics'],
          currentNode: 'react-advanced',
          totalXP: 2500
        }
      });
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLearningPaths = () => {
    return [
      {
        _id: 'web-dev-path',
        title: 'Full Stack Web Development',
        description: 'Complete path from beginner to professional web developer',
        category: 'Programming',
        difficulty: 'Beginner to Advanced',
        estimatedDuration: '6 months',
        totalCourses: 12,
        nodes: [
          {
            id: 'html-basics',
            title: 'HTML Fundamentals',
            level: 1,
            position: { x: 50, y: 100 },
            status: 'completed',
            prerequisites: [],
            courseId: 'course1',
            xp: 200,
            duration: '2 weeks'
          },
          {
            id: 'css-fundamentals',
            title: 'CSS & Styling',
            level: 1,
            position: { x: 250, y: 100 },
            status: 'completed',
            prerequisites: ['html-basics'],
            courseId: 'course2',
            xp: 250,
            duration: '3 weeks'
          },
          {
            id: 'js-intro',
            title: 'JavaScript Basics',
            level: 2,
            position: { x: 150, y: 250 },
            status: 'completed',
            prerequisites: ['html-basics', 'css-fundamentals'],
            courseId: 'course3',
            xp: 300,
            duration: '4 weeks'
          },
          {
            id: 'responsive-design',
            title: 'Responsive Design',
            level: 2,
            position: { x: 350, y: 250 },
            status: 'unlocked',
            prerequisites: ['css-fundamentals'],
            courseId: 'course4',
            xp: 200,
            duration: '2 weeks'
          },
          {
            id: 'js-advanced',
            title: 'Advanced JavaScript',
            level: 3,
            position: { x: 150, y: 400 },
            status: 'unlocked',
            prerequisites: ['js-intro'],
            courseId: 'course5',
            xp: 400,
            duration: '6 weeks'
          },
          {
            id: 'react-basics',
            title: 'React Fundamentals',
            level: 3,
            position: { x: 350, y: 400 },
            status: 'completed',
            prerequisites: ['js-intro', 'responsive-design'],
            courseId: 'course6',
            xp: 450,
            duration: '5 weeks'
          },
          {
            id: 'react-advanced',
            title: 'Advanced React',
            level: 4,
            position: { x: 250, y: 550 },
            status: 'current',
            prerequisites: ['react-basics', 'js-advanced'],
            courseId: 'course7',
            xp: 500,
            duration: '6 weeks'
          },
          {
            id: 'node-basics',
            title: 'Node.js & Express',
            level: 4,
            position: { x: 50, y: 550 },
            status: 'locked',
            prerequisites: ['js-advanced'],
            courseId: 'course8',
            xp: 450,
            duration: '5 weeks'
          },
          {
            id: 'databases',
            title: 'Databases & MongoDB',
            level: 5,
            position: { x: 150, y: 700 },
            status: 'locked',
            prerequisites: ['node-basics'],
            courseId: 'course9',
            xp: 400,
            duration: '4 weeks'
          },
          {
            id: 'fullstack-project',
            title: 'Full Stack Project',
            level: 6,
            position: { x: 250, y: 850 },
            status: 'locked',
            prerequisites: ['react-advanced', 'databases'],
            courseId: 'course10',
            xp: 1000,
            duration: '8 weeks',
            isMilestone: true
          }
        ]
      },
      {
        _id: 'data-science-path',
        title: 'Data Science & Machine Learning',
        description: 'Master data analysis, visualization, and machine learning',
        category: 'Data Science',
        difficulty: 'Intermediate to Advanced',
        estimatedDuration: '8 months',
        totalCourses: 15,
        nodes: []
      },
      {
        _id: 'mobile-dev-path',
        title: 'Mobile App Development',
        description: 'Build cross-platform mobile applications',
        category: 'Mobile',
        difficulty: 'Beginner to Advanced',
        estimatedDuration: '5 months',
        totalCourses: 10,
        nodes: []
      }
    ];
  };

  const getNodeStatus = (node) => {
    const pathProgress = userProgress[selectedPath?._id];
    if (!pathProgress) return node.status || 'locked';
    
    if (pathProgress.completedNodes.includes(node.id)) return 'completed';
    if (pathProgress.currentNode === node.id) return 'current';
    
    // Check if prerequisites are met
    const prerequisites = node.prerequisites || [];
    const prerequisitesMet = prerequisites.length === 0 || prerequisites.every(prereq =>
      pathProgress.completedNodes.includes(prereq)
    );
    
    return prerequisitesMet ? 'unlocked' : 'locked';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'from-green-500 to-emerald-500',
          border: 'border-green-500',
          text: 'text-green-700',
          icon: CheckCircle
        };
      case 'current':
        return {
          bg: 'from-blue-500 to-purple-500',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: Play
        };
      case 'unlocked':
        return {
          bg: 'from-yellow-500 to-orange-500',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          icon: Zap
        };
      default:
        return {
          bg: 'from-gray-400 to-gray-500',
          border: 'border-gray-400',
          text: 'text-gray-600',
          icon: Lock
        };
    }
  };

  const handleNodeClick = (node) => {
    const status = getNodeStatus(node);
    
    if (status === 'locked') {
      toast.error('Complete prerequisites first!');
      return;
    }
    
    if (status === 'completed') {
      toast.success('Already completed! Review the course?');
      return;
    }
    
    // Navigate to course
    onNavigate?.('courses');
    toast.success(`Starting: ${node.title}`);
  };

  const SkillNode = ({ node }) => {
    const status = getNodeStatus(node);
    const config = getStatusColor(status);
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: status !== 'locked' ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          position: 'absolute',
          left: `${node.position.x}px`,
          top: `${node.position.y}px`
        }}
        className="cursor-pointer"
        onClick={() => handleNodeClick(node)}
      >
        {/* Node Circle */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${config.bg} shadow-xl flex items-center justify-center border-4 ${config.border} ${
            status === 'locked' ? 'opacity-50' : ''
          }`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Milestone Badge */}
          {node.isMilestone && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Flag className="w-4 h-4 text-white" />
            </div>
          )}

          {/* Pulse Animation for Current */}
          {status === 'current' && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
          )}
        </div>

        {/* Node Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-64 z-10 border-2 border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">{node.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Level {node.level}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.text} bg-gray-100 dark:bg-gray-700`}>
              {status}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{node.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>{node.xp} XP</span>
            </div>
          </div>

          {node.prerequisites.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prerequisites:</p>
              <div className="flex flex-wrap gap-1">
                {node.prerequisites.map(prereq => {
                  const prereqNode = selectedPath.nodes.find(n => n.id === prereq);
                  const prereqStatus = getNodeStatus({ ...prereqNode, id: prereq });
                  return (
                    <span
                      key={prereq}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        prereqStatus === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {prereqNode?.title.substring(0, 15)}...
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {status !== 'locked' && (
            <button className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2">
              <span>{status === 'completed' ? 'Review' : status === 'current' ? 'Continue' : 'Start'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </motion.div>
    );
  };

  const ConnectionLine = ({ from, to, completed }) => {
    const fromNode = selectedPath?.nodes.find(n => n.id === from);
    const toNode = selectedPath?.nodes.find(n => n.id === to);

    if (!fromNode || !toNode) return null;

    const x1 = fromNode.position.x + 48; // Center of node
    const y1 = fromNode.position.y + 48;
    const x2 = toNode.position.x + 48;
    const y2 = toNode.position.y + 48;

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={completed ? '#10b981' : '#cbd5e1'}
        strokeWidth="3"
        strokeDasharray={completed ? '0' : '8 4'}
        className="transition-all duration-500"
      />
    );
  };

  const PathOverview = ({ path }) => {
    const pathProgress = userProgress[path._id] || {};
    const completedCount = pathProgress.completedNodes?.length || 0;
    const progress = (completedCount / path.totalCourses) * 100;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedPath(path)}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transition-all border-2 ${
          selectedPath?._id === path._id
            ? 'border-blue-500 dark:border-blue-400 shadow-xl'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{path.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{path.description}</p>
          </div>
          {selectedPath?._id === path._id && (
            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{path.totalCourses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{path.estimatedDuration}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <Target className="w-3 h-3" />
            <span>{path.difficulty}</span>
          </span>
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>{path.category}</span>
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
              <Map className="w-10 h-10" />
              <span>Learning Paths</span>
            </h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg">
              Visualize your journey and track your progress
            </p>
          </div>
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Compass className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Path Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {learningPaths.map(path => (
          <PathOverview key={path._id} path={path} />
        ))}
      </div>

      {/* Skill Tree Visualization */}
      {selectedPath && selectedPath.nodes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span>Skill Tree: {selectedPath.title}</span>
            </h2>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-sm">
              {['completed', 'current', 'unlocked', 'locked'].map(status => {
                const config = getStatusColor(status);
                return (
                  <div key={status} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${config.bg}`}></div>
                    <span className="capitalize text-gray-600 dark:text-gray-400">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Canvas for Connections */}
          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 overflow-auto" style={{ minHeight: '1000px' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {selectedPath.nodes.map(node =>
                (node.prerequisites || []).map(prereq => {
                  const prereqNode = selectedPath.nodes.find(n => n.id === prereq);
                  const prereqStatus = prereqNode ? getNodeStatus(prereqNode) : 'locked';
                  return (
                    <ConnectionLine
                      key={`${prereq}-${node.id}`}
                      from={prereq}
                      to={node.id}
                      completed={prereqStatus === 'completed'}
                    />
                  );
                })
              )}
            </svg>

            {/* Skill Nodes */}
            <div className="relative" style={{ minHeight: '1000px', zIndex: 1 }}>
              {selectedPath.nodes.map(node => (
                <SkillNode key={node.id} node={node} />
              ))}
            </div>
          </div>

          {/* Next Steps Suggestion */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Suggested Next Steps</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedPath.nodes
                .filter(node => getNodeStatus(node) === 'unlocked')
                .slice(0, 3)
                .map(node => (
                  <div
                    key={node.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all cursor-pointer"
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">{node.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Level {node.level}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{node.duration}</span>
                      <span>{node.xp} XP</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathVisualizer;
