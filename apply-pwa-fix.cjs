// ═══════════════════════════════════════════════
// FILENAME: apply-pwa-fix.cjs
// ═══════════════════════════════════════════════
// Fixes PWA update + version bump + real force update
// ═══════════════════════════════════════════════
const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

function safe(content, find, replace, label) {
  const count = content.split(find).length - 1;
  if (count === 0) {
    console.log(`\n  ❌ [${label}] NOT FOUND:`);
    console.log('  ' + JSON.stringify(find.substring(0, 200)));
    throw new Error(`[${label}] not matched`);
  }
  if (count > 1) throw new Error(`[${label}] appears ${count}x`);
  const idx = content.indexOf(find);
  return content.substring(0, idx) + replace + content.substring(idx + find.length);
}

console.log('\n🚀 apply-pwa-fix — v14.7\n');

// ═══════════════════════════════════════════════
// 1) constants.ts — v14.5 → v14.7
// ═══════════════════════════════════════════════
console.log('\n📝 src/constants.ts');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v14.7'");
write('src/constants.ts', C);

// ═══════════════════════════════════════════════
// 2) versions.ts — add v14.x entries + fix isLatest
// ═══════════════════════════════════════════════
console.log('\n📝 src/data/versions.ts');
let V = read('src/data/versions.ts');

if (!V.includes("version: 'v14.7'")) {
  V = safe(V,
`export const VERSIONS: VersionItem[] = [
  {
    version: 'v13.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,`,
`export const VERSIONS: VersionItem[] = [
  {
    version: 'v14.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA Update စနစ် အပြည့်အစုံ ပြင်ဆင်ခြင်း (Real Force Update)',
    changes: [
      { type: 'fix', text: 'Force Update ခလုတ်သည် Service Worker Update ကို တကယ်လုပ်ဆောင်ပေးပြီး Cloudflare Cache ကို ကျော်ဖြတ်နိုင်သည်' },
      { type: 'feat', text: 'VersionUpdateModal တွင် "Update Now" နှင့် "Force Reload (Hard Reset)" ခလုတ်များ ထည့်သွင်းခြင်း' },
      { type: 'fix', text: 'Cloudflare Pages တွင် sw.js ကို Cache မလုပ်စေရန် _headers ဖိုင် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Service Worker တွင် cleanupOutdatedCaches ဖွင့်ခြင်းဖြင့် version ဟောင်း Cache များ အလိုအလျောက် ရှင်းလင်းခြင်း' },
    ],
  },
  {
    version: 'v14.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Share/QR စနစ်နှင့် ပွဲချိန် (Match Time) Optional ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Share Button (Native Share + Copy Link + QR Code) ကို ကျောင်းအသေးစိတ်၊ အားကစားပြိုင်ပွဲနှင့် အားကစားသမားစာရင်းတွင် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'အားကစားပွဲစဉ်များတွင် ပွဲချိန် (Match Time) ကို Optional ထည့်သွင်းနိုင်ခြင်း' },
      { type: 'improve', text: 'အားကစားသမား စာရင်းကို Public (အမည်၊ အတန်း၊ အသက်၊ ကိုယ်စားပြုကျောင်း) သာ ပြသနိုင်စေရန် ပြင်ဆင်ခြင်း' },
    ],
  },
  {
    version: 'v14.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ကြေညာချက်နှင့် ပွဲစဉ်များတွင် ဇုန် (Optional) ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Announcements နှင့် Events တွင် ဇုန် (Optional) သတ်မှတ်နိုင်ခြင်း' },
      { type: 'feat', text: 'ဇုန် မသတ်မှတ်ပါက Association-wide အနေဖြင့် အားလုံးအတွက် ပြသခြင်း' },
    ],
  },
  {
    version: 'v14.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အားကစား၊ တောင်းဆိုမှုနှင့် ကျောင်း Portal တွင် ဇုန်စနစ်',
    changes: [
      { type: 'feat', text: 'AdminSportsManager — ဇုန်အလိုက် ကျောင်းစစ်ထုတ်မှု' },
      { type: 'feat', text: 'AdminRequestsManager — ဇုန်အလိုက် တောင်းဆိုမှုစစ်ထုတ်မှု' },
      { type: 'feat', text: 'SchoolPortal — ကျောင်း ကိုယ်တိုင် ဇုန်ရွေးနိုင်ခြင်း' },
    ],
  },
  {
    version: 'v14.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Contacts Page တွင် ဇုန်စစ်ထုတ်မှု',
    changes: [
      { type: 'feat', text: 'Contacts တွင် ဇုန်စစ်ထုတ်မှု + URL sync' },
    ],
  },
  {
    version: 'v14.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Dashboard နှင့် Admin Managers တွင် ဇုန်စနစ်',
    changes: [
      { type: 'feat', text: 'Dashboard, AdminSchoolManager, AdminFinanceManager, SchoolForm တွင် ဇုန်စနစ်' },
    ],
  },
  {
    version: 'v14.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Global Zone Filters + PWA Auto-Update Hardening',
    changes: [
      { type: 'feat', text: 'Home နှင့် Admin တွင် ဇုန် Filter' },
      { type: 'fix', text: 'PWA autoUpdate hardening (skipWaiting + clientsClaim)' },
    ],
  },
  {
    version: 'v13.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,`,
    'V add v14.x entries');
  write('src/data/versions.ts', V);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 3) main.tsx — real SW registration + global handle
