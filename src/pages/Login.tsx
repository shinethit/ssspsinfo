import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('khunthanshwe@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email နှင့် Password ကို ဖြည့်စွက်ပေးပါ။');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success('Admin Login အောင်မြင်ပါသည်။');
      navigate('/admin');
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        toast.error('စကားဝှက် (Password) မှားယွင်းနေပါသည်။ စကားဝှက်မေ့နေပါက "စကားဝှက်မေ့နေပါသလား" ဖြင့် Reset ပြုလုပ်နိုင်ပါသည်။');
      } else if (code === 'auth/user-not-found') {
        toast.error('ဤ Email ဖြင့် အကောင့်မရှိသေးပါ။ "အကောင့် အသစ်သတ်မှတ်ရန်" တက်ဘ်တွင် စတင်ဖွင့်လှစ်နိုင်ပါသည်။');
      } else if (code === 'auth/too-many-requests') {
        toast.error('အကြိမ်များစွာ ကြိုးစားထားသဖြင့် လုံခြုံရေးအရ ခေတ္တစောင့်ဆိုင်းပြီးမှ ပြန်လည်ကြိုးစားပါ။');
      } else {
        toast.error(`Login မအောင်မြင်ပါ: ${error?.message || 'ပြန်လည်စစ်ဆေးပါ။'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email နှင့် Password ကို ဖြည့်စွက်ပေးပါ။');
      return;
    }
    if (password.length < 6) {
      toast.error('Password သည် အနည်းဆုံး စာလုံး ၆ လုံး ရှိရပါမည်။');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      toast.success('အကောင့် အောင်မြင်စွာ ဖန်တီးပြီး Login ဝင်ရောက်ပြီးပါပြီ။');
      navigate('/admin');
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/email-already-in-use') {
        toast.info('ဤ Email ဖြင့် အကောင့်ဖွင့်ပြီးသားဖြစ်ပါသည်။ Login ဝင်ရောက်ပါ။');
        setMode('login');
      } else if (code === 'auth/weak-password') {
        toast.error('Password အားနည်းလွန်းပါသည်၊ အနည်းဆုံး စာလုံး ၆ လုံး သတ်မှတ်ပါ။');
      } else {
        toast.error(`အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ: ${error?.message || 'ပြန်စစ်ဆေးပါ။'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Reset link ပို့လိုသော Email ကို ရိုက်ထည့်ပေးပါ။');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      toast.success(`${email} သို့ Password Reset Link ပို့ဆောင်ပြီးပါပြီ။ Gmail ကို စစ်ဆေးပါ။`);
    } catch (error: any) {
      toast.error(`Reset link ပို့ခြင်း မအောင်မြင်ပါ: ${error?.message || 'ပြန်စစ်ဆေးပါ။'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8 text-sky-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Portal Login</h2>
          <p className="text-xs text-sky-200/80 mt-1">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ပညာရေးစနစ် စီမံခန့်ခွဲမှုစနစ်
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setResetSent(false); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-sky-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login ဝင်ရန်</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setResetSent(false); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-sky-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>အကောင့် အသစ်သတ်မှတ်ရန်</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('forgot'); setResetSent(false); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'forgot'
                ? 'bg-white text-sky-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password မေ့နေပါသလား</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Super Admin Info Hint */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-bold">ပင်မ Super Admin အကောင့်:</p>
              <p>
                စနစ်၏ Master Admin အီးမေးလ်မှာ <span className="font-mono font-bold bg-amber-100/80 px-1 py-0.5 rounded">khunthanshwe@gmail.com</span> ဖြစ်ပါသည်။
              </p>
              <button
                type="button"
                onClick={() => setEmail('khunthanshwe@gmail.com')}
                className="text-[11px] text-amber-700 underline font-semibold hover:text-amber-900 cursor-pointer block mt-1"
              >
                &rarr; ဤအီးမေးလ်ကို အလိုအလျောက် ရွေးချယ်မည်
              </button>
            </div>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Email / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="khunthanshwe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password (စကားဝှက်)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-sky-700 hover:underline cursor-pointer"
                  >
                    စကားဝှက်မေ့နေပါသလား?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
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
                className="w-full bg-sky-900 hover:bg-sky-800 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'စစ်ဆေးနေပါသည်...' : 'Login ဝင်ရောက်မည်'}</span>
              </button>
            </form>
          )}

          {/* Register / Initial Setup Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-xs text-slate-500 bg-sky-50 p-3 rounded-xl border border-sky-100 leading-relaxed">
                စနစ်တွင် အကောင့်စကားဝှက် မသတ်မှတ်ရသေးပါက သင့် Email (<span className="font-semibold text-sky-900">khunthanshwe@gmail.com</span>) အတွက် စကားဝှက်အသစ် သတ်မှတ်ပြီး တိုက်ရိုက် စတင်အသုံးပြုနိုင်ပါသည်။
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="khunthanshwe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  သတ်မှတ်လိုသော စကားဝှက် (Password - အနည်းဆုံး ၆ လုံး)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="အနည်းဆုံး ၆ လုံး"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
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
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'ဖန်တီးနေပါသည်...' : 'အကောင့်စကားဝှက် သတ်မှတ်ပြီး စတင်မည်'}</span>
              </button>
            </form>
          )}

          {/* Forgot Password / Reset Link Form */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-emerald-900">
                    Reset Link အီးမေးလ် ပို့ဆောင်ပြီးပါပြီ
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <span className="font-bold">{email}</span> ၏ Gmail Inbox (သို့မဟုတ် Spam folder) သို့ ဝင်ရောက်ပြီး ပါရှိသော link ကို နှိပ်၍ စကားဝှက်အသစ် ပြောင်းလဲသတ်မှတ်နိုင်ပါသည်။
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setResetSent(false); }}
                    className="text-xs bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-900 transition"
                  >
                    Login ပြန်သွားရန်
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    သင့် Email ထံသို့ Password ပြန်လည်သတ်မှတ်နိုင်မည့် လုံခြုံရေး Reset Link ကို Firebase မှ ပို့ပေးမည် ဖြစ်ပါသည်။
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Admin Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="khunthanshwe@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isSubmitting ? 'ပို့နေပါသည်...' : 'Password Reset Link ပို့မည်'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
