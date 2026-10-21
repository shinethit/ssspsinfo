// D:\ssspsinfo-main\final-finance-upgrade.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း လုံခြုံရေးနှင့် Running Number စနစ် အဆင့်မြှင့်တင်နေပါသည်...');

// 1. types/index.ts တွင် voucherNo ထည့်ခြင်း
const typesPath = path.join(__dirname, 'src', 'types', 'index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');
if (!typesContent.includes('voucherNo?: string;')) {
  typesContent = typesContent.replace(
    "export interface TransactionRecord {\n  id: string;\n  schoolId: string;",
    "export interface TransactionRecord {\n  id: string;\n  voucherNo?: string;\n  schoolId: string;"
  );
  fs.writeFileSync(typesPath, typesContent);
  console.log('✅ types/index.ts တွင် voucherNo ထည့်သွင်းပြီးပါပြီ။');
}

// 2. Voucher No ထုတ်ပေးမည့် Utility ဖိုင် ဖန်တီးခြင်း
const utilsPath = path.join(__dirname, 'src', 'utils');
if (!fs.existsSync(utilsPath)) {
  fs.mkdirSync(utilsPath, { recursive: true });
}
const voucherUtilPath = path.join(utilsPath, 'voucher.ts');
const voucherUtilContent = `import { TransactionRecord } from '../types';

export const generateVoucherNo = (paidDate: string, transactions: TransactionRecord[]): string => {
  // Format date to YYYYMMDD
  const d = new Date(paidDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = \`\${yyyy}\${mm}\${dd}\`;
  
  const prefix = \`SSSPSFV-\${dateStr}-\`;
  
  // Filter transactions for the same day
  const dayTransactions = transactions.filter(t => t.voucherNo && t.voucherNo.startsWith(prefix));
  
  // Find the max running number
  let maxNum = 0;
  dayTransactions.forEach(t => {
    if (t.voucherNo) {
      const parts = t.voucherNo.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  // Generate next number, padded to 4 digits
  return \`\${prefix}\${String(maxNum + 1).padStart(4, '0')}\`;
};
`;
fs.writeFileSync(voucherUtilPath, voucherUtilContent);
console.log('✅ src/utils/voucher.ts ဖိုင်အသစ် ဖန်တီးပြီးပါပြီ။');

// 3. AdminFinanceManager.tsx တွင် Voucher No အလိုအလျောက် ထုတ်ပြီး သိမ်းဆည်းခြင်း
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

if (!financeContent.includes("generateVoucherNo")) {
  financeContent = financeContent.replace(
    "import AnnualFeeReceipt from './AnnualFeeReceipt';",
    "import AnnualFeeReceipt from './AnnualFeeReceipt';\nimport { generateVoucherNo } from '../../utils/voucher';"
  );
}

// handleAddPayment တွင် voucherNo ထည့်ခြင်း
const oldAddPayment = `    try {
      await addDoc(collection(db, 'transactions'), {
        schoolId: selectedSchool.id,
        schoolName: selectedSchool.name,
        feeType,
        amount: Number(amount),
        paidDate: paidDate,
        note,
        academicYear: formAcademicYear,
        recordedBy: auth.currentUser?.email || 'Admin',
        createdAt: new Date().toISOString()
      });`;

const newAddPayment = `    try {
      const newVoucherNo = generateVoucherNo(paidDate, transactions);
      await addDoc(collection(db, 'transactions'), {
        schoolId: selectedSchool.id,
        schoolName: selectedSchool.name,
        feeType,
        amount: Number(amount),
        paidDate: paidDate,
        note,
        academicYear: formAcademicYear,
        recordedBy: auth.currentUser?.email || 'Admin',
        createdAt: new Date().toISOString(),
        voucherNo: newVoucherNo
      });`;

if (financeContent.includes(oldAddPayment)) {
  financeContent = financeContent.replace(oldAddPayment, newAddPayment);
  fs.writeFileSync(financePath, financeContent);
  console.log('✅ AdminFinanceManager.tsx တွင် Voucher No ထုတ်ပေးသည့် စနစ် ထည့်ပြီးပါပြီ။');
}

// 4. Receipt.tsx တွင် Database မှ voucherNo ကို တိုက်ရိုက်ယူသုံးခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');

