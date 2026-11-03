import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CURRENT_VERSION } from './constants';

// v24.15 (V2): the stale-version hole. The old code registered the service
// worker once on load and never checked again, so an old bundle could run
// forever without prompting. Now: registration.update() + a live version
// check run on load, every 5 minutes, and whenever the tab becomes visible
// again (visibilitychange / focus).
// NOTE on the interval: v15.0 history — a 30-SECOND poll was removed as an
// emergency fix because Cloudflare blocked the IP ("Service Worker ကို ၃၀
// စက္ကန့်တိုင်း လှမ်းမေးနေသည့် စနစ်ကို ဖယ်ရှားပြီး Cloudflare မှ IP ပိတ်ခံရခြင်း").
// A 5-minute interval keeps the stale-version check while staying far below
// that rate; on-load + visibility/focus checks catch the common cases at once.

function parseVersionParts(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .trim()
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

/** True when `live` (e.g. '24.15.0' from /version.json) is newer than the
    loaded bundle's CURRENT_VERSION (e.g. 'v24.14'). Handles the 'v' prefix
    and 2- vs 3-part versions. */
function isNewerVersion(live: string, current: string): boolean {
  const a = parseVersionParts(live);
  const b = parseVersionParts(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // v24.15 re-audit (G5): the version check lives OUTSIDE the registration
    // .then() — before, a failed registration meant no version check at all.
    // registration.update() is skipped when there is no registration; the
    // /version.json fetch still runs, and the prompt still tells the user a
    // new version exists (a plain refresh then loads it, since no worker
    // controls the page).
    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = async () => {
      try {
        if (registration) await registration.update();
      } catch {}
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const live = String(data?.version || '').trim();
        if (live && isNewerVersion(live, CURRENT_VERSION)) {
          window.dispatchEvent(
            new CustomEvent('sssps_new_version', { detail: { version: live } })
          );
        }
      } catch {}
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        (window as any).__swReg = reg;
        console.log('Custom SW registered: ', registration);
        // Check for a newer bundle at once (registration resolved).
        checkForUpdate();
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
        // Still check the live version — the prompt is the safety net even
        // when no worker is running.
        checkForUpdate();
      });

    // Check for a newer bundle: ask the SW for an update AND compare
    // the live /version.json against this bundle's version. When the
    // live version is newer, the VersionUpdateModal prompts the user.
    // Runs on load (via the register callbacks above), every 5 minutes,
    // and whenever the tab becomes visible again (visibilitychange / focus).
    const intervalId = window.setInterval(checkForUpdate, 300000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkForUpdate);
    // (interval/listeners live for the page lifetime; no cleanup needed)
    void intervalId;
  });

  // A new service worker taking control means a new bundle is live — reload
  // so the user runs it. Guarded so a flapping controller can't loop.
  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(<App />);
