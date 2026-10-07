import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, CheckCircle2, History, Smartphone, Megaphone, CheckSquare, Shield, Activity, Layers, Crown, LayoutDashboard, Bell, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CURRENT_VERSION = 'v1.9';
const STORAGE_KEY = 'pss_last_viewed_version';

export const VersionUpdateModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const lastViewedVersion = localStorage.getItem(STORAGE_KEY);
      // If user hasn't seen this version yet, show popup
      if (lastViewedVersion !== CURRENT_VERSION) {
        setIsOpen(true);
      }
    } catch {
      // In case localStorage is blocked
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {}
    setIsOpen(false);
  };

  const handleViewDetails = () => {
    handleDismiss();
    navigate('/versions');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Modal Header with Gradient Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> ဗားရှင်းအသစ် ထွက်ရှိပါပြီ
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/20 text-white">
              {CURRENT_VERSION}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-[1.6]">
            ဘာတွေ အသစ်ပါဝင်လာသလဲ? (What's New)
          </h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1 leading-normal">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဝဘ်ဆိုက်၏ နောက်ဆုံးရ လုပ်ဆောင်ချက်များ
          </p>
        </div>

        {/* Feature Highlights Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {/* Feature 0: Latest Announcements on Top */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-100">
              <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-amber-950 text-sm">
                  Dashboard ထိပ်ဆုံးတွင် နောက်ဆုံးရ ကြေညာချက် ၂ ခု ဖော်ပြပေးခြင်း
                </h4>
                <p className="text-slate-600 leading-normal">
                  အသင်းချုပ် ဒက်ရှ်ဘုတ်နှင့် ပင်မစာမျက်နှာတို့တွင် နောက်ဆုံးရ အရေးကြီး ထုတ်ပြန်ကြေညာချက် ၂ ခုကို အပေါ်ဆုံးတွင် ချက်ချင်းဖတ်ရှုနိုင်စေရန် နေရာချထားပေးခြင်း။
                </p>
              </div>
            </div>

            {/* Feature 1: Audit Notification Bell */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
              <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-rose-950 text-sm">
                  Audit Log အသိပေးချက် ခေါင်းလောင်း (Notification Bell)
                </h4>
                <p className="text-slate-600 leading-normal">
                  Dashboard Header တွင် အက်ဒမင်များ၏ မကြာသေးမီက ပြင်ဆင်/ဖျက်ပစ်ခဲ့သော စနစ်မှတ်တမ်းများကို အချိန်နှင့်တပြေးညီ ကြည့်ရှုနိုင်သည့် အသိပေးချက် ခေါင်းလောင်း အသစ်။
                </p>
              </div>
            </div>

            {/* Feature 2: Association Overview Dashboard */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/80 border border-sky-100">
              <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-sky-950 text-sm">
                  အသင်းချုပ် ဒက်ရှ်ဘုတ် အသစ် (Association Dashboard)
                </h4>
                <p className="text-slate-600 leading-normal">
                  အသင်းဝင်ကျောင်းများ၊ ပညာသင်ကြားမှုအဆင့် ခွဲခြမ်းမှု (High/Middle/Primary) နှင့် ပင်မစာမျက်နှာမှ ချက်ချင်းရှာဖွေနိုင်သော Instant Search စနစ်။
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleViewDetails}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
          >
            <History className="w-4 h-4 text-sky-600" />
            <span>ဗားရှင်းမှတ်တမ်း အပြည့်အစုံ ကြည့်ရန်</span>
          </button>

          <button
            onClick={handleDismiss}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-900 text-white hover:bg-sky-800 transition cursor-pointer shadow-xs"
          >
            <span>သိရှိပါပြီ (Got it)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
