import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { School, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Authenticate
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 2. Verify this user is linked to a school
      const q = query(collection(db, 'schools'), where('authUid', '==', user.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Check by email just in case
        const q2 = query(collection(db, 'schools'), where('accountEmail', '==', user.email));
        const snap2 = await getDocs(q2);
        if (snap2.empty) {
          toast.error('ဤအကောင့်သည် ကျောင်းအကောင့်အဖြစ် သတ်မှတ်ထားခြင်း မရှိပါ');
          await auth.signOut();
          return;
        }
      }

      toast.success('အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်');
      navigate('/school-portal');
    } catch (err: any) {
      toast.error('အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-sky-100 text-sky-700 rounded-2xl mx-auto flex items-center justify-center mb-2">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">ကျောင်း အကောင့်ဝင်ရန်</h1>
          <p className="text-sm text-slate-500">Member Portal (School Login)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">အီးမေးလ် (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">စကားဝှက် (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-sky-900 text-white py-3 rounded-xl font-bold hover:bg-sky-800 transition">
            {isSubmitting ? 'စစ်ဆေးနေပါသည်...' : 'ဝင်ရောက်မည်'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-sky-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> ပင်မစာမျက်နှာသို့
          </Link>
        </div>
      </div>
    </div>
  );
}
