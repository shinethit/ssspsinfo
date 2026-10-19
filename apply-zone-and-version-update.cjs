// apply-zone-and-version-update.cjs
const fs = require('fs');
const path = require('path');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('✅ Wrote: ' + p); }

function replaceOnce(content, search, replace, label) {
  const parts = content.split(search);
  if (parts.length === 1) {
    throw new Error('❌ Pattern NOT FOUND [' + label + ']:\n' + search.substring(0, 120).replace(/\n/g, '\\n'));
  }
  if (parts.length > 2) {
    throw new Error('⚠️ Pattern found ' + (parts.length - 1) + ' times [' + label + '] — needs unique match');
  }
  return parts.join(replace);
}

console.log('\n🚀 Starting Zone + Version Update (v14.1)...\n');

// ============================================================
// 1) src/constants.ts — Full rewrite with STANDARD_ZONES + v14.1
// ============================================================
const constantsPath = path.join(__dirname, 'src/constants.ts');
const newConstants = `export const CURRENT_VERSION = 'v14.1';
export const APP_NAME = 'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း';

/**
 * ရှမ်းပြည်နယ် (တောင်ပိုင်း) ၏ စံသတ်မှတ်ထားသော ဇုန်များ
 * (တောင်ကြီး၊ ကလော၊ လွိုင်လင်/နမ့်စန်)
 */
export const STANDARD_ZONES = [
  'တောင်ကြီးဇုန်',
  'ကလောဇုန်',
  'လွိုင်လင်/နမ့်စန်ဇုန်',
] as const;

export type StandardZone = (typeof STANDARD_ZONES)[number];

/**
 * ဇုန်အလိုက် စစ်ထုတ်ရာတွင် အသုံးပြုသော Filter Options
 * (Home၊ Admin၊ Contacts စသည့် နေရာအားလုံးတွင် တူညီစွာ သုံးနိုင်သည်)
 */
export const ZONE_FILTER_OPTIONS = [
  { value: 'all', label: 'အားလုံး', shortLabel: 'အားလုံး' },
  { value: 'တောင်ကြီးဇုန်', label: 'တောင်ကြီးဇုန်', shortLabel: 'တောင်ကြီး' },
  { value: 'ကလောဇုန်', label: 'ကလောဇုန်', shortLabel: 'ကလော' },
  { value: 'လွိုင်လင်/နမ့်စန်ဇုန်', label: 'လွိုင်လင်/နမ့်စန်ဇုန်', shortLabel: 'လွိုင်လင်/နမ့်စန်' },
  { value: 'အခြား', label: 'အခြား (Other Zones)', shortLabel: 'အခြား' },
] as const;

export type ZoneFilterValue = (typeof ZONE_FILTER_OPTIONS)[number]['value'];

/**
 * ကျောင်းတစ်ခုသည် ပေးထားသော ဇုန်စစ်ထုတ်မှုနှင့် ကိုက်ညီမှုရှိ/မရှိ စစ်ဆေးခြင်း
 */
export function isSchoolInZone(
  schoolZone: string | undefined | null,
  filterZone: string | undefined | null
): boolean {
  if (!filterZone || filterZone === 'all') return true;
  if (filterZone === 'အခြား') {
    if (!schoolZone) return true;
    return !(STANDARD_ZONES as readonly string[]).includes(schoolZone);
  }
  return schoolZone === filterZone;
}

/**
 * ကျောင်း List မှ ဇုန်တစ်ခုချင်းစီအတွက် အရေအတွက် တွက်ချက်ခြင်း
 * (Home၊ Admin တို့တွင် ပြန်လည်အသုံးပြုနိုင်သည်)
 */
export function countSchoolsByZone(
  schools: Array<{ zone?: string }>
): Record<string, number> {
  const counts: Record<string, number> = { all: schools.length };
  ZONE_FILTER_OPTIONS.forEach(opt => {
    if (opt.value === 'all') return;
    counts[opt.value] = schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;
  });
  return counts;
}
`;
write(constantsPath, newConstants);

