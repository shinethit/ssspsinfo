import { History, GitCommit, Sparkles, CheckCircle2, Shield, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { VERSIONS } from '../data/versions';
import { CURRENT_VERSION } from '../constants';

interface VersionItem {
  version: string;
  date: string;
  isLatest?: boolean;
  title: string;
  changes: {
    type: 'feat' | 'improve' | 'fix';
    text: string;
  }[];
}


export default function VersionHistory() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Back Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
          title="နောက်သို့ (Back)"
        >
          <ArrowLeft className="w-4 h-4 text-sky-800" />
          <span>နောက်သို့ (Back)</span>
        </button>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          ပင်မစာမျက်နှာ ➔
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-900 text-white rounded-2xl shadow-xs">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-950">
              ဗားရှင်းမှတ်တမ်း <span className="text-lg font-normal text-slate-500">(Version History & Changelog)</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              ဝဘ်အက်ပလီကေးရှင်း၏ ဗားရှင်းအလိုက် ပြုပြင်မွမ်းမံမှုများနှင့် အသစ်ထည့်သွင်းထားသော လုပ်ဆောင်ချက်များ
            </p>
          </div>
        </div>
      </div>

      {/* Version Cards Timeline */}
      <div className="space-y-6">
        {VERSIONS.map((item, idx) => (
          <article
            key={item.version}
            className={`bg-white rounded-2xl border p-6 sm:p-8 shadow-xs transition ${
              item.isLatest
                ? 'border-neutral-900 ring-2 ring-neutral-900/15 shadow-md'
                : 'border-slate-200'
            }`}
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base sm:text-lg font-black text-sky-950 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                  {item.version}
                </span>
                {item.isLatest && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-900 text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> လက်ရှိဗားရှင်း (Latest Version)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.date}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-sky-950 mt-4 mb-3">
              {item.title}
            </h2>

            {/* Change list */}
            <ul className="space-y-2.5">
              {item.changes.map((change, cIdx) => (
                <li key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {change.type === 'feat' ? (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      NEW
                    </span>
                  ) : change.type === 'improve' ? (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      UPDATE
                    </span>
                  ) : (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      FIX
                    </span>
                  )}
                  <span className="break-words">{change.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-slate-100/70 rounded-2xl border border-slate-200 text-center space-y-2 text-xs sm:text-sm text-slate-600">
        <p className="font-semibold text-slate-800">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း</p>
        <p>သတင်းနှင့် ပြန်ကြားရေးဌာန နည်းပညာအဖွဲ့မှ စဉ်ဆက်မပြတ် အဆင့်မြှင့်တင် ပေးလျက်ရှိပါသည်။</p>
        <div className="pt-2">
          <Link to="/" className="text-sky-800 font-bold hover:underline">
            ← ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    </div>
  );
}
