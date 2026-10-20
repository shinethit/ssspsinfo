import { useState, useEffect, useMemo } from 'react';
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
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
          <CalendarIcon className="w-6 h-6 text-sky-600" /> ပွဲနှင့် အခမ်းအနား ပြက္ခဒိန်
        </h2>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
            <option value="all">အမျိုးအစား အားလုံး</option>
            <option value="festival">ပွဲ/အခမ်းအနား</option>
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
          <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'month' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>
            <CalendarDays className="w-3.5 h-3.5" /> လအလိုက်
          </button>
          <button onClick={() => setViewMode('range')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'range' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>
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
                if (day === null) return <div key={`empty-${idx}`} className="h-14 sm:h-20" />;
                const dateStr = formatDate(year, month, day);
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                
                return (
                  <div 
                    key={dateStr} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-14 sm:h-20 rounded-lg border flex flex-col items-center justify-start p-1 cursor-pointer transition ${isSelected ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200' : isToday ? 'border-sky-300 bg-sky-50/50' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <span className={`text-[10px] sm:text-xs font-bold ${isToday ? 'text-sky-700' : 'text-slate-700'}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${e.eventType === 'school_activity' ? 'bg-amber-500' : e.eventType === 'festival' ? 'bg-rose-500' : 'bg-sky-500'}`} />
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
              <p className="text-xs text-slate-400 italic">ဤရက်တွင် ပွဲ/အခမ်းအနား မရှိပါ</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.eventType === 'school_activity' ? 'bg-amber-50 text-amber-800 border-amber-200' : ev.eventType === 'festival' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-sky-50 text-sky-800 border-sky-200'}`}>
                        {ev.eventType === 'school_activity' ? 'ကျောင်း' : ev.eventType === 'festival' ? 'ပွဲ/အခမ်းအနား' : 'အထွေထွေ'}
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
            <p className="text-xs text-slate-400 italic text-center py-6">ဤကာလအတွင်း ပွဲ/အခမ်းအနား မရှိပါ</p>
          ) : (
            <div className="space-y-3">
              {rangeEvents.map(ev => (
                <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
                  {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg border shrink-0" />}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.eventType === 'school_activity' ? 'bg-amber-50 text-amber-800 border-amber-200' : ev.eventType === 'festival' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-sky-50 text-sky-800 border-sky-200'}`}>
                        {ev.eventType === 'school_activity' ? 'ကျောင်း' : ev.eventType === 'festival' ? 'ပွဲ/အခမ်းအနား' : 'အထွေထွေ'}
                      </span>
                      <span className="text-xs font-bold text-sky-900">{ev.date} {ev.time && `• ${ev.time}`}</span>
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