// ═══════════════════════════════════════════════
console.log('\n📝 src/main.tsx');
const mainCode = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// ═══════════════════════════════════════════════
// PWA Service Worker — real update handling
// ═══════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  // Expose to VersionUpdateModal for force update
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length > 0) {
        const reg = regs[0];
        (window as any).__swReg = reg;

        // Auto-reload when new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if ((window as any).__reloadedForUpdate) return;
          (window as any).__reloadedForUpdate = true;
          window.location.reload();
        });

        // Detect new SW installed
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sssps_pwa_update_available'));
            }
          });
        });

        // Background update check every 30 minutes
        setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);
      }
    } catch (err) {
      console.error('SW init error:', err);
    }
  });
}
`;
write('src/main.tsx', mainCode);

// ═══════════════════════════════════════════════
// 4) VersionUpdateModal.tsx — real update buttons
// ═══════════════════════════════════════════════
console.log('\n📝 src/components/VersionUpdateModal.tsx');
let M = read('src/components/VersionUpdateModal.tsx');

if (!M.includes('handleForceReload')) {
  M = safe(M,
    `import { Sparkles, X, ArrowRight, History, Activity, CheckCircle2 } from 'lucide-react';`,
    `import { Sparkles, X, ArrowRight, History, Activity, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';`,
    'M1 imports');

  M = safe(M,
    `  const [isOpen, setIsOpen] = useState(false);\n  const navigate = useNavigate();`,
    `  const [isOpen, setIsOpen] = useState(false);\n  const [isUpdating, setIsUpdating] = useState(false);\n  const [isForceReloading, setIsForceReloading] = useState(false);\n  const navigate = useNavigate();`,
    'M2 state');

  M = safe(M,
    `  const handleDismiss = () => {`,
    `  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      const reg = (window as any).__swReg as ServiceWorkerRegistration | undefined;
      if (reg) {
        // Check for update first
        try { await reg.update(); } catch {}
        if (reg.waiting) {
          // Tell waiting worker to skip waiting
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Controllerchange handler in main.tsx will reload
          // Fallback reload after 2s
          setTimeout(() => window.location.reload(), 2000);
        } else {
          // No waiting — just reload to pick up fresh files
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  const handleForceReload = async () => {
    setIsForceReloading(true);
    try {
      // 1) Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      // 2) Delete all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
    } catch (e) {
      console.error('Force reload error:', e);
    } finally {
      // 3) Hard reload bypassing HTTP cache
      const url = window.location.href.split('?')[0] + '?nocache=' + Date.now();
      window.location.replace(url);
    }
  };

  const handleDismiss = () => {`,
    'M3 handlers');

  M = safe(M,
    `        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">\n          <button onClick={() => { handleDismiss(); navigate('/versions'); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">\n            မှတ်တမ်းအားလုံး ကြည့်ရန်\n          </button>\n          <button onClick={handleDismiss} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-sky-900 hover:bg-sky-800 transition">\n            သိရှိပါပြီ (Got it)\n          </button>\n        </div>`,
    `        <div className="p-4 border-t border-slate-100 flex flex-wrap justify-end gap-2 bg-white">
          <button
            onClick={handleForceReload}
            disabled={isForceReloading}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Cache အားလုံး ဖျက်ပြီး Browser ကို အတင်းပြန်ဖွင့်မည်"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isForceReloading ? 'ပြန်လည်သတ်မှတ်နေသည်...' : 'Force Reload'}
          </button>
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Service Worker Update ကို ခေါ်ပြီး ပြန်ဖွင့်မည်"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${isUpdating ? 'animate-spin' : ''}\`} />
            {isUpdating ? 'Update လုပ်နေသည်...' : 'Update Now'}
          </button>
          <button onClick={() => { handleDismiss(); navigate('/versions'); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
            မှတ်တမ်းအားလုံး
          </button>
          <button onClick={handleDismiss} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-sky-900 hover:bg-sky-800 transition cursor-pointer">
            သိရှိပါပြီ
          </button>
        </div>`,
    'M4 footer buttons');

  write('src/components/VersionUpdateModal.tsx', M);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 5) Layout.tsx — Force Update button = real check
