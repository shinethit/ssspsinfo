import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-500 animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>အင်တာနက် လိုင်းမရှိပါ (Offline Mode) — ဒေတာများကို အော့ဖ်လိုင်း မှတ်ဉာဏ်မှ ဖတ်ရှုနေပါသည်။</span>
    </div>
  );
};
