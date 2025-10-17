import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LandingPage from './src/pages/LandingPage';
import AuthPage from './src/components/AuthPage';
import Dashboard from './src/components/Dashboard';
import Celebration, { useCelebration } from './src/components/Celebration';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';
import './index.css';

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Celebration system
  const { celebration, celebrate, closeCelebration } = useCelebration();

  // Check for existing authentication on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthMode = (mode) => {
    setAuthMode(mode);
    setCurrentView('auth');
  };

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView('dashboard');
    
    // Celebrate successful registration
    if (authMode === 'register') {
      celebrate({
        type: 'achievement',
        title: 'Welcome to EduKanban!',
        message: 'Your learning journey begins now. Let\'s create your first course!',
        achievements: [
          { name: 'New Member', description: 'Successfully joined EduKanban' }
        ]
      });
    }
  };

  const handleLogout = () => {
    // Clear all auth and app state from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dashboardActiveView');
    localStorage.removeItem('chatActiveTab');
    localStorage.removeItem('chatSelectedChat');
    localStorage.removeItem('chatSelectedChatType');
    setUser(null);
    setToken(null);
    setCurrentView('landing');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading EduKanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#10B981',
            },
          },
          error: {
            duration: 4000,
            theme: {
              primary: '#EF4444',
            },
          },
        }}
      />
      
      {currentView === 'landing' && (
        <LandingPage onAuthMode={handleAuthMode} />
      )}
      
      {currentView === 'auth' && (
        <AuthPage
          mode={authMode}
          onAuthSuccess={handleAuthSuccess}
          onModeChange={setAuthMode}
          onBack={handleBackToLanding}
        />
      )}
      
      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          onCelebrate={celebrate}
        />
      )}
      
      {/* Global Celebration System */}
      <Celebration
        celebration={celebration}
        onClose={closeCelebration}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;