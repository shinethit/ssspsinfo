import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  verifyAdminCredentials,
  sendAdminPasswordReset,
} from '../lib/adminAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Password Reset Mode (Firebase Auth Send Password Reset Email)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Secure Password Verification Login
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setLoginError('Admin Email ထည့်သွင်းပေးပါ');
      return;
    }
    if (!cleanPass) {
      setLoginError('စကားဝှက် (Password) ရိုက်ထည့်ပေးပါ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyAdminCredentials(cleanUser, cleanPass);

      if (!res.success) {
        if (res.errorCode) {
          console.error('Firebase Auth error code (err.code):', res.errorCode);
        }
        setLoginError(res.error || 'စကားဝှက် မှားယွင်းနေပါသည်');
        toast.error(res.error || 'စကားဝှက် မှားယွင်းနေပါသည်');
        return;
      }

      toast.success(`ကြိုဆိုပါသည်! Admin Login အောင်မြင်ပါသည်။ (${res.email})`);
      navigate('/admin');
    } catch (err: any) {
      console.error('Firebase Auth error code (err.code):', err?.code, err);
      let errMsg = 'Login ဝင်ရောက်ရာတွင် အမှားဖြစ်ပွားပါသည်';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'invalid-credential') {
        errMsg = 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။';
      } else if (err?.code === 'permission-denied' || err?.code === 'auth/permission-denied' || err?.code?.includes('permission-denied')) {
        errMsg = 'အချက်အလက်များ ဖတ်ရှုခွင့် ခွင့်ပြုချက် မရှိပါ (Permission Denied)။ စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။';
      }
      setLoginError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Password Reset Email via Firebase Auth
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    const cleanEmail = setupEmail.trim();
    if (!cleanEmail) {
      setSetupError('Admin Email ထည့်သွင်းပေးပါ');
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await sendAdminPasswordReset(cleanEmail);

      if (!res.success) {
        if (res.errorCode) {
          console.error('Firebase Auth reset error code (err.code):', res.errorCode);
        }
        setSetupError(res.error || 'စကားဝှက် ပြန်လည်ရယူရန် လင့်ခ် ပို့၍မရပါ');
        toast.error(res.error || 'စကားဝှက် ပြန်လည်ရယူရန် လင့်ခ် ပို့၍မရပါ');
        return;
      }

      toast.success(`စကားဝှက် ပြောင်းလဲရန် လင့်ခ်ကို "${cleanEmail}" သို့ အောင်မြင်စွာ ပို့ပေးပြီးပါပြီ။ အီးမေးလ်ကို စစ်ဆေးပါ။`);
      setShowPasswordSetup(false);
    } catch (err: any) {
      console.error('Firebase Auth reset error code (err.code):', err?.code, err);
      let errMsg = 'စကားဝှက် ပြန်လည်ရယူရာတွင် အမှားဖြစ်ပွားပါသည်';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'invalid-credential') {
        errMsg = 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။';
      } else if (err?.code === 'permission-denied' || err?.code === 'auth/permission-denied' || err?.code?.includes('permission-denied')) {
        errMsg = 'အချက်အလက်များ ဖတ်ရှုခွင့် ခွင့်ပြုချက် မရှိပါ (Permission Denied)။ စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။';
      }
      setSetupError(errMsg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-950 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8 text-sky-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Portal Login</h2>
          <p className="text-xs text-sky-200/80 mt-1">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] bg-sky-800/80 border border-sky-400/30 text-sky-100">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>လုံခြုံစိတ်ချရသော စကားဝှက်ဖြင့် စစ်ဆေးခြင်း</span>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {!showPasswordSetup ? (
            /* Standard Secure Login Form */
            <form onSubmit={handleFormLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{loginError}</p>
                    <p className="text-[11px] text-rose-600">
                      စကားဝှက် မေ့နေပါက အောက်ရှိ{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordSetup(true);
                          setSetupEmail(username);
                        }}
                        className="underline font-bold hover:text-rose-900 cursor-pointer"
                      >
                        "စကားဝှက် ပြန်လည်ရယူရန်"
                      </button>{' '}
                      ကို နှိပ်ပါ။
                    </p>
                  </div>
                </div>
              )}

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
                    placeholder="admin@example.com"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition bg-slate-50/50 text-slate-900"
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
                    onClick={() => {
                      setShowPasswordSetup(true);
                      setSetupEmail(username);
                    }}
                    className="text-xs text-sky-700 hover:text-sky-900 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>စကားဝှက် မေ့နေပါသလား?</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="စကားဝှက် ရိုက်ထည့်ပါ"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition bg-slate-50/50 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-sky-800 via-sky-900 to-indigo-950 hover:from-sky-900 hover:to-indigo-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'စစ်ဆေးနေပါသည်...' : 'Admin ဝင်မည် (Login)'}</span>
              </button>

              {/* Password Assistance Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <HelpCircle className="w-4 h-4 text-sky-700" />
                  <span>စကားဝှက် အကူအညီ (Password Assistance)</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  • စနစ်တွင် ခွင့်ပြုထားသော Admin အကောင့်၏ Email နှင့် စကားဝှက်ဖြင့် လုံခြုံစွာ Login ဝင်ရောက်နိုင်ပါသည်။
                </p>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  • စကားဝှက် မေ့လျော့နေပါက သို့မဟုတ် အသစ်ပြောင်းလိုပါက အောက်ရှိ ခလုတ်ဖြင့် စကားဝှက် ပြန်လည်ရယူရန် လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့နိုင်ပါသည်။
                </p>

                <div className="pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSetup(true);
                      setSetupEmail(username);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-sky-900 font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-sky-700" />
                    <span>🔑 စကားဝှက် ပြန်လည်ရယူရန် လင့်ခ် ပို့မည်</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Password Reset Request Form */
            <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sky-950 text-sm">
                  <KeyRound className="w-4 h-4 text-sky-700" />
                  <span>စကားဝှက် ပြန်လည်ရယူခြင်း (Reset Password)</span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  အောက်ပါ အကွက်တွင် အက်ဒမင် အီးမေးလ်လိပ်စာကို ထည့်သွင်းပေးပါ။ စကားဝှက် အသစ် ပြောင်းလဲသတ်မှတ်နိုင်သော လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့ပေးပါမည်။
                </p>
              </div>

              {setupError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{setupError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordSetup(false)}
                  className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSendingReset ? 'ပေးပို့နေပါသည်...' : 'Reset လင့်ခ် ပို့မည်'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