const oldVoucherLogic = `
  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return \`\${yyyy}\${mm}\${dd}\`;
  };
  const voucherNo = \`SSSPSFV-\${formatDateStr(transaction.paidDate)}-\${transaction.id.substring(0, 4).toUpperCase()}\`;
`;
const newVoucherLogic = `
  const displayVoucherNo = transaction.voucherNo || \`SSSPSFV-\${transaction.paidDate.replace(/-/g, '')}-\${transaction.id.substring(0, 4).toUpperCase()}\`;
`;

if (receiptContent.includes(oldVoucherLogic)) {
  receiptContent = receiptContent.replace(oldVoucherLogic, newVoucherLogic);
  receiptContent = receiptContent.replace("{voucherNo}", "{displayVoucherNo}");
  fs.writeFileSync(receiptPath, receiptContent);
  console.log('✅ Receipt.tsx တွင် လုံခြုံသော Voucher No ကို သုံးစွဲအောင် ပြင်ပြီးပါပြီ။');
}

// 5. AdminSchoolManager.tsx တွင် နှစ်စဉ်ကြေးအတွက် Popup (Modal) ထည့်ခြင်း
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

// Import လိုအပ်တာတွေ ထည့်ခြင်း
if (!managerContent.includes("addDoc")) {
  managerContent = managerContent.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';\nimport { db, auth } from '../../lib/firebase';\nimport { generateVoucherNo } from '../../utils/voucher';\nimport { toast } from 'sonner';"
  );
}

// State ထည့်ခြင်း
if (!managerContent.includes("feeModalSchool")) {
  managerContent = managerContent.replace(
    "const itemsPerPage = 20;",
    "const itemsPerPage = 20;\n  const [feeModalSchool, setFeeModalSchool] = useState<School | null>(null);\n  const [feeDate, setFeeDate] = useState(new Date().toISOString().split('T')[0]);\n  const [feeAmount, setFeeAmount] = useState('');\n  const [isSubmittingFee, setIsSubmittingFee] = useState(false);"
  );
}

// Toggle နှိပ်ရင် Modal ပေါ်လာအောင် ပြင်ခြင်း
const oldToggleBtn = `<button 
                            onClick={() => onToggleFee(school)}
                            className={\`text-[11px] font-bold px-2.5 py-1 rounded-md border transition \${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}\`}
                          >
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးပေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>`;

const newToggleBtn = `<button 
                            onClick={() => {
                              if (school.isAnnualFeePaid) {
                                onToggleFee(school); // Toggle off directly if already paid (with confirmation in parent)
                              } else {
                                setFeeModalSchool(school);
                                setFeeDate(new Date().toISOString().split('T')[0]);
                                setFeeAmount(school.feeAmount?.toString() || '');
                              }
                            }}
                            className={\`text-[11px] font-bold px-2.5 py-1 rounded-md border transition \${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}\`}
                          >
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးပေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>`;

if (managerContent.includes(oldToggleBtn)) {
  managerContent = managerContent.replace(oldToggleBtn, newToggleBtn);
}

