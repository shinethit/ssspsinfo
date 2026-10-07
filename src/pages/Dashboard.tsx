import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { School, Association, Announcement } from '../types';
import { getCategoryBadge } from './Announcements';
import {
  School as SchoolIcon,
  Activity,
  Building2,
  Users,
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Calendar,
  Newspaper,
  FileText,
  MessageSquare,
} from 'lucide-react';

export default function Dashboard() {
  const [schools, setSchools] = useState<School[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schoolsSnap, associationsSnap, announcementsSnap] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(collection(db, 'associations')),
          getDocs(collection(db, 'announcements')),
        ]);

        setSchools(schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as School[]);
        setAssociations(associationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Association[]);
        setAnnouncements(announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Top 2 Latest Announcements
  const latestTwoAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || 0).getTime();
        const timeB = new Date(b.publishedAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 2);
  }, [announcements]);

  const totalSchools = schools.length;
  const highSchoolsCount = useMemo(() => schools.filter(s => s.level && s.level.includes('အထက်တန်း')).length, [schools]);
  const middleSchoolsCount = useMemo(() => schools.filter(s => s.level && s.level.includes('အလယ်တန်း')).length, [schools]);
  const primarySchoolsCount = useMemo(() => schools.filter(s => s.level && s.level.includes('မူလတန်း') && !s.level.includes('မူလတန်းကြို')).length, [schools]);

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q || (school.name && school.name.toLowerCase().includes(q)) || (school.founderName && school.founderName.toLowerCase().includes(q)) || (school.adminName && school.adminName.toLowerCase().includes(q)) || (school.level && school.level.toLowerCase().includes(q));
      const matchStatus = selectedStatus === 'all' || (school.status || 'active') === selectedStatus;
      const matchLevel = selectedLevel === 'all' || (selectedLevel === 'high' && school.level?.includes('အထက်တန်း')) || (selectedLevel === 'middle' && school.level?.includes('အလယ်တန်း')) || (selectedLevel === 'primary' && school.level?.includes('မူလတန်း'));
      const matchFee = selectedFeeStatus === 'all' || (selectedFeeStatus === 'paid' && !!school.isAnnualFeePaid) || (selectedFeeStatus === 'unpaid' && !school.isAnnualFeePaid);
      return matchSearch && matchStatus && matchLevel && matchFee;
    });
  }, [schools, searchQuery, selectedStatus, selectedLevel, selectedFeeStatus]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* 1. COMPACT HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-sky-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        <div className="relative z-10 text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
            ကိုယ်ပိုင်ကျောင်းများ စာရင်းအင်း
          </h1>
          <p className="text-sky-100/90 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-normal">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) အသင်းဝင် ကျောင်းများ၏ အချက်အလက်များ။
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold">
            <Link to="/contacts" className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-sky-950 rounded-lg transition flex items-center gap-1 shadow-xs font-bold">
              <Users className="w-3.5 h-3.5" /> <span>ကျောင်းစာရင်း</span>
            </Link>
            <Link to="/announcements" className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1 backdrop-blur-xs border border-white/20">
              <BookOpen className="w-3.5 h-3.5" /> <span>ကြေညာချက်</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. LATEST ANNOUNCEMENTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-sky-950 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-rose-600" /> နောက်ဆုံးရ ကြေညာချက်များ
          </h2>
          <Link to="/announcements" className="text-[11px] text-sky-800 font-bold hover:underline">အားလုံး &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {latestTwoAnnouncements.map((a) => (
            <Link key={a.id} to={`/announcements/${a.id}`} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 transition space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${getCategoryBadge(a.category).className}`}>
                  {getCategoryBadge(a.category).label}
                </span>
                <span className="text-[10px] text-slate-400"><Calendar className="w-3 h-3 inline" /> {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('my-MM') : '...'}</span>
              </div>
              <h3 className="font-bold text-xs text-sky-950 line-clamp-2">{a.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. SCHOOL LEVELS */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2 border-b border-slate-100 pb-2">
          <GraduationCap className="w-4 h-4 text-sky-600" /> ကျောင်းအဆင့် ခွဲခြမ်းမှု
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100"><div className="text-[10px] font-bold text-sky-900">အထက်တန်း</div><div className="text-lg font-extrabold text-sky-700">{highSchoolsCount}</div></div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100"><div className="text-[10px] font-bold text-emerald-900">အလယ်တန်း</div><div className="text-lg font-extrabold text-emerald-700">{middleSchoolsCount}</div></div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100"><div className="text-[10px] font-bold text-amber-900">မူလတန်း</div><div className="text-lg font-extrabold text-amber-700">{primarySchoolsCount}</div></div>
        </div>
      </section>

      {/* 4. INTERACTIVE SCHOOL DIRECTORY & FILTER TABLE */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-600" />
            <span>ကျောင်းစာရင်း ရှာဖွေစစ်ထုတ်ရန်</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ရှာဖွေရန်..." className="col-span-2 lg:col-span-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as any)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <option value="all">Status အားလုံး</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <option value="all">အဆင့် အားလုံး</option>
            <option value="high">အထက်တန်း</option>
            <option value="middle">အလယ်တန်း</option>
            <option value="primary">မူလတန်း</option>
          </select>
          <select value={selectedFeeStatus} onChange={(e) => setSelectedFeeStatus(e.target.value as any)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <option value="all">နှစ်စဉ်ကြေး</option>
            <option value="paid">ပေးသွင်းပြီး</option>
            <option value="unpaid">ပေးသွင်းရန်ကျန်</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredSchools.map(school => (
            <Link key={school.id} to={`/schools/${school.id}`} className="py-2 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
              <span className="font-bold text-xs text-sky-950">{school.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${school.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                {school.status || 'active'}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
