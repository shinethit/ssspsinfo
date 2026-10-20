const fs = require('fs');

function read(p) { 
  if (!fs.existsSync(p)) return ''; 
  return fs.readFileSync(p, 'utf8'); 
}
function write(p, c) { 
  fs.writeFileSync(p, c, 'utf8'); 
  console.log('  ✅ ' + p); 
}

console.log('\n🛠️ Final Cleanup & Version Bump (v15.3)\n');

// 1) သင့်မူလ vite.config.ts (PWA အပါအဝင်)
write('vite.config.ts', `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';;
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — သတင်းနှင့် ပြန်ကြားရေးဌာန',
          short_name: 'ကျောင်းအသင်း',
          description: 'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း အတွင်းပိုင်း သတင်းနှင့် အချက်အလက် မျှဝေရေး ပလပ်ဖောင်း',
          theme_color: '#0369a1',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https:\\/\\/fonts\\.googleapis\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\\/\\/fonts\\.gstatic\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\\/\\/firebasestorage\\.googleapis\\.com\\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'firebase-storage-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
            },
          ],
        },
        devOptions: { enabled: true, type: 'module' },
      }),
    ],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
`);

// 2) သင့်မူလ main.tsx (ပိုလျှံနေတဲ့ Loop ကုဒ်များ လုံးဝ မပါဝင်စေရန်)
write('src/main.tsx', `import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
`);

// 3) Version ကို v15.3 သို့ တင်ခြင်း
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.3'");
write('src/constants.ts', C);

// 4) versions.ts တွင် v15.3 ထည့်ခြင်း (Syntax Error မတက်စေရန် သေချာစစ်ဆေးပြီး)
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.3'")) {
  // v15.2 လက်ရှိ isLatest ကို false ပြောင်း
  V = V.replace(/(version: 'v15\.2'[\s\S]*?isLatest:\s*)true/, '$1false');
  
  // v15.3 အသစ် ထည့်
  V = V.replace(
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'ဆိုက်အား ပုံမှန်အခြေအနေသို့ ပြန်လည်ရောက်ရှိစေခြင်း (Final Cleanup)',
    changes: [
      { type: 'fix', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် Service Worker Loop ကုဒ်များအား လုံးဝ ဖယ်ရှားခြင်း' },
      { type: 'improve', text: 'မူလ Vite PWA AutoUpdate စနစ်အား ပြန်လည်ထည့်သွင်းပြီး အလိုအလျောက် Update ဖြစ်စေရန် ပြင်ဆင်ခြင်း' },
    ],
  },`
  );
  write('src/data/versions.ts', V);
}

// 5) ပြဿနာဖြစ်စေတဲ့ _headers ဖိုင် ရှိရင် ဖျက်ပစ်ခြင်း
if (fs.existsSync('public/_headers')) {
  fs.unlinkSync('public/_headers');
  console.log('  🗑️ Deleted public/_headers');
}

console.log('\n✅ DONE\n');