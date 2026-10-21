import React, { useRef } from 'react';
import { School } from '../../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnualFeeReceipt({ school, onClose }: { school: School; onClose: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (format: 'pdf' | 'jpeg') => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      if (format === 'jpeg') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `Receipt_${school.name}_${new Date().getTime()}.jpeg`;
        link.click();
        toast.success('JPEG ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${school.name}_${new Date().getTime()}.pdf`);
        toast.success('PDF ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
      }
    } catch (err) {
      toast.error('ဖိုင်ထုတ်ယူရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = school.feePaidDate 
    ? new Date(school.feePaidDate).toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Controls (Hidden on Print) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h3 className="font-bold text-slate-800">ဖြတ်ပိုင်း ထုတ်ယူရန်</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => handleDownload('jpeg')} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> JPEG
            </button>
            <button onClick={() => handleDownload('pdf')} className="bg-sky-100 text-sky-800 hover:bg-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-rose-600 px-2 py-1.5 text-xs font-bold ml-2">ပိတ်မည်</button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-8 bg-slate-50 overflow-x-auto">
          <div ref={receiptRef} className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 relative overflow-hidden w-[700px] mx-auto text-slate-900" style={{ minHeight: '500px' }}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <CheckCircle2 className="w-96 h-96 text-emerald-600" />
            </div>

            <div className="text-center border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
              <h1 className="text-2xl font-black leading-snug">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း</h1>
              <p className="text-sm font-semibold text-slate-500 mt-1">သတင်းနှင့် ပြန်ကြားရေးဌာန</p>
              <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest">
                နှစ်စဉ်ကြေး ငွေလက်ခံဖြတ်ပိုင်း
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">ဖြတ်ပိုင်းအမှတ်:</span>
                  <span className="font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    {(() => {
                  const d = new Date(school.feePaidDate || new Date());
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return `SSSPSFV-${yyyy}${mm}${dd}-${school.id.substring(0, 4).toUpperCase()}`;
                })()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold block mb-1">ရက်စွဲ (Date):</span>
                  <span className="font-bold">{formattedDate}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                    <span className="font-bold text-base">{school.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအဆင့် / ဇုန်:</span>
                    <span className="font-bold">{school.level} {school.zone ? `(${school.zone})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">ကျောင်းသားဦးရေ (Range):</span>
                    <span className="font-bold">{school.studentRange || 'မသတ်မှတ်ထားပါ'} {school.studentCount ? `(${school.studentCount} ဦး)` : ''}</span>
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
                      နှစ်စဉ်ကြေး (Annual Fee) - {school.feeAcademicYear || '၂၀၂၄-၂၀၂၅'}
                    </td>
                    <td className="py-4 px-4 text-right border-b border-slate-100 font-mono font-bold">
                      {(school.feeAmount || 0).toLocaleString('my-MM')} ကျပ်
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-right font-bold text-slate-800">စုစုပေါင်း (Total):</td>
                    <td className="py-4 px-4 text-right font-mono font-black text-lg text-sky-900 bg-sky-50 rounded-br-lg">
                      {(school.feeAmount || 0).toLocaleString('my-MM')} ကျပ်
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 text-sm text-slate-600">
                <p>ဤဖြတ်ပိုင်းသည် နှစ်စဉ်ကြေး ငွေပေးသွင်းမှု အတည်ပြုချက် သက်သေအဖြစ် အသုံးပြုနိုင်ပါသည်။</p>
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
      </div>
    </div>
  );
}
