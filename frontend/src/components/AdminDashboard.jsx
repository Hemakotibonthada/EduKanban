import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  BookOpen,
  TrendingUp,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Lock,
  Unlock,
  Mail,
  Bell,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Calendar,
  DollarSign,
  Award,
  FileText,
  MessageSquare,
  Flag,
  Ban,
  UserCheck,
  UserX,
  RefreshCw,
  Plus,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Zap,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminBusinessReports from './AdminBusinessReports';

const AdminDashboard = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Admin dashboard data from API
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCertificates: 0,
    pendingReports: 0,
    serverUptime: 0,
    storageUsed: 0,
    apiCalls: 0,
    errorRate: 0
  });

  const [users, setUsers] = useState([]);

  const [courses, setCourses] = useState([]);

  const [reports, setReports] = useState([
    {
      id: 1,
      type: 'user',
      reportedItem: 'Bob Wilson',
      reportedBy: 'Sarah Connor',
      reason: 'Inappropriate comments',
      description: 'User posting spam in course discussions',
      date: '2025-10-18',
      status: 'pending',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'course',
      reportedItem: 'Data Science Masterclass',
      reportedBy: 'John Doe',
      reason: 'Content quality',
      description: 'Course content appears to be copied from other sources',
      date: '2025-10-17',
      status: 'pending',
      severity: 'high'
    }
  ]);

  const [systemLogs, setSystemLogs] = useState([
    { id: 1, timestamp: '2025-10-19 14:30:25', level: 'info', message: 'User login successful', user: 'john@example.com' },
    { id: 2, timestamp: '2025-10-19 14:25:10', level: 'warning', message: 'Failed login attempt', user: 'unknown@example.com' },
    { id: 3, timestamp: '2025-10-19 14:20:05', level: 'error', message: 'Database connection timeout', user: 'system' },
    { id: 4, timestamp: '2025-10-19 14:15:33', level: 'info', message: 'Course published', user: 'jane@example.com' },
    { id: 5, timestamp: '2025-10-19 14:10:18', level: 'info', message: 'Certificate generated', user: 'alice@example.com' }
  ]);

  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Platform Maintenance', message: 'Scheduled maintenance on Sunday', date: '2025-10-15', priority: 'high', published: true },
    { id: 2, title: 'New Features Released', message: 'Check out our latest updates', date: '2025-10-10', priority: 'medium', published: true }
  ]);

  // Fetch admin statistics from API
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5001/api/analytics/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.success) {
          setStats(result.data.stats);
          setUsers(result.data.users);
          setCourses(result.data.courses);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const handleUserAction = (userId, action) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        if (action === 'suspend') {
          toast.success(`User ${u.name} suspended`);
          return { ...u, status: 'suspended' };
        } else if (action === 'activate') {
          toast.success(`User ${u.name} activated`);
          return { ...u, status: 'active' };
        } else if (action === 'delete') {
          toast.success(`User ${u.name} deleted`);
          return null;
        }
      }
      return u;
    }).filter(Boolean));
  };

  const handleCourseAction = (courseId, action) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        if (action === 'publish') {
          toast.success(`Course "${c.title}" published`);
          return { ...c, status: 'published' };
        } else if (action === 'unpublish') {
          toast.success(`Course "${c.title}" unpublished`);
          return { ...c, status: 'draft' };
        } else if (action === 'delete') {
          toast.success(`Course "${c.title}" deleted`);
          return null;
        }
      }
      return c;
    }).filter(Boolean));
  };

  const handleReportAction = (reportId, action) => {
    setReports(reports.map(r => {
      if (r.id === reportId) {
        if (action === 'resolve') {
          toast.success('Report resolved');
          return { ...r, status: 'resolved' };
        } else if (action === 'dismiss') {
          toast.success('Report dismissed');
          return { ...r, status: 'dismissed' };
        }
      }
      return r;
    }));
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    setSelectedUser(data);
    setShowModal(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-blue-100">Total Users</p>
          <p className="text-sm text-blue-100 mt-2">{stats.activeUsers} active</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">+8%</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalCourses}</h3>
          <p className="text-purple-100">Total Courses</p>
          <p className="text-sm text-purple-100 mt-2">{stats.activeCourses} active</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">+15%</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">${stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-green-100">Total Revenue</p>
          <p className="text-sm text-green-100 mt-2">${stats.monthlyRevenue} this month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">Urgent</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.pendingReports}</h3>
          <p className="text-orange-100">Pending Reports</p>
          <p className="text-sm text-orange-100 mt-2">Requires attention</p>
        </motion.div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-green-600" />
            <span>System Health</span>
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Server Uptime</span>
                <span className="text-sm font-bold text-green-600">{stats.serverUptime}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.serverUptime}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Storage Used</span>
                <span className="text-sm font-bold text-blue-600">{stats.storageUsed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.storageUsed}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
                <span className="text-sm font-bold text-yellow-600">{stats.errorRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${stats.errorRate * 10}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <span>API Usage</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Total API Calls</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{stats.apiCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Avg Response Time</span>
              </div>
              <span className="text-xl font-bold text-gray-900">145ms</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Active Connections</span>
              </div>
              <span className="text-xl font-bold text-gray-900">234</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-blue-600" />
          <span>Recent System Logs</span>
        </h3>
        <div className="space-y-2">
          {systemLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {log.level === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                {log.level === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                {log.level === 'info' && <CheckCircle className="w-5 h-5 text-green-600" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500">{log.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => openModal('createUser')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.filter(u => 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'instructor' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openModal('viewUser', user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('editUser', user)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCourseManagement = () => (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600">by {course.instructor}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === 'published' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {course.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Enrollments</p>
                  <p className="text-xl font-bold text-blue-900">{course.enrollments}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Revenue</p>
                  <p className="text-xl font-bold text-purple-900">${course.revenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Rating</p>
                  <p className="text-xl font-bold text-green-900">{course.rating || 'N/A'}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 mb-1">Price</p>
                  <p className="text-xl font-bold text-orange-900">${course.price}</p>
                </div>
              </div>

              {course.reports > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">{course.reports} pending report(s)</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {course.status === 'draft' ? (
                  <button
                    onClick={() => handleCourseAction(course.id, 'publish')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleCourseAction(course.id, 'unpublish')}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unpublish</span>
                  </button>
                )}
                <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCourseAction(course.id, 'delete')}
                  className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportsManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Flag className="w-6 h-6 text-red-600" />
          <span>Pending Reports ({reports.filter(r => r.status === 'pending').length})</span>
        </h3>

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.type === 'user' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.severity === 'high' ? 'bg-red-100 text-red-800' :
                      report.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.severity} severity
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Reported: {report.reportedItem}</h4>
                  <p className="text-sm text-gray-600 mb-2">by {report.reportedBy} on {report.date}</p>
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason: {report.reason}</p>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>

              {report.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReportAction(report.id, 'resolve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </button>
                  <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>General Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
              <input type="text" defaultValue="EduKanban" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input type="email" defaultValue="support@edukanban.com" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Mode</label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">Enable maintenance mode</span>
              </label>
            </div>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Save Settings
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-green-600" />
            <span>Security Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
              <input type="number" defaultValue="5" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input type="number" defaultValue="30" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">Require 2FA for all users</span>
              </label>
            </div>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Save Security Settings
            </button>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Mail className="w-6 h-6 text-purple-600" />
            <span>Email Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server</label>
              <input type="text" placeholder="smtp.example.com" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
              <input type="number" defaultValue="587" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Notifications</label>
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700">New user registrations</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700">Course completions</span>
              </label>
            </div>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Save Email Settings
            </button>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Database className="w-6 h-6 text-orange-600" />
            <span>Database Management</span>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Backup</p>
              <p className="text-lg font-bold text-gray-900">2025-10-19 02:00 AM</p>
            </div>
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Download Backup</span>
            </button>
            <button className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5" />
              <span>Create Backup Now</span>
            </button>
            <button className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'business', label: 'Business Reports', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                <Shield className="w-10 h-10" />
                <span>Admin Dashboard</span>
              </h1>
              <p className="text-blue-100">Complete control over your platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span className="hidden md:inline">Notifications</span>
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{stats.pendingReports}</span>
              </button>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
                <RefreshCw className="w-5 h-5" />
                <span className="hidden md:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'reports' && stats.pendingReports > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'courses' && renderCourseManagement()}
        {activeTab === 'business' && <AdminBusinessReports />}
        {activeTab === 'reports' && renderReportsManagement()}
        {activeTab === 'settings' && renderSystemSettings()}
      </div>
    </div>
  );
};

export default AdminDashboard;
