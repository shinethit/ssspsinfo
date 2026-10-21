// D:\ssspsinfo-main\upgrade-finance-v22-fixed.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း စနစ်အား v22.0 သို့ အဆင့်မြှင့်တင်နေပါသည်...');

// 1. types ဖိုင်ကို ရှာဖွေခြင်း (types.ts သို့မဟုတ် types/index.ts)
const typesPath1 = path.join(__dirname, 'src', 'types.ts');
const typesPath2 = path.join(__dirname, 'src', 'types', 'index.ts');
const actualTypesPath = fs.existsSync(typesPath1) ? typesPath1 : typesPath2;

if (fs.existsSync(actualTypesPath)) {
  let typesContent = fs.readFileSync(actualTypesPath, 'utf8');
  if (!typesContent.includes('academicYear?: string;')) {
    typesContent = typesContent.replace(
      /export interface TransactionRecord \{([\s\S]*?)\}/,
      (match, inner) => {
        if (!inner.includes('academicYear')) {
          return `export interface TransactionRecord {${inner}  academicYear?: string;\n}`;
        }
        return match;
      }
    );
    fs.writeFileSync(actualTypesPath, typesContent);
    console.log('✅ types ဖိုင်တွင် academicYear ထည့်သွင်းပြီးပါပြီ။');
  }
} else {
  console.log('⚠️ types ဖိုင်ကို ရှာမတွေ့ပါ။');
}

