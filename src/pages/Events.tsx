import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EventItem } from '../types';
import { toast } from 'sonner';
import { Calendar, MapPin, CheckCircle2, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem));
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!schoolName || !contactPhone) {
      toast.error('ကျောင်းအမည်နှင့် ဖုန်းနံပါတ် ဖြည့်သွင်းပါ');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'event_registrations'), {
        eventId: selectedEvent.id,
        schoolName: schoolName.trim(),
        contactPhone: contactPhone.trim(),
        attendeesCount: Number(attendeesCount),
        registeredAt: new Date().toISOString()
      });
      toast.success('ပွဲစဉ်အတွက် စာရင်းသွင်းမှု အောင်မြင်ပါသည်!');
      setSelectedEvent(null);
      setSchoolName('');
      setContactPhone('');
      setAttendeesCount(1);
    } catch (err) {
      toast.error('စာရင်းသွင်း၍ မရပါ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black">ပွဲစဉ်များနှင့် သင်တန်းများ</h1>
        </div>
        <p className="text-sky-100 text-sm max-w-2xl">လာမည့် အစည်းအဝေးများ၊ သင်တန်းများနှင့် အားကစားပွဲစဉ်များအတွက် စာရင်းသွင်းနိုင်ပါသည်</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          လက်ရှိတွင် ပွဲစဉ်အသစ်များ မရှိသေးပါ။
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-sky-300 transition">
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900">{ev.title}</h3>
                <p className="text-sm text-slate-600">{ev.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-100">
                    <Calendar className="w-4 h-4" /> {new Date(ev.date).toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-100">
                    <MapPin className="w-4 h-4" /> {ev.location}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(ev)}
                className="bg-sky-900 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition shrink-0"
              >
                စာရင်းသွင်းမည်
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 mb-1">စာရင်းသွင်းခြင်း</h3>
            <p className="text-xs text-sky-700 font-semibold mb-4">{selectedEvent.title}</p>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ကျောင်းအမည် *</label>
                <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} required className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ဆက်သွယ်ရန် ဖုန်း *</label>
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">တက်ရောက်မည့် ဦးရေ</label>
                <input type="number" min="1" value={attendeesCount} onChange={e => setAttendeesCount(Number(e.target.value))} required className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedEvent(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">မလုပ်တော့ပါ</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-sky-900 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                  {isSubmitting ? 'ပို့နေပါသည်...' : 'အတည်ပြုမည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
