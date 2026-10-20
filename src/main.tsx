import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// မူလ Vite PWA AutoUpdate စနစ်အတိုင်း ပြန်ထားပြီးသား
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
