import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker, initInstallPrompt } from './src/utils/serviceWorkerUtils.js'

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