import { School, SchoolLevelItem } from '../types';

export interface LevelColorPalette {
  bg: string;
  border: string;
  headerGradient: string;
  badge: string;
  tagBadge: string;
  text: string;
  accent: string;
  iconBg: string;
  bar: string;
  barBg: string;
}

export const LEVEL_COLOR_PALETTES: LevelColorPalette[] = [
  {
    bg: 'bg-sky-50/60',
    border: 'border-sky-200',
    headerGradient: 'from-sky-900 via-sky-850 to-sky-800 text-white',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    tagBadge: 'bg-sky-50 text-sky-700 border-sky-200',
    text: 'text-sky-950',
    accent: 'text-sky-600',
    iconBg: 'bg-sky-100 text-sky-700',
    bar: 'bg-sky-500',
    barBg: 'bg-sky-100',
  },
  {
    bg: 'bg-emerald-50/60',
    border: 'border-emerald-200',
    headerGradient: 'from-emerald-900 via-emerald-850 to-emerald-800 text-white',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tagBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-950',
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
    barBg: 'bg-emerald-100',
  },
  {
    bg: 'bg-teal-50/60',
    border: 'border-teal-200',
    headerGradient: 'from-teal-900 via-teal-850 to-teal-800 text-white',
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    tagBadge: 'bg-teal-50 text-teal-700 border-teal-200',
    text: 'text-teal-950',
    accent: 'text-teal-600',
    iconBg: 'bg-teal-100 text-teal-700',
    bar: 'bg-teal-500',
    barBg: 'bg-teal-100',
  },
  {
    bg: 'bg-indigo-50/60',
    border: 'border-indigo-200',
    headerGradient: 'from-indigo-900 via-indigo-850 to-indigo-800 text-white',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    tagBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    text: 'text-indigo-950',
    accent: 'text-indigo-600',
    iconBg: 'bg-indigo-100 text-indigo-700',
    bar: 'bg-indigo-500',
    barBg: 'bg-indigo-100',
  },
  {
    bg: 'bg-purple-50/60',
    border: 'border-purple-200',
    headerGradient: 'from-purple-900 via-purple-850 to-purple-800 text-white',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    tagBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-950',
    accent: 'text-purple-600',
    iconBg: 'bg-purple-100 text-purple-700',
    bar: 'bg-purple-500',
    barBg: 'bg-purple-100',
  },
  {
    bg: 'bg-amber-50/60',
    border: 'border-amber-200',
    headerGradient: 'from-amber-900 via-amber-850 to-amber-800 text-white',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    tagBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    text: 'text-amber-950',
    accent: 'text-amber-600',
    iconBg: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
    barBg: 'bg-amber-100',
  },
  {
    bg: 'bg-cyan-50/60',
    border: 'border-cyan-200',
    headerGradient: 'from-cyan-900 via-cyan-850 to-cyan-800 text-white',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    tagBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    text: 'text-cyan-950',
    accent: 'text-cyan-600',
    iconBg: 'bg-cyan-100 text-cyan-700',
    bar: 'bg-cyan-500',
    barBg: 'bg-cyan-100',
  },
  {
    bg: 'bg-blue-50/60',
    border: 'border-blue-200',
    headerGradient: 'from-blue-900 via-blue-850 to-blue-800 text-white',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    tagBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-950',
    accent: 'text-blue-600',
    iconBg: 'bg-blue-100 text-blue-700',
    bar: 'bg-blue-500',
    barBg: 'bg-blue-100',
  },
  {
    bg: 'bg-violet-50/60',
    border: 'border-violet-200',
    headerGradient: 'from-violet-900 via-violet-850 to-violet-800 text-white',
    badge: 'bg-violet-100 text-violet-800 border-violet-300',
    tagBadge: 'bg-violet-50 text-violet-700 border-violet-200',
    text: 'text-violet-950',
    accent: 'text-violet-600',
    iconBg: 'bg-violet-100 text-violet-700',
    bar: 'bg-violet-500',
    barBg: 'bg-violet-100',
  },
  {
    bg: 'bg-rose-50/60',
    border: 'border-rose-200',
    headerGradient: 'from-rose-900 via-rose-850 to-rose-800 text-white',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    tagBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-950',
    accent: 'text-rose-600',
    iconBg: 'bg-rose-100 text-rose-700',
    bar: 'bg-rose-500',
    barBg: 'bg-rose-100',
  },
];

export const OTHER_LEVEL_PALETTE: LevelColorPalette = {
  bg: 'bg-slate-50/70',
  border: 'border-slate-200',
  headerGradient: 'from-slate-900 via-slate-850 to-slate-800 text-white',
  badge: 'bg-slate-100 text-slate-800 border-slate-300',
  tagBadge: 'bg-slate-100 text-slate-700 border-slate-200',
  text: 'text-slate-950',
  accent: 'text-slate-600',
  iconBg: 'bg-slate-100 text-slate-700',
  bar: 'bg-slate-500',
  barBg: 'bg-slate-100',
};

