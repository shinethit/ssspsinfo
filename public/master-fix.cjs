const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 MASTER FIX (All-in-One) စတင်နေပါပြီ...");

try {
  // ၁။ Custom sw.js ကို ဖန်တီးခြင်း
  const swContent = `const CACHE_NAME = 'ssspsinfo-live-v21';
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png'];
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {})));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
function fetchWithTimeout(request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    fetch(request).then((res) => { clearTimeout(timer); resolve(res); }).catch((err) => { clearTimeout(timer); reject(err); });
  });
}
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) return;
  const isCodeOrHtml = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.startsWith('/assets/');
  if (isCodeOrHtml) {
    event.respondWith(fetchWithTimeout(request, 1500).then((res) => {
      if (res && res.status === 200) { const clone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); }
      return res;
    }).catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('/index.html') : new Response('Offline', { status: 408 })))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((res) => {
    if (res && res.status === 200) { const clone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); }
    return res;
  }).catch(() => new Response('Offline', { status: 404 }))));
});`;
  fs.writeFileSync(path.join(__dirname, 'public', 'sw.js'), swContent, 'utf8');
  console.log("✅ public/sw.js ဖန်တီးပြီးပါပြီ။");

  // ၂။ Manifest ဖိုင် ဖန်တီးခြင်း
  const manifestContent = JSON.stringify({
    id: "/", name: "ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း", short_name: "ကျောင်းအသင်း", display: "standalone", start_url: "/", scope: "/", theme_color: "#0369a1", background_color: "#f8fafc",
    icons: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }, null, 2);
  fs.writeFileSync(path.join(__dirname, 'public', 'manifest.webmanifest'), manifestContent, 'utf8');
  console.log("✅ public/manifest.webmanifest ဖန်တီးပြီးပါပြီ။");

  // ၃။ index.html တွင် Manifest Link ထည့်ခြင်း
  const indexPath = path.join(__dirname, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('rel="manifest"')) {
    indexContent = indexContent.replace('<link rel="apple-touch-icon"', '<link rel="manifest" href="/manifest.webmanifest" />\n    <link rel="apple-touch-icon"');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log("✅ index.html တွင် Manifest Link ထည့်ပြီးပါပြီ။");
  }

  // ၄။ main.tsx ကို ပြင်ဆင်ခြင်း
  const mainTsxContent = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW reg failed', err));
  });
}
createRoot(document.getElementById('root')!).render(<App />);`;
  fs.writeFileSync(path.join(__dirname, 'src', 'main.tsx'), mainTsxContent, 'utf8');
  console.log("✅ src/main.tsx ပြင်ဆင်ပြီးပါပြီ။");

  // ၅။ vite.config.ts မှ VitePWA ကို ဖယ်ရှားခြင်း
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  viteConfig = viteConfig.replace(/import\s*\{\s*VitePWA\s*\}\s*from\s*'vite-plugin-pwa';?\n?/, '');
  viteConfig = viteConfig.replace(/VitePWA\(\{[\s\S]*?\}\),?/g, '');
  fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
  console.log("✅ vite.config.ts မှ VitePWA ကို ဖယ်ရှားပြီးပါပြီ။");

  // ၆။ Version v21.0 တင်ခြင်း
  const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
  let versionsContent = fs.readFileSync(versionsPath, 'utf8');
  versionsContent = versionsContent.replace(/isLatest:\s*true/g, 'isLatest: false');
  const newVersion = `{\n    version: 'v21.0',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,\n    title: 'Ultimate PWA Fix (Custom SW & Manifest)',\n    changes: [\n      { type: 'fix', text: 'iOS နှင့် Windows တွင် အဟောင်း Cache စွဲကျန်ခြင်းကို လုံးဝ ဖြေရှင်းရန် Custom Service Worker သို့ ပြောင်းလဲခြင်း' },\n      { type: 'improve', text: 'Manifest နှင့် Service Worker ကို သီးသန့် ခွဲထုတ်ပြီး Platform ၃ ခုလုံးတွင် PWA အပြည့်အဝ အလုပ်လုပ်နိုင်စေရန် ပြင်ဆင်ခြင်း' }\n    ],\n  },`;
  versionsContent = versionsContent.replace(/export const VERSIONS: VersionItem\[\] = \[/, `export const VERSIONS: VersionItem[] = [\n  ${newVersion}`);
  fs.writeFileSync(versionsPath, versionsContent, 'utf8');
  console.log("✅ versions.ts တွင် v21.0 တင်ပြီးပါပြီ။\n");

  // ၇။ စမ်းသပ်ခြင်း
  console.log("🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\n✅ စမ်းသပ်မှု အောင်မြင်ပါသည်။\n");

  // ၈။ GitHub သို့ တင်ခြင်း
  console.log("🚀 GitHub သို့ တင်နေပါသည်...");
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: ultimate PWA fix - custom SW, manifest link, v21.0"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("\n🎉 အားလုံး ပြီးပါပြီ။ ခင်ဗျား ဘာမှ ထပ်လုပ်စရာ မလိုပါဘူး။");
  console.log("Cloudflare Deploy ဖြစ်သွားတာနဲ့ စက်ထဲက အဟောင်း Icon ကို ဖျက်ပြီး ပြန်ဝင်ကြည့်ပါ။");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ အနီရောင်စာသားကို ကြည့်ပါ။");
  process.exit(1);
}