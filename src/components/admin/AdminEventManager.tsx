import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EventItem, EventRegistration } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, MapPin, Eye, EyeOff, Users } from 'lucide-react';

export default function AdminEventManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const evSnap = await getDocs(collection(db, 'events'));
      const regSnap = await getDocs(collection(db, 'event_registrations'));
      
      setEvents(evSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setRegistrations(regSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventRegistration)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        title, description, date, location, isActive: true, createdAt: new Date().toISOString()
      });
      toast.success('ပွဲစဉ်အသစ် တင်ပြီးပါပြီ');
      setTitle(''); setDescription(''); setDate(''); setLocation('');
      fetchData();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (ev: EventItem) => {
    await updateDoc(doc(db, 'events', ev.id), { isActive: !ev.isActive });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'events', id));
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Create Event Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-sky-600" /> ပွဲစဉ်အသစ် တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပွဲစဉ် ခေါင်းစဉ်" className="p-2.5 border rounded-xl text-sm" />
          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2.5 border rounded-xl text-sm" />
          <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="နေရာ (ဥပမာ - တောင်ကြီးမြို့)" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="အသေးစိတ် အကြောင်းအရာ" rows={2} className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <button type="submit" disabled={isSubmitting} className="bg-sky-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:col-span-2 justify-self-start">
            {isSubmitting ? 'တင်နေပါသည်...' : 'ပွဲစဉ် တင်မည်'}
          </button>
        </form>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော ပွဲစဉ်များ ({events.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map(ev => {
            const regCount = registrations.filter(r => r.eventId === ev.id).length;
            const totalAttendees = registrations.filter(r => r.eventId === ev.id).reduce((sum, r) => sum + r.attendeesCount, 0);
            
            return (
              <div key={ev.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-900">{ev.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.location}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${ev.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {ev.isActive ? 'ဖွင့်ထားသည်' : 'ပိတ်ထားသည်'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">စာရင်းသွင်းမှု</span>
                    <span className="font-bold text-sky-700 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {regCount} ကျောင်း ({totalAttendees} ဦး)</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(ev)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                      {ev.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
