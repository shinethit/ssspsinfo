const CACHE_NAME = 'ssspsinfo-live-v7';
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png'];
self.addEventListener('install', (event) => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
function fetchWithTimeout(request, timeoutMs = 1500) { return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs); fetch(request).then((res) => { clearTimeout(timer); resolve(res); }).catch((err) => { clearTimeout(timer); reject(err); }); }); }
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return; 
  const url = new URL(request.url);
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('google')) return;
  const isCodeOrHtml = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.startsWith('/assets/');
  if (isCodeOrHtml) {
    event.respondWith(fetchWithTimeout(request).then((response) => {
      if (response && response.status === 200 && !response.redirected) { const clone = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); }
      return response;
    }).catch(() => caches.match(request).then((cached) => {
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('/index.html');
      return new Response('Network error', { status: 408 });
    })));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response && response.status === 200 && !response.redirected) { const clone = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); }
      return response;
    }).catch(() => new Response('Offline', { status: 404 }));
  }));
});
