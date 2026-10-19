const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Tech Lead Update: ဇုန်ဒေတာများ အပြည့်အစုံ ချိတ်ဆက်နေပါသည် (Data Flow Fix)...");

const srcDir = path.join(__dirname, 'src');
const dataDir = path.join(srcDir, 'data');
const adminDir = path.join(srcDir, 'components', 'admin');
const libDir = path.join(srcDir, 'lib');

// ==========================================
// 1. Create zones.ts (Standardize Zones)
// ==========================================
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const zonesPath = path.join(dataDir, 'zones.ts');
const zonesContent = `export const DEFAULT_ZONES = [
  'တောင်ကြီးဇုန်',
  'ကလောဇုန်',
  'လွိုင်လင်/နမ့်စန်ဇုန်',
  'အခြား'
];
`;
fs.writeFileSync(zonesPath, zonesContent, 'utf8');
console.log("✅ src/data/zones.ts ဖန်တီးပြီးပါပြီ");

// ==========================================
// 2. Update SchoolForm.tsx (Zone Dropdown)
// ==========================================
const schoolFormPath = path.join(adminDir, 'SchoolForm.tsx');
if (fs.existsSync(schoolFormPath)) {
  let content = fs.readFileSync(schoolFormPath, 'utf8');

  // Add Import
  if (!content.includes('DEFAULT_ZONES')) {
    content = content.replace(
      "import { STUDENT_RANGE_TIERS, getStudentRangeTier } from '../../types';",
      "import { STUDENT_RANGE_TIERS, getStudentRangeTier } from '../../types';\nimport { DEFAULT_ZONES } from '../../data/zones';"
    );
  }

  // Replace Zone Input with Select
  const zoneInputRegex = /<input \{\.\.\.schoolForm\.register\('zone'\)\} placeholder="ဇုန်" className="w-full p-2\.5 border rounded-lg text-sm bg-white" \/>/;
  const zoneSelect = `<select {...schoolForm.register('zone')} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                    <option value="">- ဇုန် ရွေးပါ -</option>
                    {DEFAULT_ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>`;

  content = content.replace(zoneInputRegex, zoneSelect);
  fs.writeFileSync(schoolFormPath, content, 'utf8');
  console.log("✅ SchoolForm.tsx တွင် ဇုန် Dropdown ထည့်ပြီးပါပြီ");
}

// ==========================================
// 3. Update AdminSchoolManager.tsx (Zone Filter)
// ==========================================
const adminManagerPath = path.join(adminDir, 'AdminSchoolManager.tsx');
if (fs.existsSync(adminManagerPath)) {
  let content = fs.readFileSync(adminManagerPath, 'utf8');

  // Add Import
  if (!content.includes('DEFAULT_ZONES')) {
    content = content.replace(
      "import { getUnifiedSchoolLevels } from '../../lib/schoolLevels';",
      "import { getUnifiedSchoolLevels } from '../../lib/schoolLevels';\nimport { DEFAULT_ZONES } from '../../data/zones';"
    );
  }

  // Add Zone Filter State
  if (!content.includes('const [zoneFilter')) {
    content = content.replace(
      "const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');",
      "const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');\n  const [zoneFilter, setZoneFilter] = useState<string>('all');"
    );
  }

  // Update Filter Logic
  const filterRegex = /const matchStatus = statusFilter === 'all' \|\| \(s\.status \|\| 'active'\) === statusFilter;/;
  const newFilterLogic = `const matchStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;
      const matchZone = zoneFilter === 'all' || s.zone === zoneFilter;`;
  
  if (content.match(filterRegex)) {
    content = content.replace(filterRegex, newFilterLogic);
    content = content.replace(
      "return matchSearch && matchStatus;",
      "return matchSearch && matchStatus && matchZone;"
    );
    content = content.replace(
      "}, [schools, searchQuery, statusFilter]);",
      "}, [schools, searchQuery, statusFilter, zoneFilter]);"
    );
  }

  // Add Zone Filter Dropdown in UI
  const statusFilterRegex = /<select value=\{statusFilter\}[\s\S]*?<\/select>/;
  const zoneDropdown = `<select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none">
          <option value="all">ဇုန် အားလုံး</option>
          {DEFAULT_ZONES.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        $&`;

  content = content.replace(statusFilterRegex, zoneDropdown);

  fs.writeFileSync(adminManagerPath, content, 'utf8');
  console.log("✅ AdminSchoolManager.tsx တွင် ဇုန် Filter ထည့်ပြီးပါပြီ");
}

// ==========================================
// 4. Update excel.ts (Zone Template & Import)
// ==========================================
const excelPath = path.join(libDir, 'excel.ts');
if (fs.existsSync(excelPath)) {
  let content = fs.readFileSync(excelPath, 'utf8');

  // Ensure Template shows the correct Zone example
  content = content.replace(
    "'ဇုန်': 'အရှေ့ဇုန်',",
    "'ဇုန်': 'တောင်ကြီးဇုန်',"
  );

  // Note: normalizeSchoolRow already correctly maps `row['ဇုန်']`, so we just ensure it's there.
  // No change needed for import parsing, it's already robust.
  
  fs.writeFileSync(excelPath, content, 'utf8');
  console.log("✅ excel.ts တွင် ဇုန် ဥပမာ ပြင်ဆင်ပြီးပါပြီ");
}

// ==========================================
// 5. Version Bump & Auto-Check
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v13.0'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(dataDir, 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v13.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'ဇုန်ဒေတာများ အပြည့်အစုံ ချိတ်ဆက်ခြင်း (Zone Data Flow)',
    changes: [
      { type: 'feat', text: 'ကျောင်းအချက်အလက် ထည့်သွင်းရာတွင် ဇုန်ကို စာသားရိုက်ထည့်ခြင်းမှ Dropdown ဖြင့် ရွေးချယ်နိုင်စေရန် ပြင်ဆင်ခြင်း' },
      { type: 'feat', text: 'Admin ကျောင်းစီမံခန့်ခွဲမှု စာမျက်နှာတွင် ဇုန်အလိုက် စစ်ထုတ်ကြည့်ရှုနိုင်သည့် Filter စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ဇုန်အမည်များကို တစ်နေရာတည်းတွင် သတ်မှတ်ထားသဖြင့် စာလုံးပေါင်းမှားယွင်းမှုကြောင့် Data မကိုက်ညီခြင်းများ လုံးဝ မဖြစ်ပေါ်တော့ခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ Error ရှိနေပါတယ်။");
}