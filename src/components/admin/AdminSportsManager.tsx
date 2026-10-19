import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SportsEvent, SportsMatchResult } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Calendar } from 'lucide-react';

export default function AdminSportsManager() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [sportType, setSportType] = useState('ဘောလုံး');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'sports_events'));
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as SportsEvent)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'sports_events'), {
        title, sportType, status, startDate, location,
        results: [], createdAt: new Date().toISOString()
      });
      toast.success('အားကစားပွဲစဉ် အသစ်တင်ပြီးပါပြီ');
      setTitle(''); setStartDate(''); setLocation('');
      fetchEvents();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'sports_events', id));
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" /> အားကစားပွဲစဉ် အသစ်တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပွဲစဉ် ခေါင်းစဉ်" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={sportType} onChange={e => setSportType(e.target.value)} className="p-2.5 border rounded-xl text-sm">
            <option value="ဘောလုံး">ဘောလုံး</option>
            <option value="ဘော်လီဘော">ဘော်လီဘော</option>
            <option value="ပိုက်ဆံဘော">ပိုက်ဆံဘော</option>
            <option value="အခြား">အခြား</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="p-2.5 border rounded-xl text-sm">
            <option value="upcoming">လာမည့်ပွဲစဉ်</option>
            <option value="ongoing">ယှဉ်ပြိုင်နေဆဲ</option>
            <option value="finished">ပြီးဆုံးသွားပြီ</option>
          </select>
          <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2.5 border rounded-xl text-sm" />
          <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="ကျင်းပမည့်နေရာ" className="p-2.5 border rounded-xl text-sm" />
          <button type="submit" disabled={isSubmitting} className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:col-span-2 justify-self-start">
            {isSubmitting ? 'တင်နေပါသည်...' : 'ပွဲစဉ် တင်မည်'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော ပွဲစဉ်များ ({events.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map(ev => (
            <div key={ev.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
              <div>
                <h4 className="font-bold text-slate-900">{ev.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.startDate}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${ev.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}`}>{ev.status}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(ev.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 self-start md:self-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
