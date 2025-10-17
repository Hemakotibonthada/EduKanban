import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  User, 
  BarChart3, 
  Settings,
  LogOut,
  Plus,
  Target,
  Clock,
  Award,
  TrendingUp,
  MessageCircle,
  Bell,
  Timer,
  Calendar as CalendarIcon,
  Search,
  Heart,
  Users,
  Menu,
  X,
  ChevronDown,
  FileText,
  Download,
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import KanbanBoard from './KanbanBoard';
import ProfilePage from './ProfilePage';
import CourseGenerationPage from './CourseGenerationPage';
import CoursesListPage from './CoursesListPage';
import CourseContentPage from './CourseContentPageSimple';
import Analytics from './Analytics';
import ChatPortal from './ChatPortal';
import ChatPortalEnhanced from './ChatPortalEnhanced';
import NotificationCenter from './NotificationCenter';
import StudyTimer from './StudyTimer';
import CalendarView from './CalendarView';
import GamificationDashboard from './GamificationDashboard';
import GlobalSearch from './GlobalSearch';
import RehabilitationCenter from './RehabilitationCenter';
import ExportImport from './ExportImport';
import CertificatesPage from './CertificatesPage';
import SocialHub from './SocialHub';
import WelcomeTour from './WelcomeTour';
import LandingDashboard from './LandingDashboard';

