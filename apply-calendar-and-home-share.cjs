// ═══════════════════════════════════════════════
// FILENAME: apply-calendar-and-home-share.cjs
// ═══════════════════════════════════════════════
// Fixes:
//  1) ShareButton remove from Sports/SchoolDetail → add to Home only
//  2) Sidebar: "အားကစားရလဒ်များ" → "အားကစား", "ပွဲစဉ်များ" → "ပွဲတော်များ"
//  3) Calendar Page with Month View + Date Range Custom Filter
//  4) SchoolPortal Activity Form with Cloudinary image
// ═══════════════════════════════════════════════
const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`Not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

function safe(content, find, replace, label) {
  const count = content.split(find).length - 1;
  if (count === 0) {
    console.log(`\n  ❌ [${label}] NOT FOUND:`);
    console.log('  ' + JSON.stringify(find.substring(0, 150)));
    throw new Error(`[${label}] not matched`);
  }
  if (count > 1) throw new Error(`[${label}] appears ${count}x`);
  const idx = content.indexOf(find);
  return content.substring(0, idx) + replace + content.substring(idx + find.length);
}

console.log('\n🚀 apply-calendar-and-home-share\n');

// ═══════════════════════════════════════════════
// 1) src/types/index.ts — EventItem update
// ═══════════════════════════════════════════════
console.log('\n📝 src/types/index.ts');
let T = read('src/types/index.ts');
if (!T.includes("eventType?: 'festival'")) {
  T = safe(T,
`export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}`,
`export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  time?: string;
  schoolId?: string;
  schoolName?: string;
  zone?: string;
  eventType?: 'festival' | 'sport' | 'school_activity' | 'general';
  imageUrl?: string;
}`,
    'T1 EventItem');
  write('src/types/index.ts', T);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 2) src/App.tsx — Add Calendar route
// ═══════════════════════════════════════════════
console.log('\n📝 src/App.tsx');
let A = read('src/App.tsx');
if (!A.includes('CalendarPage')) {
  A = safe(A,
`import Events from './pages/Events';`,
`import Events from './pages/Events';
import CalendarPage from './pages/CalendarPage';`,
    'A1 import');

  A = safe(A,
`            <Route path="events" element={<Events />} />`,
`            <Route path="events" element={<Events />} />
            <Route path="calendar" element={<CalendarPage />} />`,
    'A2 route');
  write('src/App.tsx', A);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 3) src/components/Layout.tsx — Sidebar labels + Calendar link
// ═══════════════════════════════════════════════
console.log('\n📝 src/components/Layout.tsx');
let L = read('src/components/Layout.tsx');
if (!L.includes("'/calendar'")) {
  L = safe(L,
`  Trophy,
  FolderOpen,
  Award,
  Ticket,
} from 'lucide-react';`,
`  Trophy,
  FolderOpen,
  Award,
  Ticket,
  Calendar,
} from 'lucide-react';`,
    'L1 Calendar icon');

  L = safe(L,
`    { to: '/events', label: 'ပွဲစဉ်များ (Events)', labelEn: 'Events', icon: Ticket },
    { to: '/sports', label: 'အားကစားရလဒ်များ', labelEn: 'Sports Results', icon: Trophy },`,
`    { to: '/events', label: 'ပွဲတော်များ', labelEn: 'Events', icon: Ticket },
    { to: '/calendar', label: 'ပြက္ခဒိန်', labelEn: 'Calendar', icon: Calendar },
    { to: '/sports', label: 'အားကစား', labelEn: 'Sports', icon: Trophy },`,
    'L2 nav links');
  write('src/components/Layout.tsx', L);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 4) src/pages/Sports.tsx — Remove ShareButton
// ═══════════════════════════════════════════════
console.log('\n📝 src/pages/Sports.tsx');
let SP = read('src/pages/Sports.tsx');
if (SP.includes('ShareButton')) {
  SP = safe(SP, `import ShareButton from '../components/ShareButton';\n`, ``, 'SP1 import');

  SP = safe(SP,
`      <div className="flex items-center justify-end gap-2">
        <ShareButton
          title="အားကစားပြိုင်ပွဲများ"
          text="အားကစားပြိုင်ပွဲများ — ရလဒ်များ၊ စည်းမျဉ်းများနှင့် အားကစားသမား စာရင်း"
          variant="secondary"
          label="မျှဝေရန်"
        />
      </div>

