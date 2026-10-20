import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { School, Athlete } from '../types';
import { toast } from 'sonner';
import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users, Eye, ShieldCheck, UserCheck } from 'lucide-react';
import { STANDARD_ZONES } from '../constants';

export default function SchoolPortal() {
  const [school, setSchool] = useState<School | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [township, setTownship] = useState('');
  const [zone, setZone] = useState('');
  const [studentCount, setStudentCount] = useState('');

  useEffect(() => {
    const fetchSchoolData = async () => {
      const user = auth.currentUser;
      if (!user) { navigate('/school-login'); return; }

      try {
        const q = query(collection(db, 'schools'), where('authUid', '==', user.uid));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as School;
          setSchool(data);
          setPhone(data.schoolPhone || '');
          setAddress(data.address || '');
          setTownship(data.township || '');
          setZone(data.zone || '');
          setStudentCount(data.studentCount?.toString() || '');

          // Fetch athletes for this school
          const athleteQuery = query(collection(db, 'athletes'), where('school', '==', data.name));
          const athleteSnap = await getDocs(athleteQuery);
          setAthletes(athleteSnap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete)));
        } else {
          toast.error('ကျောင်းအချက်အလက် ရှာမတွေ့ပါ');
        }
      } catch (err) {
        toast.error('ဒေတာဆွဲယူရာတွင် အမှားဖြစ်ပွားပါသည်');
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        schoolPhone: phone,
        address,
        township,
        zone,
        studentCount: studentCount ? Number(studentCount) : null,
        updatedAt: new Date().toISOString()
      });
      toast.success('အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ');
    } catch (err) {
      toast.error('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/school-login');
  };

  if (loading) return <div className="p-10 text-center">ခဏစောင့်ပါ...</div>;
  if (!school) return <div className="p-10 text-center">ကျောင်းအချက်အလက် မရှိပါ။</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <SchoolIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">{school.name}</h1>
              <p className="text-xs text-slate-500">School Member Portal</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg">
            <LogOut className="w-4 h-4" /> ထွက်မည်
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Profile Edit Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-sky-950">လုံခြုံရေး အသိပေးချက်</h3>
                <p className="text-xs text-sky-800 mt-1">ဤအကောင့်သည် သင့်ကျောင်း၏ အချက်အလက်များကိုသာ ပြင်ဆင်ခွင့်ရှိပါသည်။</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">အချက်အလက် ပြင်ဆင်ရန်</h2>
              <Link to={`/schools/${school.id}`} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 transition flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Profile ကြည့်ရန်
              </Link>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-3 h-3 text-sky-600"/> ကျောင်းဖုန်း</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Users className="w-3 h-3 text-sky-600"/> ကျောင်းသားဦးရေ</label>
                <input type="number" value={studentCount} onChange={e => setStudentCount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-sky-600"/> ကျောင်းလိပ်စာ</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">မြို့နယ်</label>
                <input type="text" value={township} onChange={e => setTownship(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-600"/> ဇုန် (Zone)</label>
                <select value={zone} onChange={e => setZone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="">- ဇုန် မသတ်မှတ်ရသေး -</option>
                  {STANDARD_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={saving} className="w-full bg-sky-900 hover:bg-sky-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'အချက်အလက်များ သိမ်းမည်'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Registered Athletes */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" /> သင့်ကျောင်း၏ အားကစားသမားများ
            </h2>
            
            {athletes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                <p className="text-sm">အားကစားသမား စာရင်း မရှိသေးပါ။</p>
                <p className="text-xs text-slate-400 mt-1">Admin ထံမှ အချက်အလက်များ ဖြည့်သွင်းရန် လိုအပ်ပါသည်။</p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    {a.photoUrl ? (
                      <img src={a.photoUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">အတန်း: {a.grade} | အသက်: {a.age}</p>
                      <div className="flex gap-1 mt-1">
                        {a.sports.map(s => (
                          <span key={s} className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
