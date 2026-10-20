const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) return '';
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }
function safeReplace(content, find, replace, label) {
  if (!content.includes(find)) throw new Error(`[${label}] Pattern not found`);
  return content.replace(find, replace);
}

console.log('\n🚀 Fixing Mobile PWA Auto-Update (v15.6)\n');

// 1) main.tsx — ဖုန်း App ဖွင့်တိုင်း Update စစ်ဆေးမည့် စနစ်
console.log('\n📝 src/main.tsx');
write('src/main.tsx', `/// <reference types="vite-plugin-pwa/client" />
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// App ဖွင့်တိုင်း Auto Update စစ်ဆေးရန်
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] Update found. Applying automatically...');
    updateSW(true); // Update ရှိရင် ချက်ချင်း သွင်းမယ်
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use.');
  },
});

// ဖုန်း Screen ပြန်ဖွင့်တိုင်း (သို့မဟုတ်) App ပြန်ဝင်တိုင်း Cloud နဲ့ တိုက်စစ်မယ်
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.update().catch(console.error); // Cloud မှာ Update ရှိမရှိ လှမ်းမေးမယ်
      }
    });
  }
});

createRoot(document.getElementById('root')!).render(<App />);
`);

// 2) public/_headers — Cloudflare က sw.js နဲ့ index.html ကို Cache မလုပ်အောင် တားဆီးခြင်း
console.log('\n📝 public/_headers');
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
write('public/_headers', `# Cloudflare က Service Worker နဲ့ HTML ကို Cache မလုပ်ရပါဘူး (Auto Update အတွက်)
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/registerSW.js
  Cache-Control: no-cache, no-store, must-revalidate

/index.html
  Cache-Control: no-cache, must-revalidate

/manifest.webmanifest
  Cache-Control: no-cache, must-revalidate
`);

// 3) Version Bump -> v15.6
console.log('\n📝 src/constants.ts -> v15.6');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.6'");
write('src/constants.ts', C);

// 4) Versions.ts -> Add v15.6
console.log('\n📝 src/data/versions.ts -> v15.6 entry');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.6'")) {
  V = safeReplace(V,
    `version: 'v15.5',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `version: 'v15.5',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`,
    'Demote v15.5'
  );
  V = safeReplace(V,
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'ဖုန်း (Mobile) များတွင် PWA Auto-Update အပြည့်အစုံ အလုပ်လုပ်နိုင်စေရန် ပြင်ဆင်ခြင်း',
    changes: [
      { type: 'fix', text: 'App ဖွင့်တိုင်း နှင့် ဖုန်း Screen ပြန်ဖွင့်တိုင်း Cloud နှင့် Local Version ကို အလိုအလျောက် တိုက်စစ်ပြီး အသစ်ရှိပါက ချက်ချင်း Update ဖြစ်စေခြင်း' },
      { type: 'improve', text: 'Cloudflare မှ sw.js နှင့် index.html ဖိုင်များကို Cache မလုပ်တော့ဘဲ အမြဲတမ်း အသစ်ဆုံး Version ကို ဆွဲယူစေခြင်း' },
    ],
  },`,
    'Add v15.6'
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE\n');