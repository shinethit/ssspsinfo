// D:\ssspsinfo-main\apply-v21.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 စတင်ဆောင်ရွက်နေပါသည်...');

// 1. constants.ts တွင် Version ကို v21.0 သို့ မြှင့်တင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.0';");
fs.writeFileSync(constantsPath, constantsContent);
console.log('✅ constants.ts တွင် Version ကို v21.0 သို့ မြှင့်တင်ပြီးပါပြီ။');

// 2. versions.ts တွင် Change Log အသစ် ထည့်သွင်းခြင်း
const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');

// v20.0 ကို isLatest: false အဖြစ် ပြောင်းခြင်း
versionsContent = versionsContent.replace(/(version: 'v20\.0',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

// v21.0 Change Log အသစ် ထည့်ခြင်း
const newLog = `  {
    version: 'v21.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Performance Optimization & Lazy Loading',
    changes: [
      { type: 'improve', text: 'App ၏ performance ကို မြှင့်တင်ရန် Lazy Loading (Code Splitting) စနစ် ထည့်သွင်းခြင်း' },
      { type: 'fix', text: 'စာမျက်နှာများ ကူးပြောင်းရာတွင် ထစ်နေခြင်း (Lagging) ပြဿနာကို ဖြေရှင်းခြင်း' },
      { type: 'fix', text: 'Service Worker Cache Version ကို v2 သို့ မြှင့်တင်ပြီး Cache အဟောင်းများကို ရှင်းလင်းခြင်း' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ versions.ts တွင် v21.0 Change Log အသစ် ထည့်သွင်းပြီးပါပြီ။');

// 3. Build လုပ်ပြီး Error စစ်ဆေးခြင်း (Rule 4)
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 4. Commit နှင့် Push လုပ်ခြင်း (Rule 4)
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "perf: implement lazy loading, bump version to v21.0 and update changelog"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 5. မလိုအပ်တဲ့ ဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  // PowerShell command ဖြင့် ဖျက်ခြင်း (ကိုယ်တိုင်ပါ ပါဝင်သည်)
  execSync('powershell -Command "Remove-Item -Path \'apply-v21.cjs\', \'fix-lag-app.cjs\', \'fix-sw.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}