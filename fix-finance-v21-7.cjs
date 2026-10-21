// D:\ssspsinfo-main\fix-finance-v21-7.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း ရက်စွဲနှင့် ဖြတ်ပိုင်းထုတ်ယူမှု ပြဿနာများကို ပြင်ဆင်နေပါသည်...');

// 1. AdminFinanceManager.tsx တွင် ရက်စွဲ (Date) ကို အတင်းထည့်ခိုင်းခြင်းနှင့် နှစ်စဉ်ကြေးအတွက် Printer ပုံထည့်ခြင်း
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

// (က) Form ထဲတွင် ရက်စွဲ (Date) ကို မဖြစ်မနေ ထည့်ရမည့်အကွက်အဖြစ် ပြင်ဆင်ခြင်း
const oldDateBlock = `                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက်</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>`;

const newDateBlock = `                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ငွေသွင်းသည့် ရက်စွဲ (Payment Date) *</label>
                  <input type="date" required value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက် (Note)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>`;

if (financeContent.includes(oldDateBlock)) {
  financeContent = financeContent.replace(oldDateBlock, newDateBlock);
}

// (ခ) နှစ်စဉ်ကြေး သွင်းထားပါက Printer ပုံပါသည့် မှတ်တမ်းကို သေချာပေါက်ပေါ်စေရန် ကုဒ်ထည့်ခြင်း
// အရင်က ကုဒ်တွေကို ရှာပြီး အသစ်လဲခြင်း
const searchStr = `{schoolTransactions.length === 0 ? (`;
const replaceStr = `{schoolTransactions.length === 0 && !selectedSchool.isAnnualFeePaid ? (`;

if (financeContent.includes(searchStr)) {
  financeContent = financeContent.replace(searchStr, replaceStr);
}

const oldMapRender = `{schoolTransactions.map(t => (`;
const newMapRender = `
              {selectedSchool?.isAnnualFeePaid && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-2 flex justify-between items-center shadow-sm animate-in fade-in">
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

if (financeContent.includes(oldMapRender) && !financeContent.includes("selectedSchool?.isAnnualFeePaid")) {
  financeContent = financeContent.replace(oldMapRender, newMapRender);
}

// (ဂ) Modal ထည့်သွင်းခြင်း
if (!financeContent.includes("<AnnualFeeReceipt school={receiptSchool}")) {
  financeContent = financeContent.replace(
    "    </div>\n  );\n}",
    "      {receiptSchool && (\n        <AnnualFeeReceipt school={receiptSchool} onClose={() => setReceiptSchool(null)} />\n      )}\n    </div>\n  );\n}"
  );
}

// (ဃ) Import ထည့်သွင်းခြင်း (တကယ်လို့ မပါသေးရင်)
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

fs.writeFileSync(financePath, financeContent);
console.log('✅ AdminFinanceManager.tsx တွင် ရက်စွဲနှင့် Printer ပုံများ ပြင်ဆင်ပြီးပါပြီ။');

// 2. Receipt.tsx တွင် PDF/JPEG ထုတ်ယူမှု သေချာအောင် ပြင်ဆင်ခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');

// import များ သေချာစစ်ဆေးခြင်း
if (!receiptContent.includes("import html2canvas")) {
  receiptContent = receiptContent.replace(
    "import { Printer, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';",
    "import { Printer, ArrowLeft, CheckCircle2, Loader2, Download } from 'lucide-react';\nimport html2canvas from 'html2canvas';\nimport jsPDF from 'jspdf';\nimport { toast } from 'sonner';\nimport { useRef } from 'react';"
  );
}

// Download logic ထည့်ခြင်း
if (!receiptContent.includes("handleDownload")) {
  const insertPoint = "const handlePrint = () => {";
  const newLogic = `
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

  const handlePrint = () => {`;
  receiptContent = receiptContent.replace(insertPoint, newLogic);

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

  // ref ထည့်ခြင်း
  receiptContent = receiptContent.replace(
    `<div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">`,
    `<div ref={receiptRef} className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">`
  );
}

fs.writeFileSync(receiptPath, receiptContent);
console.log('✅ Receipt.tsx တွင် PDF/JPEG ဒေါင်းလုဒ်စနစ် ပြင်ဆင်ပြီးပါပြီ။');

// 3. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.7';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.6',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Finance Manager Receipts Fix & Mandatory Dates',
    changes: [
      { type: 'fix', text: 'နှစ်စဉ်ကြေး (Annual Fee) သွင်းထားသော ကျောင်းများအတွက် ငွေစာရင်းတွင် Printer ပုံပေါ်လာစေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်း တင်သည့်အခါ မည်သည့်ကြေးမဆို ရက်စွဲ (Payment Date) မဖြစ်မနေ ထည့်သွင်းရန် ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် ခလုတ်များ ထည့်သွင်းခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v21.7 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 4. Build & Push
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
  execSync('git commit -m "fix(finance): show printer for annual fee, require payment dates, ensure pdf/jpeg receipt downloads work"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 5. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-finance-v21-7.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}