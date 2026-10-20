const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Custom Service Worker (iOS Fix) စတင်နေပါပြီ...");

try {
  // ၁။ public/sw.js ကို ခင်ဗျားပေးတဲ့ ပုံစံအတိုင်း ရေးမယ် (နာမည်ကို ssspsinfo ပြောင်းမယ်)
  const swContent = `const CACHE_NAME = 'ssspsinfo-live-v1';

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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Clearing old service worker cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

function fetchWithTimeout(request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network timeout in Service Worker'));
    }, timeoutMs);

    fetch(request)
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
  const url = new URL(request.url);

  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('google')
  ) {
    return;
  }

  const isCodeOrHtml =
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/assets/');

  if (isCodeOrHtml) {
    event.respondWith(
      fetchWithTimeout(request, 1500)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Network error and no cache available', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return new Response('Offline resource not available', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    })
  );
});
`;
  fs.writeFileSync(path.join(__dirname, 'public', 'sw.js'), swContent, 'utf8');
  console.log("✅ public/sw.js (Custom) ကို ဖန်တီးပြီးပါပြီ။");

  // ၂။ vite.config.ts မှ VitePWA ကို ဖြုတ်မယ်
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // VitePWA ကို ဖြုတ်ပစ်မယ် (Import နဲ့ Plugin ထဲက)
  viteConfig = viteConfig.replace(/import\s*\{\s*VitePWA\s*\}\s*from\s*'vite-plugin-pwa';?\n?/, '');
  viteConfig = viteConfig.replace(/VitePWA\(\{[\s\S]*?\}\),?/g, '');
  
  fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
  console.log("✅ vite.config.ts မှ VitePWA (Workbox) ကို ဖယ်ရှားပြီးပါပြီ။");

  // ၃။ main.tsx ကို Custom SW register လုပ်အောင် ပြင်မယ်
  const mainTsxContent = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Custom SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
`;
  fs.writeFileSync(path.join(__dirname, 'src', 'main.tsx'), mainTsxContent, 'utf8');
  console.log("✅ main.tsx တွင် Custom SW ကို register လုပ်ပြီးပါပြီ။");

  // ၄။ manifest.webmanifest ဖိုင် ဖန်တီးမယ် (VitePWA ဖြုတ်လိုက်လို့ လိုအပ်လာတယ်)
  const manifestContent = JSON.stringify({
    id: "/",
    name: "ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — သတင်းနှင့် ပြန်ကြားရေးဌာန",
    short_name: "ကျောင်းအသင်း",
    description: "ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း အတွင်းပိုင်း သတင်းနှင့် အချက်အလက် မျှဝေရေး ပလပ်ဖောင်း",
    theme_color: "#0369a1",
    background_color: "#f8fafc",
    display: "standalone",
    start_url: "/",
    scope: "/",
    icons: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }, null, 2);
  fs.writeFileSync(path.join(__dirname, 'public', 'manifest.webmanifest'), manifestContent, 'utf8');
  console.log("✅ public/manifest.webmanifest ဖန်တီးပြီးပါပြီ။");

  // ၅။ Version အသစ် v20.0 တင်မယ်
  const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
  let versionsContent = fs.readFileSync(versionsPath, 'utf8');
  versionsContent = versionsContent.replace(/isLatest:\s*true/g, 'isLatest: false');

  const newVersionString = `{
    version: 'v20.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Major PWA Overhaul (Custom Service Worker)',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် ချိတ်ဆက်မှု ပြတ်တောက်ခြင်းကို ဖြေရှင်းရန် Workbox ကို ဖယ်ရှားပြီး Custom Service Worker သို့ ပြောင်းလဲခြင်း' },
      { type: 'improve', text: 'ကွန်ရက်နှေးသွားပါက ၁.၅ စက္ကန့်အတွင်း Cache မှ အလိုအလျောက် ပြန်လည်ဖွင့်ပေးသည့် fetchWithTimeout စနစ် ထည့်သွင်းခြင်း' }
    ],
  },`;

  versionsContent = versionsContent.replace(
    /export const VERSIONS: VersionItem\[\] = \[/,
    `export const VERSIONS: VersionItem[] = [\n  ${newVersionString}`
  );
  fs.writeFileSync(versionsPath, versionsContent, 'utf8');
  console.log("✅ versions.ts တွင် v20.0 ထည့်ပြီးပါပြီ။\n");

  // ၆။ Auto-Testing
  console.log("🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\n✅ စမ်းသပ်မှု အောင်မြင်ပါသည်။\n");

  // ၇။ Git Push
  console.log("🚀 GitHub သို့ တင်နေပါသည်...");
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: migrate to custom service worker with fetchWithTimeout for iOS fix (v20.0)"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("\n🎉 အားလုံး ပြီးပါပြီ။");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ အနီရောင်စာသားကို ကြည့်ပါ။");
  process.exit(1);
}