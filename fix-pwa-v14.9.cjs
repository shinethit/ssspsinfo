// ═══════════════════════════════════════════════
// FILENAME: fix-pwa-v14.9.cjs
// ═══════════════════════════════════════════════
const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`Not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }
function safe(content, find, replace, label) {
  if (!content.includes(find)) throw new Error(`[${label}] pattern not found`);
  return content.replace(find, replace);
}

console.log('\n🚀 fix-pwa-v14.9 — Cloudflare SW cache bypass + real auto-update\n');

// ═══════════════════════════════════════════════
// 1) src/main.tsx — OVERWRITE with robust SW handler
// ═══════════════════════════════════════════════
console.log('\n📝 src/main.tsx (overwrite)');
write('src/main.tsx', `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// ═══════════════════════════════════════════════
// PWA Auto-Update — RELOAD on controllerchange
// ═══════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // THE most important line — reload when new SW takes over
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[PWA] ✅ New service worker activated — reloading page');
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length === 0) return;
      const reg = regs[0];
      (window as any).__swReg = reg;

      // Immediate check on load
      try {
        await reg.update();
        if (reg.waiting) {
          console.log('[PWA] Waiting SW found on load — sending SKIP_WAITING');
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (e) {}

      // Poll every 30 seconds for new updates
      setInterval(async () => {
        try {
          await reg.update();
          if (reg.waiting) {
            console.log('[PWA] Waiting SW found (poll) — sending SKIP_WAITING');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        } catch (e) {}
      }, 30 * 1000);
    } catch (err) {
      console.error('[PWA] SW init error:', err);
    }
  });
}
`);

// ═══════════════════════════════════════════════
// 2) public/_headers — Cloudflare no-cache for SW
// ═══════════════════════════════════════════════
console.log('\n📝 public/_headers (Cloudflare cache control)');
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
write('public/_headers', `# ═══════════════════════════════════════════════
# Cloudflare Pages — PWA auto-update headers
# ═══════════════════════════════════════════════

# Service Worker MUST be revalidated every request
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
  Service-Worker-Allowed: /

/registerSW.js
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.webmanifest
  Cache-Control: no-cache, must-revalidate

# HTML must be revalidated so new bundle refs load
/
  Cache-Control: no-cache, must-revalidate

/index.html
  Cache-Control: no-cache, must-revalidate

# Hashed assets — safe to cache long (URL changes when content changes)
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);

// ═══════════════════════════════════════════════
// 3) src/components/VersionUpdateModal.tsx — Update/Force Reload buttons
// ═══════════════════════════════════════════════
console.log('\n📝 src/components/VersionUpdateModal.tsx');
let M = read('src/components/VersionUpdateModal.tsx');
if (!M.includes('handleForceReload')) {
  // Add imports
  if (!M.includes('RefreshCw')) {
    M = M.replace(
      `import { Sparkles, X, ArrowRight, History, Activity, CheckCircle2 } from 'lucide-react';`,
      `import { Sparkles, X, ArrowRight, History, Activity, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';`
    );
  }
  // Add state
  M = M.replace(
    `  const [isOpen, setIsOpen] = useState(false);`,
    `  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isForceReloading, setIsForceReloading] = useState(false);`
  );
  // Add handlers before handleDismiss
  M = M.replace(
    `  const handleDismiss = () => {`,
    `  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      const reg = (window as any).__swReg as ServiceWorkerRegistration | undefined;
      if (reg) {
        try { await reg.update(); } catch {}
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch { window.location.reload(); }
  };

  const handleForceReload = async () => {
    setIsForceReloading(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
    } catch (e) { console.error(e); }
    const url = window.location.href.split('?')[0] + '?fresh=' + Date.now();
    window.location.replace(url);
  };

  const handleDismiss = () => {`
  );
  // Replace footer
  M = M.replace(
    `<div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">`,
    `<div className="p-4 border-t border-slate-100 flex flex-wrap justify-end gap-2 bg-white">`
  );
  // Add Update Now + Force Reload buttons before existing dismiss button
  M = M.replace(
    `          <button onClick={handleDismiss} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-sky-900 hover:bg-sky-800 transition">
            သိရှိပါပြီ (Got it)
          </button>`,
    `          <button
            onClick={handleForceReload}
            disabled={isForceReloading}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Cache အားလုံး ဖျက်ပြီး ပြန်ဖွင့်မည် (guaranteed fresh)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isForceReloading ? 'ရှင်းလင်းနေသည်...' : 'Force Reload'}
          </button>
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="SW Update ခေါ်ပြီး ပြန်ဖွင့်မည်"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${isUpdating ? 'animate-spin' : ''}\`} />
            {isUpdating ? 'Update လုပ်နေသည်...' : 'Update Now'}
          </button>
          <button onClick={handleDismiss} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-sky-900 hover:bg-sky-800 transition cursor-pointer">
            သိရှိပါပြီ
          </button>`
  );
  write('src/components/VersionUpdateModal.tsx', M);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 4) vite.config.ts — cleanupOutdatedCaches (if missing)
// ═══════════════════════════════════════════════
console.log('\n📝 vite.config.ts');
let VC = read('vite.config.ts');
if (!VC.includes('cleanupOutdatedCaches')) {
  VC = VC.replace(
    `        workbox: {\n          skipWaiting: true,`,
    `        workbox: {\n          cleanupOutdatedCaches: true,\n          skipWaiting: true,`
  );
  write('vite.config.ts', VC);
} else { console.log('  ⏭️  Already done'); }

// ═══════════════════════════════════════════════
// 5) constants.ts → v14.9
// ═══════════════════════════════════════════════
console.log('\n📝 src/constants.ts → v14.9');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v14.9'");
write('src/constants.ts', C);

// ═══════════════════════════════════════════════
// 6) versions.ts → add v14.9 entry
// ═══════════════════════════════════════════════
console.log('\n📝 src/data/versions.ts → v14.9 entry');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v14.9'")) {
  V = V.replace(
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v14.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA Auto-Update အပြည့်အစုံ ပြင်ဆင်ခြင်း (Cloudflare Cache Bypass)',
    changes: [
      { type: 'fix', text: 'Cloudflare Pages တွင် sw.js နှင့် index.html ကို Cache မ လုပ်စေရန် _headers ဖိုင် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Service Worker အသစ် Activate ဖြစ်သည်နှင့် Page ကို အလိုအလျောက် Reload လုပ်သည့် controllerchange စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Page load တိုင်းနှင့် ၃၀ စက္ကန့်တိုင်း SW Update ကို အလိုအလျောက် စစ်ဆေးခြင်း' },
      { type: 'feat', text: 'VersionUpdateModal တွင် Update Now နှင့် Force Reload ခလုတ်များ ထည့်သွင်းခြင်း' },
    ],
  },`
  );
  // Demote v14.8's isLatest
  V = V.replace(
    `    version: 'v14.8',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `    version: 'v14.8',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`
  );
  write('src/data/versions.ts', V);
} else { console.log('  ⏭️  Already done'); }

console.log('\n✅ DONE — v14.9\n');