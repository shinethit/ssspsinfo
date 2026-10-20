const fs = require('fs');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

console.log('\n♻️ Restoring original PWA setup (v15.2)\n');

// 1) Restore vite.config.ts (Bring back VitePWA)
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
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https:\\/\\/fonts\\.googleapis\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\\/\\/fonts\\.gstatic\\.com\\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
`);

// 2) Restore main.tsx to the original state (No manual SW registration needed)
write('src/main.tsx', `import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
`);

// 3) Bump version to v15.2
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.2'");
write('src/constants.ts', C);

// 4) Add to versions.ts
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.2'")) {
  V = V.replace(
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA စနစ် မူလအတိုင်း ပြန်လည်ထူထောင်ခြင်း (Restore)',
    changes: [
      { type: 'fix', text: 'မူလက အလုပ်လုပ်နေသော Vite PWA autoUpdate စနစ်အား မူလအတိုင်း ပြန်လည်ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် Manual Polling ကုဒ်များအား လုံးဝ ဖယ်ရှားခြင်း' },
    ],
  },`
  );
  // Demote v15.1
  V = V.replace(
    `    version: 'v15.1',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `    version: 'v15.1',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE\n');