// Enhanced service worker for improved caching and performance
const CACHE_NAME = 'mistwarp-cache-v1';
const RUNTIME_CACHE = 'mistwarp-runtime';

// Assets to cache immediately
const PRECACHE_URLS = [
    '/',
    '/static/blocks-media/default/backdrop1.svg',
    '/static/blocks-media/default/costume1.svg',
    '/static/assets/icon-96x96.png'
];

// Install event - cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Precaching core assets');
                return cache.addAll(PRECACHE_URLS.filter(url => url !== '/'));
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.log('Precache failed, continuing anyway:', err);
                self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.forEach(cacheName => {
                if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
                return null;
            })
        ))
            .then(() => self.clients.claim())
    );
});

// Cache first strategy - good for static assets
const cacheFirst = async request => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('Cache first failed for:', request.url);
        throw error;
    }
};

// Network first strategy - good for dynamic content
const networkFirst = async request => {
    const cache = await caches.open(RUNTIME_CACHE);
    
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
};

// Stale while revalidate - good for frequently updated content
const staleWhileRevalidate = async request => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    })
        .catch(() => cached);

    return cached || fetchPromise;
};

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const {request} = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') return;

    // Handle different types of requests with appropriate strategies
    if (request.destination === 'script' || request.destination === 'style') {
        // Cache first for JS/CSS files
        event.respondWith(cacheFirst(request));
    } else if (request.destination === 'image') {
        // Cache first for images
        event.respondWith(cacheFirst(request));
    } else if (url.pathname.includes('/api/') || url.pathname.includes('/internalapi/')) {
        // Network first for API calls
        event.respondWith(networkFirst(request));
    } else if (url.pathname.endsWith('.sb3') || url.pathname.includes('projects')) {
        // Network first for project files, but cache for offline
        event.respondWith(networkFirst(request));
    } else {
        // Stale while revalidate for everything else
        event.respondWith(staleWhileRevalidate(request));
    }
});

const cleanupCache = async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    // Remove old entries (keep last 100)
    if (requests.length > 100) {
        const toDelete = requests.slice(0, requests.length - 100);
        await Promise.all(toDelete.map(request => cache.delete(request)));
    }
};

// Handle periodic cache cleanup
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEANUP_CACHE') {
        cleanupCache();
    }
});

// Cleanup cache every hour
setInterval(cleanupCache, 60 * 60 * 1000);
