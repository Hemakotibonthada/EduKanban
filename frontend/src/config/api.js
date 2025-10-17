// API Configuration
// Dynamically determine the backend URL based on the current host
const getBackendURL = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production, use production URL
  if (import.meta.env.PROD) {
    return 'https://your-backend-domain.com/api';
  }
  
  // In development, use the current hostname
  // This allows it to work on localhost, network IP, etc.
  const hostname = window.location.hostname;
  return `http://${hostname}:5001/api`;
};

const getSocketURL = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // In production, use production URL
  if (import.meta.env.PROD) {
    return 'https://your-backend-domain.com';
  }
  
  // In development, use the current hostname
  const hostname = window.location.hostname;
  return `http://${hostname}:5001`;
};

export const API_BASE_URL = getBackendURL();
export const SOCKET_URL = getSocketURL();

// Export the functions as well for components that need them
export { getBackendURL, getSocketURL };

// Log configuration for debugging
console.log('🔧 EduKanban API Configuration:');
console.log('   API Base URL:', API_BASE_URL);
console.log('   Socket URL:', SOCKET_URL);
console.log('   Current Host:', window.location.hostname);

// Other configuration constants
export const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-frontend-domain.com'
  : 'http://localhost:3000';

export const APP_CONFIG = {
  name: 'EduKanban',
  version: '1.0.0',
  description: 'AI-Driven Personalized Learning Platform'
};