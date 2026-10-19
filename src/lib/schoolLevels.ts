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
    bg: 'bg-slate-50/60', border: 'border-slate-200', headerGradient: 'from-slate-800 via-slate-900 to-slate-950 text-white',
    badge: 'bg-slate-100 text-slate-700 border-slate-200', tagBadge: 'bg-slate-100 text-slate-600 border-slate-200',
    text: 'text-slate-900', accent: 'text-slate-600', iconBg: 'bg-slate-100 text-slate-600', bar: 'bg-slate-500', barBg: 'bg-slate-200',
  },
  {
    bg: 'bg-sky-50/60', border: 'border-sky-100', headerGradient: 'from-sky-800 via-sky-900 to-sky-950 text-white',
    badge: 'bg-sky-50 text-sky-700 border-sky-100', tagBadge: 'bg-sky-50 text-sky-600 border-sky-100',
    text: 'text-sky-900', accent: 'text-sky-600', iconBg: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500', barBg: 'bg-sky-100',
  },
  {
    bg: 'bg-indigo-50/60', border: 'border-indigo-100', headerGradient: 'from-indigo-800 via-indigo-900 to-indigo-950 text-white',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', tagBadge: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    text: 'text-indigo-900', accent: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-500', barBg: 'bg-indigo-100',
  },
  {
    bg: 'bg-emerald-50/60', border: 'border-emerald-100', headerGradient: 'from-emerald-800 via-emerald-900 to-emerald-950 text-white',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', tagBadge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    text: 'text-emerald-900', accent: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', barBg: 'bg-emerald-100',
  },
];

export const OTHER_LEVEL_PALETTE: LevelColorPalette = {
  bg: 'bg-slate-50', border: 'border-slate-200', headerGradient: 'from-slate-700 to-slate-900 text-white',
  badge: 'bg-slate-100 text-slate-700 border-slate-200', tagBadge: 'bg-slate-100 text-slate-600 border-slate-200',
  text: 'text-slate-900', accent: 'text-slate-600', iconBg: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400', barBg: 'bg-slate-100',
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

  // Keep configured levels distinct; only deduplicate exact duplicate names
  const levelItems: {
    id: string;
    name: string;
    order: number;
    description: string;
  }[] = [];

  const seenExactNames = new Set<string>();

  for (const l of sortedConfigured) {
    const rawName = l.name.trim();
    if (!rawName) continue;
    const lowerKey = rawName.toLowerCase();

    if (!seenExactNames.has(lowerKey)) {
      seenExactNames.add(lowerKey);
      levelItems.push({
        id: l.id || `lvl-${levelItems.length + 1}`,
        name: rawName,
        order: l.order ?? levelItems.length + 1,
        description: l.description?.trim() || `${rawName} အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ`,
      });
    }
  }

  // 2. Discover any additional distinct levels from schools that aren't yet in levelItems
  schools.forEach((s) => {
    const raw = (s.level || s.category || '').trim();
    if (!raw) return;
    const lowerKey = raw.toLowerCase();

    // Check if this school level doesn't match any configured level (even via prefix)
    const matchesConfigured = levelItems.some(
      (item) => item.name.toLowerCase() === lowerKey || isSchoolInLevel(s, item.name)
    );

    if (!matchesConfigured && !seenExactNames.has(lowerKey)) {
      seenExactNames.add(lowerKey);
      levelItems.push({
        id: `discovered-${raw.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: raw,
        order: levelItems.length + 1,
        description: `${raw} အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ`,
      });
    }
  });

  // Track schools that are matched into configured levels (each school belongs to ONLY ONE level)
  const matchedSchoolIds = new Set<string>();
  const levelSchoolMap = new Map<string, School[]>();
  levelItems.forEach((item) => levelSchoolMap.set(item.id, []));

  // Pass 1: Exact matches first! (Priority)
  schools.forEach((s) => {
    const sLvl = (s.level || s.category || '').trim().toLowerCase();
    if (!sLvl) return;
    const exactMatch = levelItems.find((item) => item.name.trim().toLowerCase() === sLvl);
    if (exactMatch) {
      levelSchoolMap.get(exactMatch.id)!.push(s);
      matchedSchoolIds.add(s.id);
    }
  });

  // Pass 2: Fallback prefix matching for remaining unmatched schools
  schools.forEach((s) => {
    if (matchedSchoolIds.has(s.id)) return;
    const sLvl = (s.level || s.category || '').trim();
    if (!sLvl) return;
    const fuzzyMatch = levelItems.find((item) => isSchoolInLevel(s, item.name));
    if (fuzzyMatch) {
      levelSchoolMap.get(fuzzyMatch.id)!.push(s);
      matchedSchoolIds.add(s.id);
    }
  });

  const results: UnifiedSchoolLevel[] = [];

  levelItems.forEach((item, idx) => {
    const matchingSchools = levelSchoolMap.get(item.id) || [];
    const total = matchingSchools.length;
    const paid = matchingSchools.filter((s) => !!s.isAnnualFeePaid).length;
    const unpaid = total - paid;
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    const color = LEVEL_COLOR_PALETTES[idx % LEVEL_COLOR_PALETTES.length];

    results.push({
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
    });
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
      name: 'အဆင့် သတ်မှတ်ရန်လို',
      shortLabel: 'အဆင့် သတ်မှတ်ရန်လို',
      title: 'အဆင့် သတ်မှတ်ရန်လိုသော ကျောင်းများ (အခြား / မသတ်မှတ်ရသေး)',
      order: 9999,
      description: 'ကျောင်းအဆင့် သတ်မှတ်ချက် မထည့်သွင်းရသေးသော သို့မဟုတ် သက်ဆိုင်ရာ Category ဖျက်လိုက်သော အသင်းဝင် ကိုယ်ပိုင်ကျောင်းများ',
      color: OTHER_LEVEL_PALETTE,
      total,
      paid,
      unpaid,
      pct,
      schools: unmatchedSchools,
      isUnassigned: true,
    });
  }

  // Filter out duplicate or empty discovered level entries
  return results.filter((r) => r.total > 0 || !r.id.startsWith('discovered-'));
};