// 2. AdminFinanceManager.tsx ကို အသစ်ပြန်ရေးခြင်း
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
const financeContent = `import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { School, TransactionRecord } from '../../types';
import { toast } from 'sonner';
import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin, Download, Settings, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';
import * as XLSX from 'xlsx';
import AnnualFeeReceipt from './AnnualFeeReceipt';

export default function AdminFinanceManager({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const selectedSchool = schools.find(s => s.id === selectedSchoolId) || null;

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);

  // Global Academic Year
  const [globalAcademicYear, setGlobalAcademicYear] = useState(() => localStorage.getItem('global_academic_year') || '၂၀၂၄-၂၀၂၅');
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);

  // Form State
  const [feeType, setFeeType] = useState('နှစ်စဉ်ကြေး (Annual Fee)');
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState(globalAcademicYear);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isMigrating, setIsMigrating] = useState(false);

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSaveGlobalYear = () => {
    localStorage.setItem('global_academic_year', globalAcademicYear);
    toast.success('ပညာသင်နှစ် သတ်မှတ်ချက်ကို သိမ်းဆည်းပြီးပါပြီ');
  };

  const handleBatchUpdateYear = async () => {
    if (!confirm(\`နှစ်စဉ်ကြေး သွင်းပြီးထားသော ကျောင်းအားလုံးကို "\${globalAcademicYear}" သို့ ပြောင်းလဲပါမည်။ သေချာပါသလား?\`)) return;
    setIsUpdatingBatch(true);
    try {
      const q = query(collection(db, 'schools'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        if (d.data().isAnnualFeePaid) {
          batch.update(doc(db, 'schools', d.id), { feeAcademicYear: globalAcademicYear });
          count++;
        }
      });
      await batch.commit();
      toast.success(\`ကျောင်း (\${count}) ခု၏ ပညာသင်နှစ်ကို ပြောင်းလဲပြီးပါပြီ\`);
    } catch (error) {
      console.error(error);
      toast.error('Batch Update လုပ်၍ မရပါ');
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setIsSubmitting(true);

    try {
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
      });
      
      toast.success('ငွေသွင်းမှု မှတ်တမ်းတင်ပြီးပါပြီ');
      setAmount(''); setNote('');
      fetchTransactions();
    } catch (err) {
      toast.error('မှတ်တမ်းတင်၍ မရပါ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('ဤငွေသွင်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('မှတ်တမ်း ဖျက်ပြီးပါပြီ');
      fetchTransactions();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const handleExportAllTransactions = () => {
    if (transactions.length === 0) {
      toast.info('ထုတ်ယူရန် မှတ်တမ်း မရှိသေးပါ');
      return;
    }
    const wsData = transactions.map((t, index) => ({
      'စဉ် (No)': index + 1,
      'ကျောင်းအမည် (School Name)': t.schoolName,
      'ကြေးအမျိုးအစား (Fee Type)': t.feeType,
      'ပညာသင်နှစ် (Academic Year)': t.academicYear || '',
      'ပမာဏ (Amount)': t.amount,
      'ရက်စွဲ (Date)': t.paidDate,
      'မှတ်ချက် (Note)': t.note || '',
      'မှတ်တမ်းတင်သူ (Recorded By)': t.recordedBy || 'Admin'
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finance_Records');
    XLSX.writeFile(wb, \`Finance_Records_\${new Date().toISOString().split('T')[0]}.xlsx\`);
    toast.success('မှတ်တမ်းများကို Excel ဖြင့် ထုတ်ယူပြီးပါပြီ');
  };

  const handleMigrateData = async () => {
    const schoolsWithOldPayments = schools.filter(s => (s as any).payments && (s as any).payments.length > 0);
    if (schoolsWithOldPayments.length === 0) {
      toast.info('ရွှေ့ပြောင်းရန် မှတ်တမ်းဟောင်း မရှိပါ');
      return;
    }
    if (!confirm(\`ကျောင်း (\${schoolsWithOldPayments.length}) ခုတွင် ရှိသော ငွေသွင်းမှတ်တမ်းဟောင်းများကို ရွှေ့ပြောင်းပါမည်။ သေချာပါသလား?\`)) return;

    setIsMigrating(true);
    let migratedCount = 0;
    try {
      for (const school of schoolsWithOldPayments) {
        if (!(school as any).payments) continue;
        for (const payment of (school as any).payments) {
          await addDoc(collection(db, 'transactions'), {
            schoolId: school.id,
            schoolName: school.name,
            feeType: payment.feeType,
            amount: payment.amount,
            paidDate: payment.paidDate || new Date().toISOString().split('T')[0],
            note: payment.note || '',
            academicYear: globalAcademicYear,
            recordedBy: 'System Migration',
            createdAt: new Date().toISOString()
          });
          migratedCount++;
        }
        await writeBatch(db).update(doc(db, 'schools', school.id), { payments: [] }).commit();
      }
      toast.success(\`မှတ်တမ်း (\${migratedCount}) ခုကို အောင်မြင်စွာ ရွှေ့ပြောင်းပြီးပါပြီ\`);
      fetchTransactions();
    } catch (err) {
      toast.error('ရွှေ့ပြောင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchZone = isSchoolInZone(s.zone, zoneFilter);
    return matchSearch && matchZone;
  });
  const schoolTransactions = selectedSchool ? transactions.filter(t => t.schoolId === selectedSchool.id) : [];

  return (
    <div className="space-y-6">
      {/* Global Setting Box */}
      <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">ဗဟို ပညာသင်နှစ် သတ်မှတ်ချက် (Global Setting)</h3>
            <p className="text-xs text-slate-500">Form များတွင် ဤပညာသင်နှစ်ကို Default အဖြစ် အသုံးပြုမည်</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text" 
            value={globalAcademicYear} 
            onChange={e => setGlobalAcademicYear(e.target.value)} 
            placeholder="ဥပမာ - ၂၀၂၄-၂၀၂၅" 
            className="p-2 border border-slate-300 rounded-lg text-sm w-36 font-bold text-indigo-900" 
          />
          <button onClick={handleSaveGlobalYear} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> သိမ်းမည်
          </button>
          <button onClick={handleBatchUpdateYear} disabled={isUpdatingBatch} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50">
            <ArrowRightLeft className="w-3.5 h-3.5" /> {isUpdatingBatch ? 'ပြောင်းလဲနေပါသည်...' : 'သွင်းပြီးကျောင်းများကို ဤနှစ်သို့ပြောင်းမည်'}
          </button>
        </div>
      </div>

      {schools.some(s => (s as any).payments && (s as any).payments.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
            <ArrowRightLeft className="w-5 h-5" />
            <span>ငွေသွင်းမှတ်တမ်းဟောင်းများ (Array) ကို တွေ့ရှိပါသည်။ စနစ်အသစ်သို့ ရွှေ့ပြောင်းပါ။</span>
          </div>
          <button onClick={handleMigrateData} disabled={isMigrating} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition">
            {isMigrating ? 'ရွှေ့ပြောင်းနေပါသည်...' : 'ယခု ရွှေ့ပြောင်းမည် (Migrate)'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Coins className="w-5 h-5 text-emerald-600" /> ငွေစာရင်း ကောက်ခံရန်
            </h3>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="ကျောင်းအမည် ရှာရန်..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:border-emerald-500 outline-none" />
            </div>
            
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredSchools.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 italic">ကျောင်း မတွေ့ပါ</div>
              ) : filteredSchools.map(s => (
                <div key={s.id} onClick={() => setSelectedSchoolId(s.id)} className={\`p-3 cursor-pointer transition \${selectedSchoolId === s.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'}\`}>
                  <p className="font-bold text-sm text-slate-900">{s.name}</p>
                  {s.zone && (<span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"><MapPin className="w-2.5 h-2.5" />{s.zone}</span>)}
                  {s.isAnnualFeePaid && <span className="inline-flex items-center gap-1 mt-1 ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ နှစ်စဉ်ကြေးသွင်းပြီး</span>}
                </div>
              ))}
            </div>

            {selectedSchool && (
              <form onSubmit={handleAddPayment} className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 animate-in fade-in">
                <h4 className="font-bold text-sm text-emerald-900 border-b border-emerald-200 pb-2">ကျောင်း: {selectedSchool.name}</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ကြေးအမျိုးအစား</label>
                  <select value={feeType} onChange={e => setFeeType(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                    <option value="နှစ်စဉ်ကြေး (Annual Fee)">နှစ်စဉ်ကြေး (Annual Fee)</option>
                    <option value="အားကစားကြေး (Sports Fee)">အားကစားကြေး (Sports Fee)</option>
                    <option value="သင်တန်းကြေး (Training Fee)">သင်တန်းကြေး (Training Fee)</option>
                    <option value="အခြားကြေး (Other Fee)">အခြားကြေး (Other Fee)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ပညာသင်နှစ် (Academic Year)</label>
                  <input type="text" value={formAcademicYear} onChange={e => setFormAcademicYear(e.target.value)} placeholder="ဥပမာ - ၂၀၂၄-၂၀၂၅" className="w-full p-2.5 border rounded-xl text-sm bg-white font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ပမာဏ (ကျပ်)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ငွေသွင်းသည့် ရက်စွဲ (Payment Date) *</label>
                  <input type="date" required value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white font-bold" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက် (Note)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                  <Plus className="w-4 h-4" /> {isSubmitting ? 'မှတ်တမ်းတင်နေပါသည်...' : 'ငွေသွင်းမှု မှတ်တမ်းတင်မည်'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" /> 
                {selectedSchool ? \`\${selectedSchool.name} ၏ မှတ်တမ်းများ\` : 'ကျောင်းတစ်ခုကို ရွေးချယ်ပါ'}
              </h3>
              <button onClick={handleExportAllTransactions} className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer" title="မှတ်တမ်းအားလုံးကို Excel ဖြင့် ထုတ်ယူရန်">
                <Download className="w-3.5 h-3.5" /> Export All
              </button>
            </div>
            {selectedSchool && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                စုစုပေါင်း: {(schoolTransactions.reduce((sum, t) => sum + t.amount, 0) + (selectedSchool.isAnnualFeePaid ? (selectedSchool.feeAmount || 0) : 0)).toLocaleString('my-MM')} ကျပ်
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {!selectedSchool ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                မှတ်တမ်းများ ကြည့်ရန် ဘယ်ဘက်မှ ကျောင်းတစ်ခုကို ရွေးပါ
              </div>
            ) : (schoolTransactions.length === 0 && !selectedSchool.isAnnualFeePaid) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Coins className="w-8 h-8 text-slate-300 mb-2" />
                ငွေသွင်းမှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (
              <>
                {selectedSchool.isAnnualFeePaid && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center group shadow-sm animate-in fade-in">
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

                {schoolTransactions.map(t => (
                  <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t.feeType} {t.academicYear && <span className="text-xs text-slate-500 font-normal">({t.academicYear})</span>}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{new Date(t.paidDate).toLocaleDateString('my-MM')}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-700 font-bold">{t.amount.toLocaleString('my-MM')} ကျပ်</span>
                      </div>
                      {t.note && <p className="text-[11px] text-slate-400 mt-1">({t.note})</p>}
                    </div>
                    <div className="flex gap-1">
                      <Link to={\`/receipt/\${t.id}\`} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
                        <Printer className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="ဖျက်ရန်">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {receiptSchool && (
        <AnnualFeeReceipt school={receiptSchool} onClose={() => setReceiptSchool(null)} />
      )}
    </div>
  );
}
`;
fs.writeFileSync(financePath, financeContent);
console.log('✅ AdminFinanceManager.tsx ကို အသစ်ပြန်ရေးပြီးပါပြီ။');

// 3. Receipt.tsx တွင် Voucher No Format အသစ်နှင့် Note ထည့်ခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
let receiptContent = fs.readFileSync(receiptPath, 'utf8');

// Voucher No ဖော်မတ် ပြောင်းခြင်း
const voucherLogic = `
  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return \`\${yyyy}\${mm}\${dd}\`;
  };
  const voucherNo = \`SSSPSFV-\${formatDateStr(transaction.paidDate)}-\${transaction.id.substring(0, 4).toUpperCase()}\`;
`;

if (!receiptContent.includes('voucherNo')) {
  receiptContent = receiptContent.replace(
    "const handlePrint = () => {",
    voucherLogic + "\n  const handlePrint = () => {"
  );
  receiptContent = receiptContent.replace(
    "RCPT-{transaction.id.substring(0, 6).toUpperCase()}",
    "{voucherNo}"
  );
}

// Note နှင့် Academic Year ထည့်ခြင်း (ရှိပြီးသား ကုဒ်ကို သေချာအစားထိုးရန်)
const oldTableRow = `<td className="py-4 px-4 border-b border-slate-100">
                  {transaction.feeType}
                  {transaction.note && <span className="block text-xs text-slate-500 mt-1">({transaction.note})</span>}
                </td>`;
const newTableRow = `<td className="py-4 px-4 border-b border-slate-100">
                  <span className="font-bold">{transaction.feeType}</span>
                  {transaction.academicYear && <span className="block text-xs text-slate-600 mt-0.5">ပညာသင်နှစ်: {transaction.academicYear}</span>}
                  {transaction.note && <span className="block text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">မှတ်စု: {transaction.note}</span>}
                </td>`;

if (receiptContent.includes(oldTableRow)) {
  receiptContent = receiptContent.replace(oldTableRow, newTableRow);
}

fs.writeFileSync(receiptPath, receiptContent);
console.log('✅ Receipt.tsx တွင် Voucher No နှင့် မှတ်စု ထည့်သွင်းပြီးပါပြီ။');

// 4. AnnualFeeReceipt.tsx တွင် Voucher No Format အသစ် ပြောင်းခြင်း
const annualReceiptPath = path.join(__dirname, 'src', 'components', 'admin', 'AnnualFeeReceipt.tsx');
let annualReceiptContent = fs.readFileSync(annualReceiptPath, 'utf8');

const oldVoucher = `AF-{school.id.substring(0, 6).toUpperCase()}`;
const newVoucher = `{(() => {
                  const d = new Date(school.feePaidDate || new Date());
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return \`SSSPSFV-\${yyyy}\${mm}\${dd}-\${school.id.substring(0, 4).toUpperCase()}\`;
                })()}`;

if (annualReceiptContent.includes(oldVoucher)) {
  annualReceiptContent = annualReceiptContent.replace(oldVoucher, newVoucher);
  fs.writeFileSync(annualReceiptPath, annualReceiptContent);
  console.log('✅ AnnualFeeReceipt.tsx တွင် Voucher No ဖော်မတ် အသစ်ပြောင်းပြီးပါပြီ။');
}

// 5. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v22.0';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.9',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v22.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Global Academic Year & Voucher Formatting',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်းတွင် ပညာသင်နှစ်ကို ဗဟိုမှ (Global) သတ်မှတ်နိုင်ပြီး Form များတွင် Default အဖြစ် အသုံးပြုနိုင်ခြင်း။' },
      { type: 'feat', text: 'သွင်းပြီးသား ကျောင်းများအားလုံးကို ပညာသင်နှစ်အသစ်သို့ တစ်ချက်တည်း Batch ပြောင်းလဲနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Voucher/Receipt နံပါတ်များကို SSSPSFV-YYYYMMDD ဖော်မတ်ဖြင့် စနစ်တကျ ထုတ်ပေးခြင်း။' },
      { type: 'improve', text: 'Receipt တွင် မှတ်စု (Note) နှင့် ပညာသင်နှစ်ကို ရှင်းလင်းစွာ ပြသခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v22.0 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 6. Build & Push
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
  execSync('git commit -m "feat(finance): global academic year setting, batch update, voucher format SSSPSFV-YYYYMMDD, receipt notes"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 7. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'upgrade-finance-v22-fixed.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}