const Dashboard = ({ user, token, onLogout, onCelebrate }) => {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('dashboardActiveView') || 'dashboard';
  });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStudyTimer, setShowStudyTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Persist active view to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardActiveView', activeView);
  }, [activeView]);

  // Primary navigation items (most frequently used)
  const primaryNavItems = [
    { id: 'dashboard', label: 'Home', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { id: 'courses', label: 'Courses', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    { id: 'kanban', label: 'Tasks', icon: BarChart3, color: 'from-green-500 to-teal-500' },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle, color: 'from-indigo-500 to-purple-500' },
  ];

  // Secondary navigation items (grouped in "More" menu)
  const secondaryNavItems = [
    { 
      category: 'Learning Tools',
      items: [
        { id: 'create-course', label: 'Create Course', icon: Plus, color: 'from-yellow-500 to-orange-500' },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon, color: 'from-teal-500 to-green-500' },
        { id: 'search', label: 'Global Search', icon: Search, color: 'from-indigo-500 to-blue-500' },
      ]
    },
    {
      category: 'Progress & Growth',
      items: [
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
        { id: 'gamification', label: 'Achievements', icon: Award, color: 'from-yellow-500 to-orange-500' },
        { id: 'certificates', label: 'Certificates', icon: FileText, color: 'from-amber-500 to-yellow-500' },
      ]
    },
    {
      category: 'Community & Wellness',
      items: [
        { id: 'social', label: 'Social Hub', icon: Users, color: 'from-cyan-500 to-blue-500' },
        { id: 'rehabilitation', label: 'Wellness Center', icon: Heart, color: 'from-pink-500 to-rose-500' },
      ]
    },
    {
      category: 'Settings',
      items: [
        { id: 'profile', label: 'Profile', icon: User, color: 'from-pink-500 to-rose-500' },
        { id: 'export', label: 'Export/Import', icon: Download, color: 'from-slate-500 to-gray-500' },
      ]
    }
  ];

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [coursesRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (coursesRes.ok && tasksRes.ok) {
        const coursesData = await coursesRes.json();
        const tasksData = await tasksRes.json();
        
        setCourses(coursesData.data.courses || []);
        setTasks(tasksData.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onLogout();
    }
  };

  const getStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => ['Passed', 'Completed'].includes(t.status)).length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    const completedCourses = courses.filter(c => c.status === 'completed').length;

    return {
      totalTasks,
      completedTasks,
      activeCourses,
      completedCourses,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Tour for New Users */}
      <WelcomeTour user={user} />

      {/* Show chat in fullscreen mode when active */}
      {activeView === 'chat' ? (
        <ChatPortalEnhanced 
          user={user} 
          token={token} 
          onNavigateHome={() => setActiveView('overview')}
        />
      ) : (
        <>
          {/* Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduKanban
              </span>
            </div>

            {/* Primary Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}

              {/* More Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                    showMoreMenu
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                      onMouseLeave={() => setShowMoreMenu(false)}
                    >
                      <div className="max-h-[70vh] overflow-y-auto">
                        {secondaryNavItems.map((category, idx) => (
                          <div key={idx} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                            <div className="px-4 py-2 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {category.category}
                              </p>
                            </div>
                            <div className="py-1">
                              {category.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      setActiveView(item.id);
                                      setShowMoreMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all ${
                                      isActive
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className={`p-1.5 rounded-lg ${
                                      isActive ? `bg-gradient-to-r ${item.color}` : 'bg-gray-100'
                                    }`}>
                                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <span className="text-sm">{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Study Timer Button */}
              <button
                onClick={() => setShowStudyTimer(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative group"
                title="Study Timer"
              >
                <Timer className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </button>

              {/* Notification Center */}
              <NotificationCenter user={user} token={token} />

              {/* User Profile */}
              <div className="hidden sm:flex items-center space-x-2 pl-2 ml-2 border-l border-gray-200">
                <button
                  onClick={() => setActiveView('profile')}
                  className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-1.5 transition-all"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-offset-1 ring-blue-500/30">
                    <span className="text-white text-xs font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user.firstName}
                    </p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">EduKanban</span>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-blue-100 text-sm">@{user.username}</p>
                  </div>
                </div>
              </div>

              {/* Primary Navigation */}
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Quick Access
                </p>
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all mb-1 ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Navigation */}
              {secondaryNavItems.map((category, idx) => (
                <div key={idx} className="border-t border-gray-100">
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category.category}
                    </p>
                  </div>
                  <div className="p-4 pt-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id);
                            setShowMobileMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${
                            isActive ? `bg-gradient-to-r ${item.color}` : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <LandingDashboard 
            user={user} 
            token={token} 
            onNavigate={(view, courseId) => {
              if (courseId) setSelectedCourseId(courseId);
              setActiveView(view);
            }}
          />
        )}

        {activeView === 'courses' && (
          <CoursesListPage 
            user={user} 
            token={token} 
            onCourseSelect={(courseId) => {
              setSelectedCourseId(courseId);
              setActiveView('course-content');
            }}
            onCreateCourse={() => setActiveView('create-course')}
          />
        )}

        {activeView === 'course-content' && selectedCourseId && (
          <CourseContentPage 
            user={user} 
            token={token} 
            courseId={selectedCourseId}
            onBack={() => {
              setActiveView('courses');
              setSelectedCourseId(null);
            }}
          />
        )}

        {activeView === 'kanban' && (
          <KanbanBoard user={user} token={token} />
        )}

        {activeView === 'calendar' && (
          <CalendarView user={user} token={token} />
        )}

        {activeView === 'search' && (
          <GlobalSearch 
            user={user} 
            token={token}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setActiveView('course-content');
            }}
            onSelectTask={(taskId) => {
              setActiveView('kanban');
            }}
          />
        )}

        {activeView === 'gamification' && (
          <GamificationDashboard user={user} token={token} />
        )}

        {activeView === 'rehabilitation' && (
          <RehabilitationCenter user={user} token={token} />
        )}

        {activeView === 'export' && (
          <ExportImport token={token} />
        )}

        {activeView === 'certificates' && (
          <CertificatesPage token={token} />
        )}

        {activeView === 'social' && (
          <SocialHub user={user} token={token} />
        )}

        {activeView === 'analytics' && (
          <Analytics user={user} token={token} />
        )}

        {activeView === 'create-course' && (
          <CourseGenerationPage 
            user={user} 
            token={token} 
            onCourseCreated={(course) => {
              fetchUserData();
              setActiveView('courses');
            }} 
          />
        )}

        {activeView === 'profile' && (
          <ProfilePage user={user} token={token} />
        )}
      </main>
      
      {/* Study Timer Modal */}
      {showStudyTimer && (
        <StudyTimer
          user={user}
          token={token}
          onClose={() => setShowStudyTimer(false)}
        />
      )}
      </>
      )}
    </div>
  );
};

export default Dashboard;