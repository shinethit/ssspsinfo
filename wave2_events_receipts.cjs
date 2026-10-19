const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Wave 2: Event Registration နှင့် Print Receipt စနစ် ထည့်သွင်းနေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. Update Types
// ==========================================
const typesPath = path.join(srcDir, 'types', 'index.ts');
if (fs.existsSync(typesPath)) {
  let content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes('export interface EventItem')) {
    content += `

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  schoolName: string;
  contactPhone: string;
  attendeesCount: number;
  registeredAt: string;
}
`;
    fs.writeFileSync(typesPath, content, 'utf8');
  }
}

// ==========================================
// 2. Create Receipt.tsx (Printable Invoice)
// ==========================================
const receiptPath = path.join(pagesDir, 'Receipt.tsx');
const receiptContent = `import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const { getSchoolById } = useData();
  const school = id ? getSchoolById(id) : null;

  if (!school) return <div className="p-10 text-center">ကျောင်းအချက်အလက် ရှာမတွေ့ပါ</div>;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Non-printable controls */}
      <div className="flex items-center justify-between print:hidden">
        <Link to="/admin?tab=schools" className="inline-flex items-center gap-2 text-sm font-bold text-sky-800 hover:text-sky-950">
          <ArrowLeft className="w-4 h-4" /> နောက်သို့
        </Link>
        <button onClick={handlePrint} className="bg-sky-900 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <CheckCircle2 className="w-96 h-96 text-emerald-600" />
        </div>

        {/* Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">သတင်းနှင့် ပြန်ကြားရေးဌာန</p>
          <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest">
            နှစ်စဉ်ကြေး ငွေလက်ခံဖြတ်ပိုင်း
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 relative z-10">
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-slate-500 font-semibold block mb-1">ဖြတ်ပိုင်းအမှတ် (Receipt No):</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                INV-{new Date().getFullYear()}-{school.id.substring(0, 5).toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-semibold block mb-1">ရက်စွဲ (Date):</span>
              <span className="font-bold text-slate-900">{currentDate}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအမည်:</span>
                <span className="font-bold text-slate-900 text-base">{school.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">ကျောင်းအဆင့်:</span>
                <span className="font-bold text-slate-900">{school.level}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">မြို့နယ် / မြို့:</span>
                <span className="font-bold text-slate-900">{school.township || school.city || 'မသတ်မှတ်ထားပါ'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">ပညာသင်နှစ်:</span>
                <span className="font-bold text-slate-900">{school.feeAcademicYear || '၂၀၂၄-၂၀၂၅'}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="py-3 px-4 text-left font-bold border-b border-slate-300">အကြောင်းအရာ (Description)</th>
                <th className="py-3 px-4 text-right font-bold border-b border-slate-300">ပမာဏ (Amount)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 px-4 border-b border-slate-100">
                  အသင်းဝင် နှစ်စဉ်ကြေး (Annual Membership Fee)
                  {school.studentRange && <span className="block text-xs text-slate-500 mt-1">(ကျောင်းသားဦးရေ: {school.studentRange} ဦး)</span>}
                </td>
                <td className="py-4 px-4 text-right border-b border-slate-100 font-mono font-bold">
                  {Number(school.feeAmount || 50000).toLocaleString('my-MM')} ကျပ်
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-right font-bold text-slate-800">စုစုပေါင်း (Total):</td>
                <td className="py-4 px-4 text-right font-mono font-black text-lg text-sky-900 bg-sky-50 rounded-br-lg">
                  {Number(school.feeAmount || 50000).toLocaleString('my-MM')} ကျပ်
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-4 text-sm text-slate-600">
            <p>ဤဖြတ်ပိုင်းသည် နှစ်စဉ်ကြေး ပေးသွင်းပြီးကြောင်း သက်သေအဖြစ် အသုံးပြုနိုင်ပါသည်။</p>
            {school.feePaidDate && <p className="mt-1 font-semibold text-emerald-700">ပေးသွင်းသည့်ရက်: {new Date(school.feePaidDate).toLocaleDateString('my-MM')}</p>}
          </div>
        </div>

        {/* Footer / Signature */}
        <div className="mt-16 pt-8 flex justify-between items-end relative z-10">
          <div className="text-center">
            <div className="w-32 border-b border-slate-400 mb-2"></div>
            <span className="text-xs text-slate-500 font-semibold">ငွေကိုင်ဌာန</span>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <span className="text-xs text-slate-500 font-semibold">အသင်းဥက္ကဋ္ဌ / တာဝန်ခံ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(receiptPath, receiptContent, 'utf8');
console.log("✅ Receipt.tsx (ငွေလက်ခံဖြတ်ပိုင်း) ဖန်တီးပြီးပါပြီ");

// ==========================================
// 3. Update AdminSchoolManager.tsx (Add Receipt Button)
// ==========================================
const managerPath = path.join(adminDir, 'AdminSchoolManager.tsx');
if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  
  // Add Printer icon import
  if (!content.includes('Printer')) {
    content = content.replace("ArrowUpDown, ChevronLeft, ChevronRight", "ArrowUpDown, ChevronLeft, ChevronRight, Printer");
  }

  // Add Link to Receipt inside the actions row
  const actionsRow = `<div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                          <Link to={\`/schools/\${school.id}\`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">`;
  
  const newActionsRow = `<div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                          <Link to={\`/receipt/\${school.id}\`} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition" title="ငွေလက်ခံဖြတ်ပိုင်း ထုတ်ရန်">
                            <Printer className="w-4 h-4" />
                          </Link>
                          <Link to={\`/schools/\${school.id}\`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">`;
  
  content = content.replace(actionsRow, newActionsRow);
  fs.writeFileSync(managerPath, content, 'utf8');
  console.log("✅ AdminSchoolManager.tsx တွင် Print ခလုတ် ထည့်ပြီးပါပြီ");
}

