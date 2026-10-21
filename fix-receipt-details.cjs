// D:\ssspsinfo-main\fix-receipt-details.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ဖြတ်ပိုင်း အချက်အလက်များ (ပညာသင်နှစ်၊ ကျောင်းသားဦးရေ၊ ရက်စွဲ) ပြင်ဆင်နေပါသည်...');

// 1. SchoolForm.tsx တွင် ပညာသင်နှစ် (Academic Year) အကွက် ထည့်ခြင်း
const schoolFormPath = path.join(__dirname, 'src', 'components', 'admin', 'SchoolForm.tsx');
let schoolFormContent = fs.readFileSync(schoolFormPath, 'utf8');

const oldDateBlock = `<div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">သွင်းသည့် ရက်စွဲ (Payment Date)</label>
                <input type="date" {...schoolForm.register('feePaidDate')} className="w-full p-2 border rounded-lg text-sm bg-white" />
              </div>`;

const newDateBlock = `<div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">ပညာသင်နှစ် (Academic Year)</label>
                  <input type="text" {...schoolForm.register('feeAcademicYear')} placeholder="ဥပမာ - ၂၀၂၄-၂၀၂၅" className="w-full p-2 border rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">သွင်းသည့် ရက်စွဲ (Payment Date)</label>
                  <input type="date" {...schoolForm.register('feePaidDate')} className="w-full p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>`;

if (schoolFormContent.includes(oldDateBlock)) {
  schoolFormContent = schoolFormContent.replace(oldDateBlock, newDateBlock);
  fs.writeFileSync(schoolFormPath, schoolFormContent);
  console.log('✅ SchoolForm.tsx တွင် ပညာသင်နှစ် ထည့်သွင်းနိုင်သည့် အကွက် ထည့်ပြီးပါပြီ။');
}

// 2. AnnualFeeReceipt.tsx တွင် ကျောင်းသားဦးရေ ထည့်ခြင်းနှင့် စာသားပြောင်းခြင်း
const annualReceiptPath = path.join(__dirname, 'src', 'components', 'admin', 'AnnualFeeReceipt.tsx');
let annualReceiptContent = fs.readFileSync(annualReceiptPath, 'utf8');

// ကျောင်းသားဦးရေ ထည့်ခြင်း
const oldSchoolInfo = `<div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                    <span className="font-bold text-base">{school.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအဆင့် / ဇုန်:</span>
                    <span className="font-bold">{school.level} {school.zone ? \`(\${school.zone})\` : ''}</span>
                  </div>
                </div>`;

const newSchoolInfo = `<div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                    <span className="font-bold text-base">{school.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအဆင့် / ဇုန်:</span>
                    <span className="font-bold">{school.level} {school.zone ? \`(\${school.zone})\` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းသားဦးရေ (Range):</span>
                    <span className="font-bold">{school.studentRange || 'မသတ်မှတ်ထားပါ'} {school.studentCount ? \`(\${school.studentCount} ဦး)\` : ''}</span>
                  </div>
                </div>`;

if (annualReceiptContent.includes(oldSchoolInfo)) {
  annualReceiptContent = annualReceiptContent.replace(oldSchoolInfo, newSchoolInfo);
}

// ငွေကိုင်ဌာန -> ဘဏ္ဍာရေးမှူး ပြောင်းခြင်း
annualReceiptContent = annualReceiptContent.replace('<span className="text-xs text-slate-500 font-semibold">ငွေကိုင်ဌာန</span>', '<span className="text-xs text-slate-500 font-semibold">ဘဏ္ဍာရေးမှူး</span>');

fs.writeFileSync(annualReceiptPath, annualReceiptContent);
console.log('✅ AnnualFeeReceipt.tsx တွင် ကျောင်းသားဦးရေနှင့် ဘဏ္ဍာရေးမှူး စာသား ပြင်ဆင်ပြီးပါပြီ။');

// 3. Receipt.tsx တွင် ငွေကိုင်ဌာန -> ဘဏ္ဍာရေးမှူး ပြောင်းခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');
receiptContent = receiptContent.replace('<span className="text-xs text-slate-500 font-semibold">ငွေကိုင်ဌာန</span>', '<span className="text-xs text-slate-500 font-semibold">ဘဏ္ဍာရေးမှူး</span>');
fs.writeFileSync(receiptPath, receiptContent);
console.log('✅ Receipt.tsx တွင် ဘဏ္ဍာရေးမှူး စာသား ပြင်ဆင်ပြီးပါပြီ။');

// 4. Version & Change Log ပြင်ဆင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.9';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.8',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Receipt Details Update',
    changes: [
      { type: 'improve', text: 'ကျောင်းအချက်အလက် ပြင်ဆင်သည့်နေရာတွင် ပညာသင်နှစ် (Academic Year) ထည့်သွင်းနိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'နှစ်စဉ်ကြေး ဖြတ်ပိုင်းတွင် ကျောင်းသားဦးရေ (Range) ကို ထည့်သွင်းပြသခြင်း။' },
      { type: 'improve', text: '"ငွေကိုင်ဌာန" နေရာတွင် "ဘဏ္ဍာရေးမှူး" ဟု ပြောင်းလဲပြသခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v21.9 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 5. Build & Push
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: add academic year to form, show student range on receipt, rename cashier to finance officer"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. PowerShell ဖြင့် ရှင်းလင်းခြင်း
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-receipt-details.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}