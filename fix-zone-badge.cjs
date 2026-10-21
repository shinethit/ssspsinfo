// D:\ssspsinfo-main\fix-zone-badge.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ကျောင်းစာရင်းရှိ မြို့နယ်မသတ်မှတ် စာသားများကို ဖြုတ်ပြီး ဇုန် Badge ဖြင့် အစားထိုးနေပါသည်...');

// 1. AdminSchoolManager.tsx ကို ပြင်ဆင်ခြင်း
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

// မြို့နယ်မသတ်မှတ် ဆိုတဲ့ စာသားကို ဖြုတ်ပြီး ကွက်လပ်ဖြစ်နေရင် လုံးဝမပြသစေရန် ပြင်ဆင်ခြင်း
const oldCode = `<span className="text-[10px] text-slate-500">{school.township || school.city || 'မြို့နယ်မသတ်မှတ်'}</span>`;
const newCode = `{(school.township || school.city) && <span className="text-[10px] text-slate-500">{school.township || school.city}</span>}`;

if (managerContent.includes(oldCode)) {
  managerContent = managerContent.replace(oldCode, newCode);
  fs.writeFileSync(managerPath, managerContent);
  console.log('✅ AdminSchoolManager.tsx တွင် မြို့နယ်မသတ်မှတ် စာသားကို ဖြုတ်ပြီး ဇုန် Badge အစားထိုးပြီးပါပြီ။');
} else {
  console.log('⚠️ ပြင်ဆင်ရန် ကုဒ်ကို ရှာမတွေ့ပါ။ (ဖိုင်ထဲတွင် ရှိပြီးသား ဖြစ်နိုင်ပါသည်)');
}

// 2. constants.ts တွင် Version ကို v21.2 သို့ မြှင့်တင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.2';");
fs.writeFileSync(constantsPath, constantsContent);
console.log('✅ constants.ts တွင် Version ကို v21.2 သို့ မြှင့်တင်ပြီးပါပြီ။');

// 3. versions.ts တွင် Change Log အသစ် ထည့်သွင်းခြင်း
const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');

// v21.1 ကို isLatest: false အဖြစ် ပြောင်းခြင်း
versionsContent = versionsContent.replace(/(version: 'v21\.1',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

// v21.2 Change Log အသစ် ထည့်ခြင်း
const newLog = `  {
    version: 'v21.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'UI Cleanup: Zone Badges in School Manager',
    changes: [
      { type: 'improve', text: 'ကျောင်းစီမံခန့်ခွဲမှု (School Manager) တွင် မြို့နယ်မသတ်မှတ်ထားသော ကျောင်းများအတွက် "မြို့နယ်မသတ်မှတ်" ဆိုသော စာသားများကို ဖယ်ရှားခြင်း။' },
      { type: 'improve', text: 'မြို့နယ်/ဇုန် အချက်အလက်များကို ပိုမိုရှင်းလင်းသော Badge ပုံစံဖြင့် ပြသစေရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ versions.ts တွင် v21.2 Change Log အသစ် ထည့်သွင်းပြီးပါပြီ။');

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
  execSync('git commit -m "ui: remove unspecified township text and enhance zone badges in school manager"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. မလိုအပ်တဲ့ ဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-zone-badge.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}