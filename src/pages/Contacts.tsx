import { useState, useEffect, useMemo, useCallback } from 'react';
import { School } from '../types';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  Search,
  School as SchoolIcon,
  ArrowRight,
  ArrowLeft,
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
  MapPin,
} from 'lucide-react';
import { downloadSchoolTemplate, exportSchoolsToExcel } from '../lib/excel';
import {
  getUnifiedSchoolLevels,
  UnifiedSchoolLevel,
  isSchoolInLevel,
} from '../lib/schoolLevels';

export type SortOption = 'category_name' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';

// Burmese numbers converter
const toBurmeseNumber = (num: number): string => {
  const digits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return String(num).replace(/\d/g, (d) => digits[parseInt(d, 10)]);
};

export interface SchoolPhoneItem {
  number: string;
  cleanDial: string;
}

export interface CategorizedSchoolPhone {
  key: string;
  category: 'founder' | 'admin' | 'contact1' | 'contact2' | 'school';
  fullLabel: string;
  personName?: string;
  personRole?: string;
  number: string;
  cleanDial: string;
}

export const extractSchoolPhoneList = (school: School): SchoolPhoneItem[] => {
  const rawList = [
    school.schoolPhone,
    school.schoolPhone2,
    school.contactPhone,
    school.contactPhone2,
    school.adminPhone,
    school.founderPhone,
    school.contact2Phone,
    ...(Array.isArray(school.schoolPhones) ? school.schoolPhones : []),
    ...(Array.isArray(school.contactPhones) ? school.contactPhones : []),
    ...(Array.isArray(school.adminPhones) ? school.adminPhones : []),
    ...(Array.isArray(school.founderPhones) ? school.founderPhones : []),
    ...(Array.isArray(school.contact2Phones) ? school.contact2Phones : []),
  ];

  const results: SchoolPhoneItem[] = [];
  const seen = new Set<string>();

  for (const raw of rawList) {
    if (!raw || typeof raw !== 'string') continue;
    const parts = raw.split(/[/,\n;]+/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      const clean = part.replace(/[^0-9+]/g, '');
      if (clean && clean.length >= 5 && !seen.has(clean)) {
        seen.add(clean);
        results.push({
          number: part,
          cleanDial: clean,
        });
      }
    }
  }

  return results;
};

