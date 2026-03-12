// 大叔心聲 Service Worker v5.4
const CACHE_NAME = 'dashu-v6.1';
const ASSETS = [
  '/',
  '/index.html',
  '/dashu-192.png',
  '/dashu-512.png',
  '/og-image.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for static assets, network-first for API/dynamic
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and Google auth requests
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('google') || url.hostname.includes('gstatic')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses for same-origin
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback — return cached index
      if (e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
