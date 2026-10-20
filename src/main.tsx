/// <reference types="vite-plugin-pwa/client" />
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// PWA Service Worker Registration & Auto Update
const updateSW = registerSW({
  onNeedRefresh() {
    // Cloud မှာ Version အသစ်တွေ့ရင် အလိုအလျောက် Update လုပ်ပြီး Reload လုပ်မယ်
    console.log('[PWA] New update found, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
