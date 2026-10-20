import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SportsEvent, SportInfo, Athlete } from '../types';
import { Trophy, Calendar, MapPin, ArrowLeft, Loader2, UserCheck, Shield, Info, Clock } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { DEFAULT_SPORTS_TYPES } from '../data/sports';

export default function Sports() {
  const navigate = useNavigate();
  const [activeSport, setActiveSport] = useState(DEFAULT_SPORTS_TYPES[0]);
  const [viewTab, setViewTab] = useState<'results' | 'rules' | 'officials' | 'athletes'>('results');
  const [activeStatus, setActiveStatus] = useState<'upcoming' | 'ongoing' | 'finished'>('finished');
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportInfo, setSportInfo] = useState<SportInfo | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'sports_events'), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SportsEvent));
      fetched.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setEvents(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      setInfoLoading(true);
      try {
        const snap = await getDoc(doc(db, 'sport_info', activeSport));
        if (snap.exists()) setSportInfo(snap.data() as SportInfo);
        else setSportInfo(null);
        
        const athleteSnap = await getDocs(collection(db, 'athletes')).catch(() => ({ docs: [] }));
        const allAthletes = athleteSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Athlete));
        setAthletes(allAthletes.filter((a: any) => a.sports.includes(activeSport)));
      } catch (err) { console.error(err); }
      finally { setInfoLoading(false); }
    };
    fetchInfo();
  }, [activeSport]);

  const filteredEvents = events.filter(e => e.sportType === activeSport && e.status === activeStatus);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-900 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black">အားကစားပြိုင်ပွဲများ</h1>
        </div>
        <p className="text-emerald-100 text-sm">အားကစားအမျိုးအစားအလိုက် ရလဒ်များ၊ စည်းမျဉ်းများနှင့် အားကစားသမားများ</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <ShareButton
          title="အားကစားပြိုင်ပွဲများ"
          text="အားကစားပြိုင်ပွဲများ — ရလဒ်များ၊ စည်းမျဉ်းများနှင့် အားကစားသမား စာရင်း"
          variant="secondary"
          label="မျှဝေရန်"
        />
      </div>

      <div className="flex overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1 snap-x">
        {DEFAULT_SPORTS_TYPES.map(sport => (
          <button
            key={sport}
            onClick={() => setActiveSport(sport)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition shrink-0 snap-start ${activeSport === sport ? 'bg-sky-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="flex overflow-x-auto bg-slate-100 p-1 rounded-xl gap-1">
        <button onClick={() => setViewTab('results')} className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap ${viewTab === 'results' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>ရလဒ်များ</button>
        <button onClick={() => setViewTab('rules')} className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap ${viewTab === 'rules' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>စည်းမျဉ်းနှင့် သတင်းအချက်အလက်</button>
        <button onClick={() => setViewTab('officials')} className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap ${viewTab === 'officials' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>ဒိုင်နှင့် ကော်မတီ</button>
        <button onClick={() => setViewTab('athletes')} className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap ${viewTab === 'athletes' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500'}`}>အားကစားသမားများ</button>
      </div>

      {infoLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
      ) : viewTab === 'rules' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="font-bold text-lg text-sky-950 border-b pb-2 flex items-center gap-2"><Info className="w-5 h-5 text-sky-600"/> စည်းမျဉ်းနှင့် အချက်အလက်</h3>
          {sportInfo?.rules ? <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-xl border">{sportInfo.rules}</p> : <p className="text-sm text-slate-400">စည်းမျဉ်း မထည့်ရသေးပါ။</p>}
          {sportInfo?.info && <p className="text-sm text-slate-600 whitespace-pre-line">{sportInfo.info}</p>}
        </div>
      ) : viewTab === 'officials' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="font-bold text-lg text-sky-950 border-b pb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-sky-600"/> ဒိုင်နှင့် ကော်မတီဝင်များ</h3>
          {sportInfo?.officials && sportInfo.officials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sportInfo.officials.map(o => (
                <div key={o.id} className="bg-slate-50 p-3 rounded-xl border text-sm">
                  <p className="font-bold text-slate-900">{o.name}</p>
                  <p className="text-sky-700 font-semibold">{o.role}</p>
                  {o.phone && <p className="text-slate-500 font-mono mt-1 text-xs">{o.phone}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">ဒိုင်များ မထည့်ရသေးပါ။</p>}
        </div>
      ) : viewTab === 'athletes' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b pb-2 gap-2 flex-wrap">
            <h3 className="font-bold text-lg text-sky-950 flex items-center gap-2"><UserCheck className="w-5 h-5 text-sky-600"/> အားကစားသမား စာရင်း</h3>
            <ShareButton
              title={`${activeSport} — အားကစားသမား စာရင်း`}
              text={`${activeSport} အားကစားသမားများ — အမည်၊ အတန်း၊ အသက်၊ ကိုယ်စားပြုကျောင်း`}
              variant="secondary"
              label="မျှဝေရန်"
            />
          </div>
          {athletes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="p-3 font-bold">အမည်</th>
                    <th className="p-3 font-bold">အတန်း</th>
                    <th className="p-3 font-bold">အသက်</th>
                    <th className="p-3 font-bold">ကျောင်း</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {athletes.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {a.photoUrl ? (
                            <img src={a.photoUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><UserCheck className="w-4 h-4"/></div>
                          )}
                          <span className="font-bold text-slate-900">{a.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{a.grade}</td>
                      <td className="p-3 font-mono">{a.age}</td>
                      <td className="p-3 text-sky-800 font-semibold">{a.school}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-slate-400">အားကစားသမား မထည့်ရသေးပါ။</p>}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-md mx-auto">
            {(['upcoming', 'ongoing', 'finished'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveStatus(tab)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeStatus === tab ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab === 'upcoming' ? 'လာမည့်ပွဲစဉ်' : tab === 'ongoing' ? 'ယှဉ်ပြိုင်နေဆဲ' : 'ရလဒ်များ'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-semibold">
              {activeSport} အတွက် {activeStatus === 'finished' ? 'ရလဒ်များ' : 'ပွဲစဉ်များ'} မရှိသေးပါ။
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-base">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.startDate}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ပွဲရလဒ်များ</h4>
                    {event.results && event.results.length > 0 ? (
                      event.results.map(match => (
                        <div key={match.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className={`flex-1 text-right ${match.winner === match.teamA ? 'text-sky-900' : 'text-slate-600'}`}>
                            <p className="font-bold">{match.teamA}</p>
                            {match.playerA && <p className="text-xs text-slate-400">{match.playerA}</p>}
                          </div>
                          <div className="flex flex-col items-center mx-2">
                            <div className="px-4 font-mono font-black text-lg text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm">
                              {match.scoreA} - {match.scoreB}
                            </div>
                            {match.matchTime && (
                              <span className="text-[10px] text-sky-700 font-bold mt-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />{match.matchTime}
                              </span>
                            )}
                          </div>
                          <div className={`flex-1 text-left ${match.winner === match.teamB ? 'text-sky-900' : 'text-slate-600'}`}>
                            <p className="font-bold">{match.teamB}</p>
                            {match.playerB && <p className="text-xs text-slate-400">{match.playerB}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">ရလဒ် မထည့်ရသေးပါ</p>
                    )}
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
