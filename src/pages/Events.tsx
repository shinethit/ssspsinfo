import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EventItem } from '../types';
import { toast } from 'sonner';
import { Calendar, MapPin, CheckCircle2, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// v24.13 A3(b): compare phones by digits only — Myanmar digits are
// converted to Latin FIRST, then non-digits are stripped.
function normPhoneForDupCheck(phone: string): string {
  const latin = phone.replace(/[၀-၉]/g, (d) => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(d)));
  return latin.replace(/[^0-9]/g, '');
}

// v24.13: a dateless/invalid date used to render literal 'Invalid Date'.
function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'ရက်စွဲ မဖော်ပြထားပါ';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return 'ရက်စွဲ မဖော်ပြထားပါ';
  return d.toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Events() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [schoolName, setSchoolName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // v24.13: isActive !== false (client-side) — the old
        // where('isActive','==',true) hid every old event that simply lacks
        // the field. Calendar uses the same rule now.
        const snap = await getDocs(collection(db, 'events'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem));
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // v24.6: this page is "upcoming" events — hide events whose date has
        // passed. Dateless legacy records stay visible.
        const n = new Date();
        const todayStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        setEvents(data.filter(e => e.isActive !== false).filter(e => !e.date || e.date >= todayStr));
      } catch (err) {
        console.error(err);
        // v24.13: a failed load is now an error state, not a false "no events".
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // v24.13 P6: Calendar links here with ?register=<eventId> — open the
  // registration modal for that event once the list has loaded.
  useEffect(() => {
    const regId = searchParams.get('register');
    if (regId && !loading && events.length > 0) {
      const ev = events.find(x => x.id === regId);
      if (ev) setSelectedEvent(ev);
      else toast.error('ဤပွဲကို ရှာမတွေ့ပါ');
    }
  }, [searchParams, loading, events]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!schoolName || !contactPhone) {
      toast.error('ကျောင်းအမည်နှင့် ဖုန်းနံပါတ် ဖြည့်သွင်းပါ');
      return;
    }
    // v24.6: no registering for an event that already happened
    if (selectedEvent.date) {
      const n = new Date();
      const todayStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      if (selectedEvent.date < todayStr) {
        toast.error('ဤပွဲ ပြီးသွားပါပြီ — စာရင်းသွင်း၍ မရပါ');
        return;
      }
    }

    // v24.13 A3(b): the rules cap attendeesCount at 200 — the old silent
    // write failure now gets a clear message up front.
    const count = Number(attendeesCount);
    if (!count || count < 1) { toast.error('တက်ရောက်မည့် ဦးရေ ဖြည့်သွင်းပါ'); return; }
    if (count > 200) { toast.error('တက်ရောက်မည့် ဦးရေ အများဆုံး ၂၀၀ ဦးသာ ဖြစ်ပါသည်'); return; }

    setIsSubmitting(true);
    try {
      // v24.13 A3(b): duplicate check — same event + same school name or
      // phone (digits compared, so Myanmar/Latin digits match).
      const existingSnap = await getDocs(query(collection(db, 'event_registrations'), where('eventId', '==', selectedEvent.id)));
      const normPhone = normPhoneForDupCheck(contactPhone.trim());
      const isDup = existingSnap.docs.some(d => {
        const r = d.data() as { schoolName?: string; contactPhone?: string };
        const sameName = (r.schoolName || '').trim().toLowerCase() === schoolName.trim().toLowerCase();
        const samePhone = normPhone.length > 0 && normPhoneForDupCheck(r.contactPhone || '') === normPhone;
        return sameName || samePhone;
      });
      if (isDup) { toast.error('စာရင်းသွင်းပြီးသား ဖြစ်ပါသည်'); return; }
      await addDoc(collection(db, 'event_registrations'), {
        eventId: selectedEvent.id,
        schoolName: schoolName.trim(),
        contactPhone: contactPhone.trim(),
        attendeesCount: count,
        registeredAt: new Date().toISOString()
      });
      toast.success('ပွဲ/အခမ်းအနားအတွက် စာရင်းသွင်းမှု အောင်မြင်ပါသည်!');
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
          <h1 className="text-2xl sm:text-3xl font-black">ပွဲနှင့် အခမ်းအနားများ</h1>
        </div>
        <p className="text-sky-100 text-sm max-w-2xl">လာမည့် အစည်းအဝေးများ၊ သင်တန်းများနှင့် အားကစားပွဲစဉ်များအတွက် စာရင်းသွင်းနိုင်ပါသည်</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
      ) : loadError ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 text-rose-700">
          ပွဲ/အခမ်းအနားများ ဖတ်မရပါ။ အင်တာနက် စစ်ပြီး စာမျက်နှာကို ပြန်ဖွင့်ပါ။
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          လက်ရှိတွင် ပွဲ/အခမ်းအနားအသစ်များ မရှိသေးပါ။
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
                    <Calendar className="w-4 h-4" /> {formatEventDate(ev.date)}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 my-auto">
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
                <input type="number" min="1" max="200" value={attendeesCount} onChange={e => setAttendeesCount(Number(e.target.value))} required className="w-full p-2.5 border rounded-xl text-sm" />
                <p className="text-xs text-slate-400 mt-1">အများဆုံး ၂၀၀ ဦးအထိသာ စာရင်းသွင်းနိုင်ပါသည်</p>
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
