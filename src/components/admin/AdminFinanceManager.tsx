import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, query, orderBy, deleteField, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { School, TransactionRecord } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { getGlobalAcademicYear, normalizeAcademicYear, isValidAcademicYear, isCurrentYearPaid, getCurrentAcademicYear } from '../../lib/academicYear';
import { parseStoredDate, formatMyanmarDate } from '../../lib/myanmarDate';
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
  // v24.15 (V16): the transaction's own amount + paid date for the receipt
  // (the receipt shows THESE, never the flag, never today as a fallback).
  const [receiptTxnAmount, setReceiptTxnAmount] = useState<number | null>(null);
  const [receiptTxnPaidDate, setReceiptTxnPaidDate] = useState<string | null>(null);
  // v24.15 (V18): merging duplicate same-year transactions, one group at a time.
  const [isMergingDuplicates, setIsMergingDuplicates] = useState(false);
  // v24.15 (P4): schools already backfilled with feeVoucherNo /
  // feeTransactionId this session, so the one-time backfill never repeats.
  const backfilledRef = useRef<Set<string>>(new Set());

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

  // v24.15 (V28): the global year is validated on save (normalized
  // YYYY–YYYY, Latin or Myanmar digits). An invalid value is rejected —
  // 'abc' / Latin digits / empty used to save and poison every default year.
  const handleSaveGlobalYear = () => {
    const normalized = normalizeAcademicYear(globalAcademicYear);
    if (!isValidAcademicYear(normalized)) {
      toast.error('ပညာသင်နှစ် မမှန်ကန်ပါ — ဥပမာ ၂၀၂၆-၂၀၂၇ ပုံစံဖြင့် ထည့်ပါ');
      return;
    }
    setGlobalAcademicYear(normalized);
    localStorage.setItem('global_academic_year', normalized);
    toast.success('ပညာသင်နှစ် သတ်မှတ်ချက်ကို သိမ်းဆည်းပြီးပါပြီ');
  };

  const handleBatchUpdateYear = async () => {
    // v24.15 (V28): never roll to an invalid year.
    const newYear = normalizeAcademicYear(globalAcademicYear);
    if (!isValidAcademicYear(newYear)) {
      toast.error('ပညာသင်နှစ် မမှန်ကန်ပါ — ဥပမာ ၂၀၂၆-၂၀၂၇ ပုံစံဖြင့် ထည့်ပြီး သိမ်းပြီးမှ ပြောင်းပါ');
      return;
    }
    if (!(await confirmDialog(`နှစ်စဉ်ကြေး သွင်းပြီးထားသော ကျောင်းအားလုံးကို "${newYear}" သို့ ပြောင်းလဲပါမည်။ သေချာပါသလား?`))) return;
    setIsUpdatingBatch(true);
    try {
      const q = query(collection(db, 'schools'));
      const snap = await getDocs(q);
      // v24.15 (V13): derive the OLD year PER SCHOOL from this snapshot
      // BEFORE updating any flag (each school's own stored feeAcademicYear).
      // The old code read the old year from localStorage AFTER the admin
      // had already saved the new year, so oldYear === newYear and the
      // transaction re-yearing was silently skipped — flags moved,
      // transactions didn't, and every paid school double-counted.
      const oldYearBySchool = new Map<string, string>();
      const rolledSchoolIds: string[] = [];
      // v24.15 re-audit (F5): a paid school with NO stored year is skipped
      // entirely — the old code moved its flag to the new year while its
      // transactions could never be re-yeared (oldYear '' is falsy), so the
      // flag and the money disagreed. Skipped schools are reported below.
      let skippedNoYear = 0;
      snap.docs.forEach(d => {
        if (d.data().isAnnualFeePaid) {
          const oldYear = normalizeAcademicYear(d.data().feeAcademicYear || '');
          if (!oldYear) { skippedNoYear++; return; }
          oldYearBySchool.set(d.id, oldYear);
          rolledSchoolIds.push(d.id);
        }
      });
      // Chunk the flag updates (450 ops per batch).
      for (let i = 0; i < rolledSchoolIds.length; i += 450) {
        const batch = writeBatch(db);
        rolledSchoolIds.slice(i, i + 450).forEach(id => {
          batch.update(doc(db, 'schools', id), { feeAcademicYear: newYear });
        });
        await batch.commit();
      }
      const count = rolledSchoolIds.length;
      // Re-year each school's transactions from ITS OWN old year, so the
      // flag and the transaction agree on the year again.
      let txCount = 0;
      if (count > 0) {
        const txSnap = await getDocs(collection(db, 'transactions'));
        const toReyear: string[] = [];
        txSnap.docs.forEach(d => {
          const t = d.data();
          const oldYear = oldYearBySchool.get(t.schoolId);
          if (
            oldYear && oldYear !== newYear &&
            rolledSchoolIds.includes(t.schoolId) &&
            t.feeType === ANNUAL_FEE_TYPE &&
            normalizeAcademicYear(t.academicYear || '') === oldYear
          ) {
            toReyear.push(d.id);
          }
        });
        for (let i = 0; i < toReyear.length; i += 450) {
          const txBatch = writeBatch(db);
          toReyear.slice(i, i + 450).forEach(id => {
            txBatch.update(doc(db, 'transactions', id), { academicYear: newYear });
          });
          await txBatch.commit();
        }
        txCount = toReyear.length;
      }
      toast.success(`ကျောင်း (${count}) ခု၏ ပညာသင်နှစ်ကို ပြောင်းလဲပြီးပါပြီ${txCount > 0 ? `၊ မှတ်တမ်း (${txCount}) ခုကိုလည်း ပြောင်းလဲပြီးပါပြီ` : ''}${skippedNoYear > 0 ? `၊ ပညာသင်နှစ် မရှိသော ကျောင်း (${skippedNoYear}) ခုကို မပြောင်းလဲပါ` : ''}`);
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
      // v24.15 (V14): the year is normalized on submit (Latin digits /
      // spaces become the canonical Myanmar-digit year) before anything
      // is written or compared.
      const normalizedYear = normalizeAcademicYear(formAcademicYear) || getGlobalAcademicYear();
      // v24.15 re-audit (F6): a typed year must be valid — 'abc' used to be
      // stored verbatim on the transaction. Reject it here.
      if (!isValidAcademicYear(normalizedYear)) { toast.error('ပညာသင်နှစ် မမှန်ကန်ပါ — ဥပမာ ၂၀၂၆-၂၀၂၇ ပုံစံဖြင့် ထည့်ပါ'); return; }
      if (feeType === ANNUAL_FEE_TYPE) {
        // v24.7: one write path does both — the transaction AND the school's
        // paid flag. Recording only one used to leave the two disagreeing.
        // v24.15 (V15 + V30): recordAnnualFeePayment reuses an existing
        // same-year transaction when there is one (the flag then mirrors
        // THAT transaction's amount/date) and reports `reused` — the toast
        // and audit log must say so instead of claiming new money moved.
        const result = await recordAnnualFeePayment({
          school: selectedSchool,
          amount: numericAmount,
          paidDate,
          academicYear: normalizedYear,
          note,
        });
        await recordAuditLog({
          action: result.reused ? 'update' : 'create',
          entityType: 'transaction',
          entityId: selectedSchool.id,
          entityName: selectedSchool.name,
          details: result.reused
            ? `နှစ်စဉ်ကြေး (${normalizedYear}) — ရှိပြီးသား မှတ်တမ်း ပြန်သုံးခြင်း (${result.voucherNo || 'voucher မရှိ'})၊ ပမာဏ ${result.amount.toLocaleString('my-MM')} ကျပ်၊ ရက်စွဲ ${result.paidDate} — ငွေအသစ် မသွင်းပါ`
            : `နှစ်စဉ်ကြေး ${result.amount.toLocaleString('my-MM')} ကျပ် (${normalizedYear}, ${result.voucherNo})`,
        });
        if (result.reused) {
          toast.success(`ဤကျောင်းအတွက် ${normalizedYear} ခုနှစ်တွင် နှစ်စဉ်ကြေး မှတ်တမ်း ရှိပြီးသားဖြစ်သည် — အမှတ်အသားကို ရှိပြီးသား မှတ်တမ်း (${result.amount.toLocaleString('my-MM')} ကျပ်) နှင့် ကိုက်ညီအောင် ပြင်ဆင်ပြီးပါပြီ (ငွေအသစ် မသွင်းပါ)`);
        } else {
          toast.success('ငွေသွင်းမှု မှတ်တမ်းတင်ပြီးပါပြီ');
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
          academicYear: normalizedYear,
          recordedBy: auth.currentUser?.email || 'Admin',
          createdAt: new Date().toISOString(),
          voucherNo: newVoucherNo
        });
        await recordAuditLog({ action: 'create', entityType: 'transaction', entityId: selectedSchool.id, entityName: selectedSchool.name, details: `${feeType} ${Number(amount).toLocaleString('my-MM')} ကျပ် (${normalizedYear}, ${newVoucherNo})` });
        toast.success('ငွေသွင်းမှု မှတ်တမ်းတင်ပြီးပါပြီ');
      }

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
    // v24.15 (V25): a year-less transaction must NOT clear the flag unless
    // it is the transaction the flag was built from. Match it by the
    // stored transaction id when present, else by paidDate + amount
    // against the flag's own values. A year-less record matching neither
    // is an old/legacy record — deleting it leaves the flag alone.
    const flagTxIdMatches = Boolean(school?.feeTransactionId && school.feeTransactionId === target?.id);
    const flagValuesMatch = Boolean(
      school && target && !target.academicYear &&
      school.feePaidDate && school.feePaidDate === target.paidDate &&
      Number(school.feeAmount || 0) === Number(target.amount || 0)
    );
    const clearsFlag = Boolean(isAnnualFee && school && school.isAnnualFeePaid && (
      flagTxIdMatches ||
      (target.academicYear && school.feeAcademicYear && normalizeAcademicYear(target.academicYear) === normalizeAcademicYear(school.feeAcademicYear)) ||
      flagValuesMatch
    ));
    if (!(await confirmDialog(clearsFlag
      ? `ဤနှစ်စဉ်ကြေး မှတ်တမ်းကို ဖျက်လိုက်လျှင် "${target?.schoolName}" ၏ နှစ်စဉ်ကြေး သွင်းပြီးအမှတ်ကိုလည်း ပယ်ဖျက်ပါမည်။ သေချာပါသလား?`
      : 'ဤငွေသွင်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      // v24.15 (V24): flag-clear + transaction delete go in ONE batch so
      // they commit together — the old order (delete first, then flag)
      // could leave the transaction deleted while the flag still claimed
      // paid. If the batch fails, nothing was written, so the flag needs
      // no restore.
      const batch = writeBatch(db);
      batch.delete(doc(db, 'transactions', id));
      if (clearsFlag && school) {
        // v24.15 re-audit (F1): also clear the stale fee amount / paid date
        // / year — the old batch cleared only the flag + voucher + tx id, so
        // the portal fee card showed "ပေးသွင်းရန် ကျန်ရှိပါသည်" PLUS the
        // old amount/date/year. Same fields toggle-OFF already clears.
        batch.update(doc(db, 'schools', school.id), {
          isAnnualFeePaid: false,
          feeVoucherNo: deleteField(),
          feeTransactionId: deleteField(),
          feeAmount: deleteField(),
          feePaidDate: deleteField(),
          feeAcademicYear: deleteField(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
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

  // v24.15 (V18): merge one duplicate group — keep the earliest
  // transaction (by createdAt, then paidDate), delete the rest. Never
  // silent: the admin confirms first and the merge is audit-logged.
  const handleMergeDuplicates = async (schoolId: string, academicYear: string, group: TransactionRecord[]) => {
    const school = schools.find(s => s.id === schoolId);
    const sorted = [...group].sort((a, b) =>
      String(a.createdAt || a.paidDate || '').localeCompare(String(b.createdAt || b.paidDate || '')));
    const keep = sorted[0];
    const extras = sorted.slice(1);
    if (!keep || extras.length === 0) return;
    if (!(await confirmDialog(`"${school?.name || schoolId}" — ${academicYear} ခုနှစ်တွင် နှစ်စဉ်ကြေး မှတ်တမ်း (${group.length}) ခု ထပ်နေပါသည်။ အစောဆုံး မှတ်တမ်း (${keep.voucherNo || keep.paidDate}၊ ${Number(keep.amount || 0).toLocaleString('my-MM')} ကျပ်) ကိုသာ ထားပြီး ကျန် (${extras.length}) ခုကို ဖျက်ပါမည်။ သေချာပါသလား?`))) return;
    setIsMergingDuplicates(true);
    try {
      const batch = writeBatch(db);
      extras.forEach(t => batch.delete(doc(db, 'transactions', t.id)));
      await batch.commit();
      // v24.15 re-audit (F2): if the school flag pointed at one of the
      // deleted extras (or at no transaction at all), re-point it at the
      // kept transaction and mirror the kept amount/date/year — otherwise
      // the portal's receipt link vanishes (flag id deleted) or the flag
      // and Finance disagree again. Only when the flag's year is this
      // group's year (or the flag has no year and the group is this year);
      // a flag for another year is untouched.
      if (school) {
        const flagYear = normalizeAcademicYear(school.feeAcademicYear || '');
        const groupYear = normalizeAcademicYear(academicYear);
        if ((flagYear === groupYear || (!flagYear && groupYear === getCurrentAcademicYear())) && school.feeTransactionId !== keep.id) {
          await updateDoc(doc(db, 'schools', school.id), {
            feeTransactionId: keep.id,
            feeVoucherNo: keep.voucherNo || '',
            feeAmount: keep.amount,
            feePaidDate: keep.paidDate,
            feeAcademicYear: keep.academicYear || academicYear,
            updatedAt: new Date().toISOString(),
          });
          onSchoolsChange?.();
        }
      }
      await recordAuditLog({ action: 'delete', entityType: 'transaction', entityId: schoolId, entityName: school?.name || schoolId, details: `ထပ်နေသော နှစ်စဉ်ကြေး မှတ်တမ်း ပေါင်းခြင်း (${academicYear}) — (${extras.length}) ခု ဖျက်ပြီး၊ ${keep.voucherNo || keep.paidDate} ကို ထားခြင်း` });
      toast.success(`ထပ်နေသော မှတ်တမ်း (${extras.length}) ခုကို ဖျက်ပြီး တစ်ခုတည်း ထားလိုက်ပါပြီ`);
      fetchTransactions();
    } catch (err) {
      toast.error('ပေါင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsMergingDuplicates(false);
    }
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
    // v24.15 (V20): each old payment keeps ITS OWN year/date when known
    // (only falling back to the global year/today when the old record has
    // none); an annual-fee payment is skipped when a same-year annual-fee
    // transaction already exists for that school; and the school flag is
    // set from the migrated payment when the school has no current-year
    // transaction.
    const knownTx = [...transactions];
    const todayStr = new Date().toISOString().split('T')[0];
    const globalYear = normalizeAcademicYear(globalAcademicYear) || getGlobalAcademicYear();
    try {
      for (const school of schoolsWithOldPayments) {
        if (!(school as any).payments) continue;
        for (const payment of (school as any).payments) {
          const paidDate = payment.paidDate || todayStr;
          const paymentYear = normalizeAcademicYear(payment.academicYear || payment.feeAcademicYear || '') || globalYear;
          // v24.15 (V20): a same-year annual-fee transaction already exists
          // — migrating this old payment would create a second one.
          if (payment.feeType === ANNUAL_FEE_TYPE && findAnnualFeeTransaction(knownTx, school.id, paymentYear)) {
            skippedCount++;
            continue;
          }
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
            academicYear: paymentYear,
            recordedBy: 'System Migration',
            createdAt: new Date().toISOString(),
            voucherNo
          });
          knownTx.push({ id: ref.id, schoolId: school.id, schoolName: school.name, feeType: payment.feeType, amount: payment.amount, paidDate, academicYear: paymentYear, createdAt: new Date().toISOString(), voucherNo } as TransactionRecord);
          migratedCount++;
          // v24.15 (V20): set the flag from the migrated payment when the
          // school has no current-year annual-fee transaction — but never
          // overwrite a flag that belongs to a DIFFERENT year (that year's
          // payment is the current one; this old payment is history).
          const flagIsOtherYear = Boolean(
            school.isAnnualFeePaid && school.feeAcademicYear &&
            normalizeAcademicYear(school.feeAcademicYear) !== paymentYear
          );
          if (payment.feeType === ANNUAL_FEE_TYPE && !flagIsOtherYear) {
            await updateDoc(doc(db, 'schools', school.id), {
              isAnnualFeePaid: true,
              feePaidDate: paidDate,
              feeAmount: payment.amount,
              feeAcademicYear: paymentYear,
              feeVoucherNo: voucherNo,
              feeTransactionId: ref.id,
              updatedAt: new Date().toISOString(),
            });
          }
        }
        await writeBatch(db).update(doc(db, 'schools', school.id), { payments: [] }).commit();
      }
      await recordAuditLog({ action: 'create', entityType: 'transaction', details: `မှတ်တမ်းဟောင်း ရွှေ့ပြောင်းခြင်း — ${migratedCount} ခု ရွှေ့ပြီး, ${skippedCount} ခု ထပ်နေလို့ ကျော်ခြင်း` });
      toast.success(`မှတ်တမ်း (${migratedCount}) ခုကို အောင်မြင်စွာ ရွှေ့ပြောင်းပြီးပါပြီ${skippedCount > 0 ? ` (ထပ်နေသော ${skippedCount} ခု ကျော်ထားပါသည်)` : ''}`);
      fetchTransactions();
      // v24.15 (V20): the migration may have set school flags — refresh
      // the schools list so the flag cards update at once.
      onSchoolsChange?.();
    } catch (err) {
      toast.error('ရွှေ့ပြောင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsMigrating(false);
    }
  };

  // v24.15 (P4): one-time backfill — a paid school whose doc has no
  // feeTransactionId yet, but DOES have a same-year annual-fee
  // transaction, gets feeVoucherNo + feeTransactionId written onto the
  // school doc once, so legacy paid schools get their voucher/link too
  // (and the portal can read them from the school doc alone).
  useEffect(() => {
    if (!selectedSchool?.isAnnualFeePaid || selectedSchool.feeTransactionId) return;
    if (backfilledRef.current.has(selectedSchool.id)) return;
    const tx = findAnnualFeeTransaction(
      transactions.filter(t => t.schoolId === selectedSchool.id),
      selectedSchool.id,
      normalizeAcademicYear(selectedSchool.feeAcademicYear || '')
    );
    if (!tx) return;
    // v24.15 re-audit (F9): only backfill when the found transaction's year
    // matches the flag's year (or the current year, when the flag has no
    // year) — with an empty flag year the lookup's leniency returns the
    // newest transaction regardless of year, and attaching last year's
    // voucher to this year's flag would be wrong.
    const flagYear = normalizeAcademicYear(selectedSchool.feeAcademicYear || '');
    const txYear = normalizeAcademicYear(tx.academicYear || '');
    if (flagYear ? txYear !== flagYear : txYear !== getCurrentAcademicYear()) return;
    backfilledRef.current.add(selectedSchool.id);
    updateDoc(doc(db, 'schools', selectedSchool.id), {
      feeVoucherNo: tx.voucherNo || '',
      feeTransactionId: tx.id,
      updatedAt: new Date().toISOString(),
    }).then(() => onSchoolsChange?.()).catch((err) => {
      console.error('Fee voucher backfill failed:', err);
      backfilledRef.current.delete(selectedSchool.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool?.id, selectedSchool?.isAnnualFeePaid, selectedSchool?.feeTransactionId, transactions.length]);

  // v24.15 (V18): duplicate same-year annual-fee transactions across ALL
  // schools (school + normalized year, count > 1). Shown as a warning
  // banner with a merge action — never auto-deleted silently.
  const duplicateGroups = (() => {
    const byKey = new Map<string, TransactionRecord[]>();
    for (const t of transactions) {
      if (t.feeType !== ANNUAL_FEE_TYPE) continue;
      // v24.15 re-audit (F3): year-less transactions used to be skipped, so
      // their duplicates were invisible. They group under "ပညာသင်နှစ် မရှိ".
      const key = `${t.schoolId}|${normalizeAcademicYear(t.academicYear || '')}`;
      const list = byKey.get(key) || [];
      list.push(t);
      byKey.set(key, list);
    }
    return [...byKey.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([key, list]) => {
        const [schoolId, academicYear] = key.split('|');
        return { schoolId, academicYear: academicYear || 'ပညာသင်နှစ် မရှိ', list, school: schools.find(s => s.id === schoolId) };
      });
  })();

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
  // v24.15 (V17): the flag card's voucher comes from the SAME-YEAR
  // transaction only (the school's current feeAcademicYear, normalized).
  // The old no-year lookup returned the first annual-fee transaction of
  // ANY year, so the card + receipt could show another year's voucher.
  // If no same-year transaction exists, there is no stored voucher — the
  // derived number below is only for a legacy flag-only payment, and it
  // belongs to the flag's own year.
  const flagCardTx = selectedSchool ? findAnnualFeeTransaction(schoolTransactions, selectedSchool.id, normalizeAcademicYear(selectedSchool.feeAcademicYear || '')) : undefined;
  const derivedFlagVoucherNo = (() => {
    if (!selectedSchool?.feePaidDate) return undefined;
    const d = new Date(selectedSchool.feePaidDate);
    if (Number.isNaN(d.getTime())) return undefined;
    return `SSSPSFV-${d.toISOString().slice(0, 10).replace(/-/g, '')}-${selectedSchool.id.substring(0, 4).toUpperCase()}`;
  })();
  const flagCardVoucherNo = selectedSchool?.feeVoucherNo || flagCardTx?.voucherNo || derivedFlagVoucherNo;
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

      {duplicateGroups.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2">
          <p className="text-sm font-bold text-rose-900">⚠️ ထပ်နေသော နှစ်စဉ်ကြေး မှတ်တမ်းများ တွေ့ရှိပါသည် — စုစုပေါင်း မှားယွင်းနိုင်ပါသည်</p>
          {duplicateGroups.map(g => (
            <div key={`${g.schoolId}|${g.academicYear}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-rose-100 rounded-lg px-3 py-2">
              <p className="text-xs text-rose-800">
                <span className="font-bold">{g.school?.name || g.schoolId}</span> — {g.academicYear} ခုနှစ်၊ မှတ်တမ်း ({g.list.length}) ခု
                ({g.list.map(t => `${Number(t.amount || 0).toLocaleString('my-MM')} ကျပ်`).join(' + ')})
              </p>
              <button
                onClick={() => handleMergeDuplicates(g.schoolId, g.academicYear, g.list)}
                disabled={isMergingDuplicates}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isMergingDuplicates ? 'ပေါင်းနေပါသည်...' : 'အစောဆုံးတစ်ခုသာ ထားပြီး ပေါင်းမည်'}
              </button>
            </div>
          ))}
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
                  {isCurrentYearPaid(s) && <span className="inline-flex items-center gap-1 mt-1 ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ နှစ်စဉ်ကြေးသွင်းပြီး</span>}
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
                        {/* v24.15 re-audit (G4): hardcoded Myanmar date — the
                            old Intl 'my-MM' render fell back to English on
                            the user's phone and showed 'Invalid Date'. */}
                        <span>{formatMyanmarDate(parseStoredDate(selectedSchool.feePaidDate))}</span>
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
                      {/* v24.15 (V16): pass the transaction's own amount +
                          date into the receipt (same-year tx when there is
                          one, else the flag's own values) — the receipt
                          shows THESE, never the flag by itself, never today. */}
                      <button onClick={() => { setReceiptVoucherNo(flagCardVoucherNo ?? null); setReceiptTxnAmount(flagCardTx?.amount ?? selectedSchool.feeAmount ?? null); setReceiptTxnPaidDate(flagCardTx?.paidDate ?? selectedSchool.feePaidDate ?? null); setReceiptSchool(selectedSchool); }} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
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
                        <span>{formatMyanmarDate(parseStoredDate(t.paidDate))}</span>
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
        <AnnualFeeReceipt school={receiptSchool} voucherNo={receiptVoucherNo ?? undefined} paidDate={receiptSchool.feePaidDate} txnAmount={receiptTxnAmount} txnPaidDate={receiptTxnPaidDate} onClose={() => { setReceiptSchool(null); setReceiptVoucherNo(null); setReceiptTxnAmount(null); setReceiptTxnPaidDate(null); }} />
      )}
    </div>
  );
}