/**
 * Normalizes level string for fuzzy/robust matching.
 * Strips leading numbering like "၁။ ", "1. ", etc.
 */
export const stripLevelPrefix = (val: string): string => {
  return val
    .trim()
    .replace(/^[၀-၉0-9]+[။\.\s\-–_]+/g, '')
    .trim()
    .toLowerCase();
};

/**
 * Checks if a school's level matches a target level item.
 */
export const isSchoolInLevel = (school: School, targetLevelName: string): boolean => {
  const schoolLvl = (school.level || school.category || '').trim();
  const targetLvl = targetLevelName.trim();

  if (!schoolLvl && !targetLvl) return true;
  if (!schoolLvl || !targetLvl) return false;

  // 1. Exact match (case insensitive)
  if (schoolLvl.toLowerCase() === targetLvl.toLowerCase()) {
    return true;
  }

  // 2. Stripped prefix comparison (e.g. "၁။ အထက်တန်း" vs "အထက်တန်း")
  const strippedSchool = stripLevelPrefix(schoolLvl);
  const strippedTarget = stripLevelPrefix(targetLvl);
  if (strippedSchool && strippedTarget && strippedSchool === strippedTarget) {
    return true;
  }

  return false;
};

export interface UnifiedSchoolLevel {
  id: string;
  name: string;
  shortLabel: string;
  title: string;
  order: number;
  description: string;
  color: LevelColorPalette;
  total: number;
  paid: number;
  unpaid: number;
  pct: number;
  schools: School[];
  isUnassigned?: boolean;
}

/**
 * Derives a unified, sorted list of school levels combining:
 * 1. Admin-configured school levels (`school_levels` collection)
 * 2. Any additional distinct levels present in the `schools` data
 * 3. An "အခြား / အဆင့် မသတ်မှတ်ရသေး" bucket for schools without a matched level (if any exist)
 */
export const getUnifiedSchoolLevels = (
  configuredLevels: SchoolLevelItem[] = [],
  schools: School[] = []
): UnifiedSchoolLevel[] => {
  // 1. Build list of primary level items from configuredLevels
  const sortedConfigured = [...configuredLevels].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const levelItems: {
    id: string;
    name: string;
    order: number;
    description: string;
  }[] = sortedConfigured.map((l, idx) => ({
    id: l.id || `lvl-${idx + 1}`,
    name: l.name.trim(),
    order: l.order ?? idx + 1,
    description: l.description?.trim() || `${l.name} အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ`,
  }));

  // 2. Discover any additional distinct levels from schools that aren't yet in configuredLevels
  schools.forEach((s) => {
    const raw = (s.level || '').trim();
    if (raw && !levelItems.some((item) => isSchoolInLevel(s, item.name))) {
      levelItems.push({
        id: `discovered-${raw.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: raw,
        order: levelItems.length + 1,
        description: `${raw} အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ`,
      });
    }
  });

  // Track schools that are matched into configured levels
  const matchedSchoolIds = new Set<string>();

  const results: UnifiedSchoolLevel[] = levelItems.map((item, idx) => {
    const matchingSchools = schools.filter((s) => isSchoolInLevel(s, item.name));
    matchingSchools.forEach((s) => matchedSchoolIds.add(s.id));

    const total = matchingSchools.length;
    const paid = matchingSchools.filter((s) => !!s.isAnnualFeePaid).length;
    const unpaid = total - paid;
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    const color = LEVEL_COLOR_PALETTES[idx % LEVEL_COLOR_PALETTES.length];

    return {
      id: item.id,
      name: item.name,
      shortLabel: item.name,
      title: `${item.name} အဆင့် ကျောင်းများ`,
      order: item.order,
      description: item.description,
      color,
      total,
      paid,
      unpaid,
      pct,
      schools: matchingSchools,
    };
  });

  // 3. Find any schools that didn't match any level (e.g. empty level or undefined)
  const unmatchedSchools = schools.filter((s) => !matchedSchoolIds.has(s.id));
  if (unmatchedSchools.length > 0) {
    const total = unmatchedSchools.length;
    const paid = unmatchedSchools.filter((s) => !!s.isAnnualFeePaid).length;
    const unpaid = total - paid;
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

    results.push({
      id: 'unassigned-level',
      name: 'အခြား / အဆင့် မသတ်မှတ်ရသေး',
      shortLabel: 'အဆင့် မသတ်မှတ်ရသေး',
      title: 'အခြား / အဆင့် မသတ်မှတ်ရသေးသော ကျောင်းများ',
      order: 9999,
      description: 'ကျောင်းအဆင့် သတ်မှတ်ချက် မထည့်သွင်းရသေးသော အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ',
      color: OTHER_LEVEL_PALETTE,
      total,
      paid,
      unpaid,
      pct,
      schools: unmatchedSchools,
      isUnassigned: true,
    });
  }

  return results;
};
