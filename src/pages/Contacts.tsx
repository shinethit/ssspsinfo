import { useState, useEffect, useMemo } from 'react';
import { School } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { OfflineSyncStatusBadge } from '../components/OfflineSyncStatusBadge';
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
  GraduationCap,
  BookOpen,
  Sparkles,
  Building2,
  ArrowUpDown,
  Layers,
  LayoutGrid,
  List,
  Phone,
  UserCheck,
} from 'lucide-react';
import { downloadSchoolTemplate, exportSchoolsToExcel } from '../lib/excel';

export type CategoryKey = 'all' | 'high' | 'middle' | 'primary' | 'preschool' | 'other';
export type SortOption = 'category_name' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';

interface CategoryConfig {
  key: string;
  title: string;
  shortLabel: string;
  badgeLabel: string;
  order: number;
  icon: typeof SchoolIcon;
  description: string;
  color: {
    bg: string;
    border: string;
    headerGradient: string;
    badge: string;
    tagBadge: string;
    text: string;
    accent: string;
    iconBg: string;
  };
  match: (level: string) => boolean;
}

const CATEGORY_DEFINITIONS: CategoryConfig[] = [
  {
    key: 'high',
    title: 'အထက်တန်းအဆင့် ကျောင်းများ',
    shortLabel: 'အထက်တန်း',
    badgeLabel: 'အထက်တန်းအဆင့်',
    description: 'အထက်တန်းပညာ သင်ကြားခွင့်ရ အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ',
    order: 1,
    icon: GraduationCap,
    match: (level: string) => level.includes('အထက်တန်း') || level.toLowerCase().includes('high'),
    color: {
      bg: 'bg-sky-50/50',
      border: 'border-sky-200',
      headerGradient: 'from-sky-900 via-sky-850 to-sky-800 text-white',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      tagBadge: 'bg-sky-50 text-sky-700 border-sky-200',
      text: 'text-sky-950',
      accent: 'text-sky-600',
      iconBg: 'bg-sky-100 text-sky-700',
    },
  },
  {
    key: 'middle',
    title: 'အလယ်တန်းအဆင့် ကျောင်းများ',
    shortLabel: 'အလယ်တန်း',
    badgeLabel: 'အလယ်တန်းအဆင့်',
    description: 'အလယ်တန်းပညာ သင်ကြားခွင့်ရ အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ',
    order: 2,
    icon: BookOpen,
    match: (level: string) => level.includes('အလယ်တန်း') || level.toLowerCase().includes('middle'),
    color: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      headerGradient: 'from-emerald-900 via-emerald-850 to-emerald-800 text-white',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      tagBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-950',
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
  },
  {
    key: 'primary',
    title: 'မူလတန်းအဆင့် ကျောင်းများ',
    shortLabel: 'မူလတန်း',
    badgeLabel: 'မူလတန်းအဆင့်',
    description: 'မူလတန်းပညာ သင်ကြားခွင့်ရ အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ',
    order: 3,
    icon: SchoolIcon,
    match: (level: string) =>
      (level.includes('မူလတန်း') && !level.includes('မူလတန်းကြို') && !level.includes('မူကြို')) ||
      level.toLowerCase().includes('primary'),
    color: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      headerGradient: 'from-amber-900 via-amber-850 to-amber-800 text-white',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      tagBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      text: 'text-amber-950',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-100 text-amber-800',
    },
  },
  {
    key: 'preschool',
    title: 'မူလတန်းကြို / မူကြို ကျောင်းများ',
    shortLabel: 'မူလတန်းကြို',
    badgeLabel: 'မူကြိုအဆင့်',
    description: 'မူလတန်းကြိုနှင့် KG ပညာရေး သင်ကြားခွင့်ရ ကိုယ်ပိုင်ကျောင်းများ',
    order: 4,
    icon: Sparkles,
    match: (level: string) =>
      level.includes('မူလတန်းကြို') ||
      level.includes('မူကြို') ||
      level.toLowerCase().includes('pre') ||
      level.toLowerCase().includes('kg') ||
      level.toLowerCase().includes('kindergarten'),
    color: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      headerGradient: 'from-purple-900 via-purple-850 to-purple-800 text-white',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      tagBadge: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'text-purple-950',
      accent: 'text-purple-600',
      iconBg: 'bg-purple-100 text-purple-700',
    },
  },
  {
    key: 'other',
    title: 'အခြား ကျောင်းများ',
    shortLabel: 'အခြား',
    badgeLabel: 'အခြားအဆင့်',
    description: 'အထွေထွေနှင့် အခြားအဆင့် ကိုယ်ပိုင်ကျောင်းများ',
    order: 5,
    icon: Building2,
    match: () => true,
    color: {
      bg: 'bg-slate-50/50',
      border: 'border-slate-200',
      headerGradient: 'from-slate-900 via-slate-850 to-slate-800 text-white',
      badge: 'bg-slate-100 text-slate-850 border-slate-300',
      tagBadge: 'bg-slate-100 text-slate-700 border-slate-200',
      text: 'text-slate-950',
      accent: 'text-slate-600',
      iconBg: 'bg-slate-100 text-slate-700',
    },
  },
];

