import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Filter,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const CalendarView = ({ user, token }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [filter, setFilter] = useState('all'); // 'all', 'todo', 'inProgress', 'completed'
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchCourses();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTasksByFilter = (dateTasks) => {
    if (filter === 'all') return dateTasks;
    return dateTasks.filter(task => task.status === filter);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const formatDateHeader = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getDayClassName = (date) => {
    if (!date) return 'invisible';
    
    const baseClass = 'relative p-2 h-24 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors';
    const todayClass = isToday(date) ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400' : '';
    const selectedClass = isSelected(date) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : '';
    
    return `${baseClass} ${todayClass} ${selectedClass}`;
  };

  const getTaskColorClass = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'inProgress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const selectedDayTasks = getTasksForDate(selectedDate);
  const filteredSelectedTasks = getTasksByFilter(selectedDayTasks);

  const exportCalendar = () => {
    const calendarData = {
      month: formatDateHeader(),
      tasks: tasks.map(task => ({
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority
      }))
    };
    
    const dataStr = JSON.stringify(calendarData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `calendar-${formatDateHeader()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Calendar exported successfully!');
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                Task Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Plan and track your learning schedule</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={exportCalendar}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Export Calendar"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">
              {/* Calendar Navigation */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <h2 className="text-xl font-bold">{formatDateHeader()}</h2>
                  
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Week Days Header */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-700">
                {weekDays.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const dateTasks = date ? getTasksForDate(date) : [];
                  const filteredTasks = getTasksByFilter(dateTasks);
                  
                  return (
                    <div
                      key={index}
                      className={getDayClassName(date)}
                      onClick={() => date && setSelectedDate(date)}
                    >
                      {date && (
                        <>
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {date.getDate()}
                          </div>
                          
                          {/* Task Dots */}
                          <div className="space-y-1 overflow-hidden">
                            {filteredTasks.slice(0, 3).map((task, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-1 py-0.5 rounded truncate ${getTaskColorClass(task.status)}`}
                              >
                                {task.title}
                              </div>
                            ))}
                            {filteredTasks.length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                +{filteredTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Filter Tasks</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-800', darkColor: 'dark:bg-gray-700 dark:text-gray-300' },
                  { key: 'todo', label: 'To Do', color: 'bg-yellow-100 text-yellow-800', darkColor: 'dark:bg-yellow-900/30 dark:text-yellow-400' },
                  { key: 'inProgress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', darkColor: 'dark:bg-blue-900/30 dark:text-blue-400' },
                  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', darkColor: 'dark:bg-green-900/30 dark:text-green-400' }
                ].map(({ key, label, color, darkColor }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === key
                        ? `${color} ${darkColor} ring-2 ring-offset-2 dark:ring-offset-gray-800`
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Day Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              
              {filteredSelectedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks for this day</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSelectedTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        task.status === 'completed'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : task.status === 'inProgress'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedTime}h
                            </span>
                            {task.difficulty && (
                              <span className={`px-2 py-0.5 rounded ${
                                task.difficulty === 'hard'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : task.difficulty === 'medium'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {task.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">This Month</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Tasks</span>
                  <span className="font-bold text-gray-900 dark:text-white">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {tasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {tasks.filter(t => t.status === 'inProgress').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">To Do</span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">
                    {tasks.filter(t => t.status === 'todo').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
