const fs = require('fs');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

console.log('\n🚑 Emergency Fix — Removing PWA & Service Worker entirely\n');

// 1) main.tsx (အကုန်ရှင်းလင်း)
write('src/main.tsx', `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
`);

// 2) vite.config.ts (PWA Plugin ဖြုတ်ခြင်း)
write('vite.config.ts', `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
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

// 3) constants.ts -> v15.1
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.1'");
write('src/constants.ts', C);

// 4) versions.ts -> v15.1
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.1'")) {
  V = V.replace(
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA Auto-Update ပိတ်သိမ်းခြင်း (Emergency Fix)',
    changes: [
      { type: 'fix', text: 'PWA Service Worker ကြောင့် ဖြစ်ပေါ်နေသော Cloudflare ERR_CONNECTION_RESET ပြဿနာကို ရပ်တန့်ရန် PWA စနစ်အား ယာယီပိတ်သိမ်းခြင်း' },
      { type: 'improve', text: 'ဆိုက်အား ပုံမှန်အခြေအနေသို့ ပြန်လည်ရောက်ရှိစေရန် Core စနစ်များကိုသာ ဦးစားပေးလုပ်ဆောင်ခြင်း' },
    ],
  },`
  );
  V = V.replace(
    `    version: 'v15.0',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `    version: 'v15.0',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE\n');