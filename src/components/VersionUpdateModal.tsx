import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, History, Layers, Bell, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CURRENT_VERSION = 'v2.4';
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
            ဘာတွေ အသစ်ပါဝင်လာသလဲ? (What's New)
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-normal">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဝဘ်ဆိုက်၏ နောက်ဆုံးရ ပြင်ဆင်မွမ်းမံမှုများ
          </p>
        </div>

        {/* Feature Highlights Body */}
        <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Feature 1: School Levels 3-way Synchronization */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/80 border border-sky-100">
            <div className="p-2 rounded-xl bg-sky-900 text-white shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-sky-950 text-sm">
                ကျောင်းအဆင့်များ သုံးဘက်ညီ (Contacts, Dashboard, Admin) တပြေးညီ ချိတ်ဆက်မှု
              </h4>
              <p className="text-slate-600 leading-normal">
                Contacts (ပထမပုံ)၊ Dashboard (ဒုတိယပုံ) နှင့် Admin (တတိယပုံ) တို့ရှိ ကျောင်းအဆင့် စစ်ထုတ်မှုများနှင့် အရေအတွက်များကို တပြေးညီ (Inline Real-time Sync) ဖြစ်စေပြီး Admin တွင် ပြင်ဆင်/အတိုးအလျှော့ ပြုလုပ်မှုတိုင်း မျက်နှာပြင်အားလုံးတွင် တိုက်ရိုက် အလိုအလျောက် ပြောင်းလဲသွားစေပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 2: Prominent Notification Bell */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-amber-950 text-sm">
                ခေါင်းလောင်း အသိပေးချက် (Notification Bell) အမြဲမပြတ် ပေါ်လွင်စွာ မြင်တွေ့နိုင်ခြင်း
              </h4>
              <p className="text-slate-600 leading-normal">
                Preview နှင့် မည်သည့် မျက်နှာပြင်တွင်မဆို ခေါင်းလောင်း notification icon ကို မပျောက်ကွယ်ဘဲ အမြဲတစေ ပေါ်လွင်ထင်ရှားစွာ မြင်တွေ့နိုင်အောင် ဖန်တီးပေးပြီး စနစ်လုပ်ဆောင်ချက်များ (ကျောင်းထည့်/ပြင်/ဖျက်) နှင့် ဗားရှင်းအသစ်များကို အချိန်နှင့်တပြေးညီ အသိပေးစေပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 3: Black Version Update Badge */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <div className="p-2 rounded-xl bg-black text-amber-400 border border-neutral-700 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-white text-sm">
                အနက်ရောင် Version Update (အမဲ) တံဆိပ် စနစ်သစ်
              </h4>
              <p className="text-slate-300 leading-normal">
                စနစ်တစ်ခုခု ပြောင်းလဲတိုင်း၊ ပြင်တိုင်း၊ Improve လုပ်တိုင်း နဂိုအခြေအနေနှင့် မတူညီသည်များကို အလွယ်တကူ သိရှိစေရန် အနက်ရောင် (Black) 'Version Update v2.4' တံဆိပ်ကို Header၊ Sidebar နှင့် Navigation များတွင် အထင်အရှား ထည့်သွင်းပေးထားပါသည်။
              </p>
            </div>
          </div>

          {/* Feature 4: Compact Clean Notification Strip */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-emerald-950 text-sm">
                ကျစ်လျစ်သပ်ရပ်သော Compact Notification & Toast စနစ်
              </h4>
              <p className="text-slate-600 leading-normal">
                အသုံးပြုသူ ကြည့်ရှုအသုံးပြုရာတွင် အဆင်မပြေဖြစ်စေသော အရှည်ကြီးဖြစ်နေသည့် Notification များနှင့် Toast များကို ကျစ်လျစ်သိပ်သည်းပြီး မျက်စိရှင်းလင်းစွာ ဖတ်ရှုနိုင်သော Compact Alert Strip နှင့် စက္ကန့်တို Toast များဖြင့် ပြောင်းလဲပြင်ဆင်ထားပါသည်။
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
