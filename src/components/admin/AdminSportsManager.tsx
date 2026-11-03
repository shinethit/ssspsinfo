import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SportsEvent, SportsMatchResult, School, Athlete } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { Plus, Trash2, PlusCircle, Upload, Download, AlertCircle, MapPin, Edit2 } from 'lucide-react';
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
  const [matchTime, setMatchTime] = useState('');
  // A2(b)/Medal: optional 2nd-place (silver) and 3rd-place (bronze) schools
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  // A2(b): sports event being edited (null = creating a new event)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  // A2(b): result being edited (null = adding a new result)
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  // A7: in-flight guards so double-click cannot create twice
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  // A4: the result form belongs to one event/sport — clear it whenever the
  // admin picks a different event or switches sport tabs, so a stale
  // team/score/winner can never be saved under the wrong event.
  const clearResultForm = () => {
    setTeamA(''); setPlayerA(''); setScoreA(''); setTeamB(''); setPlayerB(''); setScoreB('');
    setWinner(''); setMedal(''); setMatchTime(''); setSecondPlace(''); setThirdPlace('');
    setEditingMatchId(null);
  };

  // A4: changing either team invalidates the winner (and the 2nd/3rd
  // places, which are picked from the two teams) and that team's player.
  const handleTeamAChange = (value: string) => {
    setTeamA(value); setPlayerA(''); setWinner(''); setSecondPlace(''); setThirdPlace('');
  };
  const handleTeamBChange = (value: string) => {
    setTeamB(value); setPlayerB(''); setWinner(''); setSecondPlace(''); setThirdPlace('');
  };

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

  // A7: wrapped in try/catch (a failed save used to fail silently) with an
  // in-flight guard; A2(b): when editing, update the event's title/date/
  // location instead of creating a new event (results are preserved).
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEvent) return;
    setIsSubmittingEvent(true);
    try {
      if (editingEventId) {
        await updateDoc(doc(db, 'sports_events', editingEventId), {
          title, startDate, location,
        });
        toast.success('ပွဲစဉ် ပြင်ဆင်ပြီးပါပြီ');
        setEditingEventId(null);
      } else {
        await addDoc(collection(db, 'sports_events'), {
          title, sportType: activeSport, status: 'upcoming', startDate, location,
          results: [], createdAt: new Date().toISOString()
        });
        toast.success('ပွဲစဉ်အသစ် တင်ပြီးပါပြီ');
      }
      setTitle(''); setStartDate(''); setLocation('');
      fetchEvents();
    } catch (err) {
      toast.error('ပွဲစဉ် သိမ်း၍ မရပါ — အင်တာနက် စစ်ပြီး ထပ်ကြိုးစားပါ');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // A2(b): prefill the create-event form with this event's data for editing.
  const startEditEvent = (ev: SportsEvent) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || '');
    setStartDate(ev.startDate || '');
    setLocation(ev.location || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditEvent = () => {
    setEditingEventId(null);
    setTitle(''); setStartDate(''); setLocation('');
  };

  // A2(b): prefill the result form with this match's data for editing.
  const startEditMatch = (match: SportsMatchResult) => {
    setEditingMatchId(match.id);
    setTeamA(match.teamA || '');
    setPlayerA(match.playerA || '');
    setScoreA(String(match.scoreA ?? ''));
    setTeamB(match.teamB || '');
    setPlayerB(match.playerB || '');
    setScoreB(String(match.scoreB ?? ''));
    setWinner(match.winner || '');
    setMedal(match.medal || '');
    setMatchTime(match.matchTime || '');
    setSecondPlace((match as SportsMatchResult & { secondPlace?: string }).secondPlace || '');
    setThirdPlace((match as SportsMatchResult & { thirdPlace?: string }).thirdPlace || '');
    setIsIndividual(Boolean(match.playerA || match.playerB));
  };

  // A2(b): remove one result from the event's results array.
  const handleDeleteMatch = async (matchId: string) => {
    if (!selectedEventId) return;
    if (!(await confirmDialog('ဤရလဒ်ကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      const event = events.find(ev => ev.id === selectedEventId);
      if (!event) return;
      await updateDoc(doc(db, 'sports_events', selectedEventId), {
        results: (event.results || []).filter(r => r.id !== matchId)
      });
      toast.success('ရလဒ် ဖျက်ပြီးပါပြီ');
      if (editingMatchId === matchId) clearResultForm();
      fetchEvents();
    } catch (err) {
      toast.error('ရလဒ် ဖျက်၍ မရပါ');
    }
  };

  // A7: wrapped in try/catch (a failed save used to fail silently) with an
  // in-flight guard; A2(b): when editing, replace that match in place
  // (same id) instead of appending a duplicate.
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (isSubmittingMatch) return;
    const event = events.find(ev => ev.id === selectedEventId);
    if (!event) return;

    // v24.6: a result without an explicit winner/medal used to be saved
    // blank, and the medal table then guessed a winner from the scores.
    if (!winner) {
      toast.error('အနိုင်ရသူ ရွေးပေးပါ');
      return;
    }
    if (winner !== 'သရေ' && !medal) {
      toast.error('ဆုတံဆိပ် ရွေးပေးပါ');
      return;
    }
    // Medal: 2nd/3rd places must be real, distinct schools, not the winner.
    if (secondPlace && secondPlace !== teamA && secondPlace !== teamB) {
      toast.error('ဒုတိယနေရာ ကျောင်းကို ရွေးပေးပါ');
      return;
    }
    if (thirdPlace && thirdPlace !== teamA && thirdPlace !== teamB) {
      toast.error('တတိယနေရာ ကျောင်းကို ရွေးပေးပါ');
      return;
    }
    if (secondPlace && secondPlace === winner) {
      toast.error('ဒုတိယနေရာသည် အနိုင်ရသူနှင့် မတူရပါ');
      return;
    }
    if (thirdPlace && (thirdPlace === winner || thirdPlace === secondPlace)) {
      toast.error('တတိယနေရာသည် အနိုင်ရသူ / ဒုတိယနေရာနှင့် မတူရပါ');
      return;
    }

    const isDuplicate = (event.results || []).some(r =>
      r.id !== editingMatchId && (
        (r.teamA === teamA && r.teamB === teamB) ||
        (r.teamA === teamB && r.teamB === teamA) ||
        (playerA && r.playerA === playerA) ||
        (playerB && r.playerB === playerB)
      )
    );

    if (isDuplicate) {
      if (!(await confirmDialog('ဤအသင်း (သို့မဟုတ်) အားကစားသမားသည် ဤပွဲစဉ်တွင် ပါဝင်ပြီးသား ဖြစ်နေပါသည်။ ထပ်မံထည့်ရန် သေချာပါသလား?'))) return;
    }

    setIsSubmittingMatch(true);
    try {
      // secondPlace/thirdPlace are optional extra fields on the match —
      // SportsMatchResult has no declared fields for them yet, so they are
      // added via spread (MedalTally reads them the same way).
      const newMatch: SportsMatchResult = {
        id: editingMatchId || Date.now().toString(),
        teamA, playerA: isIndividual ? playerA : undefined, scoreA,
        teamB, playerB: isIndividual ? playerB : undefined, scoreB,
        winner, medal: medal as any,
        matchTime: matchTime.trim() || undefined,
        ...(secondPlace ? { secondPlace } : {}),
        ...(thirdPlace ? { thirdPlace } : {}),
      } as SportsMatchResult;

      const nextResults = editingMatchId
        ? (event.results || []).map(r => (r.id === editingMatchId ? newMatch : r))
        : [...(event.results || []), newMatch];
      await updateDoc(doc(db, 'sports_events', selectedEventId), {
        results: nextResults
      });
      toast.success(editingMatchId ? 'ရလဒ် ပြင်ဆင်ပြီးပါပြီ' : 'ရလဒ် ထည့်ပြီးပါပြီ');
      clearResultForm();
      fetchEvents();
    } catch (err) {
      toast.error('ရလဒ် သိမ်း၍ မရပါ — အင်တာနက် စစ်ပြီး ထပ်ကြိုးစားပါ');
    } finally {
      setIsSubmittingMatch(false);
    }
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
            <p className="text-xs text-slate-500">ပြိုင်ပွဲအတွက် ကျောင်း ရွေးချယ်ရာတွင် ဤဇုန်ကို စစ်ထုတ်ပါမည်</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ZONE_FILTER_OPTIONS.map(opt => {
            const count = opt.value === 'all' ? schools.length : schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;
            return (
              <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)}
                className={`px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border cursor-pointer ` +
                  (zoneFilter === opt.value ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100')}>
                <span>{opt.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ` +
                  (zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1 snap-x mb-2">
        {DEFAULT_SPORTS_TYPES.map(sport => (
          <button key={sport} onClick={() => { setActiveSport(sport); setSelectedEventId(null); clearResultForm(); cancelEditEvent(); }} className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition shrink-0 snap-start ${activeSport === sport ? 'bg-sky-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            {sport}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setViewMode('results')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'results' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>ရလဒ်များ</button>
        <button onClick={() => setViewMode('athletes')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'athletes' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>အားကစားသမားများ</button>
        <button onClick={() => setViewMode('info')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'info' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>စည်းမျဉ်းနှင့် ဒိုင်များ</button>
      </div>

      {viewMode === 'results' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                <Plus className="w-5 h-5 text-emerald-600" /> {editingEventId ? `${activeSport} ပွဲစဉ် ပြင်ဆင်ရန်` : `${activeSport} ပွဲစဉ်အသစ်`}
              </h3>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပြိုင်ပွဲ ခေါင်းစဉ်" className="w-full p-2.5 border rounded-xl text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                  <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="ကျင်းပမည့်နေရာ" className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmittingEvent} className="flex-1 bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">{isSubmittingEvent ? 'တင်နေပါသည်...' : editingEventId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'ပွဲစဉ် တင်မည်'}</button>
                  {editingEventId && (
                    <button type="button" onClick={cancelEditEvent} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm">Cancel</button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b font-bold text-xs text-slate-600 uppercase tracking-wide">ပွဲစဉ်စာရင်း</div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {sportEvents.map(ev => (
                  <div key={ev.id} onClick={() => { setSelectedEventId(ev.id); clearResultForm(); }} className={`p-3 cursor-pointer transition flex justify-between items-start ${selectedEventId === ev.id ? 'bg-sky-50 border-l-4 border-sky-500' : 'hover:bg-slate-50'}`}>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                      <div className="text-xs text-slate-500 mt-1">{ev.startDate} • {ev.location}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button title="ပွဲစဉ် ပြင်ဆင်ရန်" onClick={(e) => { e.stopPropagation(); startEditEvent(ev); }} className="text-amber-600 p-1 hover:bg-amber-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async (e) => { e.stopPropagation(); if (await confirmDialog('ဖျက်ရန် သေချာပါသလား?')) { try { await deleteDoc(doc(db, 'sports_events', ev.id)); fetchEvents(); } catch (err) { toast.error('ဖျက်၍ မရပါ'); } } }} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
                  <select value={selectedEvent.status} onChange={async e => { try { await updateDoc(doc(db, 'sports_events', selectedEvent.id), { status: e.target.value }); fetchEvents(); } catch (err) { toast.error('ပြောင်း၍ မရပါ'); } }} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white outline-none cursor-pointer">
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
                        <select required value={teamA} onChange={e => handleTeamAChange(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-1">
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
                        <select required value={teamB} onChange={e => handleTeamBChange(e.target.value)} className="w-full p-2 border rounded-lg text-xs mb-1">
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
                    <div className="grid grid-cols-2 gap-2">
                      <select value={secondPlace} onChange={e => setSecondPlace(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
                        <option value="">- ဒုတိယနေရာ (ငွေ) — မသတ်မှတ်ရသေး -</option>
                        {teamA && <option value={teamA}>🥈 {teamA}</option>}
                        {teamB && teamB !== teamA && <option value={teamB}>🥈 {teamB}</option>}
                      </select>
                      <select value={thirdPlace} onChange={e => setThirdPlace(e.target.value)} className="w-full p-2 border rounded-lg text-xs">
                        <option value="">- တတိယနေရာ (ကြေး) — မသတ်မှတ်ရသေး -</option>
                        {teamA && <option value={teamA}>🥉 {teamA}</option>}
                        {teamB && teamB !== teamA && <option value={teamB}>🥉 {teamB}</option>}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={matchTime}
                      onChange={e => setMatchTime(e.target.value)}
                      placeholder="ပွဲချိန် (Optional — ဥပမာ 10:00 AM သို့မဟုတ် ည ၇:၀၀)"
                      className="w-full p-2 border rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={isSubmittingMatch} className="flex-1 bg-sky-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"><PlusCircle className="w-3.5 h-3.5" /> {isSubmittingMatch ? 'သိမ်းနေပါသည်...' : editingMatchId ? 'ရလဒ် ပြင်ဆင်မည်' : 'ရလဒ်ထည့်မည်'}</button>
                      {editingMatchId && (
                        <button type="button" onClick={clearResultForm} className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold">Cancel</button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="divide-y divide-slate-100 p-2 max-h-[300px] overflow-y-auto">
                  {selectedEvent.results?.map(match => (
                    <div key={match.id} className="p-2 flex justify-between items-center gap-2 bg-white hover:bg-slate-50 rounded-lg group">
                      <div className="text-xs font-bold text-slate-700 min-w-0">
                        <span>{match.teamA}</span> 
                        <span className="text-slate-400 font-normal ml-1">{match.playerA && `(${match.playerA})`}</span> 
                        <span className="text-sky-600 font-mono text-sm mx-1">{match.scoreA} - {match.scoreB}</span> 
                        <span>{match.teamB}</span> 
                        <span className="text-slate-400 font-normal ml-1">{match.playerB && `(${match.playerB})`}</span>
                        {match.matchTime && (
                          <span className="ml-2 text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200 font-semibold">
                            {match.matchTime}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" title="ရလဒ် ပြင်ဆင်ရန်" onClick={() => startEditMatch(match)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button type="button" title="ရလဒ် ဖျက်ရန်" onClick={() => handleDeleteMatch(match.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
