const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) return '';
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }
function safeReplace(content, find, replace, label) {
  if (!content.includes(find)) throw new Error(`[${label}] Pattern not found`);
  return content.replace(find, replace);
}

console.log('\n🚀 Fixing PWA Registration & Auto-Update (v15.5)\n');

// 1) main.tsx — PWA register ကို မှန်ကန်စွာ ပြန်ထည့်ခြင်း
console.log('\n📝 src/main.tsx');
write('src/main.tsx', `/// <reference types="vite-plugin-pwa/client" />
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
`);

// 2) constants.ts -> v15.5
console.log('\n📝 src/constants.ts -> v15.5');
let C = read('src/constants.ts');
C = C.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.5'");
write('src/constants.ts', C);

// 3) versions.ts -> v15.5
console.log('\n📝 src/data/versions.ts -> v15.5 entry');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.5'")) {
  V = safeReplace(V,
    `version: 'v15.4',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `version: 'v15.4',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`,
    'Demote v15.4'
  );
  V = safeReplace(V,
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'PWA Auto Update စနစ် အပြည့်အစုံ ပြန်လည်ထည့်သွင်းခြင်း',
    changes: [
      { type: 'fix', text: 'PWA စနစ် (App ကဲ့သို့ သွင်းယူနိုင်ခြင်း) ပြန်လည်အလုပ်လုပ်နိုင်ရန် Service Worker အား မှန်ကန်စွာ ပြန်လည်မှတ်ပုံတင်ခြင်း' },
      { type: 'feat', text: 'App ဖွင့်ဖွင့်ချင်း Cloud နှင့် Local Version ကို အလိုအလျောက် တိုက်စစ်ပြီး Version အသစ်ရှိပါက ချက်ချင်း Update ဖြစ်စေခြင်း' },
    ],
  },`,
    'Add v15.5'
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE\n');