// ============================================================
// 2) vite.config.ts — Add skipWaiting + clientsClaim (PWA autoUpdate reinforcement)
// ============================================================
const vitePath = path.join(__dirname, 'vite.config.ts');
let viteContent = read(vitePath);
viteContent = replaceOnce(
  viteContent,
  `        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB`,
  `        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB`,
  'vite.config.ts: workbox skipWaiting'
);
write(vitePath, viteContent);

// ============================================================
// 3) src/pages/Home.tsx — Use ZONE_FILTER_OPTIONS, zone counts, zone-aware search, zone summary
// ============================================================
const homePath = path.join(__dirname, 'src/pages/Home.tsx');
let homeContent = read(homePath);

// 3a. Add MapPin to lucide-react import
homeContent = replaceOnce(
  homeContent,
  `  GraduationCap,\n  FileText,\n} from 'lucide-react';`,
  `  GraduationCap,\n  FileText,\n  MapPin,\n} from 'lucide-react';`,
  'Home.tsx: add MapPin import'
);

// 3b. Add constants import
homeContent = replaceOnce(
  homeContent,
  `import { getUnifiedSchoolLevels } from '../lib/schoolLevels';`,
  `import { getUnifiedSchoolLevels } from '../lib/schoolLevels';\nimport { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../constants';`,
  'Home.tsx: add constants import'
);

// 3c. Make filteredSchoolsByZone use helper + add zoneCounts memo
homeContent = replaceOnce(
  homeContent,
  `  const filteredSchoolsByZone = useMemo(() => {\n    if (selectedZone === 'all') return schools;\n    if (selectedZone === 'အခြား') {\n      return schools.filter(s => !s.zone || !['တောင်ကြီးဇုန်', 'ကလောဇုန်', 'လွိုင်လင်/နမ့်စန်ဇုန်'].includes(s.zone));\n    }\n    return schools.filter(s => s.zone === selectedZone);\n  }, [schools, selectedZone]);`,
  `  const filteredSchoolsByZone = useMemo(() => {\n    return schools.filter(s => isSchoolInZone(s.zone, selectedZone));\n  }, [schools, selectedZone]);\n\n  const zoneCounts = useMemo(() => {\n    const counts: Record<string, number> = { all: schools.length };\n    ZONE_FILTER_OPTIONS.forEach(opt => {\n      if (opt.value !== 'all') {\n        counts[opt.value] = schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;\n      }\n    });\n    return counts;\n  }, [schools]);`,
  'Home.tsx: replace filteredSchoolsByZone'
);

// 3d. Make quick search zone-aware + include zone field in search
homeContent = replaceOnce(
  homeContent,
  `  const filteredQuickSchools = useMemo(() => {\n    if (!quickSearch.trim()) return [];\n    const q = quickSearch.trim().toLowerCase();\n    return schools\n      .filter(s =>\n        (s.name && s.name.toLowerCase().includes(q)) ||`,
  `  const filteredQuickSchools = useMemo(() => {\n    if (!quickSearch.trim()) return [];\n    const q = quickSearch.trim().toLowerCase();\n    return schools\n      .filter(s => isSchoolInZone(s.zone, selectedZone))\n      .filter(s =>\n        (s.name && s.name.toLowerCase().includes(q)) ||\n        (s.zone && s.zone.toLowerCase().includes(q)) ||`,
  'Home.tsx: quick search zone-aware'
);

// 3e. Update quick-search results dependency array
homeContent = replaceOnce(
  homeContent,
  `  }, [schools, quickSearch]);`,
  `  }, [schools, quickSearch, selectedZone]);`,
  'Home.tsx: quick search deps'
);

