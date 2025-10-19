import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskPomodoroTimer from './TaskPomodoroTimer';
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
  Square,
  FileCheck,
  BarChart3,
  MessageSquare,
  Tag,
  PlayCircle,
  StopCircle,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import ExamPage from './ExamPage';
import ExamResultsModal from './ExamResultsModal';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
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
  
  // Exam-related state
  const [showExamPage, setShowExamPage] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examTask, setExamTask] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [showExamResults, setShowExamResults] = useState(false);

  const [filters, setFilters] = useState({
    course: '',
    priority: '',
    search: '',
    status: '',
    overdue: false,
    today: false,
    thisWeek: false,
    tags: []
  });

  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, priority, createdAt, alphabetical
  
  // Enhanced features state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [taskTags, setTaskTags] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [timeEntries, setTimeEntries] = useState({});
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(null); // null or task object
  
  // Task templates
  const templates = [
    {
      name: 'Study Session',
      description: 'Complete reading assignment',
      priority: 'medium',
      estimatedTime: 60,
      tags: ['study', 'reading'],
      icon: '📚'
    },
    {
      name: 'Assignment',
      description: 'Complete homework assignment',
      priority: 'high',
      estimatedTime: 120,
      tags: ['homework', 'assignment'],
      icon: '📝'
    },
    {
      name: 'Quiz Preparation',
      description: 'Review materials and practice questions',
      priority: 'high',
      estimatedTime: 90,
      tags: ['quiz', 'preparation'],
      icon: '🎯'
    },
    {
      name: 'Project Milestone',
      description: 'Complete project milestone',
      priority: 'urgent',
      estimatedTime: 180,
      tags: ['project', 'milestone'],
      icon: '🚀'
    }
  ];

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
      // Fetch enrolled courses with modules
      const coursesResponse = await fetch(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        const enrolledCourses = coursesData.data.courses || [];
        
        // Transform course modules into tasks
        const modulesTasks = [];
        
        for (const course of enrolledCourses) {
          if (course.status !== 'completed') { // Only show modules from non-completed courses
            // Fetch detailed course with modules
            const courseResponse = await fetch(`${API_BASE_URL}/courses/${course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              const detailedCourse = courseData.data.course;
              
              if (detailedCourse.modules && detailedCourse.modules.length > 0) {
                detailedCourse.modules.forEach((module, index) => {
                  // Check if module has associated tasks and their status
                  const moduleTask = {
                    _id: `module_${module._id}`,
                    title: module.title,
                    description: module.description || `Module ${index + 1} of ${detailedCourse.title}`,
                    courseId: course._id,
                    courseTitle: course.title,
                    moduleId: module._id,
                    type: 'module',
                    priority: 'medium',
                    status: module.status || 'todo', // Default to todo if no status
                    estimatedTime: module.estimatedDuration || 60,
                    dueDate: module.dueDate,
                    examRequired: module.hasExam || false,
                    examId: module.examId,
                    examPassed: module.examPassed || false,
                    examAttempts: module.examAttempts || 0,
                    content: module.content,
                    topics: module.topics || [],
                    reviewTopics: module.reviewTopics || [],
                    failedTopics: module.failedTopics || [],
                    certificate: module.certificate,
                    progress: module.progress || 0,
                    isModule: true // Flag to identify this as a module-based task
                  };
                  
                  modulesTasks.push(moduleTask);
                });
              }
            }
          }
        }
        
        setTasks(modulesTasks);
        setCourses(enrolledCourses);
      }
    } catch (error) {
      console.error('Error fetching module tasks:', error);
      toast.error('Failed to load learning modules');
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
      const task = tasks.find(t => t._id === taskId);
      
      // Handle module status updates differently
      if (task && task.isModule) {
        await updateModuleStatus(task, updates);
        return;
      }

      // Optimistically update UI first
      const previousTasks = [...tasks];
      setTasks(prev => prev.map(task =>
        task._id === taskId ? { ...task, ...updates } : task
      ));

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
        // Update with server response to ensure consistency
        setTasks(prev => prev.map(task =>
          task._id === taskId ? data.data : task
        ));
        toast.success('Task updated successfully!');
      } else {
        // Revert on failure
        setTasks(previousTasks);
        toast.error(data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Task update error:', error);
      // Revert on error
      fetchTasks(); // Reload from server
      toast.error('Network error. Please try again.');
    }
  };

  const updateModuleStatus = async (moduleTask, updates) => {
    try {
      // Special handling for module status updates
      const newStatus = updates.status;
      let updatedModule = { ...moduleTask, ...updates };
      
      // Extract the real module ID (remove 'module_' prefix if present)
      const realModuleId = moduleTask.moduleId || moduleTask._id.replace('module_', '');
      
      // Generate review topics when moved to review
      if (newStatus === 'review' && moduleTask.status !== 'review') {
        updatedModule = await generateReviewTopics(updatedModule);
        toast.success('Module ready for review! Key topics identified.');
      }
      
      // Handle exam completion flow
      if (newStatus === 'completed' && moduleTask.examRequired && !moduleTask.examPassed) {
        // Don't allow completion without passing exam
        toast.warning('Complete the exam first to finish this module');
        return;
      }
      
      // Generate certificate on completion
      if (newStatus === 'completed' && moduleTask.examPassed) {
        updatedModule = await generateCertificate(updatedModule);
        toast.success('🎉 Module completed! Certificate generated.');
      }
      
      // Move failed modules back to in-progress
      if (newStatus === 'in-progress' && moduleTask.examAttempts > 0 && !moduleTask.examPassed) {
        updatedModule = await generateFailedTopics(updatedModule);
        toast.info('Focus on the failed topics to improve your understanding');
      }

      // Update module on the backend
      const response = await fetch(`${API_BASE_URL}/courses/${moduleTask.courseId}/modules/${realModuleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setTasks(prev => prev.map(task =>
          task._id === moduleTask._id ? updatedModule : task
        ));
      } else {
        const errorData = await response.json();
        console.error('Module update error:', errorData);
        toast.error('Failed to update module status');
      }
    } catch (error) {
      console.error('Module update error:', error);
      toast.error('Failed to update module');
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    console.log('Drag ended:', { activeId: active?.id, overId: over?.id });

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(t => t._id === active.id);
    const overColumn = over.id;

    console.log('Task found:', activeTask?.title, 'Current status:', activeTask?.status, 'Target status:', overColumn);

    if (activeTask && columns.find(c => c.id === overColumn)) {
      if (activeTask.status !== overColumn) {
        console.log('Updating task status from', activeTask.status, 'to', overColumn);
        
        // Check if moving from 'review' to 'completed' and exam is required
        if (activeTask.status === 'review' && overColumn === 'completed' && activeTask.examRequired && !activeTask.examPassed) {
          // Open exam modal instead of updating status
          setExamTask(activeTask);
          await openExam(activeTask);
        } else {
          // Normal status update
          await updateTask(activeTask._id, { status: overColumn });
        }
      } else {
        console.log('Task already in target column');
      }
    } else {
      console.log('Invalid drop target or task not found');
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Exam functions
  const openExam = async (task) => {
    if (!task.examId) {
      toast.error('No exam found for this task');
      return;
    }

    setExamTask(task);
    setCurrentExam({ examId: task.examId, courseId: task.courseId });
    setShowExamPage(true);
  };

  const handleExamComplete = async (results) => {
    setShowExamPage(false);
    setExamResults(results);
    setShowExamResults(true);
    
    // Handle module-based exam completion
    if (examTask && examTask.isModule) {
      if (results.passed) {
        // Auto-move to completed and generate certificate
        const updatedModule = await generateCertificate({
          ...examTask,
          examPassed: true,
          status: 'completed',
          examAttempts: (examTask.examAttempts || 0) + 1,
          lastExamResults: results
        });
        
        // Update local state
        setTasks(prev => prev.map(task =>
          task._id === examTask._id ? updatedModule : task
        ));
        
        toast.success('🎉 Congratulations! Module completed and certificate generated!');
      } else {
        // Move back to in-progress with failed topics
        const updatedModule = await generateFailedTopics({
          ...examTask,
          examPassed: false,
          status: 'in-progress',
          examAttempts: (examTask.examAttempts || 0) + 1,
          lastExamResults: results
        });
        
        // Update local state
        setTasks(prev => prev.map(task =>
          task._id === examTask._id ? updatedModule : task
        ));
        
        toast.info('Review the failed topics and try again when ready');
      }
    } else {
      // Refresh tasks to get updated status for regular tasks
      fetchTasks();
    }
  };

  const handleExamResultsClose = () => {
    setShowExamResults(false);
    setExamResults(null);
    setExamTask(null);
  };

  const handleExamRetry = () => {
    setShowExamResults(false);
    if (examTask && examTask.examId) {
      setShowExamPage(true);
    }
  };

  const handleViewCertificate = (certificate) => {
    // Navigate to certificate page or open in new window
    const certificateUrl = `/certificates/${certificate.certificateId}`;
    window.open(certificateUrl, '_blank');
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

  // Enhanced feature functions
  const createTaskFromTemplate = async (template) => {
    const taskData = {
      title: template.name,
      description: template.description,
      priority: template.priority,
      status: 'todo',
      tags: template.tags,
      estimatedTime: template.estimatedTime
    };
    
    await createTask(taskData);
    setShowTemplates(false);
  };

  const startTimer = (taskId) => {
    setActiveTimer({
      taskId,
      startTime: new Date(),
      elapsed: 0
    });
    
    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          elapsed: Math.floor((new Date() - prev.startTime) / 1000)
        };
      });
    }, 1000);
    
    setActiveTimer(prev => ({ ...prev, interval }));
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    
    clearInterval(activeTimer.interval);
    
    const timeEntry = {
      taskId: activeTimer.taskId,
      duration: activeTimer.elapsed,
      date: new Date()
    };
    
    // Save time entry
    setTimeEntries(prev => ({
      ...prev,
      [activeTimer.taskId]: [...(prev[activeTimer.taskId] || []), timeEntry]
    }));
    
    toast.success(`Time tracked: ${formatTime(activeTimer.elapsed)}`);
    setActiveTimer(null);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const addComment = async (taskId, comment) => {
    const newComment = {
      id: Date.now(),
      text: comment,
      author: user.firstName + ' ' + user.lastName,
      createdAt: new Date(),
      userId: user._id
    };
    
    setTaskComments(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), newComment]
    }));
    
    toast.success('Comment added');
  };

  const getTotalTimeSpent = (taskId) => {
    const entries = timeEntries[taskId] || [];
    return entries.reduce((total, entry) => total + entry.duration, 0);
  };

  const getTaskProgress = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || !task.subtasks) return 0;
    
    const completed = task.subtasks.filter(st => st.completed).length;
    return task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0;
  };

  // Learning flow helper functions
  const generateReviewTopics = async (moduleTask) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-review-topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: moduleTask.moduleId,
          courseId: moduleTask.courseId,
          topics: moduleTask.topics,
          content: moduleTask.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...moduleTask,
          reviewTopics: data.reviewTopics || [
            'Key concepts and definitions',
            'Important formulas and methods',
            'Common pitfalls to avoid',
            'Practice problems solutions',
            'Real-world applications'
          ]
        };
      }
    } catch (error) {
      console.error('Error generating review topics:', error);
    }
    
    // Fallback review topics
    return {
      ...moduleTask,
      reviewTopics: [
        'Review main concepts',
        'Practice key examples',
        'Understand core principles',
        'Memorize important points'
      ]
    };
  };

  const generateFailedTopics = async (moduleTask) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-failed-topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: moduleTask.moduleId,
          examAttempts: moduleTask.examAttempts,
          lastExamResults: moduleTask.lastExamResults
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...moduleTask,
          failedTopics: data.failedTopics || [
            'Review fundamental concepts',
            'Focus on weak areas identified',
            'Practice more examples',
            'Seek additional resources'
          ]
        };
      }
    } catch (error) {
      console.error('Error generating failed topics:', error);
    }
    
    // Fallback failed topics
    return {
      ...moduleTask,
      failedTopics: [
        'Review the concepts you missed',
        'Practice similar problems',
        'Study the theory again',
        'Ask for help if needed'
      ]
    };
  };

  const generateCertificate = async (moduleTask) => {
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId: moduleTask.moduleId,
          courseId: moduleTask.courseId,
          userId: user.id,
          userName: user.name,
          moduleTitle: moduleTask.title,
          courseTitle: moduleTask.courseTitle,
          completionDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...moduleTask,
          certificate: {
            id: data.certificateId,
            url: data.certificateUrl,
            generatedAt: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
    
    // Fallback certificate data
    return {
      ...moduleTask,
      certificate: {
        id: `cert_${moduleTask.moduleId}_${Date.now()}`,
        url: null,
        generatedAt: new Date().toISOString()
      }
    };
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
          className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border dark:border-gray-700 hover:shadow-lg transition-all ${
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
                    <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              )}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-0.5"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight flex-1">
                {task.title}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg" title={task.priority}>
                {getPriorityIcon(task.priority)}
              </span>
              <button
                onClick={() => setEditingTask(task)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded"
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

          <div className="ml-6 space-y-2">
            {/* Task Info Row */}
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

            {/* Enhanced Features Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Total Time Spent Badge */}
                {getTotalTimeSpent(task._id) > 0 && (
                  <div className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(getTotalTimeSpent(task._id))}</span>
                  </div>
                )}

                {/* Comments Badge */}
                {taskComments[task._id]?.length > 0 && (
                  <button
                    onClick={() => setShowTaskDetails(task._id)}
                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center space-x-1 hover:bg-blue-200"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{taskComments[task._id].length}</span>
                  </button>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPomodoroTimer(task);
                  }}
                  className={`p-1 rounded hover:bg-blue-200 transition-colors ${
                    activeTimer?.taskId === task._id 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}
                  title="Pomodoro Timer"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTaskDetails(task._id);
                  }}
                  className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  title="View Details"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Module-specific content based on status */}
          {task.isModule && (
            <div className="ml-6 mt-2 pt-2 border-t border-gray-100 space-y-2">
              {/* In Progress: Show Open Module button */}
              {task.status === 'in-progress' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTaskDetails(task._id);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open Module</span>
                </button>
              )}

              {/* Review: Show review topics and exam button */}
              {task.status === 'review' && (
                <div className="space-y-2">
                  {task.reviewTopics && task.reviewTopics.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-purple-900 mb-2">Review Topics:</h4>
                      <ul className="text-xs text-purple-700 space-y-1">
                        {task.reviewTopics.slice(0, 3).map((topic, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                        {task.reviewTopics.length > 3 && (
                          <li className="text-purple-500 text-xs">+{task.reviewTopics.length - 3} more topics</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {task.examRequired && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openExam(task);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Start Exam</span>
                    </button>
                  )}
                </div>
              )}

              {/* Completed: Show certificate download */}
              {task.status === 'completed' && task.certificate && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">🎉</span>
                      <span className="text-xs font-medium text-green-800">Module Completed!</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.certificate.url) {
                          window.open(task.certificate.url, '_blank');
                        } else {
                          toast.info('Certificate is being generated...');
                        }
                      }}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      Download Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* Failed Exam: Show failed topics */}
              {task.status === 'in-progress' && task.examAttempts > 0 && !task.examPassed && task.failedTopics && (
                <div className="bg-red-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-red-900 mb-2">Focus Areas for Improvement:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {task.failedTopics.slice(0, 2).map((topic, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Regular Exam Button for non-module tasks */}
          {!task.isModule && task.examRequired && task.examId && (
            <div className="ml-6 mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openExam(task);
                }}
                className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  task.examPassed
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {task.examPassed ? 'Exam Passed ✓' : 'Take Exam'}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Droppable Column Component
  const DroppableColumn = ({ column, children, taskCount }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
    });

    const Icon = column.icon;

    return (
      <div 
        ref={setNodeRef}
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 transition-colors ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 text-${column.color}-600 dark:text-${column.color}-400`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">({taskCount})</span>
          </div>
        </div>
        {children}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Title and Stats */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.total} total • {stats.completed} completed • {stats.overdue} overdue
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Kanban View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setViewMode('grouped');
                  setGroupByCourse(true);
                }}
                className={`p-2 rounded-lg ${viewMode === 'grouped' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Group by Course"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Overdue</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.today}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Due Today</div>
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
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Course Filter */}
            <select
              value={filters.course}
              onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
              className="px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  filters.overdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, today: !prev.today }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.today ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, thisWeek: !prev.thisWeek }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.thisWeek ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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

            {/* Templates Button */}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                showTemplates ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span>📋</span>
              <span>Templates</span>
            </button>

            {/* Time Tracker Button */}
            <button
              onClick={() => setShowTimeTracker(!showTimeTracker)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                showTimeTracker ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timer</span>
            </button>

            {/* Analytics Button */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                showAnalytics ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
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

                return (
                  <DroppableColumn key={column.id} column={column} taskCount={columnTasks.length}>
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
                  </DroppableColumn>
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
                  <div key={course._id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm p-4">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden">
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

      {/* Exam Page Modal */}
      {showExamPage && currentExam && (
        <ExamPage
          examId={currentExam.examId}
          courseId={currentExam.courseId}
          onClose={() => {
            setShowExamPage(false);
            setCurrentExam(null);
          }}
          onComplete={handleExamComplete}
        />
      )}

      {/* Exam Results Modal */}
      {showExamResults && examResults && (
        <ExamResultsModal
          results={examResults}
          onClose={handleExamResultsClose}
          onRetry={handleExamRetry}
          onViewCertificate={handleViewCertificate}
        />
      )}

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Templates</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quick start with predefined task templates</p>
                  </div>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-900"
                    onClick={() => {
                      createTaskFromTemplate(template);
                      setShowTemplates(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{template.icon}</span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            template.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            template.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                            template.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {template.priority.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            ⏱️ {template.estimatedTime} min
                          </span>
                          {template.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Tracker Panel */}
      <AnimatePresence>
        {showTimeTracker && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-0 h-screen w-80 bg-white dark:bg-gray-800 shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Time Tracker</h2>
                <button
                  onClick={() => setShowTimeTracker(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Active Timer */}
              {activeTimer && (
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Timer</span>
                    <StopCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {formatTime(activeTimer.elapsed)}
                  </div>
                  <div className="text-sm opacity-90 mb-3 truncate">
                    {tasks.find(t => t._id === activeTimer.taskId)?.title || 'Unknown Task'}
                  </div>
                  <button
                    onClick={() => stopTimer(activeTimer.taskId)}
                    className="w-full bg-white text-orange-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Stop Timer
                  </button>
                </div>
              )}
            </div>

            {/* Time Entries */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Time Entries</h3>
              <div className="space-y-3">
                {Object.entries(timeEntries).flatMap(([taskId, entries]) => 
                  entries.map(entry => ({ ...entry, taskId }))
                ).sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                .slice(0, 10).map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                          {tasks.find(t => t._id === entry.taskId)?.title || 'Unknown Task'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(entry.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatTime(entry.duration)}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {Object.keys(timeEntries).length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">No time entries yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Dashboard */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Analytics</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Insights into your productivity</p>
                  </div>
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="text-3xl font-bold mb-1">{tasks.length}</div>
                    <div className="text-sm opacity-90">Total Tasks</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="text-3xl font-bold mb-1">
                      {tasks.filter(t => t.status === 'completed').length}
                    </div>
                    <div className="text-sm opacity-90">Completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                    <div className="text-3xl font-bold mb-1">
                      {tasks.filter(t => t.status === 'in-progress').length}
                    </div>
                    <div className="text-sm opacity-90">In Progress</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                    <div className="text-3xl font-bold mb-1">
                      {formatTime(
                        Object.values(timeEntries)
                          .flat()
                          .reduce((sum, entry) => sum + entry.duration, 0)
                      )}
                    </div>
                    <div className="text-sm opacity-90">Total Time</div>
                  </div>
                </div>

                {/* Time Distribution */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Time Distribution by Task
                  </h3>
                  <div className="space-y-3">
                    {tasks
                      .map(task => ({
                        task,
                        time: getTotalTimeSpent(task._id)
                      }))
                      .filter(item => item.time > 0)
                      .sort((a, b) => b.time - a.time)
                      .slice(0, 5)
                      .map((item, index) => {
                        const maxTime = Math.max(...tasks.map(t => getTotalTimeSpent(t._id)));
                        const percentage = maxTime > 0 ? (item.time / maxTime) * 100 : 0;
                        return (
                          <div key={item.task._id}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                                {item.task.title}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">{formatTime(item.time)}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    {Object.keys(timeEntries).length === 0 && (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Start tracking time to see analytics</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Rate by Priority */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completion Rate by Priority</h3>
                  <div className="space-y-3">
                    {priorities.map((priority) => {
                      const priorityTasks = tasks.filter(t => t.priority === priority.value);
                      const completed = priorityTasks.filter(t => t.status === 'completed').length;
                      const rate = priorityTasks.length > 0 ? (completed / priorityTasks.length) * 100 : 0;
                      return (
                        <div key={priority.value}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {priority.icon} {priority.label}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {completed}/{priorityTasks.length} ({rate.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${priority.color}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Details Modal with Comments and Subtasks */}
      <AnimatePresence>
        {showTaskDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              {(() => {
                const task = tasks.find(t => t._id === showTaskDetails);
                if (!task) return null;

                const comments = taskComments[task._id] || [];
                const totalTime = getTotalTimeSpent(task._id);
                const progress = getTaskProgress(task._id);

                return (
                  <>
                    <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h2>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                              task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              task.status === 'review' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {task.status}
                            </span>
                            {totalTime > 0 && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(totalTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowTaskDetails(null)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Module Content - only for modules */}
                      {task.isModule && task.content && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Module Content
                          </h3>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3 border dark:border-blue-800/30">
                            {task.content.instructions && (
                              <div>
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Instructions:</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-400">{task.content.instructions}</p>
                              </div>
                            )}
                            
                            {task.topics && task.topics.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Key Topics:</h4>
                                <ul className="space-y-1">
                                  {task.topics.map((topic, index) => (
                                    <li key={index} className="text-sm text-blue-700 dark:text-blue-400 flex items-start space-x-2">
                                      <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                                      <span>{topic}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {task.content.hints && task.content.hints.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Hints:</h4>
                                <ul className="space-y-1">
                                  {task.content.hints.map((hint, index) => (
                                    <li key={index} className="text-sm text-blue-700 dark:text-blue-400 flex items-start space-x-2">
                                      <span className="text-blue-500 dark:text-blue-400 mt-1">💡</span>
                                      <span>{hint}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Review Topics - only in review status */}
                      {task.isModule && task.status === 'review' && task.reviewTopics && task.reviewTopics.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Review Topics
                          </h3>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border dark:border-purple-800/30">
                            <ul className="space-y-2">
                              {task.reviewTopics.map((topic, index) => (
                                <li key={index} className="text-sm text-purple-700 dark:text-purple-400 flex items-start space-x-2">
                                  <span className="text-purple-500 dark:text-purple-400 mt-1">📚</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Failed Topics - only when exam attempts > 0 and not passed */}
                      {task.isModule && task.examAttempts > 0 && !task.examPassed && task.failedTopics && task.failedTopics.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Areas for Improvement
                          </h3>
                          <div className="bg-red-50 rounded-lg p-4">
                            <ul className="space-y-2">
                              {task.failedTopics.map((topic, index) => (
                                <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                                  <span className="text-red-500 mt-1">⚠️</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Description - for non-modules or additional info */}
                      {task.description && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                          <p className="text-gray-700">{task.description}</p>
                        </div>
                      )}

                      {/* Timer Actions */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Time Tracking</h3>
                        {activeTimer?.taskId === task._id ? (
                          <button
                            onClick={() => stopTimer(task._id)}
                            className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center space-x-2"
                          >
                            <StopCircle className="w-4 h-4" />
                            <span>Stop Timer ({formatTime(activeTimer.elapsed)})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(task._id)}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>Start Timer</span>
                          </button>
                        )}
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comments ({comments.length})
                        </h3>
                        <div className="space-y-3 mb-4">
                          {comments.map((comment, index) => (
                            <motion.div
                              key={index}
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.text}</p>
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                addComment(task._id, e.target.value.trim());
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousSibling;
                              if (input.value.trim()) {
                                addComment(task._id, input.value.trim());
                                input.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pomodoro Timer Modal */}
      <AnimatePresence>
        {showPomodoroTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPomodoroTimer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <TaskPomodoroTimer
                task={showPomodoroTimer}
                onClose={() => setShowPomodoroTimer(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedKanbanBoard;
