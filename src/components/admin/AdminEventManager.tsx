import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EventItem, EventRegistration } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { Plus, Trash2, Calendar, MapPin, Eye, EyeOff, Users, Edit2, X } from 'lucide-react';
import { STANDARD_ZONES, ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';

export default function AdminEventManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A2(a): event being edited (null = creating a new event)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  // A3(a): event whose registrants are shown in the modal (null = closed)
  const [regsEvent, setRegsEvent] = useState<EventItem | null>(null);

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

  // A2(a): create a new event, or save edits to the event being edited.
  // Editing keeps the same doc (so registrations keep their eventId) and
  // preserves isActive / createdAt.
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), {
          title, description, date, location, zone: zone || '',
        });
        toast.success('ပွဲ/အခမ်းအနား ပြင်ဆင်ပြီးပါပြီ');
      } else {
        await addDoc(collection(db, 'events'), {
          title, description, date, location, zone: zone || '', eventType: 'general', isActive: true, createdAt: new Date().toISOString()
        });
        toast.success('ပွဲ/အခမ်းအနား အသစ် တင်ပြီးပါပြီ');
      }
      setTitle(''); setDescription(''); setDate(''); setLocation(''); setZone('');
      setEditingEventId(null);
      fetchData();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditEvent = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    setDate(ev.date || '');
    setLocation(ev.location || '');
    setZone((ev as any).zone || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setTitle(''); setDescription(''); setDate(''); setLocation(''); setZone('');
  };

  // A3(a): delete one registration (moderators may manage event_registrations)
  const handleDeleteRegistration = async (regId: string) => {
    if (!(await confirmDialog('ဤစာရင်းသွင်းမှုကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await deleteDoc(doc(db, 'event_registrations', regId));
      toast.success('ဖျက်ပြီးပါပြီ');
      setRegistrations(prev => prev.filter(r => r.id !== regId));
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const toggleActive = async (ev: EventItem) => {
    try {
      await updateDoc(doc(db, 'events', ev.id), { isActive: !ev.isActive });
      fetchData();
    } catch (err) {
      toast.error('ပြောင်း၍ မရပါ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog('ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('ဖျက်ပြီးပါပြီ');
      fetchData();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Event Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-sky-600" /> {editingEventId ? 'ပွဲ/အခမ်းအနား ပြင်ဆင်ရန်' : 'ပွဲ/အခမ်းအနား အသစ် တင်ရန်'}
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပွဲ/အခမ်းအနား ခေါင်းစဉ်" className="p-2.5 border rounded-xl text-sm" />
          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2.5 border rounded-xl text-sm" />
          <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="နေရာ (ဥပမာ - တောင်ကြီးမြို့)" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={zone} onChange={e => setZone(e.target.value)} className="p-2.5 border rounded-xl text-sm sm:col-span-2 bg-white">
            <option value="">- ဇုန် မသတ်မှတ် (Association-wide / အားလုံးအတွက်) -</option>
            {STANDARD_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="အသေးစိတ် အကြောင်းအရာ" rows={2} className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={isSubmitting} className="bg-sky-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm justify-self-start">
              {isSubmitting ? 'တင်နေပါသည်...' : editingEventId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'ပွဲ/အခမ်းအနား တင်မည်'}
            </button>
            {editingEventId && (
              <button type="button" onClick={cancelEditEvent} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Zone Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"><MapPin className="w-3.5 h-3.5" /></div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">ဇုန်အလိုက် စစ်ထုတ်ခြင်း (Zone Filter)</h4>
            <p className="text-xs text-slate-500">ပွဲ/အခမ်းအနားများကို ဇုန်အလိုက် စစ်ထုတ်နိုင်ပါသည်</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ZONE_FILTER_OPTIONS.map(opt => {
            const count = opt.value === 'all' ? events.length : events.filter(e => isSchoolInZone((e as any).zone, opt.value)).length;
            return (
              <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border cursor-pointer ` +
                  (zoneFilter === opt.value ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100')}>
                <span>{opt.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ` +
                  (zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော ပွဲ/အခမ်းအနားများ ({zoneFilter === 'all' ? events.length : events.filter(e => isSchoolInZone((e as any).zone, zoneFilter)).length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {(zoneFilter === 'all' ? events : events.filter(e => isSchoolInZone((e as any).zone, zoneFilter))).map(ev => {
            const regCount = registrations.filter(r => r.eventId === ev.id).length;
            const totalAttendees = registrations.filter(r => r.eventId === ev.id).reduce((sum, r) => sum + r.attendeesCount, 0);
            
            return (
              <div key={ev.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-900">{ev.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.location}</span>
                    {(ev as any).zone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <MapPin className="w-3 h-3" />{(ev as any).zone}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full font-bold ${ev.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {ev.isActive ? 'ဖွင့်ထားသည်' : 'ပိတ်ထားသည်'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setRegsEvent(ev)} className="text-right hover:bg-slate-100 rounded-lg px-2 py-1" title="စာရင်းသွင်းထားသူများ ကြည့်ရန်">
                    <span className="text-xs text-slate-500 font-bold block">စာရင်းသွင်းမှု</span>
                    <span className="font-bold text-sky-700 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {regCount} ကျောင်း ({totalAttendees} ဦး)</span>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => startEditEvent(ev)} title="ပြင်ဆင်ရန်" className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
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

      {/* A3(a): Registrants modal */}
      {regsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRegsEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">{regsEvent.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">စာရင်းသွင်းထားသော ကျောင်းများ ({registrations.filter(r => r.eventId === regsEvent.id).length} ကျောင်း)</p>
              </div>
              <button onClick={() => setRegsEvent(null)} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100">
              {registrations.filter(r => r.eventId === regsEvent.id).length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">စာရင်းသွင်းထားသူ မရှိသေးပါ</p>
              ) : (
                registrations.filter(r => r.eventId === regsEvent.id).map(reg => (
                  <div key={reg.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{reg.schoolName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {reg.contactPhone}
                        {reg.registeredAt ? ` • ${new Date(reg.registeredAt).toLocaleDateString('my-MM')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-sky-700 whitespace-nowrap">{reg.attendeesCount} ဦး</span>
                      <button onClick={() => handleDeleteRegistration(reg.id)} title="စာရင်းသွင်းမှု ဖျက်ရန်" className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
