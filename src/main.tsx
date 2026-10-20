import { createRoot } from 'react-dom/client';
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
