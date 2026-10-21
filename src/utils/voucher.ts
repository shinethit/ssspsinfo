import { TransactionRecord } from '../types';

export const generateVoucherNo = (paidDate: string, transactions: TransactionRecord[]): string => {
  // Format date to YYYYMMDD
  const d = new Date(paidDate);
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

  // Generate next number, padded to 4 digits
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
};
