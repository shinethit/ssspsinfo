const fs = require('fs');
const path = require('path');

console.log("🚀 စတင်ပြင်ဆင်နေပါသည်...");

// 1. main.tsx ကို ရိုးရိုးရှင်းရှင်း ပြန်ပြောင်းခြင်း
const mainTsxContent = `import { createRoot } from 'react-dom/client';
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
`;

fs.writeFileSync(path.join(__dirname, 'src', 'main.tsx'), mainTsxContent, 'utf8');
console.log("✅ main.tsx ကို ရိုးရိုးရှင်းရှင်း ပြင်ဆင်ပြီးပါပြီ။");

// 2. versions.ts တွင် v19.0 (သို့) အသစ်ဆုံး Version ထည့်ခြင်း
let versionsContent = fs.readFileSync(path.join(__dirname, 'src', 'data', 'versions.ts'), 'utf8');

// အရင်က ရှိခဲ့တဲ့ isLatest များကို false ပြောင်းခြင်း
versionsContent = versionsContent.replace(/isLatest:\s*true/g, 'isLatest: false');

const newVersionString = `{
    version: 'v19.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Emergency PWA Core Fix & iOS/Windows Compatibility',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် Error တက်စေသော _headers ဖိုင်အား လုံးဝ ဖယ်ရှားခြင်း' },
      { type: 'fix', text: 'main.tsx ရှိ Force Reload (Self-healing) ကုဒ်များအား ဖယ်ရှားပြီး မူလ Vite PWA AutoUpdate စနစ်အတိုင်း ပြန်လည်ထားရှိခြင်း' },
      { type: 'improve', text: 'Version များကို စနစ်တကျ ပြန်လည်သတ်မှတ်ပြီး တည်ငြိမ်မှုရှိစေရန် ပြင်ဆင်ခြင်း' }
    ],
  },`;

versionsContent = versionsContent.replace(
  /export const VERSIONS: VersionItem\[\] = \[/,
  `export const VERSIONS: VersionItem[] = [\n  ${newVersionString}`
);

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'versions.ts'), versionsContent, 'utf8');
console.log("✅ versions.ts တွင် v19.0 Changelog ထည့်သွင်းပြီးပါပြီ။");

console.log("🎉 အားလုံး ပြင်ဆင်ပြီးပါပြီ။ ယခု 'npm run build' ဖြင့် စမ်းသပ်နိုင်ပါပြီ။");