const CACHE_NAME = 'konsilium-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install a service worker and cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential assets');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
  const { request } = event;

  // For non-GET requests (like POST to the AI API), do not intercept them.
  // Let the browser handle them directly. This is crucial to avoid issues
  // like "ReadableStream uploading is not supported".
  if (request.method !== 'GET') {
    return;
  }
  
  // For HTML pages (navigation requests), use a network-first strategy.
  // This ensures users always get the latest version of the page,
  // with an offline fallback to the cached version.
  if (request.mode === 'navigate' || request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/')) // Fallback to root cache if network fails
    );
    return;
  }

  // For all other GET requests (assets like CSS, JS, images), use a cache-first strategy.
  // This provides fast loading times and offline access to the app shell.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // If the response is in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }
      // If not in cache, fetch from the network, cache it, and then return it.
      return fetch(request).then(networkResponse => {
        // A response must be cloned to be both cached and returned.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