// 3f. Update placeholder to mention zone
homeContent = replaceOnce(
  homeContent,
  `                placeholder="ကျောင်းအမည်၊ တာဝန်ခံ သို့မဟုတ် အဆင့်ဖြင့် ရှာဖွေပါ..."`,
  `                placeholder="ကျောင်းအမည်၊ တာဝန်ခံ၊ ဇုန် သို့မဟုတ် အဆင့်ဖြင့် ရှာဖွေပါ..."`,
  'Home.tsx: quick search placeholder'
);

// 3g. Replace zone tabs (add counts + summary card)
homeContent = replaceOnce(
  homeContent,
  `        {/* Zone Tabs */}\n        <div className="flex overflow-x-auto gap-1 pb-1">\n          {['all', 'တောင်ကြီးဇုန်', 'ကလောဇုန်', 'လွိုင်လင်/နမ့်စန်ဇုန်', 'အခြား'].map(zone => (\n            <button\n              key={zone}\n              onClick={() => setSelectedZone(zone)}\n              className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition \${\n                selectedZone === zone\n                  ? 'bg-sky-900 text-white shadow-sm'\n                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'\n              }\`}\n            >\n              {zone === 'all' ? 'အားလုံး' : zone}\n            </button>\n          ))}\n        </div>`,
  `        {/* Zone Tabs (with live counts) */}\n        <div className="flex overflow-x-auto gap-1 pb-1">\n          {ZONE_FILTER_OPTIONS.map(opt => (\n            <button\n              key={opt.value}\n              onClick={() => setSelectedZone(opt.value)}\n              className={\`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition flex items-center gap-1.5 \${\n                selectedZone === opt.value\n                  ? 'bg-sky-900 text-white shadow-sm'\n                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'\n              }\`}\n            >\n              <span>{opt.label}</span>\n              <span className={\`text-[9px] px-1.5 py-0.2 rounded-full font-bold \${\n                selectedZone === opt.value\n                  ? 'bg-sky-700 text-sky-100'\n                  : 'bg-white text-slate-500 border border-slate-200'\n              }\`}>\n                {zoneCounts[opt.value] ?? 0}\n              </span>\n            </button>\n          ))}\n        </div>\n\n        {/* Selected Zone Summary */}\n        {selectedZone !== 'all' && (\n          <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 flex items-center justify-between flex-wrap gap-2 text-[11px]">\n            <div className="flex items-center gap-1.5">\n              <MapPin className="w-3 h-3 text-sky-600" />\n              <span className="font-bold text-sky-900">{selectedZone}</span>\n              <span className="text-slate-400">|</span>\n              <span className="text-slate-700">စုစုပေါင်း <strong className="text-sky-900">{filteredSchoolsByZone.length}</strong> ကျောင်း</span>\n            </div>\n            <div className="flex items-center gap-2 text-[10px]">\n              <span className="text-emerald-700 font-bold">\n                ✓ Active: {filteredSchoolsByZone.filter(s => (s.status || 'active') === 'active').length}\n              </span>\n              <span className="text-slate-400">|</span>\n              <Link\n                to={\`/contacts?zone=\${encodeURIComponent(selectedZone)}\`}\n                className="text-sky-700 font-bold hover:underline"\n              >\n                စာရင်းကြည့်ရန် &rarr;\n              </Link>\n            </div>\n          </div>\n        )}`,
  'Home.tsx: zone tabs + summary'
);

write(homePath, homeContent);

// ============================================================
// 4) src/pages/Admin.tsx — Add zone filter, state, UI, zone-aware counts + AdminSchoolManager
// ============================================================
const adminPath = path.join(__dirname, 'src/pages/Admin.tsx');
let adminContent = read(adminPath);

// 4a. Import zones from constants
adminContent = replaceOnce(
  adminContent,
  `import { isSchoolInLevel, getUnifiedSchoolLevels } from '../lib/schoolLevels';`,
  `import { isSchoolInLevel, getUnifiedSchoolLevels } from '../lib/schoolLevels';\nimport { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../constants';`,
  'Admin.tsx: constants import'
);

