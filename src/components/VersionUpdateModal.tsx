import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, History, Activity, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VERSIONS } from '../data/versions';
import { CURRENT_VERSION } from '../constants';

const STORAGE_KEY = 'pss_last_viewed_version';

export const VersionUpdateModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isForceReloading, setIsForceReloading] = useState(false);
  const navigate = useNavigate();
  
  const latestVersion = VERSIONS[0];

  useEffect(() => {
    try {
      const lastViewedVersion = localStorage.getItem(STORAGE_KEY);
      if (lastViewedVersion !== CURRENT_VERSION) {
        setTimeout(() => setIsOpen(true), 800);
      }
    } catch {}

    const handleOpen = () => setIsOpen(true);
    window.addEventListener('sssps_open_version_modal', handleOpen);
    return () => window.removeEventListener('sssps_open_version_modal', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      const reg = (window as any).__swReg as ServiceWorkerRegistration | undefined;
      if (reg) {
        // Check for update first
        try { await reg.update(); } catch {}
        if (reg.waiting) {
          // Tell waiting worker to skip waiting
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Controllerchange handler in main.tsx will reload
          // Fallback reload after 2s
          setTimeout(() => window.location.reload(), 2000);
        } else {
          // No waiting — just reload to pick up fresh files
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  const handleForceReload = async () => {
    setIsForceReloading(true);
    try {
      // 1) Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      // 2) Delete all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
    } catch (e) {
      console.error('Force reload error:', e);
    } finally {
      // 3) Hard reload bypassing HTTP cache
      const url = window.location.href.split('?')[0] + '?nocache=' + Date.now();
      window.location.replace(url);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-900 p-6 text-white relative">
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-slate-800 text-amber-300 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Update
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/20 text-white">
              {CURRENT_VERSION}
            </span>
          </div>
          <h2 className="text-xl font-black leading-snug">ဘာတွေ အသစ်ပါဝင်လာသလဲ?</h2>
          <p className="text-slate-400 text-xs mt-1">{latestVersion.title}</p>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto bg-slate-50">
          {latestVersion.changes.map((change, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${change.type === 'fix' ? 'bg-rose-100 text-rose-700' : change.type === 'feat' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 block">{change.type}</span>
                <p className="text-slate-700 text-xs leading-relaxed font-medium">{change.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-wrap justify-end gap-2 bg-white">
          <button
            onClick={handleForceReload}
            disabled={isForceReloading}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Cache အားလုံး ဖျက်ပြီး Browser ကို အတင်းပြန်ဖွင့်မည်"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isForceReloading ? 'ပြန်လည်သတ်မှတ်နေသည်...' : 'Force Reload'}
          </button>
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Service Worker Update ကို ခေါ်ပြီး ပြန်ဖွင့်မည်"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Update လုပ်နေသည်...' : 'Update Now'}
          </button>
          <button onClick={() => { handleDismiss(); navigate('/versions'); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
            မှတ်တမ်းအားလုံး
          </button>
          <button onClick={handleDismiss} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-sky-900 hover:bg-sky-800 transition cursor-pointer">
            သိရှိပါပြီ
          </button>
        </div>

      </div>
    </div>
  );
};
