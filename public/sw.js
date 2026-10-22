const CACHE_NAME = 'ssspsinfo-live-v10';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

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

  // Navigation requests (ဥပမာ /admin, /schools စသည်ဖြင့် ဝင်ရောက်ခြင်း)
  if (request.mode === 'navigate') {
    event.respondWith(
      // redirect: 'follow' ကို သုံးပေးခြင်းဖြင့် redirected response error ကို ဖြေရှင်းပေးသည်
      fetch(request, { redirect: 'follow' }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ကျန်သည့် static files များအတွက်
  event.respondWith(
    fetch(request, { redirect: 'follow' })
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(request))
  );
});