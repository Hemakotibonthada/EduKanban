// Service Worker Registration and Management

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, prompt user to update
            console.log('[PWA] New content available, please refresh');
            showUpdateNotification();
          }
        });
      });

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed');
        window.location.reload();
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('[PWA] Service Workers not supported in this browser');
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered successfully');
      return true;
    } catch (error) {
      console.error('[PWA] Service Worker unregistration failed:', error);
      return false;
    }
  }
  return false;
};

// Show update notification to user
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('EduKanban Update Available', {
      body: 'A new version is available. Please refresh to update.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'update-available',
      requireInteraction: true,
      actions: [
        { action: 'refresh', title: 'Refresh Now' }
      ]
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error);
      return false;
    }
  }
  return false;
};

// Check if app is running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Background sync for offline data
export const registerBackgroundSync = async (tag) => {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

// Cache specific URLs
export const cacheUrls = async (urls) => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_URLS',
          urls: urls
        });
        return true;
      }
    } catch (error) {
      console.error('[PWA] Cache URLs failed:', error);
    }
  }
  return false;
};

// Clear all caches
export const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
      return true;
    } catch (error) {
      console.error('[PWA] Clear caches failed:', error);
      return false;
    }
  }
  return false;
};

// Check online/offline status
export const getNetworkStatus = () => {
  return navigator.onLine;
};

// Listen for online/offline events
export const addNetworkListener = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Install prompt handling
let deferredPrompt = null;

export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    console.log('[PWA] Install prompt ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
};

export const canInstall = () => {
  return deferredPrompt !== null;
};

// IndexedDB helpers for offline storage
export const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EduKanbanDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('pendingTasks')) {
        db.createObjectStore('pendingTasks', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('pendingProgress')) {
        db.createObjectStore('pendingProgress', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('cachedCourses')) {
        db.createObjectStore('cachedCourses', { keyPath: '_id' });
      }

      if (!db.objectStoreNames.contains('cachedTasks')) {
        db.createObjectStore('cachedTasks', { keyPath: '_id' });
      }
    };
  });
};

export const savePendingTask = async (task) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pendingTasks'], 'readwrite');
    const store = transaction.objectStore('pendingTasks');
    const request = store.add(task);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PWA] Save pending task failed:', error);
    throw error;
  }
};

export const savePendingProgress = async (progress) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pendingProgress'], 'readwrite');
    const store = transaction.objectStore('pendingProgress');
    const request = store.add(progress);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PWA] Save pending progress failed:', error);
    throw error;
  }
};

export const cacheData = async (storeName, data) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    if (Array.isArray(data)) {
      await Promise.all(data.map(item => store.put(item)));
    } else {
      await store.put(data);
    }

    console.log(`[PWA] Data cached in ${storeName}`);
    return true;
  } catch (error) {
    console.error('[PWA] Cache data failed:', error);
    return false;
  }
};

export const getCachedData = async (storeName) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PWA] Get cached data failed:', error);
    return [];
  }
};

console.log('[PWA] Service Worker utilities loaded');
