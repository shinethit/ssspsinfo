import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DocumentItem } from '../types';
import { FileText, Download, Search, FolderOpen, ArrowLeft, File, Loader2 } from 'lucide-react';

export default function Documents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));
        const snap = await getDocs(q);
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filteredDocs = docs.filter(d =>
    (d.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm">စာရွက်စာတမ်း မရှိသေးပါ</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-sm">ရှာဖွေမှုနှင့် ကိုက်ညီသော စာရွက်စာတမ်း မရှိပါ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:bg-sky-50/50 transition group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-sky-100 group-hover:text-sky-700 transition shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{doc.category}</span>
                      {doc.uploadedAt && (
                        <span>{new Date(doc.uploadedAt).toLocaleDateString('my-MM')}</span>
                      )}
                      {doc.fileSize && <span>{doc.fileSize}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  title="ဒေါင်းလုဒ်ဆွဲရန်"
                  className="p-2.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition shadow-sm border border-sky-100 cursor-pointer shrink-0"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