// ==========================================
// 4. Create Events.tsx (Public Registration)
// ==========================================
const eventsPath = path.join(pagesDir, 'Events.tsx');
const eventsContent = `import { useState, useEffect } from 'react';
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
`;
fs.writeFileSync(eventsPath, eventsContent, 'utf8');
console.log("✅ Events.tsx (စာရင်းသွင်းစနစ်) ဖန်တီးပြီးပါပြီ");

// ==========================================
// 5. Create AdminEventManager.tsx
// ==========================================
const adminEventPath = path.join(adminDir, 'AdminEventManager.tsx');
const adminEventContent = `import React, { useState, useEffect } from 'react';
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
                    <span className={\`px-2 py-0.5 rounded-full font-bold \${ev.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}\`}>
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
`;
fs.writeFileSync(adminEventPath, adminEventContent, 'utf8');
console.log("✅ AdminEventManager.tsx ဖန်တီးပြီးပါပြီ");

// ==========================================
// 6. Update Admin.tsx to include Events Tab
// ==========================================
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  // Add import
  if (!content.includes('AdminEventManager')) {
    content = content.replace(
      "import AdminSchoolManager from '../components/admin/AdminSchoolManager';",
      "import AdminSchoolManager from '../components/admin/AdminSchoolManager';\nimport AdminEventManager from '../components/admin/AdminEventManager';"
    );
  }

  // Add to activeTab type
  content = content.replace(
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup'",
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup' | 'events'"
  );

  // Add Tab Button
  const tabRegex = /<button\s+onClick=\{\(\) => setActiveTab\('tickers'\)\}[\s\S]*?<\/button>/;
  const newTab = `<button
            onClick={() => setActiveTab('tickers')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'tickers'
                ? 'bg-white text-rose-900 shadow-xs ring-1 ring-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Megaphone className="w-4 h-4 shrink-0 text-rose-600" /> စာတန်းပြေး (Ticker)
          </button>
          <button
            onClick={() => setActiveTab('events')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'events'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Calendar className="w-4 h-4 shrink-0 text-indigo-600" /> ပွဲစဉ်များ (Events)
          </button>`;
  content = content.replace(tabRegex, newTab);

  // Render Tab Content (before Tickers Tab)
  const renderRegex = /\{activeTab === 'tickers' && \(/;
  const newRender = `{activeTab === 'events' && (
        <AdminEventManager />
      )}

      {activeTab === 'tickers' && (`;
  content = content.replace(renderRegex, newRender);

  fs.writeFileSync(adminPath, content, 'utf8');
  console.log("✅ Admin.tsx တွင် Events Tab ထည့်သွင်းပြီးပါပြီ");
}

// ==========================================
// 7. Update Layout.tsx & App.tsx
// ==========================================
const layoutPath = path.join(srcDir, 'components', 'Layout.tsx');
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');
  if (!content.includes("to: '/events'")) {
    content = content.replace(
      "{ to: '/announcements', label: 'ကြေညာချက်များ', labelEn: 'Announcements', icon: BookOpen },",
      "{ to: '/announcements', label: 'ကြေညာချက်များ', labelEn: 'Announcements', icon: BookOpen },\n    { to: '/events', label: 'ပွဲစဉ်များ (Events)', labelEn: 'Events', icon: Ticket },"
    );
    // Add Ticket import
    content = content.replace("Trophy,\n  FolderOpen,", "Trophy,\n  FolderOpen,\n  Ticket,");
    fs.writeFileSync(layoutPath, content, 'utf8');
  }
}

const appPath = path.join(srcDir, 'App.tsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  if (!content.includes('Events')) {
    content = content.replace(
      "import Documents from './pages/Documents';",
      "import Documents from './pages/Documents';\nimport Events from './pages/Events';\nimport Receipt from './pages/Receipt';"
    );
    content = content.replace(
      "<Route path=\"documents\" element={<Documents />} />",
      "<Route path=\"documents\" element={<Documents />} />\n            <Route path=\"events\" element={<Events />} />\n            <Route path=\"receipt/:id\" element={<Receipt />} />"
    );
    fs.writeFileSync(appPath, content, 'utf8');
  }
}

// ==========================================
// 8. Version Bump & Auto-Check
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v6.1'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v6.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Wave 2: ငွေလက်ခံဖြတ်ပိုင်း (Receipt) နှင့် ပွဲစဉ်စာရင်းသွင်းစနစ် (Event Registration) ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'ကျောင်းများ၏ နှစ်စစဉ်ကြေးအတွက် တရားဝင် ငွေလက်ခံဖြတ်ပိုင်း (Print/PDF) ထုတ်ယူနိုင်သည့် စနစ်သစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'သင်တန်းများ၊ အစည်းအဝေးများနှင့် အားကစားပွဲစဉ်များအတွက် ကျောင်းများမှ အွန်လိုင်းမှတစ်ဆင့် စာရင်းသွင်းနိုင်သည့် Events စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Admin Panel တွင် ပွဲစဉ်အသစ်များ တင်ခြင်းနှင့် စာရင်းသွင်းထားသူများကို စစ်ထုတ်ကြည့်ရှုနိုင်သည့် Event Manager စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Wave 2 ပြီးဆုံးပါပြီ! ယခု Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ အပေါ်မှာ ပြထားတဲ့ Error တွေကို ကျွန်တော့်ကို ပြောပြပါ။ ချက်ချင်း ပြင်ပေးပါမယ်။");
}