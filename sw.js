const CACHE_NAME = 'wynote-pdf-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];

// Install Event: Cache all essential UI elements and compilers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets...');
        // Using force-cache settings for third-party CDNs to bypass CORS blockages if any
        return Promise.all(
          ASSETS_TO_CACHE.map((url) => {
            return fetch(new Request(url, { mode: 'no-cors' }))
              .then((response) => cache.put(url, response))
              .catch((err) => console.error(`Failed to cache asset: ${url}`, err));
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clear older cache profiles
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache storage:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First/Network-Fallback Strategy for Offline Autonomy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Dynamically cache successful requests
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback or silent failure if offline and resource is uncached
      });
    })
  );
});
