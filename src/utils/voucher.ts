import { TransactionRecord } from '../types';

export const generateVoucherNo = (paidDate: string, transactions: TransactionRecord[]): string => {
  // v24.15 (V26): guard an invalid date — an unparseable paidDate used to
  // produce 'SSSPSFV-NaNNaNNaN-0001'. Fall back to today; the caller (the
  // reuse path in finance.ts) prefers the transaction's own createdAt
  // before reaching here. Never emit NaN.
  const parsed = new Date(paidDate);
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const prefix = `SSSPSFV-${dateStr}-`;

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

  // Generate next number, padded to 4 digits.
  // KNOWN LIMITATION (V26): this is max+1 over a client-fetched list, so
  // two admins recording in the same second can still compute the same
  // number. True atomic uniqueness needs a server-side counter (e.g. a
  // Firestore counter doc updated in a transaction) — low probability
  // (two admins, same day, same second), recorded here, not fixed here.
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
};
