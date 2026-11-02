import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Gallery } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { Trash2, Images } from 'lucide-react';
import ImageUploadDropzone from '../ImageUploadDropzone';

export default function AdminGalleryManager() {
  const [photos, setPhotos] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gallery)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error('ဓာတ်ပုံ တင်ပေးပါ (သို့မဟုတ်) ပုံ Link ထည့်ပါ');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        title: title.trim(),
        album: album.trim(),
        imageUrl: imageUrl.trim(),
        uploadedBy: 'Admin',
        createdAt: new Date().toISOString()
      });
      toast.success('ဓာတ်ပုံ အသစ်တင်ပြီးပါပြီ');
      setTitle(''); setAlbum(''); setImageUrl('');
      fetchPhotos();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog('ဤဓာတ်ပုံကို ဖျက်ရန် သေချာပါသလား?'))) return;
    await deleteDoc(doc(db, 'gallery', id));
    toast.success('ဖျက်ပြီးပါပြီ');
    fetchPhotos();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Images className="w-5 h-5 text-sky-600" /> ဓာတ်ပုံ အသစ်တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ဓာတ်ပုံ ခေါင်းစဉ်" className="p-2.5 border rounded-xl text-sm" />
            <input required value={album} onChange={e => setAlbum(e.target.value)} placeholder="အယ်လ်ဘမ် (ဥပမာ - အားကစားပွဲ)" className="p-2.5 border rounded-xl text-sm" />
          </div>
          <ImageUploadDropzone
            value={imageUrl}
            onChange={setImageUrl}
            label="ဓာတ်ပုံ"
            helperText="ကွန်ပျူတာ/ဖုန်းထဲမှ ပုံဖိုင်ရွေးချယ်တင်သွင်းနိုင်သည် (သို့မဟုတ်) တိုက်ရိုက် URL ရိုက်ထည့်နိုင်သည်"
            folder="gallery"
          />
          <button type="submit" disabled={isSubmitting} className="bg-sky-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm justify-self-start disabled:opacity-50">
            {isSubmitting ? 'တင်နေပါသည်...' : 'ဓာတ်ပုံ တင်မည်'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော ဓာတ်ပုံများ ({photos.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">ဖွင့်နေပါသည်...</div>
        ) : photos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">ဓာတ်ပုံ မရှိသေးပါ</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {photos.map(photo => (
              <div key={photo.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
                <img src={photo.imageUrl} alt={photo.title} className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{photo.title}</h4>
                  <span className="text-xs text-slate-500 mt-1">{photo.album}{photo.createdAt ? ` • ${new Date(photo.createdAt).toLocaleDateString('my-MM')}` : ''}</span>
                </div>
                <button onClick={() => handleDelete(photo.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
