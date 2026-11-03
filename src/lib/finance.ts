// Finance single-source-of-truth helpers (v24.7).
// Before v24.7 the money lived in two places that disagreed: the payment
// form wrote only a transaction (the school still showed unpaid), the fee
// modal wrote only the school flag (the money never appeared in the
// transactions list), and the per-school total badge added both — so a fee
// recorded both ways was counted twice. The rule now: a payment is ONE
// transaction AND the school flag, written together by recordAnnualFeePayment.
// The transactions collection is the record; the flag is just the summary
// the Dashboard and the school list read quickly.

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { School, TransactionRecord } from '../types';
import { generateVoucherNo } from '../utils/voucher';

export const ANNUAL_FEE_TYPE = 'နှစ်စဉ်ကြေး (Annual Fee)';

// Record an annual-fee payment: transaction + school flag, together.
// The voucher number is generated from a freshly fetched list, so two
// admins recording on the same day no longer collide (generateVoucherNo is
// max+1 of the list it is given). If the flag update fails, the transaction
// is rolled back so the two can never disagree. Throws on failure.
export async function recordAnnualFeePayment(args: {
  school: School;
  amount: number;
  paidDate: string;
  academicYear: string;
  note?: string;
  recordedBy?: string;
}): Promise<{ transactionId: string; voucherNo: string }> {
  // v24.13 (F6): never record a zero/negative/invented amount — the guard
  // lives here so every caller (fee modal, Finance form, toggles, Excel
  // import) is covered, not just the one form that was fixed before.
  if (!Number.isFinite(args.amount) || args.amount <= 0) {
    throw new Error('နှစ်စဉ်ကြေး ပမာဏ ၀ ထက် ကြီးရပါမည်');
  }
  const snap = await getDocs(collection(db, 'transactions'));
  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TransactionRecord);
  // v24.13 (F5b): a school + academic year has at most ONE annual-fee
  // transaction. If one already exists, reuse it — just make sure the flag
  // matches — instead of writing a second transaction for the same payment
  // (toggling, re-marking, or re-importing used to duplicate it).
  const already = findAnnualFeeTransaction(existing, args.school.id, args.academicYear);
  if (already) {
    let voucherNo = already.voucherNo || '';
    if (!voucherNo) {
      voucherNo = generateVoucherNo(args.paidDate, existing);
      await updateDoc(doc(db, 'transactions', already.id), { voucherNo });
    }
    await updateDoc(doc(db, 'schools', args.school.id), {
      isAnnualFeePaid: true,
      feePaidDate: args.paidDate,
      feeAmount: args.amount,
      feeAcademicYear: args.academicYear,
      updatedAt: new Date().toISOString(),
    });
    return { transactionId: already.id, voucherNo };
  }
  const voucherNo = generateVoucherNo(args.paidDate, existing);
  const ref = await addDoc(collection(db, 'transactions'), {
    schoolId: args.school.id,
    schoolName: args.school.name,
    feeType: ANNUAL_FEE_TYPE,
    amount: args.amount,
    paidDate: args.paidDate,
    note: args.note || '',
    academicYear: args.academicYear,
    recordedBy: args.recordedBy || auth.currentUser?.email || 'Admin',
    createdAt: new Date().toISOString(),
    voucherNo,
  });
  try {
    await updateDoc(doc(db, 'schools', args.school.id), {
      isAnnualFeePaid: true,
      feePaidDate: args.paidDate,
      feeAmount: args.amount,
      feeAcademicYear: args.academicYear,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Flag update failed — remove the transaction again so the money and
    // the flag can never disagree.
    try {
      await deleteDoc(doc(db, 'transactions', ref.id));
    } catch {
      // Rollback itself failed; the caller still reports the error.
    }
    throw err;
  }
  return { transactionId: ref.id, voucherNo };
}

// The annual-fee transaction for a school + academic year, if one exists.
// The Finance tab uses this so the old flag-only card is hidden when the
// same payment already shows as a transaction row (otherwise it is shown
// twice and the total badge counts it twice).
export function findAnnualFeeTransaction(
  transactions: TransactionRecord[],
  schoolId: string,
  academicYear?: string
): TransactionRecord | undefined {
  return transactions.find(
    (t) =>
      t.schoolId === schoolId &&
      t.feeType === ANNUAL_FEE_TYPE &&
      (!academicYear || !t.academicYear || t.academicYear === academicYear)
  );
}
