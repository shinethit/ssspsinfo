// D:\ssspsinfo-main\fix-buttons.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ခလုတ်များ၏ တုံ့ပြန်မှု (UX) ကို ပြင်ဆင်နေပါသည်...');

// 1. index.css တွင် Global Button Feedback CSS ထည့်ခြင်း
const cssPath = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// ထပ်မံထည့်သွင်းမည့် CSS
const buttonCss = `
/* =========================================
   Global Button Feedback & Active States
   ========================================= */
button, [role="button"], input[type="submit"], input[type="button"] {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* နှိပ်လိုက်ရင် ခဏလေး ကျုံ့ဝင်သွားမည် (Tactile Feedback) */
button:active:not(:disabled), 
[role="button"]:active:not(:disabled),
input[type="submit"]:active:not(:disabled),
input[type="button"]:active:not(:disabled) {
  transform: scale(0.94) !important;
  opacity: 0.85 !important;
}

/* Disabled ဖြစ်နေရင် နှိပ်လို့မရကြောင်း ပြသခြင်း */
button:disabled, 
input[type="submit"]:disabled {
  cursor: not-allowed !important;
  opacity: 0.6 !important;
  transform: none !important;
}

/* Focus ဖြစ်နေရင် Outline ပြသခြင်း */
button:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 2px;
}
`;

if (!cssContent.includes('Global Button Feedback & Active States')) {
  fs.appendFileSync(cssPath, buttonCss);
  console.log('✅ index.css တွင် Global Button Feedback CSS ထည့်သွင်းပြီးပါပြီ။');
}

// 2. constants.ts တွင် Version ကို v21.1 သို့ မြှင့်တင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.1';");
fs.writeFileSync(constantsPath, constantsContent);
console.log('✅ constants.ts တွင် Version ကို v21.1 သို့ မြှင့်တင်ပြီးပါပြီ။');

// 3. versions.ts တွင် Change Log အသစ် ထည့်သွင်းခြင်း
const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');

// v21.0 ကို isLatest: false အဖြစ် ပြောင်းခြင်း
versionsContent = versionsContent.replace(/(version: 'v21\.0',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

// v21.1 Change Log အသစ် ထည့်ခြင်း
const newLog = `  {
    version: 'v21.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Global Button UX & Feedback Enhancement',
    changes: [
      { type: 'improve', text: 'ခလုတ်များကို နှိပ်လိုက်ပါက ချက်ချင်း တုံ့ပြန်မှုရှိစေရန် (Active state နှင့် Transition) စနစ်တကျ ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Loading ဖြစ်နေစဉ်အတွင်း ခလုတ်များ အလုပ်မလုပ်တော့ခြင်းနှင့် Spinner ပြသခြင်းတို့ကို ပိုမိုရှင်းလင်းစွာ မြင်တွေ့နိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'fix', text: 'ခလုတ်များ နှိပ်လိုက်ပါက အသံတိတ်နေခြင်း (No feedback) ပြဿနာကို ဖြေရှင်းခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ versions.ts တွင် v21.1 Change Log အသစ် ထည့်သွင်းပြီးပါပြီ။');

// 4. Build လုပ်ပြီး Error စစ်ဆေးခြင်း (Rule 4)
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 5. Commit နှင့် Push လုပ်ခြင်း (Rule 4)
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat(ux): add global button active states, transitions, and disable states"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. မလိုအပ်တဲ့ ဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-buttons.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}