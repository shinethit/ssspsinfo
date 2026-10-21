// D:\ssspsinfo-main\fix-finance-fees.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း ကြေးအမျိုးအစားများနှင့် စာလုံးပေါင်းမှားများကို ပြင်ဆင်နေပါသည်...');

// 1. AdminFinanceManager.tsx ကို ပြင်ဆင်ခြင်း (နှစ်စဉ်ကြေးထည့်ခြင်းနှင့် စာလုံးပေါင်းပြင်ခြင်း)
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

const oldOptions = `<option value="အားကစားကြေး (Sports Fee)">အားကစားကြေး (Sports Fee)</option>
                    <option value="သင်တန်းကြေး (Training Fee)">သင်တန်းကြေး (Training Fee)</option>
                    <option value="အခြားကြေး (Other Fee)">အခြေး/အခြားကြေး (Other Fee)</option>`;

const newOptions = `<option value="နှစ်စဉ်ကြေး (Annual Fee)">နှစ်စဉ်ကြေး (Annual Fee)</option>
                    <option value="အားကစားကြေး (Sports Fee)">အားကစားကြေး (Sports Fee)</option>
                    <option value="သင်တန်းကြေး (Training Fee)">သင်တန်းကြေး (Training Fee)</option>
                    <option value="အခြားကြေး (Other Fee)">အခြားကြေး (Other Fee)</option>`;

if (financeContent.includes(oldOptions)) {
  financeContent = financeContent.replace(oldOptions, newOptions);
  fs.writeFileSync(financePath, financeContent);
  console.log('✅ AdminFinanceManager.tsx တွင် နှစ်စဉ်ကြေး ထည့်သွင်းပြီး စာလုံးပေါင်းမှားကို ပြင်ဆင်ပြီးပါပြီ။');
} else {
  console.log('⚠️ ပြင်ဆင်ရန် ကုဒ်ကို ရှာမတွေ့ပါ။ ဖိုင်ထဲတွင် ကိုယ်တိုင်စစ်ဆေးပါ။');
}

// 2. constants.ts တွင် Version ကို v21.3 သို့ မြှင့်တင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.3';");
fs.writeFileSync(constantsPath, constantsContent);
console.log('✅ constants.ts တွင် Version ကို v21.3 သို့ မြှင့်တင်ပြီးပါပြီ။');

// 3. versions.ts တွင် Change Log အသစ် ထည့်သွင်းခြင်း
const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');

// v21.2 ကို isLatest: false အဖြစ် ပြောင်းခြင်း
versionsContent = versionsContent.replace(/(version: 'v21\.2',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

// v21.3 Change Log အသစ် ထည့်ခြင်း
const newLog = `  {
    version: 'v21.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Finance Update: Annual Fee & Spelling Fix',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း ထည့်သွင်းရာတွင် နှစ်စဉ်ကြေး (Annual Fee) ကို Certificate/Voucher ထုတ်ပေးနိုင်ရန် ထည့်သွင်းပေးခြင်း။' },
      { type: 'fix', text: '"အခြေး/အခြားကြေး" ဟု စာလုံးပေါင်းမှားနေခြင်းကို "အခြားကြေး (Other Fee)" ဟု ပြင်ဆင်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ versions.ts တွင် v21.3 Change Log အသစ် ထည့်သွင်းပြီးပါပြီ။');

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
  execSync('git commit -m "feat(finance): add annual fee option and fix spelling for other fee"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. မလိုအပ်တဲ့ ဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-finance-fees.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}