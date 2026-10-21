// D:\ssspsinfo-main\add-export-finance.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း မှတ်တမ်းအားလုံးကို Excel ထုတ်ယူနိုင်မည့် စနစ် ထည့်သွင်းနေပါသည်...');

const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

// 1. Import များ ထည့်သွင်းခြင်း (XLSX နှင့် Download icon)
if (!financeContent.includes("import * as XLSX")) {
  financeContent = financeContent.replace(
    "import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin } from 'lucide-react';",
    "import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin, Download } from 'lucide-react';\nimport * as XLSX from 'xlsx';"
  );
}

// 2. Excel ထုတ်ပေးမည့် Function ထည့်သွင်းခြင်း
const exportFunction = `
  const handleExportAllTransactions = () => {
    if (transactions.length === 0) {
      toast.info('ထုတ်ယူရန် မှတ်တမ်း မရှိသေးပါ');
      return;
    }

    const wsData = transactions.map((t, index) => ({
      'စဉ် (No)': index + 1,
      'ကျောင်းအမည် (School Name)': t.schoolName,
      'ကြေးအမျိုးအစား (Fee Type)': t.feeType,
      'ပမာဏ (Amount)': t.amount,
      'ရက်စွဲ (Date)': t.paidDate,
      'မှတ်ချက် (Note)': t.note || '',
      'မှတ်တမ်းတင်သူ (Recorded By)': t.recordedBy || 'Admin'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    
    // Column တွေရဲ့ အကျယ်ကို ချိန်ညှိခြင်း
    ws['!cols'] = [
      { wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finance_Records');
    
    const fileName = \`Finance_Records_\${new Date().toISOString().split('T')[0]}.xlsx\`;
    XLSX.writeFile(wb, fileName);
    toast.success('မှတ်တမ်းအားလုံးကို Excel ဖိုင်အဖြစ် အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ');
  };
`;

if (!financeContent.includes('handleExportAllTransactions')) {
  financeContent = financeContent.replace(
    "const filteredSchools = schools.filter(s => {",
    exportFunction + "\n  const filteredSchools = schools.filter(s => {"
  );
}

// 3. Transaction History Header တွင် Export ခလုတ် ထည့်သွင်းခြင်း
const oldHeader = `<h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" /> 
              {selectedSchool ? \`\${selectedSchool.name} ၏ မှတ်တမ်းများ\` : 'ကျောင်းတစ်ခုကို ရွေးချယ်ပါ'}
            </h3>`;

const newHeader = `<div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" /> 
                {selectedSchool ? \`\${selectedSchool.name} ၏ မှတ်တမ်းများ\` : 'ကျောင်းတစ်ခုကို ရွေးချယ်ပါ'}
              </h3>
              <button 
                onClick={handleExportAllTransactions}
                className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="မှတ်တမ်းအားလုံးကို Excel ဖြင့် ထုတ်ယူရန်"
              >
                <Download className="w-3.5 h-3.5" /> Export All
              </button>
            </div>`;

if (financeContent.includes(oldHeader)) {
  financeContent = financeContent.replace(oldHeader, newHeader);
  fs.writeFileSync(financePath, financeContent);
  console.log('✅ AdminFinanceManager.tsx တွင် Excel Export စနစ် ထည့်သွင်းပြီးပါပြီ။');
} else {
  console.log('⚠️ Header ကုဒ်ကို ရှာမတွေ့ပါ။ ဖိုင်ကို ကိုယ်တိုင်စစ်ဆေးပါ။');
}

// 4. constants.ts တွင် Version ကို v21.4 သို့ မြှင့်တင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.4';");
fs.writeFileSync(constantsPath, constantsContent);
console.log('✅ constants.ts တွင် Version ကို v21.4 သို့ မြှင့်တင်ပြီးပါပြီ။');

// 5. versions.ts တွင် Change Log အသစ် ထည့်သွင်းခြင်း
const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');

versionsContent = versionsContent.replace(/(version: 'v21\.3',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Finance Export Feature',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း မှတ်တမ်းအားလုံးကို တစ်ခါတည်း Excel ဖိုင်အဖြစ် ထုတ်ယူနိုင်သည့် Export All စနစ် ထည့်သွင်းခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ versions.ts တွင် v21.4 Change Log အသစ် ထည့်သွင်းပြီးပါပြီ။');

// 6. Build လုပ်ပြီး Error စစ်ဆေးခြင်း (Rule 4)
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 7. Commit နှင့် Push လုပ်ခြင်း (Rule 4)
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat(finance): add export all transactions to Excel feature"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 8. မလိုအပ်တဲ့ ဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းခြင်း (Rule 5)
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'add-export-finance.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}