// Helper to determine category
const getSchoolCategory = (school: School): CategoryConfig => {
  const levelText = (school.category || school.level || '').trim();
  for (const def of CATEGORY_DEFINITIONS) {
    if (def.key === 'other') continue;
    if (def.match(levelText)) {
      return def;
    }
  }
  return CATEGORY_DEFINITIONS.find((d) => d.key === 'other')!;
};

// Burmese numbers converter
const toBurmeseNumber = (num: number): string => {
  const digits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return String(num).replace(/\d/g, (d) => digits[parseInt(d, 10)]);
};

export default function Contacts() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const { schools, loading, isSyncing, syncData } = useData();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(initialCategory);
  const [sortOption, setSortOption] = useState<SortOption>('category_name');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const [feeFilter, setFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Update from URL params if changed
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    const urlCategory = searchParams.get('category');
    if (urlCategory && urlCategory !== selectedCategoryTab) {
      setSelectedCategoryTab(urlCategory);
    }
    const urlLevel = searchParams.get('level');
    if (urlLevel && urlLevel !== levelFilter) {
      setLevelFilter(urlLevel);
    }
  }, [searchParams]);

  const { schoolLevels } = useData();

  // Distinct school levels for filter options
  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    (schoolLevels || []).forEach(l => {
      if (l.name && l.name.trim()) levels.add(l.name.trim());
    });
    schools.forEach((s) => {
      if (s.level && s.level.trim()) {
        levels.add(s.level.trim());
      }
    });
    return Array.from(levels);
  }, [schools, schoolLevels]);

  // Fee counts
  const paidCount = useMemo(() => schools.filter((s) => s.isAnnualFeePaid).length, [schools]);
  const unpaidCount = useMemo(() => schools.filter((s) => !s.isAnnualFeePaid).length, [schools]);

  // Category counts across ALL schools
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: schools.length };
    CATEGORY_DEFINITIONS.forEach((def) => {
      counts[def.key] = 0;
    });
    schools.forEach((s) => {
      const cat = getSchoolCategory(s);
      counts[cat.key] = (counts[cat.key] || 0) + 1;
    });
    return counts;
  }, [schools]);

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
    setSelectedCategoryTab('all');
    setSortOption('category_name');
  };

  const toggleCategoryCollapse = (categoryKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  // 1. Filter schools based on search, category tab, fee status, level
  const filteredSchools = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return schools.filter((s) => {
      const matchSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.level && s.level.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.responsiblePerson1Name && s.responsiblePerson1Name.toLowerCase().includes(q)) ||
        (s.contact2Name && s.contact2Name.toLowerCase().includes(q)) ||
        (s.responsiblePerson2Name && s.responsiblePerson2Name.toLowerCase().includes(q)) ||
        (s.schoolPhone && s.schoolPhone.toLowerCase().includes(q)) ||
        (s.schoolPhone2 && s.schoolPhone2.toLowerCase().includes(q)) ||
        (s.contactPhone && s.contactPhone.toLowerCase().includes(q)) ||
        (s.contactPhone2 && s.contactPhone2.toLowerCase().includes(q)) ||
        (s.responsiblePerson1Phone && s.responsiblePerson1Phone.toLowerCase().includes(q)) ||
        (s.contact2Phone && s.contact2Phone.toLowerCase().includes(q)) ||
        (s.contact2Phone2 && s.contact2Phone2.toLowerCase().includes(q)) ||
        (s.responsiblePerson2Phone && s.responsiblePerson2Phone.toLowerCase().includes(q)) ||
        (Array.isArray(s.schoolPhones) && s.schoolPhones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contactPhones) && s.contactPhones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.responsiblePerson1Phones) && s.responsiblePerson1Phones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contact2Phones) && s.contact2Phones.some(p => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.responsiblePerson2Phones) && s.responsiblePerson2Phones.some(p => p.toLowerCase().includes(q))) ||
        (s.founderPhone && s.founderPhone.toLowerCase().includes(q)) ||
        (s.founderPhone2 && s.founderPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.founderPhones) && s.founderPhones.some(p => p.toLowerCase().includes(q))) ||
        (s.adminPhone && s.adminPhone.toLowerCase().includes(q)) ||
        (s.adminPhone2 && s.adminPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.adminPhones) && s.adminPhones.some(p => p.toLowerCase().includes(q)));

      const matchCategoryTab =
        selectedCategoryTab === 'all'
          ? true
          : getSchoolCategory(s).key === selectedCategoryTab;

      const matchFee =
        feeFilter === 'all'
          ? true
          : feeFilter === 'paid'
          ? s.isAnnualFeePaid === true
          : !s.isAnnualFeePaid;

      const matchLevel =
        levelFilter === 'all' ? true : s.level && s.level.trim() === levelFilter;

      return matchSearch && matchCategoryTab && matchFee && matchLevel;
    });
  }, [schools, searchTerm, selectedCategoryTab, feeFilter, levelFilter]);

  // 2. Sort schools cleanly
  const sortedSchools = useMemo(() => {
    const list = [...filteredSchools];

    return list.sort((a, b) => {
      if (sortOption === 'name_asc') {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const cmp = nameA.localeCompare(nameB, 'my', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : nameA.localeCompare(nameB);
      }

      if (sortOption === 'name_desc') {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const cmp = nameB.localeCompare(nameA, 'my', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : nameB.localeCompare(nameA);
      }

      if (sortOption === 'newest') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }

      if (sortOption === 'oldest') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      }

      // Default: 'category_name' (Category Priority order -> School name A to Z)
      const catA = getSchoolCategory(a);
      const catB = getSchoolCategory(b);
      if (catA.order !== catB.order) {
        return catA.order - catB.order;
      }

      const nameA = a.name || '';
      const nameB = b.name || '';
      const cmp = nameA.localeCompare(nameB, 'my', { sensitivity: 'base' });
      return cmp !== 0 ? cmp : nameA.localeCompare(nameB);
    });
  }, [filteredSchools, sortOption]);

  // 3. Grouped Schools by Category for the Category View
  const groupedCategories = useMemo(() => {
    const groups: {
      config: CategoryConfig;
      schools: School[];
    }[] = [];

    CATEGORY_DEFINITIONS.forEach((config) => {
      // Find schools matching this category from sortedSchools
      const catSchools = sortedSchools.filter((s) => getSchoolCategory(s).key === config.key);
      if (catSchools.length > 0) {
        // Ensure within this category, schools are alphabetically sorted unless explicitly sorted by time
        if (sortOption === 'category_name') {
          catSchools.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            const cmp = nameA.localeCompare(nameB, 'my', { sensitivity: 'base' });
            return cmp !== 0 ? cmp : nameA.localeCompare(nameB);
          });
        }
        groups.push({
          config,
          schools: catSchools,
        });
      }
    });

    return groups;
  }, [sortedSchools, sortOption]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950 flex items-center gap-2.5">
            <SchoolIcon className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600 shrink-0" />
            <span>အသင်းဝင်ကျောင်းများ စာရင်း</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            ကဏ္ဍ/အဆင့်အလိုက် သပ်ရပ်စွာ ခွဲခြမ်းစီစဉ်ထားသော ကိုယ်ပိုင်ကျောင်းများစာရင်း (စုစုပေါင်း {toBurmeseNumber(schools.length)} ကျောင်း)
          </p>
        </div>

        {/* Action buttons: Offline Sync badge, Excel Template download & Admin Import Link */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <OfflineSyncStatusBadge />
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
            to="/admin?tab=schools"
            className="bg-sky-50 border border-sky-200 text-sky-800 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-sky-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-700" />
            <span>Excel သွင်းရန် (Admin)</span>
          </Link>
        </div>
      </div>

      {/* 2. CATEGORY PILLS FILTER BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Category အလိုက် စစ်ထုတ်ရန်:</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {selectedCategoryTab === 'all'
              ? `ကဏ္ဍအားလုံး (${toBurmeseNumber(filteredSchools.length)} ကျောင်း)`
              : `ရွေးချယ်ထားသော ကဏ္ဍ (${toBurmeseNumber(filteredSchools.length)} ကျောင်း)`}
          </span>
        </div>

        {/* Pill buttons for each category - flex-wrap to prevent horizontal scrolling */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedCategoryTab === 'all'
                ? 'bg-sky-950 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>အားလုံး (All)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedCategoryTab === 'all' ? 'bg-sky-800 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {categoryCounts.all || 0}
            </span>
          </button>

          {CATEGORY_DEFINITIONS.map((cat) => {
            const count = categoryCounts[cat.key] || 0;
            // Only show category pills that have schools, or show all standard categories
            if (count === 0 && cat.key === 'other') return null;
            const Icon = cat.icon;
            const isSelected = selectedCategoryTab === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategoryTab(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? `${cat.color.badge} border-current shadow-xs ring-2 ring-sky-500/20`
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-current' : cat.color.accent}`} />
                <span>{cat.shortLabel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/80 text-current' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH BAR, SORTING & VIEW MODE TOGGLE */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ကျောင်းအမည်၊ တာဝန်ခံ၊ တည်ထောင်သူ သို့မဟုတ် အဆင့်ဖြင့် ရှာဖွေရန်..."
              className="w-full pl-11 pr-8 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden text-sm sm:text-base bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-sky-600 shrink-0" />
              <label htmlFor="sort-select" className="text-slate-500 text-xs shrink-0 hidden sm:inline">
                စီစဉ်မှု:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer text-xs sm:text-sm pr-1"
              >
                <option value="category_name">ကဏ္ဍနှင့် အက္ခရာစဉ် (Category & Name)</option>
                <option value="name_asc">ကျောင်းအမည် (က မှ အ ထိ)</option>
                <option value="name_desc">ကျောင်းအမည် (အ မှ က ထိ)</option>
                <option value="newest">နောက်ဆုံးထည့်သွင်းမှု (အသစ်ဆုံး)</option>
                <option value="oldest">ရှေးအကျဆုံး (ထည့်သွင်းမှု)</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle (Category Grouped vs Flat List) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              title="Category အလိုက် အုပ်စုဖွဲ့ပြရန်"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-sky-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Category အုပ်စု</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="စာရင်းတစ်ခုတည်းပြရန်"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-sky-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">စာရင်းတစ်ခုတည်း</span>
            </button>
          </div>

          {/* Advance Filter Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilter((prev) => !prev)}
            type="button"
            className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shrink-0 ${
              showAdvancedFilter || activeFilterCount > 0
                ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">အဆင့်မြင့် Filter</span>
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

          {/* Export to Excel Button */}
          <button
            onClick={() => exportSchoolsToExcel(filteredSchools, 'Schools_Directory.xlsx')}
            type="button"
            title="လက်ရှိစာရင်းအား Excel ထုတ်ယူမည်"
            className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Excel ထုတ်ယူမည်</span>
          </button>
        </div>

        {/* Advance Filter Collapsible Panel (နှစ်စဉ်ကြေး အခြေအနေ & ကျောင်းအဆင့် စစ်ထုတ်မှု) */}
        {showAdvancedFilter && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Annual Fee Filter */}
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
                  ကျောင်းအဆင့် (မူလ သတ်မှတ်ချက်):
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
                  {availableLevels.map((lvl) => (
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
            {(activeFilterCount > 0 || searchTerm || selectedCategoryTab !== 'all' || sortOption !== 'category_name') && (
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

      {/* 4. SCHOOLS CONTENT DISPLAY */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
              <div className="space-y-2">
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedSchools.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <SchoolIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-lg text-slate-700">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မတွေ့ရှိပါ</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || feeFilter !== 'all' || levelFilter !== 'all' || selectedCategoryTab !== 'all'
              ? 'ရွေးချယ်ထားသော စစ်ထုတ်မှုများ သို့မဟုတ် စာလုံးပေါင်းများကို ပြန်လည်စစ်ဆေးကြည့်ပါ။'
              : 'ကျောင်းအချက်အလက်များ ထည့်သွင်းထားခြင်း မရှိသေးပါ။'}
          </p>
          {(searchTerm || activeFilterCount > 0 || selectedCategoryTab !== 'all') && (
            <button
              onClick={resetFilters}
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-800 rounded-xl text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> မူလအတိုင်း ပြန်ပြရန်
            </button>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        /* MODE A: GROUPED BY CATEGORY (Default & User Requested) */
        <div className="space-y-6">
          {groupedCategories.map((group) => {
            const { config, schools: catSchools } = group;
            const Icon = config.icon;
            const isCollapsed = !!collapsedCategories[config.key];

            return (
              <section
                key={config.key}
                className={`rounded-2xl border ${config.color.border} bg-white shadow-2xs overflow-hidden transition-all`}
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategoryCollapse(config.key)}
                  className={`bg-gradient-to-r ${config.color.headerGradient} p-4 sm:p-4.5 flex items-center justify-between cursor-pointer select-none`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <span>{config.title}</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                          {toBurmeseNumber(catSchools.length)} ကျောင်း
                        </span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1 font-normal">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/80 hidden sm:inline">
                      {isCollapsed ? 'ဖွင့်ရန်' : 'ခေါက်ရန်'}
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5 text-white" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Schools list inside this Category */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 divide-y divide-slate-100 bg-white">
                    {catSchools.map((school, index) => (
                      <Link
                        key={school.id}
                        to={`/schools/${school.id}`}
                        className="group py-3.5 px-3 sm:px-4 rounded-xl hover:bg-slate-50/80 transition flex items-center justify-between gap-3.5 cursor-pointer first:pt-2 last:pb-2"
                      >
                        {/* Index & Logo */}
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          {/* Sequential Number badge */}
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-sky-100 group-hover:text-sky-800 transition">
                            {toBurmeseNumber(index + 1)}
                          </div>

                          {/* Emblem / Logo */}
                          {school.logoUrl ? (
                            <img
                              src={school.logoUrl}
                              alt={school.name}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 bg-white p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center shrink-0 group-hover:bg-sky-800 transition shadow-2xs">
                              <SchoolIcon className="w-6 h-6" />
                            </div>
                          )}

                          {/* School Details */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-bold text-sm sm:text-base text-sky-950 group-hover:text-sky-700 transition truncate">
                              {school.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              {/* Level badge */}
                              {school.level && (
                                <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold ${config.color.tagBadge}`}>
                                  {school.level}
                                </span>
                              )}

                              {/* Student Range badge */}
                              {school.studentRange && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100 font-medium">
                                  ကျောင်းသား: {school.studentRange} ဦး
                                </span>
                              )}

                              {/* Annual Fee Badge */}
                              {school.isAnnualFeePaid ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                  ကြေးပေးပြီး ✓
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                                  ကြေးမပေးရသေး
                                </span>
                              )}

                              {/* Administrator / Founder / Coordinator preview if present */}
                              {(school.adminName || school.founderName || school.contactName || school.contact2Name) && (
                                <span className="hidden md:inline-flex items-center gap-1 text-slate-500 truncate">
                                  <UserCheck className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {school.contactName
                                      ? `တာဝန်ခံ (၁): ${school.contactName}`
                                      : school.contact2Name
                                      ? `တာဝန်ခံ (၂): ${school.contact2Name}`
                                      : school.adminName || school.founderName}
                                  </span>
                                </span>
                              )}

                              {/* Phone preview if present */}
                              {(school.schoolPhone || school.schoolPhone2 || school.founderPhone || school.adminPhone || school.contactPhone || school.contact2Phone) && (
                                <span className="hidden lg:inline-flex items-center gap-1 text-slate-500 font-medium">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {[school.schoolPhone, school.schoolPhone2, school.founderPhone, school.adminPhone, school.contactPhone, school.contact2Phone]
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .join(' / ')}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: View Detail Indicator */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 shrink-0 group-hover:translate-x-1 transition-transform">
                          <span className="hidden sm:inline">အသေးစိတ်</span>
                          <ArrowRight className="w-4 h-4 text-sky-600 group-hover:text-sky-900" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* MODE B: FLAT LIST VIEW (Sorted) */
        <div className="space-y-3">
          {sortedSchools.map((s, idx) => {
            const cat = getSchoolCategory(s);
            return (
              <Link
                key={s.id}
                to={`/schools/${s.id}`}
                className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-md transition flex items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Index + Emblem / Logo + Title & Level */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-sky-100 group-hover:text-sky-800 transition">
                    {toBurmeseNumber(idx + 1)}
                  </div>

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
                    <h3 className="font-bold text-base sm:text-lg text-sky-950 group-hover:text-sky-700 transition truncate">
                      {s.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category Badge */}
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${cat.color.badge}`}>
                        {cat.shortLabel}
                      </span>

                      {/* Level if distinct */}
                      {s.level && s.level !== cat.shortLabel && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {s.level}
                        </span>
                      )}

                      {/* Student Range */}
                      {s.studentRange && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100 font-medium">
                          ကျောင်းသား: {s.studentRange} ဦး
                        </span>
                      )}

                      {/* Fee Badge */}
                      {s.isAnnualFeePaid ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          ကြေးပေးပြီး ✓
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                          ကြေးမပေးရသေး
                        </span>
                      )}

                      {/* Coordinator / Phone preview */}
                      {(s.contactName || s.contact2Name || s.schoolPhone || s.schoolPhone2) && (
                        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 truncate">
                          <Phone className="w-3 h-3 text-sky-600" />
                          <span>
                            {s.contactName
                              ? `တာဝန်ခံ (၁): ${s.contactName}`
                              : s.contact2Name
                              ? `တာဝန်ခံ (၂): ${s.contact2Name}`
                              : s.schoolPhone || s.schoolPhone2}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Click indicator to view detail */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 shrink-0 group-hover:translate-x-1 transition-transform">
                  <span className="hidden sm:inline">အသေးစိတ်</span>
                  <ArrowRight className="w-4 h-4 text-sky-600 group-hover:text-sky-900" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
