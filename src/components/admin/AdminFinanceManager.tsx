import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { School, TransactionRecord } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { getGlobalAcademicYear } from '../../lib/academicYear';
import { recordAnnualFeePayment, findAnnualFeeTransaction, ANNUAL_FEE_TYPE } from '../../lib/finance';
import { recordAuditLog } from '../../lib/audit';
import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin, Download, Settings, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';
import * as XLSX from 'xlsx';
import AnnualFeeReceipt from './AnnualFeeReceipt';
import { generateVoucherNo } from '../../utils/voucher';

export default function AdminFinanceManager({ schools, onSchoolsChange }: { schools: School[]; onSchoolsChange?: () => void }) {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const selectedSchool = schools.find(s => s.id === selectedSchoolId) || null;

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);
  // v24.13 (F7): the stored voucher for the receipt opened from Finance.
  const [receiptVoucherNo, setReceiptVoucherNo] = useState<string | null>(null);

  // Global Academic Year
  const [globalAcademicYear, setGlobalAcademicYear] = useState(() => getGlobalAcademicYear());
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
    if (!(await confirmDialog(`နှစ်စဉ်ကြေး သွင်းပြီးထားသော ကျောင်းအားလုံးကို "${globalAcademicYear}" သို့ ပြောင်းလဲပါမည်။ သေချာပါသလား?`))) return;
    setIsUpdatingBatch(true);
    try {
      // v24.13 (F4): capture the OLD global year before the roll. Before,
      // only the school flags moved to the new year, so Finance rendered
      // both the flag card and the transaction row for the same payment
      // and the total counted it twice.
      const oldYear = getGlobalAcademicYear();
      const newYear = globalAcademicYear;
      const q = query(collection(db, 'schools'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;
      const rolledSchoolIds: string[] = [];
      snap.docs.forEach(d => {
        if (d.data().isAnnualFeePaid) {
          batch.update(doc(db, 'schools', d.id), { feeAcademicYear: newYear });
          rolledSchoolIds.push(d.id);
          count++;
        }
      });
      await batch.commit();
      // Re-year every matching annual-fee transaction (same school +
      // annual-fee type + old year) so the flag and the transaction agree
      // on the year again.
      let txCount = 0;
      if (rolledSchoolIds.length > 0 && oldYear !== newYear) {
        const txSnap = await getDocs(collection(db, 'transactions'));
        const txBatch = writeBatch(db);
        txSnap.docs.forEach(d => {
          const t = d.data();
          if (rolledSchoolIds.includes(t.schoolId) && t.feeType === ANNUAL_FEE_TYPE && t.academicYear === oldYear) {
            txBatch.update(doc(db, 'transactions', d.id), { academicYear: newYear });
            txCount++;
          }
        });
        if (txCount > 0) await txBatch.commit();
      }
      toast.success(`ကျောင်း (${count}) ခု၏ ပညာသင်နှစ်ကို ပြောင်းလဲပြီးပါပြီ${txCount > 0 ? `၊ မှတ်တမ်း (${txCount}) ခုကိုလည်း ပြောင်းလဲပြီးပါပြီ` : ''}`);
      fetchTransactions();
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
      // v24.13 (F6): 0 / negative / non-numeric amounts are rejected here
      // (and again inside recordAnnualFeePayment) — the form used to
      // accept them and record a 0-ကျပ် payment.
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) { toast.error('ပမာဏ ၀ ထက် ကြီးရပါမည်'); return; }
      if (feeType === ANNUAL_FEE_TYPE) {
        // v24.7: one write path does both — the transaction AND the school's
        // paid flag. Recording only one used to leave the two disagreeing.
        // v24.13 (F5b): if this school+year already has an annual-fee
        // transaction, just set the flag and reuse it — never write a
        // second transaction for the same payment.
        const freshSnap = await getDocs(collection(db, 'transactions'));
        const freshList = freshSnap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord));
        const existingTx = findAnnualFeeTransaction(freshList, selectedSchool.id, formAcademicYear);
        if (existingTx) {
          await updateDoc(doc(db, 'schools', selectedSchool.id), { isAnnualFeePaid: true, feePaidDate: existingTx.paidDate || paidDate, feeAmount: numericAmount, feeAcademicYear: formAcademicYear, updatedAt: new Date().toISOString() });
          await recordAuditLog({ action: 'update', entityType: 'school', entityId: selectedSchool.id, entityName: selectedSchool.name, details: `နှစ်စဉ်ကြေး ${numericAmount.toLocaleString('my-MM')} ကျပ် (${formAcademicYear}) — ရှိပြီးသား မှတ်တမ်း ပြန်သုံးခြင်း (${existingTx.voucherNo || 'voucher မရှိ'})` });
        } else {
          const { voucherNo } = await recordAnnualFeePayment({
            school: selectedSchool,
            amount: numericAmount,
            paidDate,
            academicYear: formAcademicYear,
            note,
          });
          await recordAuditLog({ action: 'create', entityType: 'transaction', entityId: selectedSchool.id, entityName: selectedSchool.name, details: `နှစ်စဉ်ကြေး ${numericAmount.toLocaleString('my-MM')} ကျပ် (${formAcademicYear}, ${voucherNo})` });
        }
      } else {
        // Other fee types have no school flag — plain transaction. The
        // voucher is generated from a freshly fetched list so two admins
        // recording the same day cannot collide on the number.
        const freshSnap = await getDocs(collection(db, 'transactions'));
        const freshList = freshSnap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord));
        const newVoucherNo = generateVoucherNo(paidDate, freshList);
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
        });
        await recordAuditLog({ action: 'create', entityType: 'transaction', entityId: selectedSchool.id, entityName: selectedSchool.name, details: `${feeType} ${Number(amount).toLocaleString('my-MM')} ကျပ် (${formAcademicYear}, ${newVoucherNo})` });
      }

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
    const target = transactions.find(t => t.id === id);
    // v24.13 (F5a): deleting an annual-fee transaction must also clear the
    // school's paid flag, or the flag would claim a payment that no longer
    // exists. Only when the transaction is for the school's current fee
    // year — deleting an old year's transaction must not un-pay this year.
    const isAnnualFee = target?.feeType === ANNUAL_FEE_TYPE;
    const school = isAnnualFee ? schools.find(s => s.id === target.schoolId) : undefined;
    const clearsFlag = Boolean(isAnnualFee && school && school.isAnnualFeePaid && (!target.academicYear || !school.feeAcademicYear || target.academicYear === school.feeAcademicYear));
    if (!(await confirmDialog(clearsFlag
      ? `ဤနှစ်စဉ်ကြေး မှတ်တမ်းကို ဖျက်လိုက်လျှင် "${target?.schoolName}" ၏ နှစ်စဉ်ကြေး သွင်းပြီးအမှတ်ကိုလည်း ပယ်ဖျက်ပါမည်။ သေချာပါသလား?`
      : 'ဤငွေသွင်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      if (clearsFlag && school) {
        await updateDoc(doc(db, 'schools', school.id), { isAnnualFeePaid: false, updatedAt: new Date().toISOString() });
      }
      if (target) await recordAuditLog({ action: 'delete', entityType: 'transaction', entityId: target.schoolId, entityName: target.schoolName, details: `${target.feeType} ${Number(target.amount || 0).toLocaleString('my-MM')} ကျပ် (${target.paidDate}) ဖျက်ခြင်း${clearsFlag ? ' — ကျောင်း၏ သွင်းပြီးအမှတ် ပယ်ဖျက်ခြင်း' : ''}` });
      toast.success('မှတ်တမ်း ဖျက်ပြီးပါပြီ');
      fetchTransactions();
      // v24.14: the school flag was cleared in Firestore above, but the
      // schools list in Admin only refreshes on the next data sync — tell
      // the parent to refetch now so the flag card updates at once.
      if (clearsFlag) onSchoolsChange?.();
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
    XLSX.writeFile(wb, `Finance_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('မှတ်တမ်းများကို Excel ဖြင့် ထုတ်ယူပြီးပါပြီ');
  };

  const handleMigrateData = async () => {
    const schoolsWithOldPayments = schools.filter(s => (s as any).payments && (s as any).payments.length > 0);
    if (schoolsWithOldPayments.length === 0) {
      toast.info('ရွှေ့ပြောင်းရန် မှတ်တမ်းဟောင်း မရှိပါ');
      return;
    }
    if (!(await confirmDialog(`ကျောင်း (${schoolsWithOldPayments.length}) ခုတွင် ရှိသော ငွေသွင်းမှတ်တမ်းဟောင်းများကို ရွှေ့ပြောင်းပါမည်။ သေချာပါသလား?`))) return;

    setIsMigrating(true);
    let migratedCount = 0;
    let skippedCount = 0;
    // v24.7: retry-safe migration. Before, a retry re-added every payment
    // that had already migrated (the per-school clear happened after its
    // payments, so a mid-school failure left duplicates on the next run).
    // Now each old payment is skipped when an identical transaction already
    // exists, and every migrated record gets a voucher number.
    const knownTx = [...transactions];
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      for (const school of schoolsWithOldPayments) {
        if (!(school as any).payments) continue;
        for (const payment of (school as any).payments) {
          const paidDate = payment.paidDate || todayStr;
          const alreadyThere = knownTx.some(t =>
            t.schoolId === school.id &&
            t.feeType === payment.feeType &&
            Number(t.amount) === Number(payment.amount) &&
            t.paidDate === paidDate
          );
          if (alreadyThere) { skippedCount++; continue; }
          const voucherNo = generateVoucherNo(paidDate, knownTx);
          const ref = await addDoc(collection(db, 'transactions'), {
            schoolId: school.id,
            schoolName: school.name,
            feeType: payment.feeType,
            amount: payment.amount,
            paidDate,
            note: payment.note || '',
            academicYear: globalAcademicYear,
            recordedBy: 'System Migration',
            createdAt: new Date().toISOString(),
            voucherNo
          });
          knownTx.push({ id: ref.id, schoolId: school.id, schoolName: school.name, feeType: payment.feeType, amount: payment.amount, paidDate, academicYear: globalAcademicYear, createdAt: new Date().toISOString(), voucherNo } as TransactionRecord);
          migratedCount++;
        }
        await writeBatch(db).update(doc(db, 'schools', school.id), { payments: [] }).commit();
      }
      await recordAuditLog({ action: 'create', entityType: 'transaction', details: `မှတ်တမ်းဟောင်း ရွှေ့ပြောင်းခြင်း — ${migratedCount} ခု ရွှေ့ပြီး, ${skippedCount} ခု ထပ်နေလို့ ကျော်ခြင်း` });
      toast.success(`မှတ်တမ်း (${migratedCount}) ခုကို အောင်မြင်စွာ ရွှေ့ပြောင်းပြီးပါပြီ${skippedCount > 0 ? ` (ထပ်နေသော ${skippedCount} ခု ကျော်ထားပါသည်)` : ''}`);
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
  // v24.7: the same annual-fee payment must not show twice (once as the
  // flag card, once as a transaction row) or be counted twice in the total.
  // When a matching transaction exists, it is the record — the flag card
  // hides and the total counts only the transactions. Flag-only payments
  // (recorded before v24.7) still show via the card.
  const annualFeeTx = selectedSchool ? findAnnualFeeTransaction(schoolTransactions, selectedSchool.id, selectedSchool.feeAcademicYear) : undefined;
  // v24.13 (F7): the flag card's voucher — the STORED voucher when any
  // annual-fee transaction exists for this school, else the derived number
  // for a legacy flag-only payment. (The card only shows when the
  // same-year transaction is missing, so a different-year transaction
  // can still supply the stored number.)
  const flagCardTx = selectedSchool ? findAnnualFeeTransaction(schoolTransactions, selectedSchool.id) : undefined;
  const flagCardVoucherNo = flagCardTx?.voucherNo
    || (selectedSchool?.feePaidDate ? `SSSPSFV-${new Date(selectedSchool.feePaidDate).toISOString().slice(0, 10).replace(/-/g, '')}-${selectedSchool.id.substring(0, 4).toUpperCase()}` : undefined);
  const schoolTotal = selectedSchool
    ? schoolTransactions.reduce((sum, t) => sum + t.amount, 0) + (!annualFeeTx && selectedSchool.isAnnualFeePaid ? (selectedSchool.feeAmount || 0) : 0)
    : 0;

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
                <div key={s.id} onClick={() => setSelectedSchoolId(s.id)} className={`p-3 cursor-pointer transition ${selectedSchoolId === s.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'}`}>
                  <p className="font-bold text-sm text-slate-900">{s.name}</p>
                  {s.zone && (<span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"><MapPin className="w-2.5 h-2.5" />{s.zone}</span>)}
                  {s.isAnnualFeePaid && <span className="inline-flex items-center gap-1 mt-1 ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ နှစ်စဉ်ကြေးသွင်းပြီး</span>}
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
                  <input type="number" required min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[420px] sm:h-[600px]">
          <div className="p-4 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 min-w-0">
                <History className="w-4 h-4 text-sky-600 shrink-0" /> 
                <span className="truncate">{selectedSchool ? `${selectedSchool.name} ၏ မှတ်တမ်းများ` : 'ကျောင်းတစ်ခုကို ရွေးချယ်ပါ'}</span>
              </h3>
              <button onClick={handleExportAllTransactions} className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer" title="မှတ်တမ်းအားလုံးကို Excel ဖြင့် ထုတ်ယူရန်">
                <Download className="w-3.5 h-3.5" /> Export All
              </button>
            </div>
            {selectedSchool && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                စုစုပေါင်း: {schoolTotal.toLocaleString('my-MM')} ကျပ်
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
                {selectedSchool.isAnnualFeePaid && !annualFeeTx && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center group shadow-sm animate-in fade-in">
                    <div>
                      <p className="font-bold text-sm text-emerald-900">နှစ်စဉ်ကြေး (Annual Fee) - {selectedSchool.feeAcademicYear}</p>
                      <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                        <span>{selectedSchool.feePaidDate ? new Date(selectedSchool.feePaidDate).toLocaleDateString('my-MM') : 'ရက်စွဲမရှိပါ'}</span>
                        <span>•</span>
                        <span className="font-mono font-bold">{(selectedSchool.feeAmount || 0).toLocaleString('my-MM')} ကျပ်</span>
                        {flagCardVoucherNo && (
                          <>
                            <span>•</span>
                            <span className="font-mono">ဖြတ်ပိုင်းအမှတ်: {flagCardVoucherNo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setReceiptVoucherNo(flagCardVoucherNo ?? null); setReceiptSchool(selectedSchool); }} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
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
                      {t.note && <p className="text-sm text-slate-400 mt-1">({t.note})</p>}
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/receipt/${t.id}`} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
                        <Printer className="w-4 h-4" />
                      </Link>
                      {/* v24.13 (F5c): the delete button is always visible —
                          it used to be opacity-0 until hover, so on touch
                          devices there was no hover and no way to delete. */}
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="ဖျက်ရန်">
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
        <AnnualFeeReceipt school={receiptSchool} voucherNo={receiptVoucherNo ?? undefined} paidDate={receiptSchool.feePaidDate} onClose={() => { setReceiptSchool(null); setReceiptVoucherNo(null); }} />
      )}
    </div>
  );
}
