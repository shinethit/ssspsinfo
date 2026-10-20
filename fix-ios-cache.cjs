const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 iOS Cache Fix စတင်နေပါပြီ...");

try {
  // ၁။ _headers ဖိုင် (ဘေးကင်းသော Version) ကို ပြန်ဖန်တီးမယ်
  const headersPath = path.join(__dirname, 'public', '_headers');
  const headersContent = `/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0

/index.html
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
`;
  fs.writeFileSync(headersPath, headersContent, 'utf8');
  console.log("✅ public/_headers ကို Cache Bypass အနေနဲ့ ပြန်ဖန်တီးပြီးပါပြီ။");

  // ၂။ vite.config.ts ကို ပုံမှန် PWA + Force Update ပုံစံ ပြန်ပြောင်းမယ်
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // selfDestroying ကို ဖြုတ်မယ်
  viteConfig = viteConfig.replace(/selfDestroying:\s*true,?/, '');
  
  // workbox ထဲမှာ skipWaiting နဲ့ clientsClaim ထည့်မယ်
  if (!viteConfig.includes('skipWaiting')) {
    viteConfig = viteConfig.replace(
      /workbox:\s*\{/,
      `workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,`
    );
  }
  fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
  console.log("✅ vite.config.ts တွင် Force Update ကုဒ်များ ပြန်ထည့်ပြီးပါပြီ။");

  // ၃။ main.tsx ကို registerSW ပြန်ထည့်မယ် (immediate: true နဲ့)
  const mainTsxContent = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
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
  console.log("✅ main.tsx တွင် registerSW ကို ပြန်ထည့်ပြီးပါပြီ။");

  // ၄။ Version အသစ် v19.4 တင်မယ်
  const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
  let versionsContent = fs.readFileSync(versionsPath, 'utf8');
  versionsContent = versionsContent.replace(/isLatest:\s*true/g, 'isLatest: false');

  const newVersionString = `{
    version: 'v19.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'iOS Cache Bypass & Normal PWA Restore',
    changes: [
      { type: 'fix', text: 'iOS Safari တွင် sw.js ကို Cache မလုပ်စေရန် _headers ဖိုင်အား ဘေးကင်းစွာ ပြန်လည်ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'PWA စနစ်အား Force Update (skipWaiting + clientsClaim) ဖြင့် ပုံမှန်အတိုင်း ပြန်လည်ထူထောင်ခြင်း' }
    ],
  },`;

  versionsContent = versionsContent.replace(
    /export const VERSIONS: VersionItem\[\] = \[/,
    `export const VERSIONS: VersionItem[] = [\n  ${newVersionString}`
  );
  fs.writeFileSync(versionsPath, versionsContent, 'utf8');
  console.log("✅ versions.ts တွင် v19.4 ထည့်ပြီးပါပြီ။\n");

  // ၅။ Auto-Testing
  console.log("🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\n✅ စမ်းသပ်မှု အောင်မြင်ပါသည်။\n");

  // ၆။ Auto-Push
  console.log("🚀 GitHub သို့ အလိုအလျောက် တင်နေပါသည်...");
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix: add safe _headers to bypass iOS sw.js cache and restore PWA"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("\n🎉 အားလုံး ပြီးပါပြီ။");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ အနီရောင်စာသားကို ကြည့်ပါ။");
  process.exit(1);
}