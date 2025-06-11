// MistWarp Performance Service Worker - Aggressive caching for 2x speedup
const CACHE_NAME = 'mistwarp-performance-v1';
const CACHE_URLS = [
  // Critical block media
  '/static/blocks-media/default/green-flag.svg',
  '/static/blocks-media/default/stop.svg',
  '/static/blocks-media/default/arrow.svg',
  '/static/blocks-media/default/rotate-left.svg',
  '/static/blocks-media/default/rotate-right.svg',
  
  // Common assets
  '/static/assets/scratch-cat.svg',
  '/static/assets/pop.wav',
  '/static/assets/meow.wav',
  
  // Fonts
  'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap'
];

// Install event - preload critical resources
self.addEventListener('install', event => {
  console.log('🚀 MistWarp Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Preloading critical resources');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed and critical resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 MistWarp Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - cache strategy for performance
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Strategy: Cache First for static assets, Network First for everything else
  if (shouldCacheResource(url)) {
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    event.respondWith(networkFirstStrategy(event.request));
  }
});

/**
 * Determine if a resource should be cached
 */
function shouldCacheResource(url) {
  const pathname = url.pathname;
  
  // Cache static assets
  return pathname.includes('/static/') ||
         pathname.includes('/blocks-media/') ||
         pathname.includes('/assets/') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.wav') ||
         pathname.endsWith('.mp3') ||
         url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com';
}

/**
 * Cache First strategy - Check cache first, fallback to network
 */
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Cache first strategy failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Network First strategy - Try network first, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses for future use
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    console.warn('Network first strategy failed, no cache available:', error);
    return new Response('Network error', { status: 503 });
  }
}
