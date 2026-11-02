import { AdminUser, Association, NewsTicker } from '../../types';
import { CheckCircle2, FileText, Megaphone, Plus, School as SchoolIcon, Users } from 'lucide-react';

interface AdminDashboardTabProps {
  schools: any[];
  announcements: any[];
  tickers: NewsTicker[];
  associations: Association[];
  admins: AdminUser[];
  onAddSchool: () => void;
  onGoToTab: (tab: string) => void;
}

export default function AdminDashboardTab({ schools, announcements, tickers, associations, admins, onAddSchool, onGoToTab }: AdminDashboardTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">မင်္ဂလာပါ၊ စီမံခန့်ခွဲမှုစနစ်မှ ကြိုဆိုပါသည်</h1>
          <p className="text-sky-200 text-sm mt-1">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဒေတာစင်တာ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onAddSchool} className="bg-white text-sky-950 hover:bg-sky-50 px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" /> ကျောင်းအသစ်ထည့်ရန်
          </button>
          <button onClick={() => onGoToTab('announcements')} className="bg-sky-700/60 hover:bg-sky-700 text-white border border-sky-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            <Megaphone className="w-4 h-4" /> ကြေညာချက်တင်ရန်
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onGoToTab('schools')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">စုစုပေါင်း ကျောင်းများ</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><SchoolIcon className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{schools.length}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-1">လည်ပတ်ဆဲ {schools.filter(s => (s.status || 'active') === 'active').length} ကျောင်း</p>
        </div>

        <div onClick={() => onGoToTab('schools')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">နှစ်စဉ်ကြေး ပေးသွင်းပြီး</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-3">{schools.filter(s => s.isAnnualFeePaid).length}</p>
          <p className="text-[11px] font-semibold text-rose-600 mt-1">ကျန်ရှိ {schools.filter(s => !s.isAnnualFeePaid).length} ကျောင်း</p>
        </div>

        <div onClick={() => onGoToTab('announcements')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ကြေညာချက်များ</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{announcements.length}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">စာတန်းပြေး {tickers.filter(t => t.isActive).length} ခု လွှင့်ထားဆဲ</p>
        </div>

        <div onClick={() => onGoToTab('associations')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">အသင်းအဖွဲ့နှင့် အက်ဒမင်</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{associations.length}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Admin အကောင့် {admins.length} ခု</p>
        </div>
      </div>
    </div>
  );
}