// ═══════════════════════════════════════════════
console.log('\n📝 src/components/Layout.tsx');
let L = read('src/components/Layout.tsx');

if (!L.includes('__swReg')) {
  L = safe(L,
    `            onClick={() => {\n              // Dispatch the custom event to open the modal\n              window.dispatchEvent(new CustomEvent('sssps_open_version_modal'));\n              closeSidebar();\n            }}`,
    `            onClick={async () => {\n              // Real SW update check, then open modal\n              const reg = (window as any).__swReg as ServiceWorkerRegistration | undefined;\n              if (reg) {\n                try {\n                  await reg.update();\n                } catch {}\n              }\n              // Always open modal — modal shows current state + buttons\n              window.dispatchEvent(new CustomEvent('sssps_open_version_modal'));\n              closeSidebar();\n            }}`,
    'L1 force update btn');
  write('src/components/Layout.tsx', L);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 6) vite.config.ts — cleanupOutdatedCaches
// ═══════════════════════════════════════════════
console.log('\n📝 vite.config.ts');
let VC = read('vite.config.ts');
if (!VC.includes('cleanupOutdatedCaches')) {
  VC = safe(VC,
    `        workbox: {\n          skipWaiting: true,`,
    `        workbox: {\n          cleanupOutdatedCaches: true,\n          skipWaiting: true,`,
    'VC1 cleanup');
  write('vite.config.ts', VC);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 7) public/_headers — Cloudflare no-cache for SW
// ═══════════════════════════════════════════════
console.log('\n📝 public/_headers');
const headers = `/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
  Service-Worker-Allowed: /

/registerSW.js
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.webmanifest
  Cache-Control: no-cache, must-revalidate

/index.html
  Cache-Control: no-cache, must-revalidate
`;
const pubDir = fs.existsSync('public') ? 'public' : null;
if (pubDir) {
  write('public/_headers', headers);
} else {
  console.log('  ⚠️  public/ folder not found — creating');
  fs.mkdirSync('public', { recursive: true });
  write('public/_headers', headers);
}

console.log('\n✅ DONE — v14.7\n');
console.log('NEXT:');
console.log('  1) git status                ← 6 modified + 1 new (_headers)');
console.log('  2) npx tsc --noEmit');
console.log('  3) npm run build');
console.log('  4) git add . && git commit -m "fix(v14.7): real force update + version bump + Cloudflare SW no-cache"');
console.log('  5) git push');
console.log('  6) Remove-Item apply-pwa-fix.cjs -Force\n');
console.log('AFTER DEPLOY:');
console.log('  Browser Console တွင် အောက်ပါကို run:');
console.log('    navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()));');
console.log('    caches.keys().then(k => Promise.all(k.map(n => caches.delete(n))));');
console.log('    location.reload(true);\n');