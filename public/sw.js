// Service Worker for Shopping Guide PWA
const CACHE_NAME = 'shopping-guide-v1'
const API_CACHE_NAME = 'shopping-guide-api-v1'

// Files to cache
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^.*\/api\/stores$/,
  /^.*\/api\/templates$/,
  /^.*\/api\/lists\?.*$/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Static assets cached, skipping waiting')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated, claiming clients')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests and extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
  
  if (!shouldCache) {
    // For non-cacheable API requests, just fetch
    try {
      return await fetch(request)
    } catch (error) {
      console.error('API request failed:', error)
      return new Response(
        JSON.stringify({ error: 'Network unavailable' }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  try {
    // Network first for API requests
    console.log('Fetching from network:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      console.log('API response cached:', request.url)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Serving from cache:', request.url)
      return cachedResponse
    }
    
    // Return error if no cache available
    console.error('No cache available for:', request.url)
    return new Response(
      JSON.stringify({ 
        error: 'Offline and no cached data available',
        offline: true 
      }),
      { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Cache first for static assets
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Serving from cache:', request.url)
      return cachedResponse
    }
    
    // Fallback to network
    console.log('Cache miss, fetching from network:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      console.log('Static asset cached:', request.url)
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url, error)
    
    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/index.html')
      if (cachedIndex) {
        console.log('Serving cached index.html for navigation')
        return cachedIndex
      }
    }
    
    // Return a basic error response
    return new Response(
      'Offline and resource not cached',
      { 
        status: 503,
        statusText: 'Service Unavailable' 
      }
    )
  }
}

// Background sync for when connectivity returns
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-shopping-data') {
    event.waitUntil(syncShoppingData())
  }
})

// Sync shopping data when online
async function syncShoppingData() {
  try {
    console.log('Syncing shopping data...')
    
    // This would trigger the app's sync functionality
    // For now, we'll just clear old API cache to force fresh data
    const apiCache = await caches.open(API_CACHE_NAME)
    const apiKeys = await apiCache.keys()
    
    // Clear old cached API responses to get fresh data
    await Promise.all(
      apiKeys.map(request => apiCache.delete(request))
    )
    
    console.log('API cache cleared for fresh sync')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('Push notification received:', data)
    
    const options = {
      body: data.body || 'You have a new shopping notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'shopping-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/pwa-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Shopping Guide', options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
    )
  }
})