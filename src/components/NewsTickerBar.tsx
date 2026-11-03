import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsTicker } from '../types';
import { Megaphone, Clock, ChevronRight, X, Play, Pause, AlertCircle, Info, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsTickerBar() {
  const [tickers, setTickers] = useState<NewsTicker[]>([]);
  // v24.15 P19: per-ticker dismiss, persisted in localStorage so dismissal
  // survives navigation and reload (Layout unmounts the ticker on /admin
  // routes, which used to resurrect everything dismissed). A new ticker
  // clears ONLY the dismissal for that new ticker id — other dismissals
  // stay dismissed.
  const DISMISSED_KEY = 'sssps_dismissed_tickers';
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds));
    } catch {
      // Storage full/unavailable — dismissal just won't persist.
    }
  }, [dismissedIds]);
  const dismissTicker = (id: string) => {
    setDismissedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };
  const prevIdsRef = useRef<string[]>([]);
  // v24.15 re-audit (R1): the first snapshot is NOT "new" — prevIdsRef
  // starts empty, so the first snapshot used to count every active ticker
  // as genuinely new and wipe every persisted dismissal (Layout unmounts
  // the ticker on /admin routes, so a remount wiped them again).
  const isFirstSnapshotRef = useRef(true);
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

        // v24.13: highest priority first (urgent > warning > info), newest
        // first within the same priority. The old sort was newest-first, so
        // an urgent ticker could sit behind a newer info one.
        const priorityRank = (p?: string) => (p === 'urgent' ? 0 : p === 'warning' ? 1 : 2);
        activeList.sort((a, b) => {
          const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
          if (byPriority !== 0) return byPriority;
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Only clear the dismissal for ticker ids that appear for the
        // first time (genuinely new tickers, including a deactivated
        // ticker that was reactivated) — every other dismissal stays.
        // The first snapshot only SEEDS prevIdsRef (see R1 above) and
        // clears nothing.
        const newIds = activeList.map(t => t.id);
        if (isFirstSnapshotRef.current) {
          isFirstSnapshotRef.current = false;
        } else {
          const genuinelyNew = newIds.filter(id => !prevIdsRef.current.includes(id));
          if (genuinelyNew.length > 0) {
            setDismissedIds(prev => prev.filter(id => !genuinelyNew.includes(id)));
          }
        }
        prevIdsRef.current = newIds;
        setTickers(activeList);
      },
      (error) => {
        console.warn('Ticker real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Only the tickers the user has not dismissed are shown.
  const visibleTickers = tickers.filter(t => !dismissedIds.includes(t.id));
  if (visibleTickers.length === 0) {
    return null;
  }

  // Determine top priority style from the visible tickers
  const topPriority = visibleTickers[0]?.priority || 'info';

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
      className={`w-full max-w-full overflow-hidden border-b transition-colors relative z-30 shadow-2xs print:hidden ${badgeConfig.bannerBg}`}
      role="region"
      aria-label="အရေးကြီး စာတန်းပြေး အသိပေးချက်"
    >
      <div className="w-full max-w-full flex items-center justify-between h-9 px-2 sm:px-3 gap-2 text-xs overflow-hidden">
        {/* Left Badge: Icon + Label + Live Pulse */}
        <div className="flex items-center gap-1.5 shrink-0 z-10 bg-inherit pr-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-sm shadow-2xs ${badgeConfig.bg} ${badgeConfig.text}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{badgeConfig.label}</span>
          </div>

          {/* Auto-assigned timestamp badge of the top ticker */}
          {visibleTickers[0]?.displayDateTime && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/60 text-slate-600 text-xs font-medium shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{visibleTickers[0].displayDateTime}</span>
            </div>
          )}
        </div>

        {/* Center: Scrolling Marquee Track */}
        <div
          className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="ticker-track flex items-center gap-8 text-xs sm:text-sm font-semibold"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {visibleTickers.map((item, index) => (
              <span key={item.id} className="inline-flex items-center gap-3 shrink-0">
                {/* Individual item date/time if available */}
                {item.displayDateTime && (
                  <span className="text-sm font-normal px-1.5 py-0.2 rounded bg-white/70 border border-slate-200 text-slate-500">
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
                {visibleTickers.length > 1 && (
                  <span className="text-slate-300 font-bold px-2 select-none">✦</span>
                )}

                {/* v24.15 P19: per-ticker dismiss — this ✕ dismisses only
                    this ticker, not all of them. */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); dismissTicker(item.id); }}
                  aria-label={`စာတန်းပြေး ပိတ်ထားရန်: ${item.text}`}
                  title="ဤစာတန်းပြေးကိုသာ ပိတ်ထားရန်"
                  className="p-0.5 rounded hover:bg-black/10 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right Controls: Pause/Play */}
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
        </div>
      </div>
    </div>
  );
}
