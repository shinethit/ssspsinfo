const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

console.log('\n🛡️ Final Safe Fix (v16.3)\n');

// 1) main.tsx: ပြဿနာဖြစ်စေတဲ့ visibilitychange ကို ဖျက်ပြီး မူလအတိုင်း ပြန်ထားမယ်
console.log('\n📝 src/main.tsx');
write('src/main.tsx', `/// <reference types="vite-plugin-pwa/client" />
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Vite PWA Auto Update
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] Update found. Applying automatically...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
`);

// 2) constants.ts: v16.3 သို့ တင်ခြင်း
console.log('\n📝 src/constants.ts');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v16.3'");
write('src/constants.ts', C);

// 3) versions.ts: Error မတက်စေရန် v15.6 ကို false ပြောင်းပြီး v16.3 ကို အပေါ်ဆုံးမှာ ထည့်ခြင်း
console.log('\n📝 src/data/versions.ts');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v16.3'")) {
  V = V.replace(
    `version: 'v15.6',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `version: 'v15.6',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`
  );
  V = V.replace(
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v16.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA Auto-Update တည်ငြိမ်စေရန် နှင့် Cloudflare Block ပြဿနာ ဖြေရှင်းခြင်း',
    changes: [
      { type: 'fix', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် visibilitychange ကုဒ်များအား ဖယ်ရှားခြင်း' },
      { type: 'improve', text: 'Vite PWA ၏ မူလ Auto-Update စနစ်အတိုင်း ပြန်လည်ထားရှိခြင်း' },
    ],
  },`
  );
  write('src/data/versions.ts', V);
}

// 4) Cloudflare Cache ကာကွယ်ရေး (sw.js ကို Cache မလုပ်ရန်)
console.log('\n📝 public/_headers');
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
write('public/_headers', `/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
  Service-Worker-Allowed: /

/index.html
  Cache-Control: no-cache, must-revalidate
`);

console.log('\n✅ DONE — Code is safe.\n');