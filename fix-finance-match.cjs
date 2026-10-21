// D:\ssspsinfo-main\fix-finance-match.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း UI ကို ကိုက်ညီအောင် ပြင်ဆင်နေပါသည်...');

// 1. html2canvas ကို install လုပ်ခြင်း (PDF/JPEG ထုတ်ရန်)
try {
  console.log('📦 html2canvas ကို install လုပ်နေပါသည်...');
  execSync('npm install html2canvas', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ html2canvas install မအောင်မြင်ပါ။');
  process.exit(1);
}

// 2. Receipt.tsx ကို PDF/JPEG ထုတ်နိုင်အောင် ပြင်ဆင်ခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');

if (!receiptContent.includes("import html2canvas")) {
  receiptContent = receiptContent.replace(
    "import { Printer, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';",
    "import { Printer, ArrowLeft, CheckCircle2, Loader2, Download } from 'lucide-react';\nimport html2canvas from 'html2canvas';\nimport jsPDF from 'jspdf';\nimport { toast } from 'sonner';\nimport { useRef } from 'react';"
  );
}

if (!receiptContent.includes("handleDownload")) {
  receiptContent = receiptContent.replace(
    "const handlePrint = () => {",
    `
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (format: 'pdf' | 'jpeg') => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      if (format === 'jpeg') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = \`Receipt_\${transaction.schoolName}_\${transaction.id.substring(0,4)}.jpeg\`;
        link.click();
        toast.success('JPEG ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(\`Receipt_\${transaction.schoolName}_\${transaction.id.substring(0,4)}.pdf\`);
        toast.success('PDF ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      }
    } catch (err) {
      toast.error('ဖိုင်ထုတ်ယူရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handlePrint = () => {`
  );

  const oldBtn = `<button onClick={handlePrint} className="bg-sky-900 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>`;
  const newBtn = `<div className="flex items-center gap-2">
          <button onClick={() => handleDownload('jpeg')} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5">
            <Download className="w-4 h-4" /> JPEG
          </button>
          <button onClick={() => handleDownload('pdf')} className="bg-sky-100 text-sky-800 hover:bg-sky-200 px-3 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>`;
  
  receiptContent = receiptContent.replace(oldBtn, newBtn);

  receiptContent = receiptContent.replace(
    `<div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">`,
    `<div ref={receiptRef} className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">`
  );
}
fs.writeFileSync(receiptPath, receiptContent);
console.log('✅ Receipt.tsx တွင် PDF/JPEG ထုတ်ယူနိုင်သည့် စနစ် ထည့်သွင်းပြီးပါပြီ။');


// 3. AdminFinanceManager.tsx တွင် နှစ်စဉ်ကြေးကို မှတ်တမ်းအနေဖြင့် ပြသခြင်းနှင့် ရက်စွဲထည့်ခြင်း
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

if (!financeContent.includes("AnnualFeeReceipt")) {
  financeContent = financeContent.replace(
    "import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';",
    "import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';\nimport AnnualFeeReceipt from './AnnualFeeReceipt';"
  );
}

if (!financeContent.includes("receiptSchool")) {
  financeContent = financeContent.replace(
    "const [isMigrating, setIsMigrating] = useState(false);",
    "const [isMigrating, setIsMigrating] = useState(false);\n  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);"
  );
}

if (!financeContent.includes("const [paidDate, setPaidDate]")) {
   financeContent = financeContent.replace(
    "const [note, setNote] = useState('');",
    "const [note, setNote] = useState('');\n  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);"
  );
}

financeContent = financeContent.replace(
  "paidDate: new Date().toISOString().split('T')[0],",
  "paidDate: paidDate,"
);

const oldFormUI = `<div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက်</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>`;
const newFormUI = `<div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">လက်ခံရရှိ ရက်စွဲ</label>
                  <input type="date" required value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက်</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>`;

if (financeContent.includes(oldFormUI)) {
   financeContent = financeContent.replace(oldFormUI, newFormUI);
}

const oldHistoryRender = `{!selectedSchool ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                မှတ်တမ်းများ ကြည့်ရန် ဘယ်ဘက်မှ ကျောင်းတစ်ခုကို ရွေးပါ
              </div>
            ) : schoolTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Coins className="w-8 h-8 text-slate-300 mb-2" />
                ငွေသွင်းမှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (`;

const newHistoryRender = `{!selectedSchool ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                မှတ်တမ်းများ ကြည့်ရန် ဘယ်ဘက်မှ ကျောင်းတစ်ခုကို ရွေးပါ
              </div>
            ) : (schoolTransactions.length === 0 && !selectedSchool.isAnnualFeePaid) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Coins className="w-8 h-8 text-slate-300 mb-2" />
                ငွေသွင်းမှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (`;

if (financeContent.includes(oldHistoryRender)) {
  financeContent = financeContent.replace(oldHistoryRender, newHistoryRender);
}

const oldMapStart = `{schoolTransactions.map(t => (`;
const newMapStart = `
              {selectedSchool?.isAnnualFeePaid && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-2 flex justify-between items-center group shadow-sm animate-in fade-in">
                  <div>
                    <p className="font-bold text-sm text-emerald-900">နှစ်စဉ်ကြေး (Annual Fee) - {selectedSchool.feeAcademicYear}</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                      <span>{selectedSchool.feePaidDate ? new Date(selectedSchool.feePaidDate).toLocaleDateString('my-MM') : 'ရက်စွဲမရှိပါ'}</span>
                      <span>•</span>
                      <span className="font-mono font-bold">{(selectedSchool.feeAmount || 0).toLocaleString('my-MM')} ကျပ်</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setReceiptSchool(selectedSchool)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {schoolTransactions.map(t => (`;
              
if (financeContent.includes(oldMapStart)) {
  financeContent = financeContent.replace(oldMapStart, newMapStart);
}

if (!financeContent.includes("<AnnualFeeReceipt school={receiptSchool}")) {
    financeContent = financeContent.replace(
      "    </div>\n  );\n}",
      "      {receiptSchool && (\n        <AnnualFeeReceipt school={receiptSchool} onClose={() => setReceiptSchool(null)} />\n      )}\n    </div>\n  );\n}"
    );
}

fs.writeFileSync(financePath, financeContent);
console.log('✅ AdminFinanceManager.tsx တွင် နှစ်စဉ်ကြေး ဖြတ်ပိုင်းနှင့် ရက်စွဲထည့်သွင်းမှု ပြင်ဆင်ပြီးပါပြီ။');

// 4. Version နှင့် Change Log ပြင်ဆင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.6';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.5',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Finance Manager Receipts & Date Fixes',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း Manager တွင် နှစ်စဉ်ကြေး (Annual Fee) ကို မှတ်တမ်းအနေဖြင့် ပြသပြီး ဖြတ်ပိုင်း တိုက်ရိုက်ထုတ်ယူနိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'improve', text: 'အခြားကြေး သွင်းသည့်အခါ လက်ခံရရှိ ရက်စွဲ (Paid Date) ကို ကိုယ်တိုင်ရွေးချယ်နိုင်စေရန် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v21.6 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 5. Build & Test
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 6. Git Push
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix(finance): match annual fee in finance manager, add paidDate, upgrade receipts to pdf/jpeg"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 7. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-finance-match.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}