import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DocumentItem } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { Plus, Trash2, FolderOpen, Link as LinkIcon, Edit2, ExternalLink } from 'lucide-react';

export default function AdminDocumentManager() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('စည်းမျဉ်း');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A2(c): document being edited (null = uploading a new document)
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

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

  // A2(c): create a new document, or save edits to the document being
  // edited (same doc — uploadedAt is preserved).
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDocId) {
        await updateDoc(doc(db, 'documents', editingDocId), { title, category, fileUrl });
        toast.success('စာရွက်စာတမ်း ပြင်ဆင်ပြီးပါပြီ');
        setEditingDocId(null);
      } else {
        await addDoc(collection(db, 'documents'), {
          title, category, fileUrl,
          uploadedAt: new Date().toISOString()
        });
        toast.success('စာရွက်စာတမ်း အသစ်တင်ပြီးပါပြီ');
      }
      setTitle(''); setFileUrl('');
      fetchDocs();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditDoc = (docItem: DocumentItem) => {
    setEditingDocId(docItem.id);
    setTitle(docItem.title || '');
    setCategory(docItem.category || 'စည်းမျဉ်း');
    setFileUrl(docItem.fileUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditDoc = () => {
    setEditingDocId(null);
    setTitle(''); setCategory('စည်းမျဉ်း'); setFileUrl('');
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog('ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
      toast.success('ဖျက်ပြီးပါပြီ');
      fetchDocs();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-amber-600" /> {editingDocId ? 'စာရွက်စာတမ်း ပြင်ဆင်ရန်' : 'စာရွက်စာတမ်း အသစ်တင်ရန်'}
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="စာရွက်စာတမ်း အမည်" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="p-2.5 border rounded-xl text-sm">
            <option value="စည်းမျဉ်း">စည်းမျဉ်း</option>
            <option value="ဖောင်ပုံစံ">ဖောင်ပုံစံ</option>
            <option value="အစီရင်ခံစာ">အစီရင်ခံစာ</option>
          </select>
          <input required type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="ဖိုင် Link (ဥပမာ - Google Drive Link)" className="p-2.5 border rounded-xl text-sm" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm justify-self-start">
              {isSubmitting ? 'တင်နေပါသည်...' : editingDocId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'စာရွက်စာတမ်း တင်မည်'}
            </button>
            {editingDocId && (
              <button type="button" onClick={cancelEditDoc} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm">
                Cancel
              </button>
            )}
          </div>
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
                <span className="text-xs text-slate-500 mt-1">{docItem.category}{docItem.uploadedAt ? ` • ${new Date(docItem.uploadedAt).toLocaleDateString('my-MM')}` : ''}</span>
              </div>
              <div className="flex gap-2 self-start md:self-center">
                {docItem.fileUrl && (
                  <a href={docItem.fileUrl} target="_blank" rel="noreferrer" title="ဖွင့်ကြည့်ရန်" className="p-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 flex items-center gap-1 text-xs font-bold">
                    <ExternalLink className="w-4 h-4" /> ဖွင့်ကြည့်ရန်
                  </a>
                )}
                <button onClick={() => startEditDoc(docItem)} title="ပြင်ဆင်ရန်" className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(docItem.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 self-start md:self-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
