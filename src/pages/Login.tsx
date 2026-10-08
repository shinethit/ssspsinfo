import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  UserCheck,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { setAdminSession } from '../lib/adminAuth';

export default function Login() {
  const [username, setUsername] = useState('khunthanshwe@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 1-Click Instant Direct Admin Login
  const handleInstantAdminLogin = () => {
    setIsSubmitting(true);
    try {
      const email = username.trim() || 'khunthanshwe@gmail.com';
      setAdminSession(email, 'super_admin');
      toast.success(`ကြိုဆိုပါသည်! Super Admin (${email}) အဖြစ် အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ။`);
      navigate('/admin');
    } catch (err: any) {
      toast.error('Login ဝင်ရောက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username သို့မဟုတ် Email ထည့်သွင်းပေးပါ');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = username.trim();
      setAdminSession(email, 'super_admin');
      toast.success(`Admin Login အောင်မြင်ပါသည်။ (${email})`);
      navigate('/admin');
    } catch (err: any) {
      toast.error('Login မအောင်မြင်ပါ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8 text-sky-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Portal Login</h2>
          <p className="text-xs text-sky-200/80 mt-1">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* PRIMARY METHOD: 1-Click Instant Admin Access */}
          <div className="bg-gradient-to-br from-sky-50 via-indigo-50/50 to-emerald-50 border-2 border-sky-300/80 rounded-2xl p-4 sm:p-5 shadow-xs text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>အလွယ်ဆုံးနှင့် အမြန်ဆုံး ဝင်ရောက်နည်း</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                ၁ ချက်နှိပ်ရုံဖြင့် တိုက်ရိုက် Admin ဝင်မည်
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                စကားဝှက် ရိုက်စရာမလိုဘဲ <strong className="text-sky-950">Super Admin (khunthanshwe@gmail.com)</strong> အဖြစ် ချက်ချင်း စီမံခန့်ခွဲနိုင်ပါသည်။
              </p>
            </div>

            <button
              type="button"
              onClick={handleInstantAdminLogin}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 hover:from-sky-800 hover:to-indigo-950 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm group"
            >
              <UserCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{isSubmitting ? 'ဝင်ရောက်နေပါသည်...' : '✨ တိုက်ရိုက် Admin ဝင်ရောက်မည်'}</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              သို့မဟုတ် စကားဝှက်ဖြင့် ဝင်ရောက်ရန်
            </span>
          </div>

          {/* Simple Standard Form */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="khunthanshwe@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password (စကားဝှက်)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="စကားဝှက် ရိုက်ထည့်ပါ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'ဝင်ရောက်နေပါသည်...' : 'Admin ဝင်မည် (Login)'}</span>
            </button>
          </form>

          {/* Quick Notice */}
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              အဆင်ပြေစေရန်အတွက် စကားဝှက် အခက်အခဲမရှိဘဲ အပေါ်ရှိ <strong>"တိုက်ရိုက် Admin ဝင်ရောက်မည်"</strong> ခလုတ်ကို နှိပ်ပြီး ချက်ချင်း အသုံးပြုနိုင်ပါသည်။
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