// 4b. Add adminZoneFilter state
adminContent = replaceOnce(
  adminContent,
  `  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');`,
  `  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');\n  const [adminZoneFilter, setAdminZoneFilter] = useState<string>('all');`,
  'Admin.tsx: adminZoneFilter state'
);

// 4c. Replace summary calculations with zone-aware versions + add schoolsForZone memo
adminContent = replaceOnce(
  adminContent,
  `  // Dashboard & School Summary Calculations\n  const totalSchoolsCount = schools.length;\n  const activeSchoolsCount = useMemo(() => schools.filter(s => (s.status || 'active') === 'active').length, [schools]);\n  const underReviewSchoolsCount = useMemo(() => schools.filter(s => s.status === 'under_review').length, [schools]);\n  const inactiveSchoolsCount = useMemo(() => schools.filter(s => s.status === 'inactive').length, [schools]);\n  const feePaidCount = useMemo(() => schools.filter(s => s.isAnnualFeePaid === true).length, [schools]);\n  const feeUnpaidCount = totalSchoolsCount - feePaidCount;`,
  `  // Zone-filtered schools (used for summary cards + AdminSchoolManager)\n  const schoolsForZone = useMemo(() => {\n    if (adminZoneFilter === 'all') return schools;\n    return schools.filter(s => isSchoolInZone(s.zone, adminZoneFilter));\n  }, [schools, adminZoneFilter]);\n\n  // Dashboard & School Summary Calculations (Zone-Aware)\n  const totalSchoolsCount = schoolsForZone.length;\n  const activeSchoolsCount = useMemo(() => schoolsForZone.filter(s => (s.status || 'active') === 'active').length, [schoolsForZone]);\n  const underReviewSchoolsCount = useMemo(() => schoolsForZone.filter(s => s.status === 'under_review').length, [schoolsForZone]);\n  const inactiveSchoolsCount = useMemo(() => schoolsForZone.filter(s => s.status === 'inactive').length, [schoolsForZone]);\n  const feePaidCount = useMemo(() => schoolsForZone.filter(s => s.isAnnualFeePaid === true).length, [schoolsForZone]);\n  const feeUnpaidCount = totalSchoolsCount - feePaidCount;`,
  'Admin.tsx: zone-aware summary counts'
);

// 4d. Update filteredAdminSchools to use schoolsForZone
adminContent = replaceOnce(
  adminContent,
  `  const filteredAdminSchools = useMemo(() => {\n    const q = adminSchoolSearch.trim().toLowerCase();\n    return schools.filter(s => {\n      const matchesSearch =\n        !q ||\n        (s.name && s.name.toLowerCase().includes(q)) ||\n        (s.level && s.level.toLowerCase().includes(q)) ||\n        (s.founderName && s.founderName.toLowerCase().includes(q)) ||\n        (s.adminName && s.adminName.toLowerCase().includes(q));`,
  `  const filteredAdminSchools = useMemo(() => {\n    const q = adminSchoolSearch.trim().toLowerCase();\n    return schoolsForZone.filter(s => {\n      const matchesSearch =\n        !q ||\n        (s.name && s.name.toLowerCase().includes(q)) ||\n        (s.level && s.level.toLowerCase().includes(q)) ||\n        (s.founderName && s.founderName.toLowerCase().includes(q)) ||\n        (s.adminName && s.adminName.toLowerCase().includes(q));`,
  'Admin.tsx: filteredAdminSchools zone-aware'
);

// 4e. Update filteredAdminSchools dependency array
adminContent = replaceOnce(
  adminContent,
  `  }, [schools, adminSchoolSearch, adminFeeFilter, adminStatusFilter]);`,
  `  }, [schoolsForZone, adminSchoolSearch, adminFeeFilter, adminStatusFilter]);`,
  'Admin.tsx: filteredAdminSchools deps'
);

