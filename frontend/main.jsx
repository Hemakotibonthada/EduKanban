import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker, initInstallPrompt } from './src/utils/serviceWorkerUtils.js'
import performanceMonitor from './src/utils/performance.js'

// Initialize performance monitoring
performanceMonitor.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('✅ Service Worker registered successfully');
    }
  }).catch((error) => {
    console.error('❌ Service Worker registration failed:', error);
  });
}

// Initialize install prompt
initInstallPrompt();

// Log performance summary on page unload (development only)
if (import.meta.env.DEV) {
  window.addEventListener('beforeunload', () => {
    const summary = performanceMonitor.getSummary();
    console.log('📊 Performance Summary:', summary);
  });
}