`,
    ``,
    'SP2 header share');

  SP = safe(SP,
`          <div className="flex items-center justify-between border-b pb-2 gap-2 flex-wrap">
            <h3 className="font-bold text-lg text-sky-950 flex items-center gap-2"><UserCheck className="w-5 h-5 text-sky-600"/> အားကစားသမား စာရင်း</h3>
            <ShareButton
              title={\`\${activeSport} — အားကစားသမား စာရင်း\`}
              text={\`\${activeSport} အားကစားသမားများ — အမည်၊ အတန်း၊ အသက်၊ ကိုယ်စားပြုကျောင်း\`}
              variant="secondary"
              label="မျှဝေရန်"
            />
          </div>`,
`          <h3 className="font-bold text-lg text-sky-950 border-b pb-2 flex items-center gap-2"><UserCheck className="w-5 h-5 text-sky-600"/> အားကစားသမား စာရင်း</h3>`,
    'SP3 athletes share');
  write('src/pages/Sports.tsx', SP);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 5) src/pages/SchoolDetail.tsx — Remove ShareButton
// ═══════════════════════════════════════════════
console.log('\n📝 src/pages/SchoolDetail.tsx');
let SD = read('src/pages/SchoolDetail.tsx');
if (SD.includes('ShareButton')) {
  SD = safe(SD, `import ShareButton from '../components/ShareButton';\n`, ``, 'SD1 import');

  SD = safe(SD,
`      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          to="/contacts"
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-800 hover:text-sky-950 transition"
        >
          <ArrowLeft className="w-4 h-4" /> အသင်းဝင်ကျောင်းများသို့ ပြန်သွားရန်
        </Link>
        <ShareButton
          title={school.name}
          text={\`\${school.name} — ကျောင်း အသေးစိတ် အချက်အလက်\`}
          variant="secondary"
          label="မျှဝေရန်"
        />
      </div>`,
`      <Link
        to="/contacts"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-800 hover:text-sky-950 transition"
      >
        <ArrowLeft className="w-4 h-4" /> အသင်းဝင်ကျောင်းများသို့ ပြန်သွားရန်
      </Link>`,
    'SD2 share');
  write('src/pages/SchoolDetail.tsx', SD);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 6) src/pages/Home.tsx — Add ShareButton
// ═══════════════════════════════════════════════
console.log('\n📝 src/pages/Home.tsx');
let H = read('src/pages/Home.tsx');
if (!H.includes('ShareButton')) {
  H = safe(H,
`import { getUnifiedSchoolLevels } from '../lib/schoolLevels';`,
`import { getUnifiedSchoolLevels } from '../lib/schoolLevels';
import ShareButton from '../components/ShareButton';`,
    'H1 import');

  H = safe(H,
`          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
            သတင်းနှင့် ပြန်ကြားရေးဌာန
          </h1>`,
`          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              သတင်းနှင့် ပြန်ကြားရေးဌာန
            </h1>
            <ShareButton
              title="ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း"
              text="သတင်းနှင့် ပြန်ကြားရေးဌာန — အသင်းဝင်ကျောင်းများ၏ သတင်းအချက်အလက်များ"
              variant="primary"
              label="App ကို မျှဝေရန်"
            />
          </div>`,
    'H2 header share');
  write('src/pages/Home.tsx', H);
} else { console.log('  ⏭️ Already done'); }

