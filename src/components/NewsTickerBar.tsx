import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsTicker } from '../types';
import { Megaphone, Clock, ChevronRight, X, Play, Pause, AlertCircle, Info, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsTickerBar() {
  const [tickers, setTickers] = useState<NewsTicker[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Real-time listener for active news tickers
    const q = query(
      collection(db, 'tickers'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeList = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as NewsTicker[];

        // Sort locally by createdAt desc
        activeList.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setTickers(activeList);
        if (activeList.length > 0) {
          setDismissed(false); // Re-show if new ticker is activated
        }
      },
      (error) => {
        console.warn('Ticker real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  if (tickers.length === 0 || dismissed) {
    return null;
  }

  // Determine top priority style from active tickers
  const topPriority = tickers[0]?.priority || 'info';

  const badgeConfig = {
    urgent: {
      bg: 'bg-rose-600',
      text: 'text-white',
      bannerBg: 'bg-rose-50 border-rose-200 text-rose-950',
      label: 'အထူးကြေညာချက်',
      icon: Flame,
    },
    warning: {
      bg: 'bg-amber-600',
      text: 'text-white',
      bannerBg: 'bg-amber-50 border-amber-200 text-amber-950',
      label: 'သတိပေးချက်',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-sky-800',
      text: 'text-white',
      bannerBg: 'bg-sky-50 border-sky-200 text-sky-950',
      label: 'စာတန်းပြေး သတင်း',
      icon: Megaphone,
    },
  }[topPriority];

  const Icon = badgeConfig.icon;

  return (
    <div
      className={`w-full border-b transition-colors relative z-30 shadow-2xs ${badgeConfig.bannerBg}`}
      role="region"
      aria-label="အရေးကြီး စာတန်းပြေး အသိပေးချက်"
    >
      <div className="w-full flex items-center justify-between h-10 px-2 sm:px-4 gap-2 text-xs">
        {/* Left Badge: Icon + Label + Live Pulse */}
        <div className="flex items-center gap-1.5 shrink-0 z-10 bg-inherit pr-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] shadow-2xs ${badgeConfig.bg} ${badgeConfig.text}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">{badgeConfig.label}</span>
          </div>

          {/* Auto-assigned timestamp badge of the newest ticker */}
          {tickers[0]?.displayDateTime && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/60 text-slate-600 text-[10px] font-medium shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{tickers[0].displayDateTime}</span>
            </div>
          )}
        </div>

        {/* Center: Scrolling Marquee Track */}
        <div
          className="flex-1 overflow-hidden relative h-full flex items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="ticker-track flex items-center gap-8 text-xs sm:text-sm font-semibold"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {tickers.map((item, index) => (
              <span key={item.id} className="inline-flex items-center gap-3 shrink-0">
                {/* Individual item date/time if available */}
                {item.displayDateTime && (
                  <span className="text-[11px] font-normal px-1.5 py-0.2 rounded bg-white/70 border border-slate-200 text-slate-500">
                    {item.displayDateTime}
                  </span>
                )}

                {item.link ? (
                  item.link.startsWith('/') ? (
                    <Link
                      to={item.link}
                      className="hover:underline flex items-center gap-1 text-sky-900 font-bold"
                    >
                      <span>{item.text}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 text-sky-900 font-bold"
                    >
                      <span>{item.text}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  )
                ) : (
                  <span className="font-medium text-slate-800">{item.text}</span>
                )}

                {/* Separator between items if multiple */}
                {tickers.length > 1 && (
                  <span className="text-slate-300 font-bold px-2 select-none">✦</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Right Controls: Pause/Play & Dismiss */}
        <div className="flex items-center gap-1 shrink-0 z-10 bg-inherit pl-2">
          <button
            type="button"
            onClick={() => setIsPaused(prev => !prev)}
            aria-label={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            title={isPaused ? 'စာတန်းပြေး ပြန်လည်စတင်ရန်' : 'စာတန်းပြေး ခေတ္တရပ်ထားရန်'}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-600 transition cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            title="စာတန်းပြေး ပိတ်ထားရန်"
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
