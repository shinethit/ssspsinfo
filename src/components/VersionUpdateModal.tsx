import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, History, Layers, Bell, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CURRENT_VERSION = 'v2.6';
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

    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('sssps_open_version_modal', handleOpen);
    return () => window.removeEventListener('sssps_open_version_modal', handleOpen);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Modal Header with Black Banner (Version Update အမဲ) */}
        <div className="bg-black p-6 text-white relative border-b border-neutral-800">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-neutral-900 text-amber-300 border border-neutral-700 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Version Update (အမဲ)
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/20 text-white">
              {CURRENT_VERSION}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-[1.6]">
            ဘာတွေ အသစ်ပါဝင်လာသလဲ? (What's New in v2.6)
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-normal">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဝဘ်ဆိုက်၏ နောက်ဆုံးရ ပြင်ဆင်မွမ်းမံမှုများ
          </p>
        </div>

        {/* Feature Highlights Body */}
        <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Feature 1: Phone Directory Drop Down (No Overflow) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-emerald-950 text-sm">
                ကျောင်းဖုန်းနံပါတ်များ Drop Down စနစ်သစ် (Overflow မဖြစ်စေသော စနစ်)
              </h4>
              <p className="text-slate-600 leading-normal">
                စာမျက်နှာအရှည်ကြီး မဖြစ်စေရန် ကျောင်းကတ်တစ်ခုစီတွင် '📞 ဖုန်းခေါ်ရန် Dropdown ▾' ခလုတ်ဖြင့် ၁-ချက်နှိပ်ရုံဖြင့် သက်ဆိုင်ရာကျောင်း၏ ဖုန်းနံပါတ်များအားလုံးကို Dropdown စာရင်းအဖြစ် ပေါ်ထွက်လာပြီး တန်းပြီး ခေါ်ဆိုနိုင်အောင် ပြုလုပ်ထားပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 2: Location Fields Breakdown (Address, Township, City, Zone) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/80 border border-sky-100">
            <div className="p-2 rounded-xl bg-sky-900 text-white shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-sky-950 text-sm">
                ကျောင်းတည်နေရာ ခွဲခြားသတ်မှတ်မှု (ကျောင်းလိပ်စာ၊ မြို့နယ်၊ မြို့၊ ဇုန်)
              </h4>
              <p className="text-slate-600 leading-normal">
                ကျောင်းအချက်အလက်များတွင် ကျောင်းလိပ်စာ၊ မြို့နယ်၊ မြို့ နှင့် ဇုန် (Zone) တို့ကို သီးခြားစီ သတ်မှတ်ထည့်သွင်းနိုင်ပြီး Admin၊ ကျောင်းအသေးစိတ်နှင့် Excel Export စနစ်များတွင် ပြည့်စုံစွာ ပြသပေးထားပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 3: Automatic Version History Tracking */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-amber-950 text-sm">
                အလိုအလျောက် ဗားရှင်းမှတ်တမ်း ထိန်းသိမ်းခြင်း (Automatic Version History)
              </h4>
              <p className="text-slate-600 leading-normal">
                စနစ်တွင် ပြင်ဆင်မှု၊ အပ်ဒိတ်တစ်ခုခု ပြုလုပ်တိုင်း Version History နှင့် Whats New Modal တို့တွင် အလိုအလျောက် သီးသန့်မှတ်တမ်းတင် အသိပေးပေးသွားမည့် စနစ်ကို အမြဲတမ်း အလုပ်လုပ်စေရန် သတ်မှတ်ပေးထားပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 4: Black Version Update Badge */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <div className="p-2 rounded-xl bg-black text-amber-400 border border-neutral-700 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-white text-sm">
                အနက်ရောင် Version Update (အမဲ) v2.6 တံဆိပ်
              </h4>
              <p className="text-slate-300 leading-normal">
                စနစ်အတွင်း အသစ်ပြောင်းလဲမှု၊ ပြင်ဆင်မှုတိုင်းကို ချက်ချင်း သိရှိနိုင်စေရန် အနက်ရောင် (Black) 'Version Update v2.6' တံဆိပ်ကို Header၊ Sidebar၊ Footer နှင့် Version History တို့တွင် ဖော်ပြထားပါသည်။
              </p>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-black text-white hover:bg-neutral-800 transition cursor-pointer shadow-xs border border-neutral-800"
          >
            <span>သိရှိပါပြီ (Got it)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
