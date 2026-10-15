// Guided Annual Planner - Secure Offline Service Worker
// Version: gp-planner-shell-v1

const CACHE_NAME = 'gp-planner-shell-v1';
const CACHE_PREFIX = 'gp-planner-';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/images/gp-monogram.png',
  '/images/gp-logo.png',
];

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.webp',
  '.woff2',
  '.woff',
  '.webmanifest',
];

function isProtectedEndpoint(pathname) {
  const normalized = pathname.toLowerCase();
  return (
    normalized === '/api' ||
    normalized.startsWith('/api/') ||
    normalized === '/auth' ||
    normalized.startsWith('/auth/') ||
    normalized === '/health' ||
    normalized.startsWith('/health/')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache static shell assets safely
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch failure:', err);
      });
    })
  );
  // Do NOT self.skipWaiting() automatically here, so user has control to defer updates
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            // Clean up ONLY obsolete caches owned by this application
            if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) {
              console.log('[SW] Deleting obsolete cache:', name);
              return caches.delete(name);
            }
            return Promise.resolve(false);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Strict rejection of non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. Reject cross-origin requests from runtime cache
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Reject any authenticated or credentialed requests
  if (
    req.credentials === 'include' ||
    req.headers.has('authorization') ||
    req.headers.has('cookie') ||
    req.headers.has('x-mutation-id')
  ) {
    return;
  }

  const pathname = url.pathname.toLowerCase();

  // 4. Strict exclusion of API, authentication, and health endpoints
  if (isProtectedEndpoint(pathname)) {
    return;
  }

  // 5. OAuth & identity endpoints
  if (url.hostname.includes('google') || pathname.includes('oauth')) {
    return;
  }

  // 6. SPA navigation request: Network-first with offline app shell fallback
  if (req.mode === 'navigate') {
    // Defense-in-depth: Never intercept if path is a protected endpoint
    if (isProtectedEndpoint(pathname)) {
      return;
    }

    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html').then((cached) => {
          return cached || new Response('Offline: App shell unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
    );
    return;
  }

  // 7. Allowlisted static assets: Cache-First with network fallback
  const isAllowlistedStatic = STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (isAllowlistedStatic || pathname === '/' || pathname === '/index.html') {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background for HTML/manifest entries
          if (pathname === '/' || pathname === '/index.html' || pathname === '/manifest.webmanifest') {
            fetch(req)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        return fetch(req)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // Return empty response on network failure for optional assets
            return new Response(null, { status: 404, statusText: 'Not Found' });
          });
      })
    );
    return;
  }

  // Default: pass through without caching
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting signaled by user.');
    self.skipWaiting();
  }
});
