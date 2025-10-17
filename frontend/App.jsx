import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import Celebration, { useCelebration } from './src/components/Celebration';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';
import ErrorBoundary from './src/components/ErrorBoundary';
import './index.css';

// Lazy load heavy components for better initial load time
const LandingPage = lazy(() => import('./src/pages/LandingPage'));
const AuthPage = lazy(() => import('./src/components/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./src/components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./src/components/ResetPasswordPage'));
const Dashboard = lazy(() => import('./src/components/Dashboard'));

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

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
    // Check if this is a password reset page
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setCurrentView('reset-password');
      setIsLoading(false);
      return;
    }

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
    if (mode === 'forgot-password') {
      setCurrentView('forgot-password');
    } else {
      setCurrentView('auth');
    }
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
    return <LoadingFallback message="Loading EduKanban..." />;
  }

  return (
    <ErrorBoundary>
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
        
        <Suspense fallback={<LoadingFallback message="Loading page..." />}>
          {currentView === 'landing' && (
            <LandingPage onAuthMode={handleAuthMode} />
          )}
          
          {currentView === 'auth' && (
            <AuthPage
              mode={authMode}
              onAuthSuccess={handleAuthSuccess}
              onModeChange={handleAuthMode}
              onBack={handleBackToLanding}
            />
          )}
          
          {currentView === 'forgot-password' && (
            <ForgotPasswordPage
              onBack={() => {
                setAuthMode('login');
                setCurrentView('auth');
              }}
            />
          )}
          
          {currentView === 'reset-password' && (
            <ResetPasswordPage />
          )}
          
          {currentView === 'dashboard' && user && (
            <Dashboard
              user={user}
              token={token}
              onLogout={handleLogout}
              onCelebrate={celebrate}
            />
          )}
        </Suspense>
        
        {/* Global Celebration System */}
        <Celebration
          celebration={celebration}
          onClose={closeCelebration}
        />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </ErrorBoundary>
  );
};

export default App;