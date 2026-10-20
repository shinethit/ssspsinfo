import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SportsEvent, SportsMatchResult, School, Athlete } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, PlusCircle, Upload, Download, AlertCircle, MapPin } from 'lucide-react';
import { DEFAULT_SPORTS_TYPES } from '../../data/sports';
import AdminSportInfoManager from './AdminSportInfoManager';
import AdminAthleteManager from './AdminAthleteManager';
import { downloadSportsTemplate, parseSportsExcel } from '../../lib/sportsExcel';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';

export default function AdminSportsManager({ schools }: { schools: School[] }) {
  const [activeSport, setActiveSport] = useState(DEFAULT_SPORTS_TYPES[0]);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'results' | 'info' | 'athletes'>('results');
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [isIndividual, setIsIndividual] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [playerA, setPlayerA] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [winner, setWinner] = useState('');
  const [medal, setMedal] = useState<'gold'|'silver'|'bronze'|''>('');

  const fetchEvents = async () => {
    const snap = await getDocs(collection(db, 'sports_events')).catch(() => ({ docs: [] }));
    setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as SportsEvent)));
  };

  const fetchAthletes = async () => {
    const snap = await getDocs(collection(db, 'athletes'));
    const allAthletes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete));
    setAthletes(allAthletes.filter(a => a.sports.includes(activeSport)));
  };

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { fetchAthletes(); }, [activeSport]);

  
  const hasPaidSportsFee = (schoolName: string) => {
    const school = schools.find(s => s.name === schoolName);
    if (!school) return true; 
    const oldPayments = (school as any).payments || [];
    if (oldPayments.length > 0) {
      return oldPayments.some((p: any) => p.feeType.includes('အားကစား'));
    }
    return true; 
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'sports_events'), {
      title, sportType: activeSport, status: 'upcoming', startDate, location,
      results: [], createdAt: new Date().toISOString()
    });
    toast.success('ပွဲစဉ်အသစ် တင်ပြီးပါပြီ');
    setTitle(''); setStartDate(''); setLocation('');
    fetchEvents();
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const event = events.find(ev => ev.id === selectedEventId);
    if (!event) return;

    const isDuplicate = event.results?.some(r => 
      (r.teamA === teamA && r.teamB === teamB) || 
      (r.teamA === teamB && r.teamB === teamA) ||
      (playerA && r.playerA === playerA) ||
      (playerB && r.playerB === playerB)
    );

    if (isDuplicate) {
      if (!confirm('ဤအသင်း (သို့မဟုတ်) အားကစားသမားသည် ဤပွဲစဉ်တွင် ပါဝင်ပြီးသား ဖြစ်နေပါသည်။ ထပ်မံထည့်ရန် သေချာပါသလား?')) return;
    }

    const newMatch: SportsMatchResult = {
      id: Date.now().toString(), 
      teamA, playerA: isIndividual ? playerA : undefined, scoreA, 
      teamB, playerB: isIndividual ? playerB : undefined, scoreB, 
      winner, medal: medal as any
    };

    await updateDoc(doc(db, 'sports_events', selectedEventId), {
      results: [...(event.results || []), newMatch]
    });
    toast.success('ရလဒ် ထည့်ပြီးပါပြီ');
    setTeamA(''); setPlayerA(''); setScoreA(''); setTeamB(''); setPlayerB(''); setScoreB(''); setWinner(''); setMedal('');
    fetchEvents();
  };

  const sportEvents = events.filter(e => e.sportType === activeSport);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"><MapPin className="w-3.5 h-3.5" /></div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">ဇုန်အလိုက် ကျောင်း စစ်ထုတ်ခြင်း (Zone Filter)</h4>
            <p className="text-[10px] text-slate-500">ပြိုင်ပွဲအတွက် ကျောင်း ရွေးချယ်ရာတွင် ဤဇုန်ကို စစ်ထုတ်ပါမည်</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ZONE_FILTER_OPTIONS.map(opt => {
            const count = opt.value === 'all' ? schools.length : schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;
            return (
              <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ` +
                  (zoneFilter === opt.value ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100')}>
                <span>{opt.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ` +
                  (zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1 snap-x mb-2">
        {DEFAULT_SPORTS_TYPES.map(sport => (
          <button key={sport} onClick={() => { setActiveSport(sport); setSelectedEventId(null); }} className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition shrink-0 snap-start ${activeSport === sport ? 'bg-sky-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            {sport}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-max">
        <button onClick={() => setViewMode('results')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'results' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>ရလဒ်များ</button>
        <button onClick={() => setViewMode('athletes')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'athletes' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>အားကစားသမားများ</button>
        <button onClick={() => setViewMode('info')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'info' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>စည်းမျဉ်းနှင့် ဒိုင်များ</button>
      </div>

      {viewMode === 'results' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                <Plus className="w-5 h-5 text-emerald-600" /> {activeSport} ပွဲစဉ်အသစ်
              </h3>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပြိုင်ပွဲ ခေါင်းစဉ်" className="w-full p-2.5 border rounded-xl text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                  <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="ကျင်းပမည့်နေရာ" className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <button type="submit" className="w-full bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm">ပွဲစဉ် တင်မည်</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b font-bold text-xs text-slate-600 uppercase tracking-wide">ပွဲစဉ်စာရင်း</div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {sportEvents.map(ev => (
                  <div key={ev.id} onClick={() => setSelectedEventId(ev.id)} className={`p-3 cursor-pointer transition flex justify-between items-start ${selectedEventId === ev.id ? 'bg-sky-50 border-l-4 border-sky-500' : 'hover:bg-slate-50'}`}>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                      <div className="text-[10px] text-slate-500 mt-1">{ev.startDate} • {ev.location}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm('ဖျက်ရန် သေချာပါသလား?')) { deleteDoc(doc(db, 'sports_events', ev.id)).then(() => fetchEvents()); } }} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedEvent ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                <div className="p-4 bg-slate-900 text-white text-sm font-bold truncate flex justify-between items-center">
                  <span>{selectedEvent.title}</span>
                  <select value={selectedEvent.status} onChange={e => updateDoc(doc(db, 'sports_events', selectedEvent.id), { status: e.target.value }).then(fetchEvents)} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white outline-none cursor-pointer">
                    <option value="upcoming">လာမည့်ပွဲစဉ်</option>
                    <option value="ongoing">ယှဉ်ပြိုင်နေဆဲ</option>
                    <option value="finished">ပြီးဆုံးပြီ</option>
                  </select>
                </div>
                
                <div className="p-4 bg-slate-50 border-b space-y-3">
                  <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border w-max mb-2">
                    <label className="flex items-center gap-1 text-xs font-bold cursor-pointer"><input type="radio" checked={!isIndividual} onChange={() => setIsIndividual(false)} /> အသင်းလိုက်</label>
                    <label className="flex items-center gap-1 text-xs font-bold cursor-pointer ml-2"><input type="radio" checked={isIndividual} onChange={() => setIsIndividual(true)} /> တစ်ဦးချင်း</label>
                  </div>

                  <form onSubmit={handleAddMatch} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select required value={teamA} onChange={e => setTeamA(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-1">
                          <option value="">- ကျောင်းရွေးပါ -</option>
                          {schools.filter(s => isSchoolInZone(s.zone, zoneFilter)).map(s => {
                          const paid = hasPaidSportsFee(s.name);
                          const zoneTag = s.zone ? '[' + s.zone + '] ' : '';
                          return <option key={s.id} value={s.name}>{zoneTag}{s.name} {!paid ? '(⚠️ကြေးမရှင်း)' : ''}</option>
                        })}
                        </select>
                        {isIndividual && (
                          <select required value={playerA} onChange={e => setPlayerA(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
                            <option value="">- အားကစားသမား -</option>
                            {athletes.filter(a => a.school === teamA).map(a => <option key={a.id} value={a.name}>{a.name} (အတန်း - {a.grade})</option>)}
                          </select>
                        )}
                        <input required value={scoreA} onChange={e => setScoreA(e.target.value)} placeholder="ရမှတ်" className="w-full p-2 border rounded-lg text-xs mt-1" />
                      </div>
                      <div>
                        <select required value={teamB} onChange={e => setTeamB(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-1">
                          <option value="">- ကျောင်းရွေးပါ -</option>
                          {schools.filter(s => isSchoolInZone(s.zone, zoneFilter)).map(s => {
                          const paid = hasPaidSportsFee(s.name);
                          const zoneTag = s.zone ? '[' + s.zone + '] ' : '';
                          return <option key={s.id} value={s.name}>{zoneTag}{s.name} {!paid ? '(⚠️ကြေးမရှင်း)' : ''}</option>
                        })}
                        </select>
                        {isIndividual && (
                          <select required value={playerB} onChange={e => setPlayerB(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
                            <option value="">- အားကစားသမား -</option>
                            {athletes.filter(a => a.school === teamB).map(a => <option key={a.id} value={a.name}>{a.name} (အတန်း - {a.grade})</option>)}
                          </select>
                        )}
                        <input required value={scoreB} onChange={e => setScoreB(e.target.value)} placeholder="ရမှတ်" className="w-full p-2 border rounded-lg text-xs mt-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={winner} onChange={e => setWinner(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
                        <option value="">- အနိုင်ရသူ -</option>
                        <option value={teamA}>{teamA}</option>
                        <option value={teamB}>{teamB}</option>
                        <option value="သရေ">သရေ</option>
                      </select>
                      <select value={medal} onChange={e => setMedal(e.target.value as any)} className="w-full p-2 border rounded-lg text-xs">
                        <option value="">- ဆုတံဆိပ် -</option>
                        <option value="gold">🥇 ရွှေ</option>
                        <option value="silver">🥈 ငွေ</option>
                        <option value="bronze">🥉 ကြေး</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><PlusCircle className="w-3.5 h-3.5" /> ရလဒ်ထည့်မည်</button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100 p-2 max-h-[300px] overflow-y-auto">
                  {selectedEvent.results?.map(match => (
                    <div key={match.id} className="p-2 flex justify-between items-center bg-white hover:bg-slate-50 rounded-lg group">
                      <div className="text-xs font-bold text-slate-700">
                        <span>{match.teamA}</span> 
                        <span className="text-slate-400 font-normal ml-1">{match.playerA && `(${match.playerA})`}</span> 
                        <span className="text-sky-600 font-mono text-sm mx-1">{match.scoreA} - {match.scoreB}</span> 
                        <span>{match.teamB}</span> 
                        <span className="text-slate-400 font-normal ml-1">{match.playerB && `(${match.playerB})`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center p-8 text-slate-400 text-sm h-full">
                ရလဒ်များ စီမံရန် ဘယ်ဘက်မှ ပွဲစဉ်တစ်ခုကို ရွေးပါ
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'athletes' ? (
        <AdminAthleteManager activeSport={activeSport} schools={schools} />
      ) : (
        <AdminSportInfoManager activeSport={activeSport} />
      )}
    </div>
  );
}
