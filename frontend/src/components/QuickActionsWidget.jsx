import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Timer,
  StickyNote,
  Calendar,
  Users,
  X,
  Zap,
  Keyboard,
  BookOpen,
  MessageSquare,
  Target
} from 'lucide-react';

const QuickActionsWidget = ({ onNavigate, onStartTimer, user, token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const quickActions = [
    {
      id: 'study-session',
      label: 'Start Study',
      icon: Timer,
      color: 'from-blue-500 to-cyan-500',
      shortcut: 'Ctrl+S',
      action: () => {
        onStartTimer?.();
        setIsOpen(false);
      }
    },
    {
      id: 'quick-note',
      label: 'Quick Note',
      icon: StickyNote,
      color: 'from-yellow-500 to-orange-500',
      shortcut: 'Ctrl+N',
      action: () => {
        // Will implement note creator
        console.log('Create quick note');
        setIsOpen(false);
      }
    },
    {
      id: 'schedule-task',
      label: 'Add Task',
      icon: Calendar,
      color: 'from-green-500 to-teal-500',
      shortcut: 'Ctrl+T',
      action: () => {
        onNavigate?.('kanban');
        setIsOpen(false);
      }
    },
    {
      id: 'create-course',
      label: 'New Course',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      shortcut: 'Ctrl+C',
      action: () => {
        onNavigate?.('create-course');
        setIsOpen(false);
      }
    },
    {
      id: 'ai-chat',
      label: 'Ask AI',
      icon: MessageSquare,
      color: 'from-indigo-500 to-purple-500',
      shortcut: 'Ctrl+A',
      action: () => {
        onNavigate?.('chat');
        setIsOpen(false);
      }
    },
    {
      id: 'goals',
      label: 'Set Goal',
      icon: Target,
      color: 'from-pink-500 to-rose-500',
      shortcut: 'Ctrl+G',
      action: () => {
        // Will implement goals dialog
        console.log('Set new goal');
        setIsOpen(false);
      }
    }
  ];

  const keyboardShortcuts = [
    { key: 'Ctrl+S', action: 'Start study session' },
    { key: 'Ctrl+N', action: 'Create quick note' },
    { key: 'Ctrl+T', action: 'Add new task' },
    { key: 'Ctrl+C', action: 'Create new course' },
    { key: 'Ctrl+A', action: 'Open AI chat' },
    { key: 'Ctrl+G', action: 'Set new goal' },
    { key: 'Ctrl+K', action: 'Open global search' },
    { key: 'Ctrl+/', action: 'Show keyboard shortcuts' },
    { key: 'Esc', action: 'Close modal/menu' },
  ];

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            onStartTimer?.();
            break;
          case 't':
            e.preventDefault();
            onNavigate?.('kanban');
            break;
          case 'c':
            e.preventDefault();
            onNavigate?.('create-course');
            break;
          case 'a':
            e.preventDefault();
            onNavigate?.('chat');
            break;
          case '/':
            e.preventDefault();
            setShowKeyboardShortcuts(true);
            break;
          default:
            break;
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNavigate, onStartTimer]);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-4 w-80 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                  <p className="text-xs text-gray-500">Keyboard shortcuts available</p>
                </div>
                <button
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Show keyboard shortcuts"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.action}
                      className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-transparent"
                      style={{
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      
                      <div className="relative flex flex-col items-center text-center space-y-2">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                          {action.label}
                        </span>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {action.shortcut.replace('Ctrl', '⌘')}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>View all shortcuts</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg hover:shadow-xl flex items-center justify-center transition-all ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Zap className="w-6 h-6 text-white" />
          )}
        </motion.button>

        {/* Pulse Animation */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 animate-ping opacity-20"></div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Boost your productivity with these shortcuts
                  </p>
                </div>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-700">{shortcut.action}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.key.split('+').map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-gray-400">+</span>}
                          <kbd className="px-3 py-1.5 text-sm font-mono font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
                            {key.replace('Ctrl', '⌘')}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Press <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 rounded border border-gray-300">Esc</kbd> to close any modal
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActionsWidget;
