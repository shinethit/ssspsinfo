import React from 'react';
import { useData } from '../context/DataContext';
import { RefreshCw, CheckCircle2, WifiOff, CloudCheck } from 'lucide-react';

export const OfflineSyncStatusBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isOffline, isSyncing, lastSyncTime, syncData } = useData();

  const handleManualSync = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    syncData(true);
  };

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'အသစ်စတင်ဆဲ';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'ခုနလေးတင်';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} မိနစ်ခန့်က`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} နာရီခန့်က`;
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleManualSync}
        disabled={isSyncing}
        title={`Offline Sync အခြေအနေ: ${isOffline ? 'Offline Mode' : 'Online Sync'} (နောက်ဆုံး Sync: ${formatLastSync(lastSyncTime)})`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer select-none ${
          isOffline
            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {isOffline ? (
          <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        ) : (
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
        )}
        <span className="hidden md:inline">{isOffline ? 'Offline' : isSyncing ? 'Syncing...' : 'Synced'}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition ${
        isOffline
          ? 'bg-amber-50 text-amber-950 border-amber-300'
          : 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
          }`}
        />
        <span className="font-bold">
          {isOffline ? 'Offline Sync (Cache)' : 'Offline Sync အသင့်ရှိ'}
        </span>
      </div>

      <span className="text-[11px] text-slate-500 hidden sm:inline">
        • {formatLastSync(lastSyncTime)}
      </span>

      <button
        type="button"
        onClick={handleManualSync}
        disabled={isSyncing}
        title="ဒေတာ အချက်အလက်များ အသစ်စစ်ဆေးရန် နှိပ်ပါ (Sync Now)"
        className="p-1 rounded-lg hover:bg-black/5 text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
      >
        <RefreshCw className={`w-3 h-3 text-sky-700 ${isSyncing ? 'animate-spin' : ''}`} />
        <span className="hidden md:inline">{isSyncing ? 'စစ်ဆေးနေဆဲ...' : 'Sync လုပ်မည်'}</span>
      </button>
    </div>
  );
};
