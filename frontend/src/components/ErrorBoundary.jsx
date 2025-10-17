import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send error to monitoring service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }

    // Log to backend error tracking
    this.logErrorToBackend(error, errorInfo);
  }

  logErrorToBackend = async (error, errorInfo) => {
    try {
      await fetch('/api/error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Failed to log error to backend:', err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
                  <p className="text-red-100 mt-1">
                    We encountered an unexpected error. Don't worry, we're on it!
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Count Warning */}
              {errorCount > 1 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ This error has occurred {errorCount} times. Consider reloading the page.
                  </p>
                </div>
              )}

              {/* User-friendly message */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  What happened?
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  The application encountered an unexpected error and couldn't continue. 
                  This has been automatically reported to our team.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  <RefreshCcw size={18} />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-all"
                >
                  <RefreshCcw size={18} />
                  Reload Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-all"
                >
                  <Home size={18} />
                  Go Home
                </button>
              </div>

              {/* Development-only error details */}
              {isDevelopment && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    🔧 Developer Details (Click to expand)
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                        Error Message:
                      </h3>
                      <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    
                    {error.stack && (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                          Stack Trace:
                        </h3>
                        <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo && errorInfo.componentStack && (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                          Component Stack:
                        </h3>
                        <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Support info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need help? Contact our support team at{' '}
                  <a 
                    href="mailto:support@edukanban.com" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@edukanban.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
