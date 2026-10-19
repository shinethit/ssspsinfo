import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow (supports beforeinstallprompt)
  if (isInstallable) {
    if (variant === 'sidebar') {
      return (
        <button
          onClick={install}
          type="button"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-900 text-white shadow-xs hover:bg-sky-800 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Download className="w-4 h-4 text-sky-200 shrink-0" />
            <span className="truncate">ဖုန်း/ကွန်ပျူတာတွင် အက်ပ်သွင်းမည်</span>
          </div>
          <span className="text-[10px] bg-sky-800 px-1.5 py-0.5 rounded text-sky-100">
            Install
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition shadow-xs cursor-pointer"
        title="ဤဝဘ်ဆိုက်ကို ဖုန်း သို့မဟုတ် ကွန်ပျူတာထဲသို့ အက်ပ်အဖြစ် သွင်းယူရန်"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">အက်ပ်သွင်းရန်</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit, guide user)
  if (isIOS) {
    return (
      <>
        {variant === 'sidebar' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Smartphone className="w-4 h-4 text-sky-700 shrink-0" />
              <span>iPhone/iPad တွင် သွင်းရန်</span>
            </div>
            <span className="text-[10px] text-slate-500">iOS</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title="iPhone / iPad တွင် Home Screen သို့ ထည့်သွင်းရန်"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <span className="hidden sm:inline">iOS တွင်သွင်းရန်</span>
            <span className="sm:hidden">iOS</span>
          </button>
        )}

        {/* Guided iOS Modal */}
        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      iPhone / iPad တွင် ထည့်သွင်းနည်း
                    </h3>
                    <p className="text-[11px] text-slate-500">Safari Browser ဖြင့် အလွယ်တကူ သွင်းနိုင်ပါသည်</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    ၁
                  </span>
                  <div>
                    Safari ၏ အောက်ခြေဘားရှိ <strong className="text-sky-900 inline-flex items-center gap-1 font-bold"><Share2 className="w-3.5 h-3.5 inline" /> Share (မျှဝေရန်)</strong> ခလုတ်ကို နှိပ်ပါ။
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    ၂
                  </span>
                  <div>
                    အောက်သို့ အနည်းငယ်ဆွဲချပြီး <strong className="text-sky-900 inline-flex items-center gap-1 font-bold"><PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen (ပင်မမျက်နှာပြင်သို့ ထည့်ရန်)</strong> ကို နှိပ်ပါ။
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    ၃
                  </span>
                  <div>
                    ညာဘက်အပေါ်ထောင့်ရှိ <strong>Add (ထည့်ရန်)</strong> ကို နှိပ်လိုက်ပါက သင့်ဖုန်း၏ Home Screen တွင် Native App ကဲ့သို့ ပေါ်လာပါမည်။
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-sky-900 text-white text-xs sm:text-sm font-bold hover:bg-sky-800 transition shadow-xs cursor-pointer"
              >
                နားလည်ပါပြီ (Close)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback (e.g. desktop non-chromium or already primed)
  return null;
};
