import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Announcement, School, Association } from '../types';
import { useData, getAnnouncementTimestamp } from '../context/DataContext';
import { getCategoryBadge } from './Announcements';
import {
  BookOpen,
  Users,
  MessageSquare,
  ArrowRight,
  Calendar,
  Newspaper,
  Building2,
  School as SchoolIcon,
  Activity,
  AlertCircle,
  ShieldCheck,
  Search,
  Sparkles,
  Award,
  Layers,
  PhoneCall,
  CheckCircle2,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { getUnifiedSchoolLevels } from '../lib/schoolLevels';

export default function Home() {
  const { schools, announcements, associations, schoolLevels, loading } = useData();
  const [quickSearch, setQuickSearch] = useState('');

  const latestAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => getAnnouncementTimestamp(b) - getAnnouncementTimestamp(a))
      .slice(0, 4);
  }, [announcements]);

  // Dashboard Stats Calculations
  const totalSchools = schools.length;
  const activeSchools = useMemo(() => schools.filter(s => (s.status || 'active') === 'active').length, [schools]);
  const underReviewSchools = useMemo(() => schools.filter(s => s.status === 'under_review').length, [schools]);

  // Dynamic School Levels Stats matching reference / database
  const levelStats = useMemo(() => {
    return getUnifiedSchoolLevels(schoolLevels, schools).filter(l => l.total > 0);
  }, [schools, schoolLevels]);

  // Quick searched schools preview
  const filteredQuickSchools = useMemo(() => {
    if (!quickSearch.trim()) return [];
    const q = quickSearch.trim().toLowerCase();
    return schools
      .filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.contact2Name && s.contact2Name.toLowerCase().includes(q)) ||
        (s.schoolPhone && s.schoolPhone.toLowerCase().includes(q)) ||
        (s.schoolPhone2 && s.schoolPhone2.toLowerCase().includes(q)) ||
        (s.founderPhone && s.founderPhone.toLowerCase().includes(q)) ||
        (s.founderPhone2 && s.founderPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.founderPhones) && s.founderPhones.some(p => p.toLowerCase().includes(q))) ||
        (s.adminPhone && s.adminPhone.toLowerCase().includes(q)) ||
        (s.adminPhone2 && s.adminPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.adminPhones) && s.adminPhones.some(p => p.toLowerCase().includes(q))) ||
        (s.contactPhone && s.contactPhone.toLowerCase().includes(q)) ||
        (s.contactPhone2 && s.contactPhone2.toLowerCase().includes(q)) ||
        (s.contact2Phone && s.contact2Phone.toLowerCase().includes(q)) ||
        (s.contact2Phone2 && s.contact2Phone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.schoolPhones) && s.schoolPhones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contactPhones) && s.contactPhones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contact2Phones) && s.contact2Phones.some(p => p.toLowerCase().includes(q))) ||
        (s.level && s.level.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [schools, quickSearch]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* 1. HERO & BANNER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-sky-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
            သတင်းနှင့် ပြန်ကြားရေးဌာန
          </h1>

          {/* Quick Search on Hero Banner */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="ကျောင်းအမည်၊ တာဝန်ခံ သို့မဟုတ် အဆင့်ဖြင့် ရှာဖွေပါ..."
                className="w-full pl-10 pr-3 py-2 bg-white text-slate-900 rounded-xl text-xs sm:text-sm shadow-md focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Live Search Instant Results Dropdown */}
            {quickSearch.trim() && (
              <div className="mt-1 bg-white rounded-xl p-2 shadow-2xl border border-slate-200 text-left text-slate-900 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-500 px-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span>ရှာဖွေတွေ့ရှိ ({filteredQuickSchools.length})</span>
                  <Link to={`/contacts?search=${encodeURIComponent(quickSearch)}`} className="text-sky-700 hover:underline">
                    အားလုံးကြည့်မည် &rarr;
                  </Link>
                </div>
                {filteredQuickSchools.length === 0 ? (
                  <p className="text-[11px] text-slate-400 p-2 text-center">မတွေ့ပါ</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredQuickSchools.map(s => (
                      <Link
                        key={s.id}
                        to={`/schools/${s.id}`}
                        className="p-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[11px] sm:text-xs text-sky-950 truncate">{s.name}</p>
                          {(s.contactName || s.contact2Name || s.schoolPhone || s.schoolPhone2) && (
                            <p className="text-[10px] text-slate-500 truncate">
                              {[
                                s.contactName ? `တာဝန်ခံ (၁): ${s.contactName}` : '',
                                s.contact2Name ? `တာဝန်ခံ (၂): ${s.contact2Name}` : '',
                                (s.schoolPhone || s.schoolPhone2) ? `ဖုန်း: ${s.schoolPhone || s.schoolPhone2}` : '',
                              ].filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
                          အသေးစိတ်
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold">
            <Link
              to="/dashboard"
              className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition flex items-center gap-1 shadow-md font-bold"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>စာရင်းအင်း</span>
            </Link>
            <Link
              to="/contacts"
              className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-sky-950 rounded-lg transition flex items-center gap-1 shadow-xs font-bold"
            >
              <Users className="w-3.5 h-3.5" />
              <span>ကျောင်းစာရင်း</span>
            </Link>
            <Link
              to="/announcements"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1 backdrop-blur-xs border border-white/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ကြေညာချက်များ</span>
            </Link>
            <Link
              to="/associations"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1 backdrop-blur-xs border border-white/20"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>အသင်းများ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TOP LATEST 2 ANNOUNCEMENTS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-rose-50 text-rose-600">
              <Newspaper className="w-3 h-3" />
            </div>
            <h2 className="text-xs font-bold text-sky-950">
              နောက်ဆုံးရ ကြေညာချက်များ
            </h2>
          </div>
          <Link
            to="/announcements"
            className="text-[10px] text-sky-800 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>အားလုံး</span> &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="h-16 bg-white rounded-lg border border-slate-100 animate-pulse" />
            <div className="h-16 bg-white rounded-lg border border-slate-100 animate-pulse" />
          </div>
        ) : latestAnnouncements.length === 0 ? (
          <div className="p-2 bg-white rounded-lg border border-slate-100 text-center text-slate-400 text-[10px]">
            ကြေညာချက် မရှိသေးပါ
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {latestAnnouncements.slice(0, 2).map((a) => {
              const badge = getCategoryBadge(a.category);
              return (
                <Link
                  key={a.id}
                  to={`/announcements/${a.id}`}
                  className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-none hover:border-sky-200 transition group flex flex-col justify-between space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[8px] px-1 py-0.5 rounded-full font-semibold border ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5 shrink-0">
                      <Calendar className="w-2.5 h-2.5 text-sky-600" />
                      {a.eventDate || (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('my-MM') : 'မကြာသေးမီက')}
                    </span>
                  </div>

                  <h3 className="font-bold text-[11px] text-sky-950 group-hover:text-sky-700 transition leading-tight line-clamp-1">
                    {a.title}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. SCHOOL EDUCATION LEVELS BREAKDOWN (Matching Reference & Database) */}
      <section className="bg-white p-3 rounded-xl border border-slate-100 shadow-none space-y-2">
        <div className="flex items-center justify-between border-b border-slate-50 pb-1">
          <h3 className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
            <span>ကျောင်းအဆင့် ခွဲခြမ်းမှု (အဆင့်အလိုက် စာရင်းအင်း)</span>
          </h3>
          <Link to="/contacts" className="text-[10px] font-bold text-sky-700 hover:underline">
            အသေးစိတ် &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {levelStats.map((item) => (
            <Link
              key={item.id}
              to={`/contacts?level=${encodeURIComponent(item.name)}`}
              className={`p-2.5 rounded-lg ${item.color.bg} border ${item.color.border} space-y-1 hover:brightness-95 transition group block`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={`${item.color.text} truncate group-hover:underline`} title={item.name}>
                  {item.name}
                </span>
                <span className={`${item.color.accent} font-extrabold shrink-0 ml-1`}>
                  {item.total}
                </span>
              </div>
              <div className={`w-full ${item.color.barBg} rounded-full h-1 overflow-hidden`}>
                <div
                  className={`${item.color.bar} h-1 rounded-full transition-all`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. TOWNSHIP ASSOCIATIONS & QUICK SHORTCUTS BANNER */}
      <section className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-3 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <h3 className="font-bold text-[10px]">မြို့နယ်အသင်းများ</h3>
          </div>
          <div className="pt-0.5">
            <Link
              to="/associations"
              className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500 hover:bg-sky-400 text-sky-950 font-bold text-[9px] rounded-md transition"
            >
              <span>ကြည့်မည်</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-3 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="font-bold text-[10px]">ဆွေးနွေးခန်း</h3>
          </div>
          <div className="pt-0.5">
            <Link
              to="/chat"
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-[9px] rounded-md transition"
            >
              <span>ဝင်မည်</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

