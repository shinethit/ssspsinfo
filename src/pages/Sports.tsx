import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, MapPin, ChevronRight, ArrowLeft, Medal } from 'lucide-react';
import { SportsEvent } from '../types';

export default function Sports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'finished'>('finished');

  // Mock data for UI demonstration
  const mockEvents: SportsEvent[] = [
    {
      id: '1', title: 'ရှမ်းတောင်ပိုင်း ကိုယ်ပိုင်ကျောင်းများ ဘောလုံးပြိုင်ပွဲ', sportType: 'ဘောလုံး',
      status: 'finished', startDate: '2026-10-15', location: 'တောင်ကြီး အားကစားကွင်း',
      results: [
        { id: 'm1', teamA: 'ရွှေမင်းသား', scoreA: 2, teamB: 'ပညာရောင်ခြည်', scoreB: 1, winner: 'ရွှေမင်းသား' },
        { id: 'm2', teamA: 'အောင်ပန်း', scoreA: 0, teamB: 'ကလော', scoreB: 0, winner: 'သရေ' }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-900 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black">အားကစားပြိုင်ပွဲများ</h1>
        </div>
        <p className="text-emerald-100 text-sm max-w-2xl">အသင်းဝင်ကျောင်းများ၏ အားကစားပြိုင်ပွဲ သတင်းများနှင့် ရလဒ်များ</p>
      </div>

      <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
        {(['upcoming', 'ongoing', 'finished'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === tab ? 'bg-sky-100 text-sky-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            {tab === 'upcoming' ? 'လာမည့်ပွဲစဉ်များ' : tab === 'ongoing' ? 'ယှဉ်ပြိုင်နေဆဲ' : 'ရလဒ်များ'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'finished' ? (
          mockEvents.filter(e => e.status === 'finished').map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-2 inline-block">{event.sportType}</span>
                    <h3 className="font-bold text-slate-900 text-base">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.startDate}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ပွဲရလဒ်များ</h4>
                {event.results.map(match => (
                  <div key={match.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className={`flex-1 text-right font-bold ${match.winner === match.teamA ? 'text-sky-900' : 'text-slate-600'}`}>{match.teamA}</div>
                    <div className="px-4 font-mono font-black text-lg text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm mx-2">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <div className={`flex-1 text-left font-bold ${match.winner === match.teamB ? 'text-sky-900' : 'text-slate-600'}`}>{match.teamB}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            ဤကဏ္ဍတွင် ပြိုင်ပွဲများ မရှိသေးပါ။
          </div>
        )}
      </div>
    </div>
  );
}
