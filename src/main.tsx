import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// ═══════════════════════════════════════════════
// PWA Auto-Update
// ═══════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // Reload ONLY when a new SW takes control
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

      // Check ONLY once on page load (No setInterval to avoid CF Rate Limit)
      try {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (e) {}
    } catch (err) {
      console.error('[PWA] SW init error:', err);
    }
  });
}
