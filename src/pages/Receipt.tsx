import { useState, useEffect, useRef } from 'react';
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

  
  const displayVoucherNo = transaction.voucherNo || `SSSPSFV-${transaction.paidDate.replace(/-/g, '')}-${transaction.id.substring(0, 4).toUpperCase()}`;

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
        link.download = `Receipt_${transaction.schoolName}_${transaction.id.substring(0,4)}.jpeg`;
        link.click();
        toast.success('JPEG ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${transaction.schoolName}_${transaction.id.substring(0,4)}.pdf`);
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
                {displayVoucherNo}
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
                  <span className="font-bold">{transaction.feeType}</span>
                  {transaction.academicYear && <span className="block text-xs text-slate-600 mt-0.5">ပညာသင်နှစ်: {transaction.academicYear}</span>}
                  {transaction.note && <span className="block text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">မှတ်စု: {transaction.note}</span>}
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
            <span className="text-xs text-slate-500 font-semibold">ဘဏ္ဍာရေးမှူး</span>
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