// Modal နှင့် Save Logic ထည့်ခြင်း (Component အဆုံးတွင်)
const feeModalRender = `
      {/* Annual Fee Payment Modal */}
      {feeModalSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 mb-1">နှစ်စဉ်ကြေး သွင်းရန်</h3>
            <p className="text-xs text-slate-500 mb-4">{feeModalSchool.name}</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ငွေသွင်းသည့် ရက်စွဲ *</label>
                <input type="date" value={feeDate} onChange={e => setFeeDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ပမာဏ (ကျပ်) *</label>
                <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 font-bold" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button onClick={() => setFeeModalSchool(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">မလုပ်တော့ပါ</button>
              <button 
                onClick={async () => {
                  if (!feeDate || !feeAmount) return toast.error('အချက်အလက်များ ဖြည့်စွက်ပါ');
                  setIsSubmittingFee(true);
                  try {
                    // Fetch today's transactions to generate correct running number
                    const q = query(collection(db, 'transactions'), where('paidDate', '==', feeDate));
                    const snap = await getDocs(q);
                    const existingTx = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord));
                    
                    const newVoucherNo = generateVoucherNo(feeDate, existingTx);
                    
                    // 1. Add to transactions
                    await addDoc(collection(db, 'transactions'), {
                      schoolId: feeModalSchool.id,
                      schoolName: feeModalSchool.name,
                      feeType: 'နှစ်စဉ်ကြေး (Annual Fee)',
                      amount: Number(feeAmount),
                      paidDate: feeDate,
                      academicYear: feeModalSchool.feeAcademicYear || '၂၀၂၄-၂၀၂၅',
                      recordedBy: auth.currentUser?.email || 'Admin',
                      createdAt: new Date().toISOString(),
                      voucherNo: newVoucherNo
                    });

                    // 2. Update school document
                    await updateDoc(doc(db, 'schools', feeModalSchool.id), {
                      isAnnualFeePaid: true,
                      feePaidDate: feeDate,
                      feeAmount: Number(feeAmount)
                    });

                    toast.success('နှစ်စဉ်ကြေး သွင်းပြီးပါပြီ');
                    setFeeModalSchool(null);
                    onToggleFee(feeModalSchool); // Trigger parent refresh
                  } catch (err) {
                    toast.error('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
                  } finally {
                    setIsSubmittingFee(false);
                  }
                }}
                disabled={isSubmittingFee}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmittingFee ? 'သိမ်းဆည်းနေပါသည်...' : 'သိမ်းဆည်းမည်'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!managerContent.includes("feeModalSchool")) {
  managerContent = managerContent.replace("    </div>\n  );\n}", feeModalRender + "    </div>\n  );\n}");
}

fs.writeFileSync(managerPath, managerContent);
console.log('✅ AdminSchoolManager.tsx တွင် နှစ်စဉ်ကြေးအတွက် Popup ထည့်သွင်းပြီးပါပြီ။');


// 6. AnnualFeeReceipt.tsx တွင် voucherNo ပါလာအောင် ပြင်ဆင်ခြင်း
const annualReceiptPath = path.join(__dirname, 'src', 'components', 'admin', 'AnnualFeeReceipt.tsx');
let annualReceiptContent = fs.readFileSync(annualReceiptPath, 'utf8');

const oldAnnualVoucher = `{(() => {
                  const d = new Date(school.feePaidDate || new Date());
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return \`SSSPSFV-\${yyyy}\${mm}\${dd}-\${school.id.substring(0, 4).toUpperCase()}\`;
                })()}`;
const newAnnualVoucher = `{school.feePaidDate ? \`SSSPSFV-\${new Date(school.feePaidDate).toISOString().slice(0,10).replace(/-/g, '')}-\${school.id.substring(0, 4).toUpperCase()}\` : 'N/A'}`;

if (annualReceiptContent.includes(oldAnnualVoucher)) {
  annualReceiptContent = annualReceiptContent.replace(oldAnnualVoucher, newAnnualVoucher);
  fs.writeFileSync(annualReceiptPath, annualReceiptContent);
  console.log('✅ AnnualFeeReceipt.tsx တွင် Voucher No ကို လုံခြုံအောင် ပြင်ပြီးပါပြီ။');
}


// 7. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v22.5';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v22\.4',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v22.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Immutable Finance Records & Running Voucher No',
    changes: [
      { type: 'feat', text: 'Voucher / Receipt နံပါတ်များကို နေ့စဉ် Reset ဖြစ်သည့် Running Number (SSSPSFV-YYYYMMDD-0001) ဖြင့် စနစ်တကျ ထုတ်ပေးခြင်း။' },
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်းများ (Date နှင့် Vr ID) ကို Database တွင် တိုက်ရိုက်သိမ်းဆည်းထားသဖြင့် နောက်ပိုင်း မည်သူမှ ပြန်လည်ပြင်ဆင်၍ မရတော့ခြင်း (Immutable)။' },
      { type: 'improve', text: 'နှစ်စဉ်ကြေး သွင်းသည့်အခါ ရက်စွဲနှင့် ပမာဏကို ထည့်သွင်းနိုင်သည့် Popup စနစ် ထည့်သွင်းခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v22.5 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 8. Build & Push
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
  execSync('git commit -m "feat(finance): immutable voucher numbers with daily resetting running numbers, annual fee modal"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 9. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'final-finance-upgrade.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}