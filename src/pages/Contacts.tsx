import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { School } from '../types';
import { Link } from 'react-router-dom';
import {
  Search,
  School as SchoolIcon,
  ArrowRight,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { downloadSchoolTemplate } from '../lib/excel';

export default function Contacts() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeFilter, setFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'schools'));
        setSchools(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School)));
      } catch (err) {
        console.error('Error fetching schools:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Distinct school levels for filter options
  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    schools.forEach(s => {
      if (s.level && s.level.trim()) {
        levels.add(s.level.trim());
      }
    });
    return Array.from(levels);
  }, [schools]);

  const paidCount = useMemo(() => schools.filter(s => s.isAnnualFeePaid).length, [schools]);
  const unpaidCount = useMemo(() => schools.filter(s => !s.isAnnualFeePaid).length, [schools]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (feeFilter !== 'all') count++;
    if (levelFilter !== 'all') count++;
    return count;
  }, [feeFilter, levelFilter]);

  const resetFilters = () => {
    setFeeFilter('all');
    setLevelFilter('all');
    setSearchTerm('');
  };

  const filteredSchools = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return schools.filter(s => {
      const matchSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.level && s.level.toLowerCase().includes(q)) ||
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q));

      const matchFee =
        feeFilter === 'all'
          ? true
          : feeFilter === 'paid'
          ? s.isAnnualFeePaid === true
          : !s.isAnnualFeePaid;

      const matchLevel =
        levelFilter === 'all' ? true : s.level && s.level.trim() === levelFilter;

      return matchSearch && matchFee && matchLevel;
    });
  }, [schools, searchTerm, feeFilter, levelFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Title & Excel Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950 flex items-center gap-2.5">
            <SchoolIcon className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600 shrink-0" />
            <span>အသင်းဝင်ကျောင်းများ စာရင်း</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            ကျောင်းအမည်ကို နှိပ်၍ သက်ဆိုင်ရာ တာဝန်ခံများနှင့် ဆက်သွယ်ရန် အသေးစိတ်ကို ကြည့်ရှုနိုင်ပါသည်။
          </p>
        </div>

        {/* Action buttons: Excel Template download & Admin Import Link */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={downloadSchoolTemplate}
            type="button"
            className="bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Excel Template ကို ရယူရန်"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Excel Template ဒေါင်းလုဒ်</span>
          </button>
          <Link
            to="/admin"
            className="bg-sky-50 border border-sky-200 text-sky-800 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-sky-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-700" />
            <span>Excel သွင်းရန် (Admin)</span>
          </Link>
        </div>
      </div>

      {/* Search Bar & Advanced Filter Toggle */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ကျောင်းအမည် (သို့) ကျောင်းအဆင့်ဖြင့် ရှာဖွေရန်..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden text-sm sm:text-base bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Advance Filter Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilter(prev => !prev)}
            type="button"
            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shrink-0 ${
              showAdvancedFilter || activeFilterCount > 0
                ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span>အဆင့်မြင့် ရှာဖွေမှု (Advanced Filter)</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {showAdvancedFilter ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Advance Filter Collapsible Panel (နှစ်စဉ်ကြေး အခြေအနေ & ကျောင်းအဆင့် စစ်ထုတ်မှု) */}
        {showAdvancedFilter && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Annual Fee Filter (Advance Filter ထဲတွင် သပ်ရပ်စွာ ပေါင်းထည့်ထားပါသည်) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  နှစ်စဉ်ကြေး ပေးသွင်းမှု အခြေအနေ:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setFeeFilter('all')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      feeFilter === 'all'
                        ? 'bg-sky-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    အားလုံး ({schools.length})
                  </button>
                  <button
                    onClick={() => setFeeFilter('paid')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                      feeFilter === 'paid'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ပေးသွင်းပြီး ({paidCount})</span>
                  </button>
                  <button
                    onClick={() => setFeeFilter('unpaid')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                      feeFilter === 'unpaid'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>မပေးသွင်းရသေး ({unpaidCount})</span>
                  </button>
                </div>
              </div>

              {/* School Level Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  ကျောင်းအဆင့်ဖြင့် စစ်ထုတ်ရန်:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setLevelFilter('all')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      levelFilter === 'all'
                        ? 'bg-sky-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    အဆင့်အားလုံး
                  </button>
                  {availableLevels.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        levelFilter === lvl
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset Filters Option */}
            {(activeFilterCount > 0 || searchTerm) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={resetFilters}
                  type="button"
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Filter အားလုံးကို မူလအတိုင်း ပြန်ထားရန်
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Directory List (Shows School Name, Level ONLY - Annual Fee is shown INSIDE school detail) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 animate-pulse flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl w-24"></div>
            </div>
          ))}
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <SchoolIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-semibold text-lg">ကျောင်းစာရင်း မရှိသေးပါ</p>
          <p className="text-xs text-slate-400">
            {searchTerm || feeFilter !== 'all' || levelFilter !== 'all'
              ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မတွေ့ရှိပါ။'
              : 'ကျောင်းအချက်အလက်များ ထည့်သွင်းထားခြင်း မရှိသေးပါ။'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchools.map((s) => (
            <Link
              key={s.id}
              to={`/schools/${s.id}`}
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-md transition flex items-center justify-between gap-4 cursor-pointer"
            >
              {/* Left: School Emblem / Logo + Title & Level (Strictly Clean - No Annual Fee Badge outside) */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                {s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt={s.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-sky-900 text-white flex items-center justify-center shrink-0 group-hover:bg-sky-800 transition shadow-2xs">
                    <SchoolIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  {/* School Name (Primary focus) */}
                  <h3 className="font-bold text-base sm:text-lg text-sky-950 group-hover:text-sky-700 transition truncate">
                    {s.name}
                  </h3>

                  {/* Level Badge only */}
                  {s.level && (
                    <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold truncate">
                      {s.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Click indicator to view detail */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 shrink-0 group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline">အသေးစိတ်</span>
                <ArrowRight className="w-4 h-4 text-sky-600 group-hover:text-sky-900" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