// ═══════════════════════════════════════════════
// 7) src/pages/CalendarPage.tsx — Create
// ═══════════════════════════════════════════════
console.log('\n📝 src/pages/CalendarPage.tsx (NEW)');
const calendarCode = `import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EventItem } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, LayoutList, CalendarDays } from 'lucide-react';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../constants';

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'range'>('month');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem));
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.isActive === false) return false;
      if (!isSchoolInZone(e.zone, zoneFilter)) return false;
      if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
      return true;
    });
  }, [events, zoneFilter, typeFilter]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const formatDate = (y: number, m: number, d: number) => {
    return \`\${y}-\${String(m + 1).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
  };

  const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const rangeEvents = useMemo(() => {
    if (!startDate || !endDate) return [];
    return [...filteredEvents]
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, startDate, endDate]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <h2 className="text-xl font-extrabold text-sky-950 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-sky-600" /> ပွဲတော်နှင့် လှုပ်ရှားမှု ပြက္ခဒိန်
        </h2>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
            <option value="all">အမျိုးအစား အားလုံး</option>
            <option value="festival">ပွဲတော်</option>
            <option value="school_activity">ကျောင်း Activity</option>
            <option value="general">အထွေထွေ</option>
          </select>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
            {ZONE_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={() => { setTypeFilter('all'); setZoneFilter('all'); setCurrentMonth(new Date()); setSelectedDate(null); }} className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 cursor-pointer">Filter ရှင်းမည်</button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('month')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer \${viewMode === 'month' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}\`}>
            <CalendarDays className="w-3.5 h-3.5" /> လအလိုက်
          </button>
          <button onClick={() => setViewMode('range')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer \${viewMode === 'range' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}\`}>
            <LayoutList className="w-3.5 h-3.5" /> ရက်အပိုင်းအခြား
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="font-bold text-lg text-sky-950">{currentMonth.toLocaleDateString('my-MM', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-slate-500 mb-1">
              <div>တနင်္ဂနွေ</div><div>တနင်္လာ</div><div>အင်္ဂါ</div><div>ဗုဒ္ဓဟူး</div><div>ကြာသပတေး</div><div>သောကြာ</div><div>စနေ</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={\`empty-\${idx}\`} className="h-14 sm:h-20" />;
                const dateStr = formatDate(year, month, day);
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                
                return (
                  <div 
                    key={dateStr} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={\`h-14 sm:h-20 rounded-lg border flex flex-col items-center justify-start p-1 cursor-pointer transition \${isSelected ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200' : isToday ? 'border-sky-300 bg-sky-50/50' : 'border-slate-100 hover:bg-slate-50'}\`}
                  >
                    <span className={\`text-[10px] sm:text-xs font-bold \${isToday ? 'text-sky-700' : 'text-slate-700'}\`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className={\`w-1.5 h-1.5 rounded-full \${e.eventType === 'school_activity' ? 'bg-amber-500' : e.eventType === 'festival' ? 'bg-rose-500' : 'bg-sky-500'}\`} />
                        ))}
                        {dayEvents.length > 3 && <span className="text-[8px] font-bold text-slate-500">+{dayEvents.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="font-bold text-base text-sky-950 border-b pb-2">
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('my-MM', { day: 'numeric', month: 'long', year: 'numeric' }) : 'ရက်ရွေးပါ'}
            </h3>
            {!selectedDate ? (
              <p className="text-xs text-slate-400">ကြည့်ရှုရန် ပြက္ခဒိန်မှ ရက်တစ်ရက်ကို နှိပ်ပါ</p>
            ) : selectedEvents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">ဤရက်တွင် ပွဲတော်/လှုပ်ရှားမှု မရှိပါ</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={\`text-[10px] font-bold px-2 py-0.5 rounded border \${ev.eventType === 'school_activity' ? 'bg-amber-50 text-amber-800 border-amber-200' : ev.eventType === 'festival' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-sky-50 text-sky-800 border-sky-200'}\`}>
                        {ev.eventType === 'school_activity' ? 'ကျောင်း' : ev.eventType === 'festival' ? 'ပွဲတော်' : 'အထွေထွေ'}
                      </span>
                      {ev.time && <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3"/>{ev.time}</span>}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-full h-32 object-cover rounded-lg border" />}
                    {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}
                    <div className="text-xs text-slate-500 flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                      {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ev.location}</span>}
                      {ev.schoolName && <span>ကျောင်း: <strong className="text-slate-700">{ev.schoolName}</strong></span>}
                      {ev.zone && <span className="text-sky-800 bg-sky-100 px-1.5 rounded">{ev.zone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full sm:w-auto" />
            <span className="text-slate-400 text-xs font-bold">မှ</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-full sm:w-auto" />
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl w-full sm:w-auto cursor-pointer">ရှင်းမည်</button>
          </div>
          {!startDate || !endDate ? (
            <p className="text-xs text-slate-400 italic text-center py-6">ရက်အပိုင်းအခြား ရွေးချယ်ပါ</p>
          ) : rangeEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">ဤကာလအတွင်း ပွဲတော်/လှုပ်ရှားမှု မရှိပါ</p>
          ) : (
            <div className="space-y-3">
              {rangeEvents.map(ev => (
                <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
                  {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg border shrink-0" />}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={\`text-[10px] font-bold px-2 py-0.5 rounded border \${ev.eventType === 'school_activity' ? 'bg-amber-50 text-amber-800 border-amber-200' : ev.eventType === 'festival' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-sky-50 text-sky-800 border-sky-200'}\`}>
                        {ev.eventType === 'school_activity' ? 'ကျောင်း' : ev.eventType === 'festival' ? 'ပွဲတော်' : 'အထွေထွေ'}
                      </span>
                      <span className="text-xs font-bold text-sky-900">{ev.date} {ev.time && \`• \${ev.time}\`}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}
                    <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                      {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ev.location}</span>}
                      {ev.schoolName && <span>ကျောင်း: <strong className="text-slate-700">{ev.schoolName}</strong></span>}
                      {ev.zone && <span className="text-sky-800 bg-sky-100 px-1.5 rounded">{ev.zone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;
write('src/pages/CalendarPage.tsx', calendarCode);

// ═══════════════════════════════════════════════
// 8) src/pages/SchoolPortal.tsx — Activity Form
// ═══════════════════════════════════════════════
console.log('\n📝 src/pages/SchoolPortal.tsx');
let PO = read('src/pages/SchoolPortal.tsx');
if (!PO.includes('handleAddActivity')) {
  PO = safe(PO,
    `import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';`,
    `import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';`,
    'PO1 addDoc');

  PO = safe(PO,
    `import { School, Athlete } from '../types';`,
    `import { School, Athlete, EventItem } from '../types';`,
    'PO2 EventItem');

  PO = safe(PO,
    `import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users, Eye, ShieldCheck, UserCheck } from 'lucide-react';`,
    `import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users, Eye, ShieldCheck, UserCheck, Calendar, Clock } from 'lucide-react';`,
    'PO3 icons');

  PO = safe(PO,
    `import { STANDARD_ZONES } from '../constants';`,
    `import { STANDARD_ZONES } from '../constants';
import ImageUploadDropzone from '../components/ImageUploadDropzone';`,
    'PO4 ImageUploadDropzone');

  PO = safe(PO,
    `  const [studentCount, setStudentCount] = useState('');`,
    `  const [studentCount, setStudentCount] = useState('');

  const [activities, setActivities] = useState<EventItem[]>([]);
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actTime, setActTime] = useState('');
  const [actLocation, setActLocation] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actImage, setActImage] = useState('');
  const [isSubmittingAct, setIsSubmittingAct] = useState(false);`,
    'PO5 state');

  PO = safe(PO,
    `          setAthletes(athleteSnap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete)));`,
    `          setAthletes(athleteSnap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete)));

          const actQuery = query(collection(db, 'events'), where('schoolId', '==', data.id));
          const actSnap = await getDocs(actQuery);
          setActivities(actSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));`,
    'PO6 fetch activities');

  PO = safe(PO,
    `  const handleLogout = async () => {`,
    `  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setIsSubmittingAct(true);
    try {
      const payload = {
        title: actTitle,
        date: actDate,
        time: actTime,
        location: actLocation,
        description: actDesc,
        imageUrl: actImage,
        zone: school.zone || '',
        schoolId: school.id,
        schoolName: school.name,
        eventType: 'school_activity' as const,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'events'), payload);
      setActivities([...activities, { id: docRef.id, ...payload }]);
      toast.success('လှုပ်ရှားမှု တင်ပြီးပါပြီ');
      setActTitle(''); setActDate(''); setActTime(''); setActLocation(''); setActDesc(''); setActImage('');
    } catch (err) {
      toast.error('တင်၍ မရပါ');
    } finally {
      setIsSubmittingAct(false);
    }
  };

  const handleLogout = async () => {`,
    'PO7 handleAddActivity');

  PO = safe(PO,
    `        </div>
      </div>
    </div>
  );
}`,
    `        </div>

        {/* Activity Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> ကျောင်း၏ လှုပ်ရှားမှုများ (Activities)
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleAddActivity} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">လှုပ်ရှားမှုအသစ် တင်ရန်</h3>
              <input required placeholder="ခေါင်းစဉ် *" value={actTitle} onChange={e => setActTitle(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                <input placeholder="အချိန် (Optional)" value={actTime} onChange={e => setActTime(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              </div>
              <input placeholder="နေရာ (Optional)" value={actLocation} onChange={e => setActLocation(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <textarea placeholder="အသေးစိတ် (Optional)" value={actDesc} onChange={e => setActDesc(e.target.value)} rows={2} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <ImageUploadDropzone
                value={actImage}
                onChange={setActImage}
                label="ဓာတ်ပုံ (Optional)"
                folder="school-activities"
              />
              <button type="submit" disabled={isSubmittingAct} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer">
                {isSubmittingAct ? 'တင်နေပါသည်...' : '+ လှုပ်ရှားမှု တင်မည်'}
              </button>
            </form>
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">တင်ထားသော လှုပ်ရှားမှုများ ({activities.length})</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">လှုပ်ရှားမှု မရှိသေးပါ</p>
              ) : (
                [...activities].sort((a,b) => b.date.localeCompare(a.date)).map(act => (
                  <div key={act.id} className="p-3 bg-white border border-slate-200 rounded-xl flex gap-3 shadow-2xs">
                    {act.imageUrl && <img src={act.imageUrl} alt={act.title} className="w-14 h-14 rounded-lg object-cover border shrink-0" />}
                    <div>
                      <p className="font-bold text-sm text-slate-900">{act.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {act.date} {act.time && \`• \${act.time}\`}</p>
                      {act.location && <p className="text-[10px] text-slate-400 mt-1"><MapPin className="w-2.5 h-2.5 inline"/> {act.location}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
    'PO8 UI');
  write('src/pages/SchoolPortal.tsx', PO);
} else { console.log('  ⏭️ Already done'); }

console.log('\n✅ DONE\n');
console.log('NEXT:');
console.log('  1) git status');
console.log('  2) npx tsc --noEmit');
console.log('  3) npm run build');
console.log('  4) git add . && git commit -m "feat(v14.8): calendar page + school activities + share on home only"');
console.log('  5) git push');
console.log('  6) Remove-Item apply-calendar-and-home-share.cjs -Force\n');