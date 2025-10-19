import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Award,
  BookOpen,
  Code,
  Calendar,
  Mail,
  MapPin,
  Briefcase,
  Github,
  Linkedin,
  Globe,
  Download,
  Share2,
  Edit,
  Trophy,
  Star,
  TrendingUp,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import EditProfileModal from './EditProfileModal';

const EnhancedProfilePortfolio = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPublic, setIsPublic] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userData, setUserData] = useState(user);

  // Mock portfolio data
  const portfolioData = {
    bio: "Full-stack developer passionate about creating impactful web applications. Love learning new technologies and sharing knowledge with the community.",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    github: "johndoe",
    linkedin: "johndoe",
    skills: [
      { name: 'JavaScript', level: 95, category: 'Language' },
      { name: 'React', level: 90, category: 'Framework' },
      { name: 'Node.js', level: 85, category: 'Backend' },
      { name: 'Python', level: 80, category: 'Language' },
      { name: 'MongoDB', level: 75, category: 'Database' },
      { name: 'AWS', level: 70, category: 'Cloud' },
    ],
    completedProjects: [
      {
        id: 1,
        title: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with React, Node.js, and MongoDB',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        completedDate: '2025-09-15',
        courseRelated: 'Full Stack Web Development',
        thumbnail: 'https://via.placeholder.com/400x225/667eea/ffffff?text=E-Commerce',
        liveUrl: 'https://project1.demo',
        githubUrl: 'https://github.com/user/project1'
      },
      {
        id: 2,
        title: 'Task Management App',
        description: 'Real-time collaborative task management with drag-and-drop',
        technologies: ['React', 'Firebase', 'Material-UI'],
        completedDate: '2025-08-20',
        courseRelated: 'React Complete Course',
        thumbnail: 'https://via.placeholder.com/400x225/f093fb/ffffff?text=Task+App',
        liveUrl: 'https://project2.demo',
        githubUrl: 'https://github.com/user/project2'
      },
      {
        id: 3,
        title: 'Weather Dashboard',
        description: 'Interactive weather dashboard with data visualization',
        technologies: ['Vue.js', 'Chart.js', 'OpenWeather API'],
        completedDate: '2025-07-10',
        courseRelated: 'Data Visualization',
        thumbnail: 'https://via.placeholder.com/400x225/4facfe/ffffff?text=Weather+App',
        liveUrl: 'https://project3.demo',
        githubUrl: 'https://github.com/user/project3'
      }
    ],
    badges: [
      { id: 1, name: 'Quick Learner', icon: '⚡', description: 'Completed 5 courses in 30 days', earnedDate: '2025-08-15' },
      { id: 2, name: 'Code Master', icon: '👨‍💻', description: 'Submitted 50+ projects', earnedDate: '2025-09-01' },
      { id: 3, name: 'Team Player', icon: '🤝', description: 'Collaborated in 10+ study groups', earnedDate: '2025-09-10' },
      { id: 4, name: '100 Day Streak', icon: '🔥', description: 'Maintained 100-day learning streak', earnedDate: '2025-09-20' },
      { id: 5, name: 'Community Helper', icon: '🌟', description: 'Helped 100+ peers', earnedDate: '2025-10-01' },
      { id: 6, name: 'Full Stack Pro', icon: '🎯', description: 'Mastered full-stack development', earnedDate: '2025-10-10' }
    ],
    learningJourney: [
      { date: '2025-01-15', event: 'Started Full Stack Web Development Path', type: 'milestone' },
      { date: '2025-02-20', event: 'Completed HTML & CSS Fundamentals', type: 'course' },
      { date: '2025-03-15', event: 'Completed JavaScript Basics', type: 'course' },
      { date: '2025-04-10', event: 'Built First React Project', type: 'project' },
      { date: '2025-05-05', event: 'Earned Quick Learner Badge', type: 'badge' },
      { date: '2025-06-01', event: 'Completed React Advanced', type: 'course' },
      { date: '2025-07-15', event: 'Started Node.js Backend', type: 'course' },
      { date: '2025-08-20', event: 'Built E-Commerce Platform', type: 'project' },
      { date: '2025-09-10', event: '100 Day Streak Achievement', type: 'badge' },
      { date: '2025-10-15', event: 'Completed Full Stack Path', type: 'milestone' }
    ],
    statistics: {
      totalCourses: 24,
      completedCourses: 18,
      totalProjects: 12,
      totalXP: 15420,
      level: 28,
      studyHours: 485,
      currentStreak: 45
    }
  };

  const handleExportResume = () => {
    toast.success('Generating your professional resume...');
    // Would trigger PDF generation
  };

  const handleShareProfile = () => {
    const profileUrl = `https://edukanban.com/profile/${user._id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied to clipboard!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'projects', label: 'Projects', icon: Code },
    { id: 'skills', label: 'Skills', icon: Target },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'journey', label: 'Journey', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            {/* Profile Info */}
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-white/30 dark:ring-gray-700/30 shadow-xl">
                <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-blue-100 text-lg mb-3">{portfolioData.bio}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{portfolioData.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                  </span>
                </div>

                {/* Social Links */}
                                {/* Social Links */}
                <div className="flex items-center space-x-3 mt-4">
                  <a href={`https://github.com/${portfolioData.github}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={`https://linkedin.com/in/${portfolioData.linkedin}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href={portfolioData.website} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg transition-colors">
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleExportResume}
                className="px-6 py-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Export Resume</span>
              </button>
              <button
                onClick={handleShareProfile}
                className="px-6 py-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all flex items-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Profile</span>
              </button>
              <label className="flex items-center justify-between space-x-3 px-4 py-2 bg-white/20 dark:bg-white/10 rounded-xl cursor-pointer">
                <span className="text-white font-medium">Public Profile</span>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="toggle-checkbox"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-t border-white/20 dark:border-white/10 px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-white">
            <div className="text-center">
              <p className="text-3xl font-bold">{portfolioData.statistics.level}</p>
              <p className="text-sm text-blue-100">Level</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{portfolioData.statistics.completedCourses}</p>
              <p className="text-sm text-blue-100">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{portfolioData.statistics.totalProjects}</p>
              <p className="text-sm text-blue-100">Projects</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{portfolioData.statistics.studyHours}h</p>
              <p className="text-sm text-blue-100">Study Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{portfolioData.statistics.currentStreak}</p>
              <p className="text-sm text-blue-100">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 border dark:border-gray-700">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioData.completedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group border dark:border-gray-700"
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Code className="w-16 h-16 text-white opacity-50" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.completedDate).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs">{project.courseRelated}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Live Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Technical Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolioData.skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{skill.category}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{skill.level}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {portfolioData.badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-all cursor-pointer group border dark:border-gray-700"
              >
                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                  {badge.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{badge.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{badge.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(badge.earnedDate).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Journey Tab */}
        {activeTab === 'journey' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Learning Journey Timeline</h2>
            <div className="space-y-4">
              {portfolioData.learningJourney.map((item, index) => {
                const icons = {
                  milestone: Trophy,
                  course: BookOpen,
                  project: Code,
                  badge: Award
                };
                const Icon = icons[item.type];
                const colors = {
                  milestone: 'from-yellow-500 to-orange-500',
                  course: 'from-blue-500 to-cyan-500',
                  project: 'from-purple-500 to-pink-500',
                  badge: 'from-green-500 to-emerald-500'
                };

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-4"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[item.type]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.event}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{item.type}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overview Tab - Default */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span>Recent Projects</span>
              </h3>
              <div className="space-y-3">
                {portfolioData.completedProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{project.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{project.courseRelated}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                <span>Latest Achievements</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {portfolioData.badges.slice(0, 6).map(badge => (
                  <div key={badge.id} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{badge.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={userData}
          token={token}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={(updatedUser) => setUserData(updatedUser)}
        />
      )}
    </div>
  );
};

export default EnhancedProfilePortfolio;
