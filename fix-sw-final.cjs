// D:\ssspsinfo-main\fix-sw-final.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Service Worker Redirect Error ကို အပြီးသတ် ပြင်ဆင်နေပါသည်...');

// 1. sw.js ကို လုံးဝ Error ကင်းရှင်းမယ့် ပုံစံသစ်ဖြင့် ပြန်လည်ရေးသားခြင်း
const swPath = path.join(__dirname, 'public', 'sw.js');
const swContent = `const CACHE_NAME = 'ssspsinfo-live-v9';

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

// Fetch event ကို Network First ပုံစံဖြင့်သာ လုပ်ဆောင်စေခြင်း (Redirect error လုံးဝမတက်စေရန်)
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

  // Navigation requests (যেমন /admin, /schools) ကို Network မှသာ တိုက်ရိုက်ခေါ်ယူရန်
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ကျန်သည့် static files များအတွက်
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(request))
  );
});
`;

fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✅ public/sw.js ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');

// 2. Cloudflare Pages SPA Routing (_redirects) သေချာစေရန်
const redirectsPath = path.join(__dirname, 'public', '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf8');

// 3. Build & Push
console.log('🔨 Build ပြန်လုပ်နေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။');
  process.exit(1);
}

console.log('📦 GitHub သို့ Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix(sw): final fix for fetch event redirect error"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('🎉 GitHub သို့ အောင်မြင်စွာ တင်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ။');
}

try {
  if (fs.existsSync(__filename)) fs.unlinkSync(__filename);
} catch (e) {}