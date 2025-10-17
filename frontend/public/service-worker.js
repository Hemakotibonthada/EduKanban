const CACHE_NAME = 'edukanban-v1.0.0';
const API_CACHE_NAME = 'edukanban-api-v1.0.0';
const IMAGE_CACHE_NAME = 'edukanban-images-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// API endpoints to cache
const API_URLS = [
  '/api/courses',
  '/api/tasks',
  '/api/users/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for API, cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cached response, return offline page
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Handle image requests - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle all other requests - Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        fetch(request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse);
          });
        }).catch(() => {
          // Network failed, but we have cache
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Cache the new response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Network failed and no cache, return offline page
        return caches.match('/offline.html');
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const db = await openDatabase();
    const pendingTasks = await getPendingTasks(db);
    
    // Sync each pending task
    for (const task of pendingTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
        
        if (response.ok) {
          await removePendingTask(db, task.id);
          console.log('[Service Worker] Task synced:', task.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync task:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync tasks error:', error);
  }
}

async function syncProgress() {
  try {
    // Get pending progress updates from IndexedDB
    const db = await openDatabase();
    const pendingUpdates = await getPendingProgress(db);
    
    // Sync each pending update
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/progress/${update.courseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update.data),
        });
        
        if (response.ok) {
          await removePendingProgress(db, update.id);
          console.log('[Service Worker] Progress synced:', update.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync progress:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync progress error:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'EduKanban Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open', icon: '/icons/open.png' },
      { action: 'close', title: 'Close', icon: '/icons/close.png' }
    ],
    tag: data.tag || 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if a window is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Helper functions for IndexedDB operations
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EduKanbanDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingTasks')) {
        db.createObjectStore('pendingTasks', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingProgress')) {
        db.createObjectStore('pendingProgress', { keyPath: 'id' });
      }
    };
  });
}

function getPendingTasks(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingTasks'], 'readonly');
    const store = transaction.objectStore('pendingTasks');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingProgress(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingProgress'], 'readonly');
    const store = transaction.objectStore('pendingProgress');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingTask(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingTasks'], 'readwrite');
    const store = transaction.objectStore('pendingTasks');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function removePendingProgress(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingProgress'], 'readwrite');
    const store = transaction.objectStore('pendingProgress');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[Service Worker] Script loaded');
