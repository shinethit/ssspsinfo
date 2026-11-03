const CACHE_NAME = 'ssspsinfo-live-v25';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// v24.15 (V2): the VersionUpdateModal posts SKIP_WAITING to a waiting worker
// after reg.update(). Without this listener the message did nothing (the
// install handler's skipWaiting() covers the normal path, but this makes the
// modal's "Update Now" flow work as its comment claims).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function fetchWithTimeout(request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs);
    fetch(request, { redirect: 'follow' })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('cloudinary')
  ) {
    return;
  }

  // v24.15 re-audit (G5): /version.json must NEVER be cached or served
  // from cache — the live version check is the only safety net when a
  // deploy ships a byte-identical sw.js, and the cache-first branch below
  // would otherwise serve (and re-store) a stale copy. Network-only.
  if (url.pathname === '/version.json') {
    event.respondWith(fetch(request));
    return;
  }

  const isCodeOrHtml =
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/assets/');

  if (isCodeOrHtml) {
    // Network-first with a 10s timeout (v24.15 V2: the old 1.5s timeout
    // served stale bundles on slow networks); cache successful responses
    // so offline works.
    event.respondWith(
      fetchWithTimeout(request, 10000)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') return caches.match('/index.html');
            // v24.15 (V2): NEVER return a fake 408 'Offline' Response for
            // JS/CSS — a failed chunk must surface as a genuine network
            // error, never masquerade as a served file.
            return Response.error();
          })
        )
    );
    return;
  }

  // Other requests (images, fonts, etc.): cache-first, falling back to network.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request, { redirect: 'follow' }).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
