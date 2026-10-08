import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { School, STUDENT_RANGE_TIERS, getStudentRangeTier } from '../types';
import { useData, getAnnouncementTimestamp } from '../context/DataContext';
import { OfflineSyncStatusBadge } from '../components/OfflineSyncStatusBadge';
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
  CheckCircle2,
  XCircle,
  Coins,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  PieChart,
  BarChart3,
  Layers,
  Table,
} from 'lucide-react';

export default function Dashboard() {
  const { schools, announcements, schoolLevels, loading } = useData();

  // Annual Fee Breakdown Tab: 'level' | 'student_range' | 'amount' | 'matrix'
  const [feeBreakdownTab, setFeeBreakdownTab] = useState<'level' | 'student_range' | 'amount' | 'matrix'>('level');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Helper to normalize fee amount for calculation
  const getSchoolFee = (s: School): number => {
    if (s.feeAmount !== undefined && s.feeAmount !== null && !isNaN(Number(s.feeAmount))) {
      return Number(s.feeAmount);
    }
    const tier = getStudentRangeTier(s.studentRange);
    if (tier) return tier.defaultFee;
    return 200000;
  };

  // Helper to normalize range key
  const getSchoolRangeKey = (s: School): string => {
    if (s.studentRange) {
      const tier = getStudentRangeTier(s.studentRange);
      if (tier) return tier.key;
      return s.studentRange;
    }
    return '0-100'; // Default fallback tier
  };

  // 1. Overall Key Metrics
  const totalSchools = schools.length;
  const paidSchools = useMemo(() => schools.filter(s => !!s.isAnnualFeePaid), [schools]);
  const unpaidSchools = useMemo(() => schools.filter(s => !s.isAnnualFeePaid), [schools]);
  const paidCount = paidSchools.length;
  const unpaidCount = unpaidSchools.length;
  const paidPercentage = totalSchools > 0 ? Math.round((paidCount / totalSchools) * 100) : 0;

  // Financial Figures
  const totalCollectedAmount = useMemo(() => {
    return paidSchools.reduce((sum, s) => sum + getSchoolFee(s), 0);
  }, [paidSchools]);

  const totalExpectedAmount = useMemo(() => {
    return schools.reduce((sum, s) => sum + getSchoolFee(s), 0);
  }, [schools]);

  const remainingAmountToCollect = totalExpectedAmount - totalCollectedAmount;

  // Format currency helpers (MMK)
  const formatMMK = (num: number) => {
    return num.toLocaleString('my-MM');
  };

  const formatLakhs = (num: number) => {
    const lakhs = (num / 100000).toFixed(1);
    return `${lakhs} သိန်း`;
  };

  // 2. Breakdown By School Level (ကျောင်းအဆင့်အလိုက် - Configurable & Database School Levels)
  const levelBreakdown = useMemo(() => {
    const configuredNames = (schoolLevels || []).map(l => l.name.trim()).filter(Boolean);
    const distinctSchoolLevels = Array.from(new Set(schools.map(s => (s.level || '').trim()).filter(Boolean)));
    const allLevelNames = [...configuredNames];
    distinctSchoolLevels.forEach(lvl => {
      if (!allLevelNames.some(existing => existing.toLowerCase() === lvl.toLowerCase())) {
        allLevelNames.push(lvl);
      }
    });

    if (allLevelNames.length === 0) {
      allLevelNames.push('အထက်တန်း');
    }

    const colorPalettes = ['sky', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'violet', 'amber', 'rose'];

    return allLevelNames.map((levelName, idx) => {
      const allInLevel = schools.filter(s => {
        const sl = (s.level || '').trim();
        return sl === levelName || sl.toLowerCase() === levelName.toLowerCase();
      });
      const paidInLevel = allInLevel.filter(s => !!s.isAnnualFeePaid);
      const unpaidInLevel = allInLevel.filter(s => !s.isAnnualFeePaid);
      const collected = paidInLevel.reduce((sum, s) => sum + getSchoolFee(s), 0);
      const expected = allInLevel.reduce((sum, s) => sum + getSchoolFee(s), 0);
      const pct = allInLevel.length > 0 ? Math.round((paidInLevel.length / allInLevel.length) * 100) : 0;
      const color = colorPalettes[idx % colorPalettes.length];

      return {
        key: levelName,
        label: levelName,
        sub: `ကျောင်းအဆင့် (${idx + 1})`,
        color,
        total: allInLevel.length,
        paid: paidInLevel.length,
        unpaid: unpaidInLevel.length,
        collected,
        expected,
        pct,
      };
    });
  }, [schools, schoolLevels]);

  // 3. Breakdown By Student Count Range (ကျောင်းသားဦးရေ Range အလိုက် - Reference Tiers)
  const studentRangeBreakdown = useMemo(() => {
    return STUDENT_RANGE_TIERS.map(tier => {
      const allInRange = schools.filter(s => getSchoolRangeKey(s) === tier.key);
      const paidInRange = allInRange.filter(s => !!s.isAnnualFeePaid);
      const unpaidInRange = allInRange.filter(s => !s.isAnnualFeePaid);
      const collected = paidInRange.reduce((sum, s) => sum + getSchoolFee(s), 0);
      const expected = allInRange.reduce((sum, s) => sum + getSchoolFee(s), 0);
      const pct = allInRange.length > 0 ? Math.round((paidInRange.length / allInRange.length) * 100) : 0;

      return {
        key: tier.key,
        label: tier.label,
        shortLabel: tier.shortLabel,
        description: tier.description,
        defaultFee: tier.defaultFee,
        color: tier.color,
        badgeClass: tier.badgeClass,
        total: allInRange.length,
        paid: paidInRange.length,
        unpaid: unpaidInRange.length,
        collected,
        expected,
        pct,
      };
    });
  }, [schools]);

  // 4. Breakdown By Fee Amount Tiers (ထည့်ဝင်ထားသော ပမာဏအလိုက် - Reference Tiers)
  const feeAmountBreakdown = useMemo(() => {
    const tiers = [
      { amount: 1000000, label: '၁,၀၀၀,၀၀၀ ကျပ် နှုန်းထား (၆၀၁ ဦးနှင့်အထက်)' },
      { amount: 700000, label: '၇၀၀,၀၀၀ ကျပ် နှုန်းထား (၄၀၁ - ၆၀၀ ဦး)' },
      { amount: 500000, label: '၅၀၀,၀၀၀ ကျပ် နှုန်းထား (၃၀၁ - ၄၀၀ ဦး)' },
      { amount: 400000, label: '၄၀၀,၀၀၀ ကျပ် နှုန်းထား (၂၅၁ - ၃၀၀ ဦး)' },
      { amount: 350000, label: '၃၅၀,၀၀၀ ကျပ် နှုန်းထား (၂၀၁ - ၂၅၀ ဦး)' },
      { amount: 300000, label: '၃၀၀,၀၀၀ ကျပ် နှုန်းထား (၁၅၁ - ၂၀၀ ဦး)' },
      { amount: 250000, label: '၂၅၀,၀၀၀ ကျပ် နှုန်းထား (၁၀၁ - ၁၅၀ ဦး)' },
      { amount: 200000, label: '၂၀၀,၀၀၀ ကျပ် နှုန်းထား (၀ - ၁၀၀ ဦး)' },
    ];

    return tiers.map(t => {
      const matchingSchools = schools.filter(s => getSchoolFee(s) === t.amount);
      const paid = matchingSchools.filter(s => !!s.isAnnualFeePaid).length;
      const unpaid = matchingSchools.filter(s => !s.isAnnualFeePaid).length;
      const total = matchingSchools.length;
      const collected = paid * t.amount;
      const expected = total * t.amount;
      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

      return {
        ...t,
        total,
        paid,
        unpaid,
        collected,
        expected,
        pct,
      };
    });
  }, [schools]);

  // 5. Cross Matrix (ကျောင်းအဆင့် x ကျောင်းသားဦးရေ Range)
  const matrixData = useMemo(() => {
    return levelBreakdown.map(lvl => {
      const rowRanges = STUDENT_RANGE_TIERS.map(tier => {
        const matching = schools.filter(
          s => (s.level || '').trim().toLowerCase() === lvl.key.toLowerCase() && getSchoolRangeKey(s) === tier.key
        );
        const paid = matching.filter(s => !!s.isAnnualFeePaid).length;
        const total = matching.length;
        const collected = matching.filter(s => !!s.isAnnualFeePaid).reduce((sum, s) => sum + getSchoolFee(s), 0);
        return {
          tierKey: tier.key,
          tierLabel: tier.shortLabel,
          paid,
          total,
          collected,
        };
      });

      return {
        levelKey: lvl.key,
        levelLabel: lvl.label,
        ranges: rowRanges,
        rowTotal: lvl.total,
        rowPaid: lvl.paid,
        rowCollected: lvl.collected,
      };
    });
  }, [levelBreakdown, schools]);

  // Top 2 Announcements (sorted strictly by Admin Set Date / Event Date)
  const latestTwoAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => getAnnouncementTimestamp(b) - getAnnouncementTimestamp(a))
      .slice(0, 2);
  }, [announcements]);

  // Filtered schools for interactive list
  const filteredSchools = useMemo(() => {
    return schools
      .filter(school => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
          !q ||
          (school.name && school.name.toLowerCase().includes(q)) ||
          (school.founderName && school.founderName.toLowerCase().includes(q)) ||
          (school.founderPhone && school.founderPhone.toLowerCase().includes(q)) ||
          (school.founderPhone2 && school.founderPhone2.toLowerCase().includes(q)) ||
          (Array.isArray(school.founderPhones) && school.founderPhones.some(p => p.toLowerCase().includes(q))) ||
          (school.adminName && school.adminName.toLowerCase().includes(q)) ||
          (school.adminPhone && school.adminPhone.toLowerCase().includes(q)) ||
          (school.adminPhone2 && school.adminPhone2.toLowerCase().includes(q)) ||
          (Array.isArray(school.adminPhones) && school.adminPhones.some(p => p.toLowerCase().includes(q))) ||
          (school.contactName && school.contactName.toLowerCase().includes(q)) ||
          (school.responsiblePerson1Name && school.responsiblePerson1Name.toLowerCase().includes(q)) ||
          (school.contact2Name && school.contact2Name.toLowerCase().includes(q)) ||
          (school.responsiblePerson2Name && school.responsiblePerson2Name.toLowerCase().includes(q)) ||
          (school.schoolPhone && school.schoolPhone.toLowerCase().includes(q)) ||
          (school.schoolPhone2 && school.schoolPhone2.toLowerCase().includes(q)) ||
          (Array.isArray(school.schoolPhones) && school.schoolPhones.some(p => p.toLowerCase().includes(q))) ||
          (school.contactPhone && school.contactPhone.toLowerCase().includes(q)) ||
          (school.responsiblePerson1Phone && school.responsiblePerson1Phone.toLowerCase().includes(q)) ||
          (Array.isArray(school.contactPhones) && school.contactPhones.some(p => p.toLowerCase().includes(q))) ||
          (Array.isArray(school.responsiblePerson1Phones) && school.responsiblePerson1Phones.some(p => p.toLowerCase().includes(q))) ||
          (school.contact2Phone && school.contact2Phone.toLowerCase().includes(q)) ||
          (school.responsiblePerson2Phone && school.responsiblePerson2Phone.toLowerCase().includes(q)) ||
          (Array.isArray(school.contact2Phones) && school.contact2Phones.some(p => p.toLowerCase().includes(q))) ||
          (Array.isArray(school.responsiblePerson2Phones) && school.responsiblePerson2Phones.some(p => p.toLowerCase().includes(q))) ||
          (school.level && school.level.toLowerCase().includes(q));

        const matchStatus = selectedStatus === 'all' || (school.status || 'active') === selectedStatus;

        const schoolLvl = (school.level || '').trim().toLowerCase();
        const matchLevel =
          selectedLevel === 'all' ||
          schoolLvl === selectedLevel.trim().toLowerCase();

        const schoolRange = getSchoolRangeKey(school);
        const matchRange = selectedRange === 'all' || selectedRange === schoolRange;

        const matchFee =
          selectedFeeStatus === 'all' ||
          (selectedFeeStatus === 'paid' && !!school.isAnnualFeePaid) ||
          (selectedFeeStatus === 'unpaid' && !school.isAnnualFeePaid);

        return matchSearch && matchStatus && matchLevel && matchRange && matchFee;
      })
      .sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const cmp = nameA.localeCompare(nameB, 'my', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : nameA.localeCompare(nameB);
      });
  }, [schools, searchQuery, selectedStatus, selectedLevel, selectedRange, selectedFeeStatus]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-sky-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        <div className="relative z-10 text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-semibold backdrop-blur-xs border border-sky-400/20">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span>နှစ်စဉ်ကြေးနှင့် အသင်းဝင် စာရင်းအင်း ဒိုင်ခွက်</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
            ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများ စာရင်းအင်း
          </h1>
          <p className="text-sky-100/90 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-normal">
            ကျောင်းအဆင့်၊ ကျောင်းသားဦးရေ Range နှင့် သတ်မှတ်နှစ်စဉ်ကြေး ထည့်ဝင်ထားသော အရေအတွက်များကို စနစ်တကျ ခွဲခြမ်းပြသထားပါသည်။
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <OfflineSyncStatusBadge compact />
            <Link
              to="/contacts"
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-sky-950 rounded-xl transition flex items-center gap-1.5 shadow-xs font-bold"
            >
              <Users className="w-4 h-4" /> <span>ကျောင်းစာရင်း အပြည့်အစုံ</span>
            </Link>
            <Link
              to="/announcements"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs border border-white/20"
            >
              <BookOpen className="w-4 h-4" /> <span>ကြေညာချက်များ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TOP SUMMARY METRICS (နှစ်စဉ်ကြေး အနှစ်ချုပ် ကိန်းဂဏန်းများ) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Paid Schools Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">နှစ်စဉ်ကြေး ပေးပြီး</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{paidCount}</span>
            <span className="text-xs text-slate-500 font-medium">/ {totalSchools} ကျောင်း</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            ပေးသွင်းမှု နှုန်းထား: {paidPercentage}%
          </p>
        </div>

        {/* Unpaid Schools Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ပေးသွင်းရန် ကျန်ရှိ</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{unpaidCount}</span>
            <span className="text-xs text-slate-500 font-medium">ကျောင်း</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalSchools > 0 ? (unpaidCount / totalSchools) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-rose-600 font-semibold">
            {totalSchools > 0 ? Math.round((unpaidCount / totalSchools) * 100) : 0}% ဆိုင်းငံ့ဆဲ
          </p>
        </div>

        {/* Total Collected Amount */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ကောက်ခံရရှိငွေ စုစုပေါင်း</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-sky-950 truncate">
              {formatMMK(totalCollectedAmount)}
            </div>
            <div className="text-[11px] text-sky-700 font-bold">
              ကျပ် ({formatLakhs(totalCollectedAmount)})
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            လက်ရှိ ဘဏ္ဍာနှစ်အတွင်း ရရှိငွေ
          </p>
        </div>

        {/* Expected Total Budget */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">မျှော်မှန်းရရှိငွေ စုစုပေါင်း</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 truncate">
              {formatMMK(totalExpectedAmount)}
            </div>
            <div className="text-[11px] text-indigo-700 font-bold">
              ကျပ် ({formatLakhs(totalExpectedAmount)})
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            ကျန်: <strong className="text-rose-600 font-bold">{formatMMK(remainingAmountToCollect)}</strong> ကျပ်
          </p>
        </div>
      </section>

      {/* 3. CORE ANNUAL FEE BREAKDOWN SECTION (ကျောင်းအဆင့် / ကျောင်းသားဦးရေ / ထည့်ဝင်ထားသော ပမာဏ အလိုက်) */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-sky-950 flex items-center gap-2">
              <Coins className="w-5 h-5 text-sky-600" />
              <span>နှစ်စဉ်ကြေး ထည့်ဝင်ထားသော အရေအတွက် ခွဲခြမ်းမှု</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ကျောင်းအဆင့်၊ ကျောင်းသားဦးရေ Range နှင့် သတ်မှတ်နှုန်းထားအလိုက် အသေးစိတ် စာရင်းအင်း
            </p>
          </div>

          {/* Interactive Navigation Tabs - flex-wrap to prevent horizontal scrolling */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl gap-1 self-start sm:self-auto max-w-full">
            <button
              onClick={() => setFeeBreakdownTab('level')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                feeBreakdownTab === 'level'
                  ? 'bg-white text-sky-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>ကျောင်းအဆင့်အလိုက်</span>
            </button>

            <button
              onClick={() => setFeeBreakdownTab('student_range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                feeBreakdownTab === 'student_range'
                  ? 'bg-white text-sky-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ကျောင်းသားဦးရေ Range</span>
            </button>

            <button
              onClick={() => setFeeBreakdownTab('amount')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                feeBreakdownTab === 'amount'
                  ? 'bg-white text-sky-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>ထည့်ဝင် ပမာဏအလိုက်</span>
            </button>

            <button
              onClick={() => setFeeBreakdownTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                feeBreakdownTab === 'matrix'
                  ? 'bg-white text-sky-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>ပေါင်းစပ်ဇယား</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT 1: ကျောင်းအဆင့်အလိုက် (By School Level) */}
        {feeBreakdownTab === 'level' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {levelBreakdown.map((item) => (
              <div
                key={item.key}
                onClick={() => setSelectedLevel(item.key)}
                className={`p-4 rounded-2xl border transition space-y-3 cursor-pointer ${
                  selectedLevel === item.key
                    ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-300'
                    : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{item.label}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{item.sub}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                    {item.total} ကျောင်း
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-600 font-medium">နှစ်စဉ်ကြေး ပေးပြီး:</span>
                    <span className="font-black text-emerald-700">
                      {item.paid} <span className="text-[10px] font-normal text-slate-400">({item.pct}%)</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>မပေးရသေး: <strong className="text-rose-600">{item.unpaid}</strong></span>
                    <span>ရရှိငွေ: <strong className="text-sky-950 font-bold">{formatMMK(item.collected)}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-sky-800">
                  <span>စာရင်းစစ်ထုတ်ကြည့်ရန်</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB CONTENT 2: ကျောင်းသားဦးရေ Range အလိုက် (By Student Population Range) */}
        {feeBreakdownTab === 'student_range' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {studentRangeBreakdown.map((tier) => (
                <div
                  key={tier.key}
                  onClick={() => setSelectedRange(tier.key)}
                  className={`p-3.5 rounded-2xl border transition space-y-2.5 cursor-pointer ${
                    selectedRange === tier.key
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{tier.label}</span>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {tier.description}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 shrink-0">
                      {tier.total} ကျောင်း
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>သတ်မှတ်နှုန်း:</span>
                      <strong className="text-sky-900 font-bold">
                        {formatMMK(tier.defaultFee)} ကျပ်
                      </strong>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>ပေးသွင်းပြီး:</span>
                      <strong className="text-emerald-700 font-bold">
                        {tier.paid} ကျောင်း ({tier.pct}%)
                      </strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${tier.pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                    <span className="text-slate-400">စုစုပေါင်းရရှိငွေ:</span>
                    <strong className="text-sky-950 font-bold">{formatMMK(tier.collected)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 flex items-center gap-2 text-xs text-sky-900 font-medium">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                ကျောင်းသားဦးရေ Range အလိုက် သတ်မှတ်နှုန်းထားများမှာ အသင်းကြီး၏ တရားဝင် နှစ်စဉ်ကြေး ကောက်ခံရေး မူဘောင်အတိုင်း စနစ်တကျ ချိတ်ဆက်တွက်ချက်ထားပါသည်။
              </span>
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: ထည့်ဝင်ထားသော ပမာဏအလိုက် (By Fee Amount Tiers) */}
        {feeBreakdownTab === 'amount' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {feeAmountBreakdown.map((t) => (
              <div
                key={t.amount}
                className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-950 block">
                    {formatMMK(t.amount)} ကျပ်
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                    {t.total} ကျောင်း
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ပေးသွင်းပြီး:</span>
                    <strong className="text-emerald-700">{t.paid} ကျောင်း</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ပေးရန်ကျန်:</span>
                    <strong className="text-rose-600">{t.unpaid} ကျောင်း</strong>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">ကောက်ခံရရှိငွေ:</span>
                  <strong className="text-sky-950 font-black">{formatMMK(t.collected)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB CONTENT 4: ပေါင်းစပ်ဇယား (Matrix View) */}
        {feeBreakdownTab === 'matrix' && (
          <div className="space-y-4">
            {/* Mobile View: Level breakdown cards */}
            <div className="md:hidden space-y-3">
              {matrixData.map(row => (
                <div key={row.levelKey} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-sm text-slate-900">{row.levelLabel}</span>
                    <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                      {row.rowPaid} / {row.rowTotal} ကျောင်း ({formatMMK(row.rowCollected)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {row.ranges.map(cell => (
                      <div key={cell.tierKey} className="p-2 bg-slate-50 rounded-lg border border-slate-150 space-y-0.5">
                        <span className="text-[10px] text-slate-500 block truncate">{cell.tierLabel}</span>
                        {cell.total > 0 ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              <span className="text-emerald-700">{cell.paid}</span>
                              <span className="text-slate-400 font-normal"> / {cell.total}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {formatMMK(cell.collected)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">ကျောင်းအဆင့် \ ကျောင်းသား Range</th>
                    {STUDENT_RANGE_TIERS.map(tier => (
                      <th key={tier.key} className="p-3 text-center">
                        <div>{tier.shortLabel} ဦး</div>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({formatMMK(tier.defaultFee)})
                        </span>
                      </th>
                    ))}
                    <th className="p-3 text-right bg-sky-50/60 text-sky-950 font-black">
                      စုစုပေါင်း
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixData.map(row => (
                    <tr key={row.levelKey} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {row.levelLabel}
                      </td>
                      {row.ranges.map(cell => (
                        <td key={cell.tierKey} className="p-3 text-center">
                          {cell.total > 0 ? (
                            <div>
                              <span className="font-extrabold text-emerald-700">
                                {cell.paid}
                              </span>
                              <span className="text-slate-400 font-medium"> / {cell.total}</span>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                {formatMMK(cell.collected)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3 text-right font-black text-sky-950 bg-sky-50/30">
                        <div>{row.rowPaid} / {row.rowTotal} ကျောင်း</div>
                        <div className="text-[10px] text-sky-700 font-bold">{formatMMK(row.rowCollected)} ကျပ်</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/70 border-t border-slate-200 font-black text-slate-900">
                    <td className="p-3">စုစုပေါင်းအားလုံး</td>
                    {STUDENT_RANGE_TIERS.map(tier => {
                      const tierTotal = schools.filter(s => getSchoolRangeKey(s) === tier.key);
                      const tierPaid = tierTotal.filter(s => !!s.isAnnualFeePaid).length;
                      return (
                        <td key={tier.key} className="p-3 text-center text-sky-950">
                          {tierPaid} / {tierTotal.length}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right text-sky-950 font-black bg-sky-100/60">
                      {paidCount} / {totalSchools} ကျောင်း ({formatMMK(totalCollectedAmount)} ကျပ်)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 italic text-right">
              * အကွက်တစ်ခုစီရှိ ဂဏန်းမှာ (နှစ်စဉ်ကြေး ပေးပြီး ကျောင်းအရေအတွက် / အဆင့်တူ အသင်းဝင် စုစုပေါင်း) ဖြစ်ပါသည်။
            </p>
          </div>
        )}
      </section>

      {/* 4. LATEST ANNOUNCEMENTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-sky-950 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-rose-600" />
            <span>နောက်ဆုံးရ ကြေညာချက်များ</span>
          </h2>
          <Link to="/announcements" className="text-xs text-sky-800 font-bold hover:underline">
            အားလုံး &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {latestTwoAnnouncements.map((a) => (
            <Link
              key={a.id}
              to={`/announcements/${a.id}`}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-300 transition space-y-2 group"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                    getCategoryBadge(a.category).className
                  }`}
                >
                  {getCategoryBadge(a.category).label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  <Calendar className="w-3 h-3 inline mr-1 text-sky-600" />
                  {a.eventDate || (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('my-MM') : '...')}
                </span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-sky-950 group-hover:text-sky-700 line-clamp-2">
                {a.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE SCHOOL DIRECTORY & FILTER TABLE */}
      <section className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-sky-950 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600" />
              <span>ကျောင်းစာရင်း အသေးစိတ် ရှာဖွေစစ်ထုတ်ရန်</span>
            </h3>
            <p className="text-xs text-slate-400">
              ကျောင်းအဆင့်၊ Range နှင့် နှစ်စဉ်ကြေး ပေးသွင်းမှု အခြေအနေအလိုက် တိုက်ရိုက် ကြည့်ရှုနိုင်ပါသည်
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            တွေ့ရှိမှု: {filteredSchools.length} ကျောင်း
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ကျောင်းအမည်၊ တည်ထောင်သူ ရှာရန်..."
            className="col-span-2 lg:col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-500"
          />

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">ကျောင်းအဆင့် အားလုံး</option>
            {levelBreakdown.map((lvl) => (
              <option key={lvl.key} value={lvl.key}>
                {lvl.label} ({lvl.total} ကျောင်း)
              </option>
            ))}
          </select>

          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">ကျောင်းသား Range အားလုံး</option>
            {STUDENT_RANGE_TIERS.map((tier) => (
              <option key={tier.key} value={tier.key}>
                {tier.label} ({formatMMK(tier.defaultFee)} ကျပ်)
              </option>
            ))}
          </select>

          <select
            value={selectedFeeStatus}
            onChange={(e) => setSelectedFeeStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">နှစ်စဉ်ကြေး အားလုံး</option>
            <option value="paid">နှစ်စဉ်ကြေး ပေးသွင်းပြီး</option>
            <option value="unpaid">နှစ်စဉ်ကြေး မပေးရသေး</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">Status အားလုံး</option>
            <option value="active">Active (လည်ပတ်ဆဲ)</option>
            <option value="under_review">Under Review (စိစစ်ဆဲ)</option>
            <option value="inactive">Inactive (ရပ်နား)</option>
          </select>
        </div>

        {/* Filtered Schools List */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {filteredSchools.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <SchoolIcon className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မတွေ့ရှိပါ</p>
            </div>
          ) : (
            filteredSchools.map(school => (
              <Link
                key={school.id}
                to={`/schools/${school.id}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-3 rounded-xl transition group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-sky-950 group-hover:text-sky-700">
                      {school.name}
                    </span>
                    {school.level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {school.level}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-medium border border-sky-100">
                      ကျောင်းသား: {school.studentRange || '1-100'} ဦး
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                    {school.founderName && <span>တည်ထောင်သူ: {school.founderName}</span>}
                    {school.adminName && <span>စီမံအုပ်ချုပ်သူ: {school.adminName}</span>}
                    {school.contactName && <span>တာဝန်ခံ (၁): {school.contactName}</span>}
                    {school.contact2Name && <span>တာဝန်ခံ (၂): {school.contact2Name}</span>}
                    {(school.schoolPhone || school.schoolPhone2) && (
                      <span>ဖုန်း: {[school.schoolPhone, school.schoolPhone2].filter(Boolean).join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-xs font-bold text-sky-950">
                    {formatMMK(getSchoolFee(school))} ကျပ်
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      school.isAnnualFeePaid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {school.isAnnualFeePaid ? 'ကြေးပေးပြီး ✓' : 'မပေးသေး ✗'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
