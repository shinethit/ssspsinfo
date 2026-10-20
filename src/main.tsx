/// <reference types="vite-plugin-pwa/client" />
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
