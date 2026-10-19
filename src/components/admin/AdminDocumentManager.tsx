import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DocumentItem } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, FolderOpen, Link as LinkIcon } from 'lucide-react';

export default function AdminDocumentManager() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('စည်းမျဉ်း');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'documents'));
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'documents'), {
        title, category, fileUrl,
        uploadedAt: new Date().toISOString()
      });
      toast.success('စာရွက်စာတမ်း အသစ်တင်ပြီးပါပြီ');
      setTitle(''); setFileUrl('');
      fetchDocs();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'documents', id));
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-amber-600" /> စာရွက်စာတမ်း အသစ်တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="စာရွက်စာတမ်း အမည်" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="p-2.5 border rounded-xl text-sm">
            <option value="စည်းမျဉ်း">စည်းမျဉ်း</option>
            <option value="ဖောင်ပုံစံ">ဖောင်ပုံစံ</option>
            <option value="အစီရင်ခံစာ">အစီရင်ခံစာ</option>
          </select>
          <input required type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="ဖိုင် Link (ဥပမာ - Google Drive Link)" className="p-2.5 border rounded-xl text-sm" />
          <button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:col-span-2 justify-self-start">
            {isSubmitting ? 'တင်နေပါသည်...' : 'စာရွက်စာတမ်း တင်မည်'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော စာရွက်စာတမ်းများ ({docs.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {docs.map(docItem => (
            <div key={docItem.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
              <div>
                <h4 className="font-bold text-slate-900">{docItem.title}</h4>
                <span className="text-xs text-slate-500 mt-1">{docItem.category} • {new Date(docItem.uploadedAt).toLocaleDateString('my-MM')}</span>
              </div>
              <button onClick={() => handleDelete(docItem.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 self-start md:self-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
