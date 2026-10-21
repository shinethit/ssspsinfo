// D:\ssspsinfo-main\add-receipt-feature.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 နှစ်စဉ်ကြေး ဖြတ်ပိုင်း (PDF/JPEG) ထုတ်ပေးမည့်စနစ် ထည့်သွင်းနေပါသည်...');

// 1. html2canvas ကို install လုပ်ခြင်း (JPEG/PDF ထုတ်ရန် လိုအပ်သည်)
try {
  console.log('📦 html2canvas ကို install လုပ်နေပါသည်...');
  execSync('npm install html2canvas', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ html2canvas install မအောင်မြင်ပါ။');
  process.exit(1);
}

// 2. AnnualFeeReceipt.tsx Component အသစ် ဖန်တီးခြင်း
const receiptComponentPath = path.join(__dirname, 'src', 'components', 'admin', 'AnnualFeeReceipt.tsx');
const receiptComponentContent = `import React, { useRef } from 'react';
import { School } from '../../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnualFeeReceipt({ school, onClose }: { school: School; onClose: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (format: 'pdf' | 'jpeg') => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      if (format === 'jpeg') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = \`Receipt_\${school.name}_\${new Date().getTime()}.jpeg\`;
        link.click();
        toast.success('JPEG ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(\`Receipt_\${school.name}_\${new Date().getTime()}.pdf\`);
        toast.success('PDF ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      }
    } catch (err) {
      toast.error('ဖိုင်ထုတ်ယူရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = school.feePaidDate 
    ? new Date(school.feePaidDate).toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Controls (Hidden on Print) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h3 className="font-bold text-slate-800">ဖြတ်ပိုင်း ထုတ်ယူရန်</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => handleDownload('jpeg')} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> JPEG
            </button>
            <button onClick={() => handleDownload('pdf')} className="bg-sky-100 text-sky-800 hover:bg-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-rose-600 px-2 py-1.5 text-xs font-bold ml-2">ပိတ်မည်</button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-8 bg-slate-50 overflow-x-auto">
          <div ref={receiptRef} className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 relative overflow-hidden w-[700px] mx-auto text-slate-900" style={{ minHeight: '500px' }}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <CheckCircle2 className="w-96 h-96 text-emerald-600" />
            </div>

            <div className="text-center border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
              <h1 className="text-2xl font-black leading-snug">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း</h1>
              <p className="text-sm font-semibold text-slate-500 mt-1">သတင်းနှင့် ပြန်ကြားရေးဌာန</p>
              <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest">
                နှစ်စဉ်ကြေး ငွေလက်ခံဖြတ်ပိုင်း
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">ဖြတ်ပိုင်းအမှတ်:</span>
                  <span className="font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    AF-{school.id.substring(0, 6).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold block mb-1">ရက်စွဲ (Date):</span>
                  <span className="font-bold">{formattedDate}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                    <span className="font-bold text-base">{school.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအဆင့် / ဇုန်:</span>
                    <span className="font-bold">{school.level} {school.zone ? \`(\${school.zone})\` : ''}</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="py-3 px-4 text-left font-bold border-b border-slate-300">အကြောင်းအရာ (Description)</th>
                    <th className="py-3 px-4 text-right font-bold border-b border-slate-300">ပမာဏ (Amount)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-4 border-b border-slate-100">
                      နှစ်စဉ်ကြေး (Annual Fee) - {school.feeAcademicYear || '၂၀၂၄-၂၀၂၅'}
                    </td>
                    <td className="py-4 px-4 text-right border-b border-slate-100 font-mono font-bold">
                      {(school.feeAmount || 0).toLocaleString('my-MM')} ကျပ်
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-right font-bold text-slate-800">စုစုပေါင်း (Total):</td>
                    <td className="py-4 px-4 text-right font-mono font-black text-lg text-sky-900 bg-sky-50 rounded-br-lg">
                      {(school.feeAmount || 0).toLocaleString('my-MM')} ကျပ်
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 text-sm text-slate-600">
                <p>ဤဖြတ်ပိုင်းသည် နှစ်စဉ်ကြေး ငွေပေးသွင်းမှု အတည်ပြုချက် သက်သေအဖြစ် အသုံးပြုနိုင်ပါသည်။</p>
              </div>
            </div>

            <div className="mt-16 pt-8 flex justify-between items-end relative z-10">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-2"></div>
                <span className="text-xs text-slate-500 font-semibold">ငွေကိုင်ဌာန</span>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-2"></div>
                <span className="text-xs text-slate-500 font-semibold">အသင်းဥက္ကဋ္ဌ / တာဝန်ခံ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(receiptComponentPath, receiptComponentContent);
console.log('✅ AnnualFeeReceipt.tsx ဖိုင်အသစ် ဖန်တီးပြီးပါပြီ။');

// 3. SchoolForm.tsx တွင် feePaidDate ထည့်သွင်းခြင်း
const schoolFormPath = path.join(__dirname, 'src', 'components', 'admin', 'SchoolForm.tsx');
let schoolFormContent = fs.readFileSync(schoolFormPath, 'utf8');

const oldFeeBlock = `<div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">နှစ်စဉ်ကြေး ပေးသွင်းပြီးပြီလား</label>
              <label className="flex items-center gap-2 p-2.5 border rounded-lg bg-slate-50 cursor-pointer">
                <input type="checkbox" {...schoolForm.register('isAnnualFeePaid')} className="w-4 h-4 text-sky-600 rounded" />
                <span className="text-sm font-semibold text-slate-700">ပေးသွင်းပြီး (Paid)</span>
              </label>
            </div>`;

const newFeeBlock = `<div className="space-y-3 p-3 border rounded-xl bg-slate-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...schoolForm.register('isAnnualFeePaid')} className="w-4 h-4 text-sky-600 rounded" />
                <span className="text-sm font-bold text-slate-700">နှစ်စဉ်ကြေး ပေးသွင်းပြီး (Paid)</span>
              </label>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">သွင်းသည့် ရက်စွဲ (Payment Date)</label>
                <input type="date" {...schoolForm.register('feePaidDate')} className="w-full p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>`;

if (schoolFormContent.includes(oldFeeBlock)) {
  schoolFormContent = schoolFormContent.replace(oldFeeBlock, newFeeBlock);
  fs.writeFileSync(schoolFormPath, schoolFormContent);
  console.log('✅ SchoolForm.tsx တွင် ရက်စွဲထည့်သွင်းသည့် စနစ် ထည့်ပြီးပါပြီ။');
}

// 4. AdminSchoolManager.tsx တွင် Receipt ခလုတ်နှင့် Modal ထည့်သွင်းခြင်း
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

// Import ထည့်ခြင်း
if (!managerContent.includes("AnnualFeeReceipt")) {
  managerContent = managerContent.replace(
    "import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';",
    "import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';\nimport AnnualFeeReceipt from './AnnualFeeReceipt';"
  );
}

// State ထည့်ခြင်း
if (!managerContent.includes("receiptSchool")) {
  managerContent = managerContent.replace(
    "const [currentPage, setCurrentPage] = useState(1);",
    "const [currentPage, setCurrentPage] = useState(1);\n  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);"
  );
}

// ခလုတ် ထည့်ခြင်း (Printer Icon)
const oldButtonBlock = `<button onClick={() => onToggleFee(school)} className={\`text-[11px] font-bold px-2.5 py-1 rounded-md border transition \${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}\`}>
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးပေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>`;

const newButtonBlock = `<button onClick={() => onToggleFee(school)} className={\`text-[11px] font-bold px-2.5 py-1 rounded-md border transition \${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}\`}>
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးပေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>
                          
                          {school.isAnnualFeePaid && (
                            <button onClick={() => setReceiptSchool(school)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition animate-in zoom-in" title="ဖြတ်ပိုင်းထုတ်ရန်">
                              <Printer className="w-4 h-4" />
                            </button>
                          )}`;

if (managerContent.includes(oldButtonBlock)) {
  managerContent = managerContent.replace(oldButtonBlock, newButtonBlock);
}

// Modal ထည့်ခြင်း (Component အဆုံးတွင်)
const modalRender = `
      {/* Annual Fee Receipt Modal */}
      {receiptSchool && (
        <AnnualFeeReceipt school={receiptSchool} onClose={() => setReceiptSchool(null)} />
      )}
`;
if (managerContent.includes("</div>\n  );\n}") && !managerContent.includes("AnnualFeeReceipt school={receiptSchool}")) {
  managerContent = managerContent.replace("</div>\n  );\n}", modalRender + "    </div>\n  );\n}");
}

fs.writeFileSync(managerPath, managerContent);
console.log('✅ AdminSchoolManager.tsx တွင် Receipt ထုတ်ပေးသည့် စနစ် ထည့်ပြီးပါပြီ။');

// 5. Version နှင့် Change Log ပြင်ဆင်ခြင်း
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.5';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.4',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Annual Fee Receipts & Date Tracking',
    changes: [
      { type: 'feat', text: 'နှစ်စဉ်ကြေး သွင်းပြီးပါက ကျောင်းတစ်ခုချင်းစီအတွက် ဖြတ်ပိုင်း (Receipt) ကို PDF သို့မဟုတ် JPEG အဖြစ် ထုတ်ယူနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'နှစ်စဉ်ကြေး သွင်းသည့်အခါ ရက်စွဲ (Payment Date) ကို ထည့်သွင်းနိုင်စေရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v21.5 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 6. Build & Test
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

// 7. Git Push
console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat(finance): add annual fee receipt generation with PDF/JPEG export and date tracking"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 8. PowerShell ဖြင့် ရှင်းလင်းခြင်း
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'add-receipt-feature.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}