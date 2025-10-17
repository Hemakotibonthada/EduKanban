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
  GripVertical
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

const KanbanBoard = ({ user, token }) => {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    course: '',
    priority: '',
    search: ''
  });

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
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchCourses();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
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
      const response = await fetch('http://localhost:5001/api/courses', {
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
      const response = await fetch('http://localhost:5001/api/tasks', {
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
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
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
      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
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
      // Task dropped on a column
      if (activeTask.status !== overColumn) {
        updateTask(activeTask._id, { status: overColumn });
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesCourse = !filters.course || task.courseId === filters.course;
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesCourse && matchesPriority && matchesSearch;
    });
  };

  const getTasksByStatus = (status) => {
    return getFilteredTasks().filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'gray';
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
    const priorityColor = getPriorityColor(task.priority);

    return (
      <div ref={setNodeRef} style={style}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-lg transition-all ${
            isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-2 flex-1">
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
              <div className={`w-2 h-2 bg-${priorityColor}-500 rounded-full`} title={task.priority} />
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

          <div className="flex items-center justify-between text-xs text-gray-500 ml-6">
            <div className="flex items-center space-x-2">
              {course && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span className="truncate max-w-20">{course.title}</span>
                </div>
              )}
            </div>
            
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {task.estimatedTime && (
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500 ml-6">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedTime}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const TaskCard = ({ task }) => {
    const course = courses.find(c => c._id === task.courseId);
    const priorityColor = getPriorityColor(task.priority);

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">
            {task.title}
          </h3>
          <div className={`w-2 h-2 bg-${priorityColor}-500 rounded-full`} title={task.priority} />
        </div>

        {task.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {course && (
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span className="truncate max-w-20">{course.title}</span>
              </div>
            )}
          </div>
          
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TaskModal = ({ task, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      title: task?.title || '',
      description: task?.description || '',
      courseId: task?.courseId || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'todo',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedTime: task?.estimatedTime || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2 hours"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {task && (
                <button
                  type="button"
                  onClick={() => deleteTask(task._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {task ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.course}
            onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const IconComponent = column.icon;
            const isOver = activeId && tasks.find(t => t._id === activeId)?.status !== column.id;

            return (
              <div
                key={column.id}
                className={`bg-gray-50 rounded-xl p-4 transition-all ${
                  isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 bg-${column.color}-100 rounded-lg`}>
                      <IconComponent className={`w-4 h-4 text-${column.color}-600`} />
                    </div>
                    <h2 className="font-semibold text-gray-900">{column.title}</h2>
                  </div>
                  <span className={`px-2 py-1 bg-${column.color}-100 text-${column.color}-800 rounded-full text-xs font-medium`}>
                    {columnTasks.length}
                  </span>
                </div>

                <SortableContext
                  items={columnTasks.map(task => task._id)}
                  strategy={verticalListSortingStrategy}
                  id={column.id}
                >
                  <div className="space-y-3 min-h-64">
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

        <DragOverlay>
          {activeId ? (
            <TaskCard task={tasks.find(t => t._id === activeId)} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map(column => {
          const count = getTasksByStatus(column.id).length;
          const IconComponent = column.icon;

          return (
            <div key={column.id} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-${column.color}-100 rounded-lg`}>
                  <IconComponent className={`w-5 h-5 text-${column.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600">{column.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <TaskModal 
            onClose={() => setShowAddModal(false)}
            onSave={(data) => createTask(data)}
          />
        )}
        
        {editingTask && (
          <TaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(data) => {
              updateTask(editingTask._id, data);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard;