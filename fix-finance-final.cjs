// D:\ssspsinfo-main\fix-finance-final.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ငွေစာရင်း စနစ်တစ်ခုလုံးကို အသစ်ပြန်လည် တည်ဆောက်နေပါသည် (v21.8)...');

// 1. html2canvas ကို install လုပ်ခြင်း
try {
  execSync('npm install html2canvas', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ html2canvas install မအောင်မြင်ပါ။');
  process.exit(1);
}

// 2. AdminFinanceManager.tsx ကို အစအဆုံး အသစ်ရေးခြင်း
const financePath = path.join(__dirname, 'src', 'components', 'admin', 'AdminFinanceManager.tsx');
const financeContent = `import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { School, TransactionRecord } from '../../types';
import { toast } from 'sonner';
import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';
import * as XLSX from 'xlsx';
import AnnualFeeReceipt from './AnnualFeeReceipt';

export default function AdminFinanceManager({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  
  // State အသစ် - Data တွေ ချက်ချင်း sync ဖြစ်စေရန် ID ကိုသာ သိမ်းမည်
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const selectedSchool = schools.find(s => s.id === selectedSchoolId) || null;

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);

  // Form State
  const [feeType, setFeeType] = useState('အားကစားကြေး (Sports Fee)');
  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
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
        paidDate: paidDate, // ရွေးချယ်လိုက်သော ရက်စွဲကို သုံးမည်
        note,
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
      'ပမာဏ (Amount)': t.amount,
      'ရက်စွဲ (Date)': t.paidDate,
      'မှတ်ချက် (Note)': t.note || '',
      'မှတ်တမ်းတင်သူ (Recorded By)': t.recordedBy || 'Admin'
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];
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
            recordedBy: 'System Migration',
            createdAt: new Date().toISOString()
          });
          migratedCount++;
        }
        await updateDoc(doc(db, 'schools', school.id), { payments: [] });
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
        {/* Left Side: School Selection & Form */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Coins className="w-5 h-5 text-emerald-600" /> ငွေစာရင်း ကောက်ခံရန်
            </h3>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="ကျောင်းအမည် ရှာရန်..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:border-emerald-500 outline-none" />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" /> ဇုန် အလိုက် စစ်ထုတ်ရန်:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ZONE_FILTER_OPTIONS.map(opt => {
                  const count = opt.value === 'all' ? schools.length : schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;
                  return (
                    <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)} className={\`px-2 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 border cursor-pointer \${zoneFilter === opt.value ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}\`}>
                      <span>{opt.label}</span>
                      <span className={\`text-[9px] font-bold px-1 py-0.5 rounded \${zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}\`}>{count}</span>
                    </button>
                  );
                })}
              </div>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">ပမာဏ (ကျပ်)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                
                {/* ရက်စွဲ မဖြစ်မနေ ထည့်ရမည် */}
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

        {/* Right Side: Transaction History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
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
                {/* နှစ်စဉ်ကြေး မှတ်တမ်း (သွင်းထားရင် ဒီကားချပ်လေး အမြဲပေါ်မယ်) */}
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

                {/* အခြားကြေးများ မှတ်တမ်း */}
                {schoolTransactions.map(t => (
                  <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t.feeType}</p>
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
console.log('✅ AdminFinanceManager.tsx ကို အသစ် ပြန်ရေးပြီးပါပြီ။');

// 3. Receipt.tsx ကို အစအဆုံး အသစ်ရေးခြင်း
const receiptPath = path.join(__dirname, 'src', 'pages', 'Receipt.tsx');
const receiptContent = `import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TransactionRecord } from '../types';
import { Printer, ArrowLeft, CheckCircle2, Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'transactions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTransaction({ id: docSnap.id, ...docSnap.data() } as TransactionRecord);
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: 'pdf' | 'jpeg') => {
    if (!receiptRef.current || !transaction) return;
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

  if (loading) return <div className="p-10 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  
  if (!transaction) {
    return (
      <div className="p-10 text-center space-y-4">
        <p className="text-slate-500">ငွေလက်ခံဖြတ်ပိုင်း အချက်အလက် ရှာမတွေ့ပါ။</p>
        <Link to="/admin?tab=finance" className="text-sky-700 font-bold hover:underline">← နောက်သို့</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link to="/admin?tab=finance" className="inline-flex items-center gap-2 text-sm font-bold text-sky-800 hover:text-sky-950">
          <ArrowLeft className="w-4 h-4" /> နောက်သို့
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => handleDownload('jpeg')} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" /> JPEG
          </button>
          <button onClick={() => handleDownload('pdf')} className="bg-sky-100 text-sky-800 hover:bg-sky-200 px-3 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div ref={receiptRef} className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <CheckCircle2 className="w-96 h-96 text-emerald-600" />
        </div>

        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">သတင်းနှင့် ပြန်ကြားရေးဌာန</p>
          <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest">
            ငွေလက်ခံဖြတ်ပိုင်း
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-slate-500 font-semibold block mb-1">ဖြတ်ပိုင်းအမှတ် (Receipt No):</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                RCPT-{transaction.id.substring(0, 6).toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-semibold block mb-1">ရက်စွဲ (Date):</span>
              <span className="font-bold text-slate-900">{new Date(transaction.paidDate).toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                <span className="font-bold text-slate-900 text-base">{transaction.schoolName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">မှတ်တမ်းတင်သူ:</span>
                <span className="font-bold text-slate-900">{transaction.recordedBy || 'Admin'}</span>
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
                  {transaction.feeType}
                  {transaction.note && <span className="block text-xs text-slate-500 mt-1">({transaction.note})</span>}
                </td>
                <td className="py-4 px-4 text-right border-b border-slate-100 font-mono font-bold">
                  {transaction.amount.toLocaleString('my-MM')} ကျပ်
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-right font-bold text-slate-800">စုစုပေါင်း (Total):</td>
                <td className="py-4 px-4 text-right font-mono font-black text-lg text-sky-900 bg-sky-50 rounded-br-lg">
                  {transaction.amount.toLocaleString('my-MM')} ကျပ်
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-4 text-sm text-slate-600">
            <p>ဤဖြတ်ပိုင်းသည် ငွေပေးသွင်းမှု အတည်ပြုချက် သက်သေအဖြစ် အသုံးပြုနိုင်ပါသည်။</p>
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
  );
}
`;
fs.writeFileSync(receiptPath, receiptContent);
console.log('✅ Receipt.tsx ကို အသစ် ပြန်ရေးပြီးပါပြီ။');

// 4. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v21.8';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v21\.7',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v21.8',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Ultimate Finance Sync & Receipt Fixes',
    changes: [
      { type: 'fix', text: 'နှစ်စဉ်ကြေး သွင်းထားသော ကျောင်းများ၏ အချက်အလက်များ ငွေစာရင်းတွင် ချက်ချင်း Sync ဖြစ်ပြီး ဖြတ်ပိုင်း (Printer) ခလုတ် ပေါ်လာစေရန် အပြည့်အဝ ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် စနစ်ကို အသစ်တည်ဆောက်ခြင်း။' },
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်း တင်သည့်အခါ ရက်စွဲ (Payment Date) ကို မဖြစ်မနေ ထည့်သွင်းရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v21.8 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

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
  execSync('git commit -m "fix(finance): fully rewrite AdminFinanceManager and Receipt components to fix sync and pdf/jpeg export issues"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-finance-final.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}