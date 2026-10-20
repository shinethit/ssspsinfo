const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 စတင်ပြင်ဆင်နေပါသည်...");

// 1. main.tsx ကို ရိုးရိုးရှင်းရှင်း ပြန်ပြောင်းခြင်း
const mainTsxContent = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

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
console.log("✅ src/main.tsx ကို ရိုးရိုးရှင်းရှင်း ပြင်ဆင်ပြီးပါပြီ။");

// 2. versions.ts တွင် v19.0 Changelog ထည့်ခြင်း
let versionsContent = fs.readFileSync(path.join(__dirname, 'src', 'data', 'versions.ts'), 'utf8');
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
console.log("✅ src/data/versions.ts တွင် v19.0 Changelog ထည့်သွင်းပြီးပါပြီ။\n");

// 3. Auto-Testing (Rule 5 & 8)
console.log("🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ... (ခဏစောင့်ပါ)");
try {
  console.log("▶ TypeScript စစ်ဆေးနေသည် (npx tsc --noEmit)...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  
  console.log("\n▶ Build လုပ်နေသည် (npm run build)...");
  execSync('npm run build', { stdio: 'inherit' });

  console.log("\n✅ စမ်းသပ်မှုအားလုံး အောင်မြင်ပါသည်။ Error လုံးဝ မရှိပါ။");
  console.log("🎉 ယခု GitHub သို့ တင်နိုင်ပါပြီ။");
  console.log("\n--- အောက်ပါ Command များကို Run ပါ ---");
  console.log("git add .");
  console.log('git commit -m "fix: remove _headers and simplify PWA for iOS/Windows stability (v19.0)"');
  console.log("git push origin main");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ အပေါ်က အနီရောင်စာသားကို ကြည့်ပြီး ကျွန်တော့်ကို ပြန်ပို့ပေးပါ။");
  process.exit(1);
}