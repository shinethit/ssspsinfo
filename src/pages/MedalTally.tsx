import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SportsEvent } from '../types';
import { Trophy, ArrowLeft, Loader2, Award } from 'lucide-react';
import { useInAppBack } from '../hooks/useInAppBack';

interface MedalCount {
  schoolName: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export default function MedalTally() {
  const goBack = useInAppBack();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'sports_events'), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SportsEvent)));
      setLoading(false);
    }, (err) => {
      // v24.6: without this the page spun forever on a denied/failed read
      console.error('Medal tally listener error:', err);
      setLoadError(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Calculate Medal Tally
  const calculateTally = (): MedalCount[] => {
    const tallyMap = new Map<string, MedalCount>();

    events.forEach(event => {
      if (event.status !== 'finished') return;
      event.results?.forEach(match => {
        // v24.15 P8: medals are DERIVED from places when 2nd/3rd places
        // exist (winner = gold, 2nd = silver, 3rd = bronze) and the stored
        // medal field is IGNORED — so a match can never double-count
        // (winner's silver + 2nd's silver). With no places, the stored
        // medal counts as before (legacy data). A Draw never counts
        // anything — the admin form refuses 2nd/3rd places on a Draw, and
        // any legacy Draw carrying places is ignored here.
        // v24.6: only an explicitly recorded winner counts — never guess
        // from scores (a tie/blank used to credit teamB).
        const winningTeam = match.winner;
        if (!winningTeam || winningTeam === 'သရေ' || winningTeam === 'Draw') return;

        const addMedal = (school: string | undefined, medal: 'gold' | 'silver' | 'bronze') => {
          if (!school) return;
          if (!tallyMap.has(school)) {
            tallyMap.set(school, { schoolName: school, gold: 0, silver: 0, bronze: 0, total: 0 });
          }
          const record = tallyMap.get(school)!;
          if (medal === 'gold') record.gold += 1;
          else if (medal === 'silver') record.silver += 1;
          else record.bronze += 1;
          record.total = record.gold + record.silver + record.bronze;
        };

        // secondPlace/thirdPlace are declared fields on SportsMatchResult
        // (since v24.13) — read them directly, no cast needed.
        if (match.secondPlace || match.thirdPlace) {
          addMedal(winningTeam, 'gold');
          if (match.secondPlace && match.secondPlace !== winningTeam) {
            addMedal(match.secondPlace, 'silver');
          }
          if (match.thirdPlace && match.thirdPlace !== winningTeam && match.thirdPlace !== match.secondPlace) {
            addMedal(match.thirdPlace, 'bronze');
          }
          return;
        }

        // No places — count the stored medal as before.
        if (match.medal !== 'gold' && match.medal !== 'silver' && match.medal !== 'bronze') return;
        addMedal(winningTeam, match.medal);
      });
    });

    // Convert to array and sort by Gold, then Silver, then Bronze
    return Array.from(tallyMap.values()).sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });
  };

  const tally = calculateTally();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={goBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-white" />
          <h1 className="text-2xl sm:text-3xl font-black">ဆုတံဆိပ် ဇယား (Medal Tally)</h1>
        </div>
        <p className="text-amber-100 text-sm">အားကစားပြိုင်ပွဲများမှ ကျောင်းအလိုက် ရရှိထားသော ရွှေ၊ ငွေ၊ ကြေး ဆုတံဆိပ်များ</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : loadError ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-semibold">
          ဆုတံဆိပ်ဇယား ဖတ်မရပါ။ အင်တာနက် စစ်ပြီး စာမျက်နှာကို ပြန်ဖွင့်ပါ။
        </div>
      ) : tally.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-semibold">
          ပြီးဆုံးသွားသော ပွဲစဉ်များနှင့် ဆုတံဆိပ်များ မရှိသေးပါ။
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-4 font-bold text-center w-16">အဆင့်</th>
                  <th className="p-4 font-bold">ကျောင်းအမည်</th>
                  <th className="p-4 font-bold text-center text-amber-600">🥇 ရွှေ</th>
                  <th className="p-4 font-bold text-center text-slate-500">🥈 ငွေ</th>
                  <th className="p-4 font-bold text-center text-orange-700">🥉 ကြေး</th>
                  <th className="p-4 font-bold text-center bg-sky-50 text-sky-900">စုစုပေါင်း</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tally.map((item, idx) => (
                  <tr key={item.schoolName} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center font-black text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900">{item.schoolName}</td>
                    <td className="p-4 text-center font-black text-lg text-amber-600">{item.gold}</td>
                    <td className="p-4 text-center font-black text-lg text-slate-500">{item.silver}</td>
                    <td className="p-4 text-center font-black text-lg text-orange-700">{item.bronze}</td>
                    <td className="p-4 text-center font-black text-lg bg-sky-50 text-sky-900">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
