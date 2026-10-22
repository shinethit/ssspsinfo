// D:\ssspsinfo-main\fix-sw-redirect.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Service Worker (sw.js) Redirect Error ကို ပြင်ဆင်နေပါသည်...');

const swPath = path.join(__dirname, 'public', 'sw.js');

const swContent = `const CACHE_NAME = 'ssspsinfo-live-v8';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Clean redirected responses before putting into cache or returning to browser
function cleanResponse(response) {
  if (!response || !response.redirected) return Promise.resolve(response);
  return response.blob().then((bodyBlob) => {
    return new Response(bodyBlob, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  });
}

function fetchWithTimeout(target, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    fetch(target, { redirect: 'follow' })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
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

  // 1. Navigation Requests (e.g. /admin, /schools, /) -> Always use URL string so redirect mode is 'follow'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(request.url)
        .then((response) => cleanResponse(response))
        .then((cleaned) => {
          if (cleaned && cleaned.status === 200) {
            const clone = cleaned.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return cleaned;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            if (cached) return cleanResponse(cached);
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 2. JS, CSS, HTML Assets
  const isAsset =
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/assets/');

  if (isAsset) {
    event.respondWith(
      fetchWithTimeout(request.url)
        .then((response) => cleanResponse(response))
        .then((cleaned) => {
          if (cleaned && cleaned.status === 200) {
            const clone = cleaned.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return cleaned;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response('Network error', { status: 408 })))
    );
    return;
  }

  // 3. Other Static Files & Images
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cleanResponse(cached);
      return fetch(request.url, { redirect: 'follow' })
        .then((response) => cleanResponse(response))
        .then((cleaned) => {
          if (cleaned && cleaned.status === 200) {
            const clone = cleaned.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return cleaned;
        })
        .catch(() => new Response('Offline', { status: 404 }));
    })
  );
});
`;

fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✅ public/sw.js ကို Redirect Error လုံးဝ မတက်တော့အောင် ပြင်ဆင်ပြီးပါပြီ။');

// Cloudflare Pages SPA routing အတွက် public/_redirects ဖိုင် ရှိမရှိ စစ်ပြီး မရှိရင် ထည့်ပေးမည်
const redirectsPath = path.join(__dirname, 'public', '_redirects');
if (!fs.existsSync(redirectsPath)) {
  fs.writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf8');
  console.log('✅ Cloudflare Pages SPA အတွက် public/_redirects ဖိုင်ကို ထည့်သွင်းပေးထားပါသည်။');
}

console.log('🔨 Build လုပ်နေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။');
  process.exit(1);
}

console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix(sw): resolve redirected response error for navigation requests"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('🎉 GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ။');
}

try {
  if (fs.existsSync(__filename)) fs.unlinkSync(__filename);
} catch (e) {}