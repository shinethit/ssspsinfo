import { createRoot } from 'react-dom/client';
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