// 4f. Insert zone filter UI above summary cards
adminContent = replaceOnce(
  adminContent,
  `      {/* Summary Stat Cards for Quick Overview */}\n      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">`,
  `      {/* Zone Filter Bar (Global — affects summary cards + schools manager) */}\n      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">\n        <div className="flex items-center justify-between gap-2 flex-wrap">\n          <div className="flex items-center gap-2">\n            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">\n              <MapPin className="w-3.5 h-3.5" />\n            </div>\n            <div>\n              <h4 className="font-bold text-xs sm:text-sm text-sky-950">ဇုန်အလိုက် စစ်ထုတ်ခြင်း (Zone Filter)</h4>\n              <p className="text-[10px] text-slate-500">ရွေးချယ်ထားသော ဇုန်သည် ကျောင်းစာရင်း၊ စာရင်းအင်းနှင့် ငွေစာရင်းများတွင် သက်ရောက်ပါမည်</p>\n            </div>\n          </div>\n          {adminZoneFilter !== 'all' && (\n            <button\n              type="button"\n              onClick={() => setAdminZoneFilter('all')}\n              className="text-[10px] font-semibold text-sky-700 hover:underline cursor-pointer px-2 py-1 bg-sky-50 rounded-lg border border-sky-200"\n            >\n              ✕ ဖယ်ရှားမည် (Reset)\n            </button>\n          )}\n        </div>\n        <div className="flex flex-wrap gap-1.5">\n          {ZONE_FILTER_OPTIONS.map(opt => {\n            const count = opt.value === 'all'\n              ? schools.length\n              : schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;\n            return (\n              <button\n                key={opt.value}\n                type="button"\n                onClick={() => setAdminZoneFilter(opt.value)}\n                className={\`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer \${\n                  adminZoneFilter === opt.value\n                    ? 'bg-sky-900 text-white border-sky-900 shadow-sm'\n                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'\n                }\`}\n              >\n                <span>{opt.label}</span>\n                <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center \${\n                  adminZoneFilter === opt.value\n                    ? 'bg-sky-700 text-sky-100'\n                    : 'bg-white text-slate-500 border border-slate-200'\n                }\`}>\n                  {count}\n                </span>\n              </button>\n            );\n          })}\n        </div>\n      </div>\n\n      {/* Summary Stat Cards for Quick Overview */}\n      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">`,
  'Admin.tsx: zone filter UI'
);

// 4g. Filter schools passed to AdminSchoolManager + export Excel by zone
adminContent = replaceOnce(
  adminContent,
  `        <AdminSchoolManager\n          schools={schools}\n          schoolLevels={schoolLevels}`,
  `        <AdminSchoolManager\n          schools={schoolsForZone}\n          schoolLevels={schoolLevels}`,
  'Admin.tsx: AdminSchoolManager schools prop'
);

adminContent = replaceOnce(
  adminContent,
  `          onExportExcel={() => exportSchoolsToExcel(schools)}`,
  `          onExportExcel={() => exportSchoolsToExcel(schoolsForZone)}`,
  'Admin.tsx: onExportExcel zone-aware'
);

write(adminPath, adminContent);

console.log('\n============================================');
console.log('✅ DONE — All changes applied successfully.');
console.log('============================================');
console.log('\n📋 Changes Summary:');
console.log('  • constants.ts    → v14.1 + STANDARD_ZONES + ZONE_FILTER_OPTIONS + isSchoolInZone + countSchoolsByZone');
console.log('  • vite.config.ts  → workbox skipWaiting + clientsClaim (reinforce PWA autoUpdate)');
console.log('  • Home.tsx        → Zone tabs with counts + Zone summary card + zone-aware quick search');
console.log('  • Admin.tsx       → Zone filter bar (global) + zone-aware summary cards + filtered AdminSchoolManager');
console.log('  • Layout.tsx      → No change needed (already uses CURRENT_VERSION)');
console.log('\n➡️  Next steps:');
console.log('  1) npx tsc --noEmit');
console.log('  2) git add . && git commit -m "feat(v14.1): global zone filters in Home + Admin, PWA autoUpdate hardening"');
console.log('  3) git push');
console.log('  4) Remove-Item apply-zone-and-version-update.cjs\n');