import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Service Worker ကို လုံးဝ ပိတ်ထားသည် (Zombie SW ကို ရှင်းဖို့)
createRoot(document.getElementById('root')!).render(<App />);
