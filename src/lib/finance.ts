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
import { normalizeAcademicYear } from './academicYear';

export const ANNUAL_FEE_TYPE = 'နှစ်စဉ်ကြေး (Annual Fee)';

// v24.15 (V30): what recordAnnualFeePayment reports back. `reused` is true
// when a transaction for this school+year already existed — no new money
// moved, the flag was just mirrored to the existing transaction. Callers
// MUST use `reused` for the toast wording ('update' on reuse) and the
// audit-log action ('update' on reuse vs 'create' on new). On reuse,
// `amount` / `paidDate` are the EXISTING transaction's values, never the
// new args' values.
export interface RecordAnnualFeePaymentResult {
  transactionId: string;
  voucherNo: string;
  reused: boolean;
  amount: number;
  paidDate: string;
  academicYear: string;
}

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
}): Promise<RecordAnnualFeePaymentResult> {
  // v24.13 (F6): never record a zero/negative/invented amount — the guard
  // lives here so every caller (fee modal, Finance form, toggles, Excel
  // import) is covered, not just the one form that was fixed before.
  if (!Number.isFinite(args.amount) || args.amount <= 0) {
    throw new Error('နှစ်စဉ်ကြေး ပမာဏ ၀ ထက် ကြီးရပါမည်');
  }
  // v24.15 (V14): the year is stored normalized (Myanmar digits,
  // '၂၀၂၆-၂၀၂၇') on every write path, so a Latin-digit / spaced year can
  // never defeat the duplicate guard again.
  const academicYear = normalizeAcademicYear(args.academicYear);
  const snap = await getDocs(collection(db, 'transactions'));
  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TransactionRecord);
  // v24.13 (F5b): a school + academic year has at most ONE annual-fee
  // transaction. If one already exists, reuse it — just make sure the flag
  // matches — instead of writing a second transaction for the same payment
  // (toggling, re-marking, or re-importing used to duplicate it).
  const already = findAnnualFeeTransaction(existing, args.school.id, academicYear);
  if (already) {
    let voucherNo = already.voucherNo || '';
    if (!voucherNo) {
      // v24.15 (V26): a reuse voucher is generated from the EXISTING
      // transaction's own paidDate — never the new args' date, which may
      // be today while the payment is old. Guard an invalid stored date
      // by falling back to the transaction's createdAt, then today.
      const reuseDate = isValidDateString(already.paidDate)
        ? already.paidDate
        : isValidDateString(already.createdAt)
          ? already.createdAt
          : new Date().toISOString().split('T')[0];
      voucherNo = generateVoucherNo(reuseDate, existing);
      await updateDoc(doc(db, 'transactions', already.id), { voucherNo });
    }
    // v24.15 (V15 + P4): on reuse the flag MIRRORS the existing
    // transaction (its amount and date, not the new args), and the school
    // doc stores the voucher + transaction id so the portal/receipt can
    // load them from the school doc alone. (A legacy transaction missing
    // its date/amount falls back to '' / the new amount so updateDoc never
    // receives undefined.)
    const mirrorAmount = Number.isFinite(already.amount) ? already.amount : args.amount;
    const mirrorDate = already.paidDate || '';
    await updateDoc(doc(db, 'schools', args.school.id), {
      isAnnualFeePaid: true,
      feePaidDate: mirrorDate,
      feeAmount: mirrorAmount,
      feeAcademicYear: academicYear,
      feeVoucherNo: voucherNo,
      feeTransactionId: already.id,
      updatedAt: new Date().toISOString(),
    });
    return { transactionId: already.id, voucherNo, reused: true, amount: mirrorAmount, paidDate: mirrorDate, academicYear };
  }
  const voucherNo = generateVoucherNo(args.paidDate, existing);
  const ref = await addDoc(collection(db, 'transactions'), {
    schoolId: args.school.id,
    schoolName: args.school.name,
    feeType: ANNUAL_FEE_TYPE,
    amount: args.amount,
    paidDate: args.paidDate,
    note: args.note || '',
    academicYear,
    recordedBy: args.recordedBy || auth.currentUser?.email || 'Admin',
    createdAt: new Date().toISOString(),
    voucherNo,
  });
  try {
    // v24.15 (P4): store the voucher + transaction id on the school doc in
    // the same update as the flag (moderator write, allowed by the rules).
    await updateDoc(doc(db, 'schools', args.school.id), {
      isAnnualFeePaid: true,
      feePaidDate: args.paidDate,
      feeAmount: args.amount,
      feeAcademicYear: academicYear,
      feeVoucherNo: voucherNo,
      feeTransactionId: ref.id,
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
  return { transactionId: ref.id, voucherNo, reused: false, amount: args.amount, paidDate: args.paidDate, academicYear };
}

function isValidDateString(value: string | undefined): value is string {
  return !!value && !Number.isNaN(new Date(value).getTime());
}

// All annual-fee transactions for a school (+ year when given), in list order.
export function findAllAnnualFeeTransactions(
  transactions: TransactionRecord[],
  schoolId: string,
  academicYear?: string
): TransactionRecord[] {
  const wantYear = academicYear ? normalizeAcademicYear(academicYear) : '';
  return transactions.filter(
    (t) =>
      t.schoolId === schoolId &&
      t.feeType === ANNUAL_FEE_TYPE &&
      (!wantYear || !t.academicYear || normalizeAcademicYear(t.academicYear) === wantYear)
  );
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
  // v24.15 (V14): normalize BOTH sides before comparing — a Latin-digit
  // year ('2026-2027') and a Myanmar-digit year ('၂၀၂၆-၂၀၂၇') are the
  // same year. A missing year on either side still matches (legacy
  // leniency for year-less transactions).
  return findAllAnnualFeeTransactions(transactions, schoolId, academicYear)[0];
}
