const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }
function safeReplace(content, find, replace, label) {
  if (!content.includes(find)) throw new Error(`[${label}] Pattern not found.`);
  return content.replace(find, replace);
}

console.log('\n🛡️ Applying Auto-Reset PWA Fix (v17.0)\n');

// 1) main.tsx: သူ့ဘာသာသူ Cache ရှင်းပြီး အသစ်ပြန်တက်မယ့် ကုဒ်
console.log('\n📝 src/main.tsx');
write('src/main.tsx', `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// ───────────────────────────────────────────────────────────
// 🚀 AUTO CACHE CLEARING & SELF-HEALING MECHANISM (v17.0)
// This forces Windows and iOS to clear old broken PWA caches.
// ───────────────────────────────────────────────────────────
const CURRENT_APP_VERSION = 'v17.0';
const STORAGE_KEY = 'ssspsinfo_app_version';
let isResetting = false;

try {
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  
  if (storedVersion !== CURRENT_APP_VERSION) {
    const lastReset = localStorage.getItem('ssspsinfo_last_reset');
    const now = Date.now();
    
    // စက္ကန့် ၁၅၀၀၀ အတွင်း နှစ်ခါဖြစ်မနေစေရန် ကာကွယ်ခြင်း (Loop မဖြစ်စေရန်)
    if (!lastReset || now - parseInt(lastReset) > 15000) {
      localStorage.setItem('ssspsinfo_last_reset', now.toString());
      isResetting = true;
      
      (async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            for (const k of keys) await caches.delete(k);
          }
          localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
          window.location.reload();
        } catch (e) {
          console.error('Self-heal failed:', e);
          localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
          window.location.reload();
        }
      })();
    } else {
      localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    }
  }
} catch (e) {}

// ───────────────────────────────────────────────────────────
// Render
// ───────────────────────────────────────────────────────────
if (isResetting) {
  document.getElementById('root')!.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#0369a1;"><h3>Applying important update, please wait...</h3></div>';
} else {
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
}
`);

// 2) constants.ts: v17.0 သို့ တင်ခြင်း
console.log('\n📝 src/constants.ts');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v17.0'");
write('src/constants.ts', C);

// 3) versions.ts: Error မတက်စေရန် v16.3 ကို false ပြောင်းပြီး v17.0 ကို အပေါ်ဆုံးမှာ ထည့်ခြင်း
console.log('\n📝 src/data/versions.ts');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v17.0'")) {
  V = safeReplace(V, 
    `isLatest: true,`, 
    `isLatest: false,`, 
    'Demote old version'
  );
  V = safeReplace(V,
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v17.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Auto Cache Clearing & Self-Healing System',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows များတွင် အဟောင်း PWA Cache များ စွဲကျန်နေခြင်းကို အလိုအလျောက် ရှင်းလင်းပြီး အသစ်သို့ တိုက်ရိုက်ပြောင်းလဲပေးသည့် Self-Healing စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'အသုံးပြုသူများအနေဖြင့် လက်ဖြင့် Cache ရှင်းလင်းရန် မလိုအပ်တော့ဘဲ App ဖွင့်တိုင်း အသစ်ဆုံး Version ကို အလိုအလျောက် ရရှိစေခြင်း' },
    ],
  },`
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE — Code is safe.\n');