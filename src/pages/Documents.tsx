import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Download, Search, FolderOpen, ArrowLeft, File } from 'lucide-react';

export default function Documents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const mockDocs = [
    { id: '1', title: 'အသင်းစည်းမျဉ်းနှင့် စည်းကမ်းချက်များ (၂၀၂၆)', category: 'စည်းမျဉ်း', fileSize: '2.4 MB', date: '2026-01-10' },
    { id: '2', title: 'ကိုယ်ပိုင်ကျောင်း မှတ်ပုံတင်ဖောင်ပုံစံ', category: 'ဖောင်ပုံစံ', fileSize: '1.1 MB', date: '2026-02-15' },
    { id: '3', title: '၂၀၂၅-၂၀၂၆ ပညာသင်နှစ် အစီရင်ခံစာ', category: 'အစီရင်ခံစာ', fileSize: '5.8 MB', date: '2026-03-20' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">စာရွက်စာတမ်း စင်တာ</h1>
            <p className="text-sm text-slate-500">အသင်းနှင့် သက်ဆိုင်သော ဖိုင်များကို ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="ဖိုင်အမည် ရှာဖွေရန်..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {mockDocs.filter(d => d.title.includes(searchQuery)).map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:bg-sky-50/50 transition group">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-sky-100 group-hover:text-sky-700 transition">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{doc.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{doc.category}</span>
                    <span>{doc.date}</span>
                    <span>{doc.fileSize}</span>
                  </div>
                </div>
              </div>
              <button className="p-2.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition shadow-sm border border-sky-100 cursor-pointer">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
