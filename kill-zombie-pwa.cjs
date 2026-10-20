const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Zombie Service Worker ကို သတ်ဖြတ်ဖို့ ပြင်ဆင်နေပါသည်...");

try {
  // ၁။ vite.config.ts မှာ selfDestroying: true ထည့်မယ်
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  // VitePWA config ထဲကို selfDestroying ထည့်ခြင်း
  if (!viteConfig.includes('selfDestroying')) {
    viteConfig = viteConfig.replace(
      /registerType:\s*'autoUpdate',/,
      `registerType: 'autoUpdate',\n        selfDestroying: true,`
    );
    fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
    console.log("✅ vite.config.ts တွင် selfDestroying: true ထည့်ပြီးပါပြီ။");
  }

  // ၂။ main.tsx မှ registerSW ကို ဖြုတ်မယ် (ဒါမှ SW အသစ် မလာဘဲ ကိုယ့်ကိုယ်ကိုယ် ဖျက်တဲ့ SW ပဲ အလုပ်လုပ်မှာ)
  const mainTsxContent = `import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Service Worker ကို လုံးဝ ပိတ်ထားသည် (Zombie SW ကို ရှင်းဖို့)
createRoot(document.getElementById('root')!).render(<App />);
`;
  fs.writeFileSync(path.join(__dirname, 'src', 'main.tsx'), mainTsxContent, 'utf8');
  console.log("✅ main.tsx မှ registerSW ကို ဖယ်ရှားပြီးပါပြီ။");

  // ၃။ Version အသစ်တင်မယ်
  const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
  let versionsContent = fs.readFileSync(versionsPath, 'utf8');
  versionsContent = versionsContent.replace(/isLatest:\s*true/g, 'isLatest: false');

  const newVersionString = `{
    version: 'v19.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Zombie Service Worker Killer (Force Reset)',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် ပိတ်မိနေသော Service Worker များကို ကိုယ်တိုင် ဖျက်ဆီးပစ်သည့် Self-Destructing SW စနစ် ထည့်သွင်းခြင်း' }
    ],
  },`;

  versionsContent = versionsContent.replace(
    /export const VERSIONS: VersionItem\[\] = \[/,
    `export const VERSIONS: VersionItem[] = [\n  ${newVersionString}`
  );
  fs.writeFileSync(versionsPath, versionsContent, 'utf8');
  console.log("✅ versions.ts တွင် v19.3 (Zombie Killer) ထည့်ပြီးပါပြီ။\n");

  // ၄။ Auto-Testing
  console.log("🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\n✅ စမ်းသပ်မှု အောင်မြင်ပါသည်။\n");

  // ၅။ Auto-Push
  console.log("🚀 GitHub သို့ အလိုအလျောက် တင်နေပါသည်...");
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix: deploy self-destructing service worker to kill zombie SW on iOS/Windows"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("\n🎉 အားလုံး ပြီးပါပြီ။ ခင်ဗျား ဘာမှ ထပ်လုပ်စရာ မလိုပါဘူး။");
  console.log("Cloudflare Deploy ဖြစ်သွားတာနဲ့ iOS/Windows မှာ ဆိုက်ကို ဖွင့်ကြည့်ပါ။ (တစ်ခါ Error ပြတယ်ဆိုရင် နောက်တစ်ခါ Refresh လုပ်ကြည့်ပါ။ SW အသစ်က အလုပ်လုပ်ပြီး အဟောင်းကို ဖျက်ပေးသွားပါလိမ့်မယ်)");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ (အပေါ်က အနီရောင်စာသားကို ကြည့်ပါ)");
  process.exit(1);
}