import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Clock,
  User,
  Flag,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Filter,
  Search,
  Download,
  GripVertical,
  ChevronDown,
  ChevronRight,
  List,
  Grid,
  LayoutGrid,
  SortAsc,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { API_BASE_URL } from '../config/api';

const EnhancedKanbanBoard = ({ user, token }) => {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, grouped
  const [groupByCourse, setGroupByCourse] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const [filters, setFilters] = useState({
    course: '',
    priority: '',
    search: '',
    status: '',
    overdue: false,
    today: false,
    thisWeek: false
  });

  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, priority, createdAt, alphabetical

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = [
    { id: 'todo', title: 'To Do', color: 'blue', icon: Target },
    { id: 'in-progress', title: 'In Progress', color: 'yellow', icon: Clock },
    { id: 'review', title: 'Review', color: 'purple', icon: AlertCircle },
    { id: 'completed', title: 'Completed', color: 'green', icon: CheckCircle }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'gray', icon: '🔵' },
    { value: 'medium', label: 'Medium', color: 'yellow', icon: '🟡' },
    { value: 'high', label: 'High', color: 'orange', icon: '🟠' },
    { value: 'urgent', label: 'Urgent', color: 'red', icon: '🔴' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchCourses();
  }, []);

  useEffect(() => {
    // Auto-expand all courses initially
    if (courses.length > 0) {
      const expanded = {};
      courses.forEach(course => {
        expanded[course._id] = true;
      });
      setExpandedCourses(expanded);
    }
  }, [courses]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (data.success) {
        setTasks(prev => [...prev, data.data.task]);
        toast.success('Task created successfully!');
        setShowAddModal(false);
      } else {
        toast.error(data.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        setTasks(prev => prev.map(task =>
          task._id === taskId ? { ...task, ...updates } : task
        ));
        toast.success('Task updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Task update error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
        toast.success('Task deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Task deletion error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const bulkUpdateTasks = async (taskIds, updates) => {
    try {
      // Update tasks optimistically
      setTasks(prev => prev.map(task =>
        taskIds.includes(task._id) ? { ...task, ...updates } : task
      ));

      // Update each task on server
      await Promise.all(taskIds.map(taskId =>
        fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        })
      ));

      toast.success(`Updated ${taskIds.length} tasks`);
      setSelectedTasks(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update tasks');
      fetchTasks(); // Revert optimistic updates
    }
  };

  const bulkDeleteTasks = async (taskIds) => {
    if (!window.confirm(`Delete ${taskIds.length} tasks? This cannot be undone.`)) return;

    try {
      setTasks(prev => prev.filter(task => !taskIds.includes(task._id)));

      await Promise.all(taskIds.map(taskId =>
        fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      toast.success(`Deleted ${taskIds.length} tasks`);
      setSelectedTasks(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete tasks');
      fetchTasks();
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(t => t._id === active.id);
    const overColumn = over.id;

    if (activeTask && columns.find(c => c.id === overColumn)) {
      if (activeTask.status !== overColumn) {
        updateTask(activeTask._id, { status: overColumn });
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    const filtered = getFilteredAndSortedTasks();
    setSelectedTasks(new Set(filtered.map(t => t._id)));
  };

  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  const getFilteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => {
      const matchesCourse = !filters.course || task.courseId === filters.course;
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesStatus = !filters.status || task.status === filters.status;
      const matchesSearch = !filters.search ||
        task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filters.search.toLowerCase());

      // Date filters
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDue = task.dueDate ? new Date(task.dueDate) : null;

      const matchesOverdue = !filters.overdue || (taskDue && taskDue < today && task.status !== 'completed');
      const matchesToday = !filters.today || (taskDue && taskDue.toDateString() === today.toDateString());
      
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const matchesThisWeek = !filters.thisWeek || (taskDue && taskDue >= today && taskDue <= weekEnd);

      return matchesCourse && matchesPriority && matchesStatus && matchesSearch && 
             matchesOverdue && matchesToday && matchesThisWeek;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return (a.dueDate || new Date(9999, 0)) > (b.dueDate || new Date(9999, 0)) ? 1 : -1;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTasksByStatus = (status) => {
    return getFilteredAndSortedTasks().filter(task => task.status === status);
  };

  const getTasksByCourse = (courseId) => {
    return getFilteredAndSortedTasks().filter(task => task.courseId === courseId);
  };

  const getTaskStats = () => {
    const filtered = getFilteredAndSortedTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: filtered.length,
      completed: filtered.filter(t => t.status === 'completed').length,
      inProgress: filtered.filter(t => t.status === 'in-progress').length,
      overdue: filtered.filter(t => {
        const due = t.dueDate ? new Date(t.dueDate) : null;
        return due && due < today && t.status !== 'completed';
      }).length,
      today: filtered.filter(t => {
        const due = t.dueDate ? new Date(t.dueDate) : null;
        return due && due.toDateString() === today.toDateString();
      }).length
    };
  };

  const stats = getTaskStats();

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'gray';
  };

  const getPriorityIcon = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.icon || '⚪';
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      const days = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? 's' : ''} overdue`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const SortableTaskCard = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const course = courses.find(c => c._id === task.courseId);
    const isSelected = selectedTasks.has(task._id);
    const overdue = isOverdue(task.dueDate);

    return (
      <div ref={setNodeRef} style={style}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-lg transition-all ${
            isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''
          } ${isSelected ? 'ring-2 ring-blue-400' : ''} ${overdue && task.status !== 'completed' ? 'border-l-4 border-l-red-500' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-2 flex-1">
              {bulkMode && (
                <button
                  onClick={() => toggleTaskSelection(task._id)}
                  className="mt-1"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              )}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-0.5"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                {task.title}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg" title={task.priority}>
                {getPriorityIcon(task.priority)}
              </span>
              <button
                onClick={() => setEditingTask(task)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2 ml-6">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between ml-6">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {course && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{course.title}</span>
                </div>
              )}
              {task.dueDate && (
                <div className={`flex items-center space-x-1 ${overdue && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
              )}
              {task.estimatedTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{task.estimatedTime}m</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Title and Stats */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} total • {stats.completed} completed • {stats.overdue} overdue
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Kanban View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setViewMode('grouped');
                  setGroupByCourse(true);
                }}
                className={`p-2 rounded-lg ${viewMode === 'grouped' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Group by Course"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
              <div className="text-xs text-gray-600">Due Today</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Course Filter */}
            <select
              value={filters.course}
              onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="createdAt">Sort by Created</option>
              <option value="alphabetical">Sort A-Z</option>
            </select>

            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, overdue: !prev.overdue }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.overdue ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, today: !prev.today }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.today ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, thisWeek: !prev.thisWeek }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.thisWeek ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
            </div>

            {/* Bulk Mode Toggle */}
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                if (bulkMode) deselectAllTasks();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {bulkMode ? 'Exit Bulk' : 'Bulk Edit'}
            </button>

            {/* Add Task Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && selectedTasks.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={selectAllTasks}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllTasks}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Deselect All
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateTasks(Array.from(selectedTasks), { status: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 border rounded text-sm"
                >
                  <option value="">Change Status</option>
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateTasks(Array.from(selectedTasks), { priority: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 border rounded text-sm"
                >
                  <option value="">Change Priority</option>
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => bulkDeleteTasks(Array.from(selectedTasks))}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map(column => {
                const columnTasks = getTasksByStatus(column.id);
                const Icon = column.icon;

                return (
                  <div key={column.id} className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-5 h-5 text-${column.color}-600`} />
                        <h3 className="font-semibold text-gray-900">{column.title}</h3>
                        <span className="text-sm text-gray-600">({columnTasks.length})</span>
                      </div>
                    </div>

                    <SortableContext
                      items={columnTasks.map(t => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3 min-h-[200px]">
                        <AnimatePresence>
                          {columnTasks.map(task => (
                            <SortableTaskCard key={task._id} task={task} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grouped by Course View */}
          {viewMode === 'grouped' && groupByCourse && (
            <div className="space-y-6">
              {courses.map(course => {
                const courseTasks = getTasksByCourse(course._id);
                if (courseTasks.length === 0) return null;

                const isExpanded = expandedCourses[course._id];

                return (
                  <div key={course._id} className="bg-white rounded-lg border shadow-sm">
                    <button
                      onClick={() => toggleCourseExpansion(course._id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {courseTasks.length} tasks
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {courseTasks.filter(t => t.status === 'completed').length} completed
                        </span>
                        <span>
                          {courseTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length} overdue
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t"
                      >
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {columns.map(column => {
                            const statusTasks = courseTasks.filter(t => t.status === column.id);
                            if (statusTasks.length === 0) return null;

                            const Icon = column.icon;

                            return (
                              <div key={column.id}>
                                <div className="flex items-center space-x-2 mb-3">
                                  <Icon className={`w-4 h-4 text-${column.color}-600`} />
                                  <span className="text-sm font-medium text-gray-700">
                                    {column.title} ({statusTasks.length})
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {statusTasks.map(task => (
                                    <SortableTaskCard key={task._id} task={task} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* Tasks without a course */}
              {(() => {
                const unassignedTasks = getFilteredAndSortedTasks().filter(t => !t.courseId);
                if (unassignedTasks.length === 0) return null;

                return (
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-gray-600" />
                      <span>Unassigned Tasks ({unassignedTasks.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {unassignedTasks.map(task => (
                        <SortableTaskCard key={task._id} task={task} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {bulkMode && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) selectAllTasks();
                            else deselectAllTasks();
                          }}
                          className="rounded"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Task</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getFilteredAndSortedTasks().map(task => {
                    const course = courses.find(c => c._id === task.courseId);
                    const overdue = isOverdue(task.dueDate);
                    const isSelected = selectedTasks.has(task._id);

                    return (
                      <tr key={task._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        {bulkMode && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTaskSelection(task._id)}
                              className="rounded"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-600 line-clamp-1">{task.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {course ? course.title : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${overdue && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatDueDate(task.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.estimatedTime ? `${task.estimatedTime}m` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTask(task._id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {getFilteredAndSortedTasks().length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">Try adjusting your filters or create a new task</p>
                </div>
              )}
            </div>
          )}

          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-lg p-4 shadow-2xl border-2 border-blue-500 opacity-90">
                <div className="font-medium text-gray-900">
                  {tasks.find(t => t._id === activeId)?.title}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Empty State */}
      {tasks.length === 0 && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Target className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No tasks yet</h2>
            <p className="text-gray-600 mb-6">
              Tasks are automatically created when you generate a course. Create your first course to get started!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Task</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedKanbanBoard;