export const getCategorizedSchoolPhones = (school: School): CategorizedSchoolPhone[] => {
  const results: CategorizedSchoolPhone[] = [];

  const parseNumbers = (rawInputs: (string | undefined | null | string[])[]): string[] => {
    const list: string[] = [];
    const seen = new Set<string>();

    for (const input of rawInputs) {
      if (!input) continue;
      if (Array.isArray(input)) {
        for (const item of input) {
          if (!item || typeof item !== 'string') continue;
          const parts = item.split(/[/,\n;]+/).map((p) => p.trim()).filter(Boolean);
          for (const p of parts) {
            const clean = p.replace(/[^0-9+]/g, '');
            if (clean && clean.length >= 5 && !seen.has(clean)) {
              seen.add(clean);
              list.push(p);
            }
          }
        }
      } else if (typeof input === 'string') {
        const parts = input.split(/[/,\n;]+/).map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          const clean = p.replace(/[^0-9+]/g, '');
          if (clean && clean.length >= 5 && !seen.has(clean)) {
            seen.add(clean);
            list.push(p);
          }
        }
      }
    }
    return list;
  };

  const getPhoneLabel = (categoryPrefix: string, index: number): string => {
    if (index === 0) return `${categoryPrefix} ဖုန်း (၁)`;
    if (index === 1) return `${categoryPrefix} ဖုန်း (၂)`;
    return `${categoryPrefix} ဖုန်း (${toBurmeseNumber(index + 1)})`;
  };

  // 1. တည်ထောင်သူ ဖုန်း
  const founderNums = parseNumbers([
    school.founderPhone,
    school.founderPhone2,
    school.founderPhones,
  ]);
  founderNums.forEach((num, idx) => {
    results.push({
      key: `founder-${idx}-${num}`,
      category: 'founder',
      fullLabel: getPhoneLabel('တည်ထောင်သူ', idx),
      personName: school.founderName?.trim() || undefined,
      personRole: 'တည်ထောင်သူ (Founder)',
      number: num,
      cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 2. စီမံအုပ်ချုပ်သူ ဖုန်း
  const adminNums = parseNumbers([
    school.adminPhone,
    school.adminPhone2,
    school.adminPhones,
  ]);
  adminNums.forEach((num, idx) => {
    results.push({
      key: `admin-${idx}-${num}`,
      category: 'admin',
      fullLabel: getPhoneLabel('စီမံအုပ်ချုပ်သူ', idx),
      personName: school.adminName?.trim() || undefined,
      personRole: 'စီမံအုပ်ချုပ်သူ (Admin/Principal)',
      number: num,
      cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 3. တာဝန်ခံ (၁) ဖုန်း
  const contact1Nums = parseNumbers([
    school.contactPhone,
    school.contactPhone2,
    school.contactPhones,
    school.responsiblePerson1Phone,
    school.responsiblePerson1Phone2,
    school.responsiblePerson1Phones,
  ]);
  const contact1Name = (school.contactName || school.responsiblePerson1Name)?.trim();
  const contact1Role = (school.contactRole || school.responsiblePerson1Role)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၁)';
  contact1Nums.forEach((num, idx) => {
    results.push({
      key: `contact1-${idx}-${num}`,
      category: 'contact1',
      fullLabel: getPhoneLabel('တာဝန်ခံ (၁)', idx),
      personName: contact1Name || undefined,
      personRole: contact1Role,
      number: num,
      cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 4. တာဝန်ခံ (၂) ဖုန်း
  const contact2Nums = parseNumbers([
    school.contact2Phone,
    school.contact2Phone2,
    school.contact2Phones,
    school.responsiblePerson2Phone,
    school.responsiblePerson2Phone2,
    school.responsiblePerson2Phones,
  ]);
  const contact2Name = (school.contact2Name || school.responsiblePerson2Name)?.trim();
  const contact2Role = (school.contact2Role || school.responsiblePerson2Role)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၂)';
  contact2Nums.forEach((num, idx) => {
    results.push({
      key: `contact2-${idx}-${num}`,
      category: 'contact2',
      fullLabel: getPhoneLabel('တာဝန်ခံ (၂)', idx),
      personName: contact2Name || undefined,
      personRole: contact2Role,
      number: num,
      cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 5. ကျောင်း ဖုန်း
  const schoolNums = parseNumbers([
    school.schoolPhone,
    school.schoolPhone2,
    school.schoolPhones,
  ]);
  schoolNums.forEach((num, idx) => {
    results.push({
      key: `school-${idx}-${num}`,
      category: 'school',
      fullLabel: getPhoneLabel('ကျောင်း', idx),
      personRole: 'ကျောင်း ရုံးခန်း (School Office)',
      number: num,
      cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // Fallback: If no categorized phones found, but raw extraction finds numbers
  if (results.length === 0) {
    const rawList = extractSchoolPhoneList(school);
    rawList.forEach((item, idx) => {
      results.push({
        key: `fallback-${idx}-${item.cleanDial}`,
        category: 'school',
        fullLabel: getPhoneLabel('ကျောင်း', idx),
        number: item.number,
        cleanDial: item.cleanDial,
      });
    });
  }

  return results;
};

export default function Contacts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || searchParams.get('level') || 'all';

  const { schools, loading, isSyncing, syncData, schoolLevels } = useData();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(initialCategory);
  const [sortOption, setSortOption] = useState<SortOption>('category_name');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const [feeFilter, setFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [levelFilter, setLevelFilter] = useState<string>(initialCategory);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Phone Directory Drop Down State (Prevent vertical overflow by default)
  const [openPhoneDropdowns, setOpenPhoneDropdowns] = useState<Record<string, boolean>>({});

  const togglePhoneDropdown = useCallback((schoolId: string) => {
    setOpenPhoneDropdowns((prev) => ({ ...prev, [schoolId]: !prev[schoolId] }));
  }, []);

  const expandAllPhoneDropdowns = useCallback(() => {
    const next: Record<string, boolean> = {};
    schools.forEach((s) => {
      next[s.id] = true;
    });
    setOpenPhoneDropdowns(next);
  }, [schools]);

  const collapseAllPhoneDropdowns = useCallback(() => {
    setOpenPhoneDropdowns({});
  }, []);

  // Dynamic School Levels unified from database & school records
  const unifiedLevels = useMemo(() => {
    return getUnifiedSchoolLevels(schoolLevels, schools).filter(l => l.total > 0);
  }, [schoolLevels, schools]);

  // Helper to determine unified level category of any school
  const getSchoolCategory = useCallback(
    (school: School): UnifiedSchoolLevel => {
      for (const lvl of unifiedLevels) {
        if (lvl.isUnassigned) continue;
        if (lvl.schools.some((s) => s.id === school.id)) return lvl;
        if (isSchoolInLevel(school, lvl.name)) return lvl;
      }
      return (
        unifiedLevels.find((l) => l.isUnassigned) ||
        unifiedLevels[unifiedLevels.length - 1]
      );
    },
    [unifiedLevels]
  );

  // Unified Category/Level selection handler
  const handleSelectCategory = useCallback(
    (category: string) => {
      setSelectedCategoryTab(category);
      setLevelFilter(category);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (category === 'all') {
          next.delete('category');
          next.delete('level');
        } else {
          next.set('category', category);
          next.delete('level');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Update from URL params if changed
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    const urlCategory = searchParams.get('category') || searchParams.get('level');
    if (urlCategory) {
      if (urlCategory !== selectedCategoryTab) {
        setSelectedCategoryTab(urlCategory);
        setLevelFilter(urlCategory);
      }
    } else if (selectedCategoryTab !== 'all' && (searchParams.has('level') || searchParams.has('category'))) {
      setSelectedCategoryTab('all');
      setLevelFilter('all');
    }
  }, [searchParams]);

  // Distinct school levels for filter options
  const availableLevels = useMemo(() => {
    return unifiedLevels.map((l) => l.name);
  }, [unifiedLevels]);

  // Fee counts
  const paidCount = useMemo(() => schools.filter((s) => s.isAnnualFeePaid).length, [schools]);
  const unpaidCount = useMemo(() => schools.filter((s) => !s.isAnnualFeePaid).length, [schools]);

  // Category counts across ALL schools
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: schools.length };
    unifiedLevels.forEach((lvl) => {
      counts[lvl.id] = lvl.total;
      counts[lvl.name] = lvl.total;
    });
    return counts;
  }, [schools.length, unifiedLevels]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (feeFilter !== 'all') count++;
    if (selectedCategoryTab !== 'all') count++;
    return count;
  }, [feeFilter, selectedCategoryTab]);

  const resetFilters = () => {
    setFeeFilter('all');
    setLevelFilter('all');
    setSearchTerm('');
    setSelectedCategoryTab('all');
    setSortOption('category_name');
    setSearchParams({});
  };

  const toggleCategoryCollapse = (categoryKey: string) => {
    setCollapsedCategories((prev) => {
      const isCurrentlyCollapsed = prev[categoryKey] !== false;
      return {
        ...prev,
        [categoryKey]: !isCurrentlyCollapsed ? true : false,
      };
    });
  };

  const expandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    unifiedLevels.forEach((l) => {
      allExpanded[l.id] = false;
    });
    setCollapsedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    const allCollapsed: Record<string, boolean> = {};
    unifiedLevels.forEach((l) => {
      allCollapsed[l.id] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  // 1. Filter schools based on search, category tab, fee status
  const filteredSchools = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const activeCategory = selectedCategoryTab !== 'all' ? selectedCategoryTab : (levelFilter !== 'all' ? levelFilter : 'all');

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
        (Array.isArray(s.schoolPhones) && s.schoolPhones.some((p) => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contactPhones) && s.contactPhones.some((p) => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.responsiblePerson1Phones) && s.responsiblePerson1Phones.some((p) => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.contact2Phones) && s.contact2Phones.some((p) => p.toLowerCase().includes(q))) ||
        (Array.isArray(s.responsiblePerson2Phones) && s.responsiblePerson2Phones.some((p) => p.toLowerCase().includes(q))) ||
        (s.founderPhone && s.founderPhone.toLowerCase().includes(q)) ||
        (s.founderPhone2 && s.founderPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.founderPhones) && s.founderPhones.some((p) => p.toLowerCase().includes(q))) ||
        (s.adminPhone && s.adminPhone.toLowerCase().includes(q)) ||
        (s.adminPhone2 && s.adminPhone2.toLowerCase().includes(q)) ||
        (Array.isArray(s.adminPhones) && s.adminPhones.some((p) => p.toLowerCase().includes(q)));

      const schoolCat = getSchoolCategory(s);
      const matchCategoryTab =
        activeCategory === 'all'
          ? true
          : schoolCat.id === activeCategory ||
            schoolCat.name === activeCategory ||
            isSchoolInLevel(s, activeCategory) ||
            ((activeCategory === 'unassigned' || activeCategory === 'unassigned-level') && schoolCat.isUnassigned);

      const matchFee =
        feeFilter === 'all'
          ? true
          : feeFilter === 'paid'
          ? s.isAnnualFeePaid === true
          : !s.isAnnualFeePaid;

      return matchSearch && matchCategoryTab && matchFee;
    });
  }, [schools, searchTerm, selectedCategoryTab, levelFilter, feeFilter]);

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
  }, [filteredSchools, sortOption, getSchoolCategory]);

  // 3. Grouped Schools by Category for the Category View
  const groupedCategories = useMemo(() => {
    const groups: {
      config: UnifiedSchoolLevel;
      schools: School[];
    }[] = [];

    unifiedLevels.forEach((lvl) => {
      const catSchools = sortedSchools.filter((s) => {
        const schoolCat = getSchoolCategory(s);
        return schoolCat.id === lvl.id;
      });

      if (catSchools.length > 0) {
        groups.push({
          config: lvl,
          schools: catSchools,
        });
      }
    });

    return groups;
  }, [sortedSchools, unifiedLevels, getSchoolCategory]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10 max-w-full overflow-x-hidden">
      {/* 1. Page Header & Actions (Compact with Back button) */}
      <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-950 transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
            title="နောက်သို့ (Back)"
          >
            <ArrowLeft className="w-4 h-4 text-sky-800" />
            <span>နောက်သို့</span>
          </button>

          <SchoolIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 shrink-0" />
          <h2 className="text-base sm:text-xl font-extrabold text-sky-950 truncate">
            အသင်းဝင်ကျောင်းများ စာရင်း
          </h2>
          <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shrink-0">
            {toBurmeseNumber(schools.length)} ကျောင်း
          </span>
        </div>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition shrink-0"
        >
          ပင်မစာမျက်နှာ ➔
        </Link>
      </div>

      {/* 2. UNIFIED COMPACT CONTROL CENTER (Search + Category Select + Sort in ONE Card) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Main Search Input */}
        <div className="w-full relative">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="ကျောင်းအမည်၊ တာဝန်ခံ၊ မြို့နယ် သို့မဟုတ် အဆင့်ဖြင့် ရှာဖွေရန်..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden text-xs sm:text-sm bg-white font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                title="ရှာဖွေမှု ရှင်းလင်းမည်"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category & Sort Dropdowns in a single responsive row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Category Dropdown Select */}
          <div className="sm:col-span-7 relative">
            <div className="relative flex items-center bg-slate-50 border border-slate-300 hover:border-sky-400 focus-within:border-sky-500 rounded-xl px-2.5 py-1.5 transition">
              <GraduationCap className="w-4 h-4 text-sky-600 shrink-0 mr-1.5" />
              <select
                id="category-dropdown-select"
                value={selectedCategoryTab}
                onChange={(e) => handleSelectCategory(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 outline-hidden cursor-pointer text-xs pr-6 truncate"
              >
                <option value="all">
                  ကဏ္ဍ အားလုံး — ({toBurmeseNumber(categoryCounts.all || schools.length)} ကျောင်း)
                </option>
                {unifiedLevels.map((lvl) => {
                  const count = lvl.total;
                  if (lvl.isUnassigned && count === 0) return null;
                  return (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name} — ({toBurmeseNumber(count)} ကျောင်း)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="sm:col-span-5 relative">
            <div className="relative flex items-center bg-slate-50 border border-slate-300 hover:border-sky-400 focus-within:border-sky-500 rounded-xl px-2.5 py-1.5 transition">
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-600 shrink-0 mr-1.5" />
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer text-xs pr-6 truncate"
              >
                <option value="category_name">ကဏ္ဍနှင့် အက္ခရာစဉ် (Category & Name)</option>
                <option value="name_asc">ကျောင်းအမည် (က မှ အ ထိ)</option>
                <option value="name_desc">ကျောင်းအမည် (အ မှ က ထိ)</option>
                <option value="newest">နောက်ဆုံးထည့်သွင်းမှု (အသစ်ဆုံး)</option>
                <option value="oldest">ရှေးအကျဆုံး (ထည့်သွင်းမှု)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none shrink-0" />
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar: View Mode + Filter + Excel */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Left Controls: View Mode & Category Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                title="Category အလိုက် အုပ်စုဖွဲ့ပြရန်"
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-sky-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>အုပ်စုခွဲ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="စာရင်းတစ်ခုတည်းပြရန်"
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-sky-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3 h-3" />
                <span>တစ်ခုတည်း</span>
              </button>
            </div>

            {selectedCategoryTab !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 cursor-pointer"
              >
                အားလုံးပြန်ကြည့် ✕
              </button>
            )}
          </div>

          {/* Right Controls: Advance Filter & Excel Export */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAdvancedFilter((prev) => !prev)}
              type="button"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                showAdvancedFilter || activeFilterCount > 0
                  ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-sky-600" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-sky-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {showAdvancedFilter ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            <button
              onClick={() => exportSchoolsToExcel(filteredSchools, 'Schools_Directory.xlsx')}
              type="button"
              title="လက်ရှိစာရင်းအား Excel ထုတ်ယူမည်"
              className="px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3 h-3 text-emerald-700" />
              <span>Excel</span>
            </button>
          </div>
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
                    <span>နှစ်စဉ်ကြေး သွင်းပြီး ({paidCount})</span>
                  </button>
                  <button
                    onClick={() => setFeeFilter('unpaid')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                      feeFilter === 'unpaid'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>နှစ်စဉ်ကြေး မသွင်းရသေး ({unpaidCount})</span>
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
                    onClick={() => handleSelectCategory('all')}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategoryTab === 'all'
                        ? 'bg-sky-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    အဆင့်အားလုံး
                  </button>
                  {availableLevels.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleSelectCategory(lvl)}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        selectedCategoryTab === lvl
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
        <div className="space-y-4">
          {/* Grouped Header Toolbar: Compact & responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800 text-xs">
                ကဏ္ဍ ({toBurmeseNumber(groupedCategories.length)}) ခု
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold text-xs">
                စုစုပေါင်း ({toBurmeseNumber(sortedSchools.length)}) ကျောင်း
              </span>
              {selectedCategoryTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="ml-1 text-[11px] text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                >
                  (အားလုံးပြ)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={expandAllCategories}
                className="px-2 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition border border-sky-200 cursor-pointer flex items-center gap-0.5"
                title="ကျောင်းအဆင့် အားလုံး ဖွင့်ပြရန်"
              >
                <ChevronDown className="w-3 h-3 text-sky-600" />
                <span>အားလုံးဖွင့်</span>
              </button>
              <button
                type="button"
                onClick={collapseAllCategories}
                className="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer flex items-center gap-0.5"
                title="ကျောင်းအဆင့် အားလုံး ခေါက်သိမ်းရန်"
              >
                <ChevronUp className="w-3 h-3 text-slate-500" />
                <span>ခေါက်</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={expandAllPhoneDropdowns}
                className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer flex items-center gap-0.5"
                title="ဖုန်းစာရင်း အားလုံး ဖွင့်ပြရန်"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>ဖုန်းဖွင့်</span>
              </button>
              <button
                type="button"
                onClick={collapseAllPhoneDropdowns}
                className="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer flex items-center gap-0.5"
                title="ဖုန်းစာရင်း အားလုံး ခေါက်ရန်"
              >
                <span>ဖုန်းခေါက်</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groupedCategories.map((group) => {
            const { config, schools: catSchools } = group;
            const Icon = config.isUnassigned ? Building2 : GraduationCap;
            const isCollapsed = collapsedCategories[config.id] !== false;

            return (
              <section
                key={config.id}
                className={`rounded-2xl border ${config.color.border} bg-white shadow-2xs overflow-hidden transition-all`}
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategoryCollapse(config.id)}
                  className={`bg-gradient-to-r ${config.color.headerGradient} p-3.5 sm:p-4.5 flex items-center justify-between gap-2.5 cursor-pointer select-none`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-lg font-bold flex flex-wrap items-center gap-1.5 sm:gap-2 leading-snug min-w-0">
                        <span className="truncate">{config.title}</span>
                        <span className="text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 shrink-0">
                          {toBurmeseNumber(catSchools.length)} ကျောင်း
                        </span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1 font-normal">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                  <div className="p-2.5 sm:p-4 divide-y divide-slate-100 bg-white">
                    {catSchools.map((school, index) => {
                      const categorizedPhones = getCategorizedSchoolPhones(school);
                      return (
                        <div
                          key={school.id}
                          className="group py-3 px-2 sm:px-4 rounded-xl hover:bg-slate-50/80 transition flex flex-col gap-2.5 first:pt-1 last:pb-1"
                        >
                          {/* Index & Logo & Details + Actions */}
                          <div className="flex items-start gap-2.5 sm:gap-3.5">
                            {/* Sequential Number badge */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-sky-100 group-hover:text-sky-900 transition mt-0.5">
                              {toBurmeseNumber(index + 1)}
                            </div>

                            {/* Emblem / Logo (Clickable to detail) */}
                            <Link
                              to={`/schools/${school.id}`}
                              className="shrink-0 cursor-pointer block mt-0.5"
                              title={`${school.name} အသေးစိတ် ကြည့်ရှုရန်`}
                            >
                              {school.logoUrl ? (
                                <img
                                  src={school.logoUrl}
                                  alt={school.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 bg-white p-0.5 hover:scale-105 transition"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center group-hover:bg-sky-800 transition shadow-2xs">
                                  <SchoolIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                              )}
                            </Link>

                            {/* School Details & Actions (Full width) */}
                            <div className="min-w-0 flex-1 space-y-1.5">
                              {/* Top Name Row (Desktop shows actions on right, Mobile wraps cleanly) */}
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3">
                                {/* School Name: ALWAYS completely visible, break-words, never crushed */}
                                <Link
                                  to={`/schools/${school.id}`}
                                  className="block font-bold text-sm sm:text-base text-sky-950 hover:text-sky-700 transition break-words leading-snug cursor-pointer"
                                  title={`${school.name} အသေးစိတ် ကြည့်ရှုရန်`}
                                >
                                  {school.name}
                                </Link>

                                {/* Action Buttons on Tablet/Desktop: Phone & Detail */}
                                <div className="hidden sm:flex items-center gap-2 shrink-0">
                                  {categorizedPhones.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => togglePhoneDropdown(school.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition cursor-pointer"
                                      title="ဖုန်းခေါ်ဆိုရန် Dropdown စာရင်း ကြည့်ရန်"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                      <span>ဖုန်းခေါ်ရန် ({toBurmeseNumber(categorizedPhones.length)})</span>
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openPhoneDropdowns[school.id] ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}

                                  <Link
                                    to={`/schools/${school.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 hover:text-sky-950 px-2.5 py-1.5 rounded-xl hover:bg-sky-50 transition shrink-0 cursor-pointer"
                                    title="ကျောင်းအသေးစိတ် ကြည့်ရှုရန်"
                                  >
                                    <span>အသေးစိတ်</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                                  </Link>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                {/* Level badge */}
                                {school.level && (
                                  <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold shrink-0 ${config.color.tagBadge}`}>
                                    {school.level}
                                  </span>
                                )}

                                {/* Student Range badge */}
                                {school.studentRange && (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100 font-medium shrink-0">
                                    ကျောင်းသား: {school.studentRange} ဦး
                                  </span>
                                )}

                                {/* Location Badge */}
                                {(school.township || school.city || school.zone) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-100 font-semibold shrink-0">
                                    <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                                    <span>{[school.township || school.city, school.zone ? `(${school.zone})` : null].filter(Boolean).join(' ')}</span>
                                  </span>
                                )}

                                {/* Annual Fee Badge */}
                                {school.isAnnualFeePaid ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shrink-0">
                                    နှစ်စဉ်ကြေး သွင်းပြီး ✓
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold shrink-0">
                                    နှစ်စဉ်ကြေး မသွင်းရသေး
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons on Mobile: Dedicated Bottom Row */}
                              <div className="flex sm:hidden items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                {categorizedPhones.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => togglePhoneDropdown(school.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                                    title="ဖုန်းခေါ်ဆိုရန် Dropdown စာရင်း ကြည့်ရန်"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>ဖုန်းခေါ်ရန် ({toBurmeseNumber(categorizedPhones.length)})</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openPhoneDropdowns[school.id] ? 'rotate-180' : ''}`} />
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">ဖုန်း မရှိပါ</span>
                                )}

                                <Link
                                  to={`/schools/${school.id}`}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition shrink-0 cursor-pointer"
                                  title="ကျောင်းအသေးစိတ် ကြည့်ရှုရန်"
                                >
                                  <span>အသေးစိတ်</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                                </Link>
                              </div>
                            </div>
                          </div>

                          {/* Categorized Phone Numbers Directory (Drop Down စနစ် - Over flow မဖြစ်အောင် ထိန်းချုပ်ထားသည်) */}
                          {openPhoneDropdowns[school.id] && (
                            <div className="pt-2.5 border-t border-slate-100/90 animate-in fade-in slide-in-from-top-1 duration-150">
                              {categorizedPhones.length > 0 ? (
                                <div className="p-3 bg-slate-50/90 rounded-2xl border border-emerald-200/90 space-y-2">
                                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 px-1">
                                    <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>ဖုန်းနံပါတ်များ (တန်းပြီး ခေါ်ဆိုနိုင်သော Dropdown စာရင်း)</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePhoneDropdown(school.id)}
                                      className="text-[11px] text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 cursor-pointer"
                                    >
                                      ခေါက်သိမ်းမည် ✕
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                                    {categorizedPhones.map((cp) => (
                                      <div
                                        key={cp.key}
                                        className="flex items-center justify-between gap-2.5 p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200 transition-colors shadow-2xs group/item"
                                      >
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span className="break-words font-extrabold text-emerald-950">{cp.fullLabel}</span>
                                          </div>
                                          {(cp.personName || cp.personRole) && (
                                            <div className="text-xs pl-3 font-semibold leading-relaxed break-words flex flex-wrap items-center gap-1.5">
                                              {cp.personName && (
                                                <span className="text-slate-900 font-bold bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200">
                                                  {cp.personName}
                                                </span>
                                              )}
                                              {cp.personRole && (
                                                <span className="text-sky-900 font-semibold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[11px]">
                                                  {cp.personRole}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <a
                                          href={`tel:${cp.cleanDial}`}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition shrink-0 cursor-pointer whitespace-nowrap"
                                          title={`တန်းပြီး ဖုန်းခေါ်မည် (${cp.fullLabel}: ${cp.number})`}
                                        >
                                          <Phone className="w-3.5 h-3.5 shrink-0" />
                                          <span className="font-mono tracking-tight text-xs">{cp.number}</span>
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">ဖုန်းနံပါတ် ထည့်သွင်းထားခြင်း မရှိသေးပါ</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          </div>
        </div>
      ) : (
        /* MODE B: FLAT LIST VIEW (Sorted) */
        <div className="space-y-3">
          {sortedSchools.map((s, idx) => {
            const cat = getSchoolCategory(s);
            const categorizedPhones = getCategorizedSchoolPhones(s);
            return (
              <div
                key={s.id}
                className="group bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-md transition flex flex-col gap-3"
              >
                {/* Top Row: Index + Emblem / Logo + Title & Badges + Actions */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Sequential Number badge */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-sky-100 group-hover:text-sky-900 transition mt-0.5">
                    {toBurmeseNumber(idx + 1)}
                  </div>

                  {/* Emblem / Logo */}
                  <Link
                    to={`/schools/${s.id}`}
                    className="shrink-0 cursor-pointer block mt-0.5"
                    title={`${s.name} အသေးစိတ် ကြည့်ရှုရန်`}
                  >
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 bg-white p-0.5 sm:p-1 hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-sky-900 text-white flex items-center justify-center group-hover:bg-sky-800 transition shadow-2xs">
                        <SchoolIcon className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                    )}
                  </Link>

                  {/* School Details & Actions (Full width) */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Top Name Row (Desktop shows actions on right, Mobile wraps cleanly) */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3">
                      {/* School Name: ALWAYS completely visible, break-words, never crushed */}
                      <Link
                        to={`/schools/${s.id}`}
                        className="block font-bold text-sm sm:text-lg text-sky-950 hover:text-sky-700 transition break-words leading-snug cursor-pointer"
                        title={`${s.name} အသေးစိတ် ကြည့်ရှုရန်`}
                      >
                        {s.name}
                      </Link>

                      {/* Action Buttons on Tablet/Desktop: Phone & Detail */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {categorizedPhones.length > 0 && (
                          <button
                            type="button"
                            onClick={() => togglePhoneDropdown(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition cursor-pointer"
                            title="ဖုန်းခေါ်ဆိုရန် Dropdown စာရင်း ကြည့်ရန်"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>ဖုန်းခေါ်ရန် ({toBurmeseNumber(categorizedPhones.length)})</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openPhoneDropdowns[s.id] ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        <Link
                          to={`/schools/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 hover:text-sky-950 px-2.5 py-1.5 rounded-xl hover:bg-sky-50 transition shrink-0 cursor-pointer"
                          title="ကျောင်းအသေးစိတ် ကြည့်ရှုရန်"
                        >
                          <span>အသေးစိတ်</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                        </Link>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {/* Category Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full border font-bold shrink-0 ${cat.color.badge}`}>
                        {cat.shortLabel}
                      </span>

                      {/* Level if distinct */}
                      {s.level && s.level !== cat.shortLabel && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium shrink-0">
                          {s.level}
                        </span>
                      )}

                      {/* Student Range */}
                      {s.studentRange && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100 font-medium shrink-0">
                          ကျောင်းသား: {s.studentRange} ဦး
                        </span>
                      )}

                      {/* Fee Badge */}
                      {s.isAnnualFeePaid ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shrink-0">
                          နှစ်စဉ်ကြေး သွင်းပြီး ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold shrink-0">
                          နှစ်စဉ်ကြေး မသွင်းရသေး
                        </span>
                      )}

                      {/* Location Badge */}
                      {(s.township || s.city || s.zone) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-100 font-semibold shrink-0">
                          <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>{[s.township || s.city, s.zone ? `(${s.zone})` : null].filter(Boolean).join(' ')}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons on Mobile: Dedicated Bottom Row */}
                    <div className="flex sm:hidden items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {categorizedPhones.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => togglePhoneDropdown(s.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                          title="ဖုန်းခေါ်ဆိုရန် Dropdown စာရင်း ကြည့်ရန်"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>ဖုန်းခေါ်ရန် ({toBurmeseNumber(categorizedPhones.length)})</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openPhoneDropdowns[s.id] ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">ဖုန်း မရှိပါ</span>
                      )}

                      <Link
                        to={`/schools/${s.id}`}
                        className="inline-flex items-center justify-center gap-1 text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition shrink-0 cursor-pointer"
                        title="ကျောင်းအသေးစိတ် ကြည့်ရှုရန်"
                      >
                        <span>အသေးစိတ်</span>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Categorized Phone Numbers Directory (Drop Down စနစ် - Over flow မဖြစ်အောင် ထိန်းချုပ်ထားသည်) */}
                {openPhoneDropdowns[s.id] && (
                  <div className="pt-2.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    {categorizedPhones.length > 0 ? (
                      <div className="p-3 bg-slate-50/90 rounded-2xl border border-emerald-200/90 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 px-1">
                          <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ဖုန်းနံပါတ်များ (တန်းပြီး ခေါ်ဆိုနိုင်သော Dropdown စာရင်း)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePhoneDropdown(s.id)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 cursor-pointer"
                          >
                            ခေါက်သိမ်းမည် ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                          {categorizedPhones.map((cp) => (
                            <div
                              key={cp.key}
                              className="flex items-center justify-between gap-2.5 p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200 transition-colors shadow-2xs group/item"
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span className="break-words font-extrabold text-emerald-950">{cp.fullLabel}</span>
                                </div>
                                {(cp.personName || cp.personRole) && (
                                  <div className="text-xs pl-3 font-semibold leading-relaxed break-words flex flex-wrap items-center gap-1.5">
                                    {cp.personName && (
                                      <span className="text-slate-900 font-bold bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200">
                                        {cp.personName}
                                      </span>
                                    )}
                                    {cp.personRole && (
                                      <span className="text-sky-900 font-semibold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[11px]">
                                        {cp.personRole}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <a
                                href={`tel:${cp.cleanDial}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition shrink-0 cursor-pointer whitespace-nowrap"
                                title={`တန်းပြီး ဖုန်းခေါ်မည် (${cp.fullLabel}: ${cp.number})`}
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-mono tracking-tight text-xs">{cp.number}</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">ဖုန်းနံပါတ် ထည့်သွင်းထားခြင်း မရှိသေးပါ</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
