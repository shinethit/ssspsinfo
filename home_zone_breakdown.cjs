const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Tech Lead Update: ဇုန်အလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှုစနစ် ထည့်သွင်းနေပါသည်...");

const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');

if (fs.existsSync(homePath)) {
  let content = fs.readFileSync(homePath, 'utf8');

  // 1. Add Zone Tabs State
  if (!content.includes('selectedZone')) {
    content = content.replace(
      "const [quickSearch, setQuickSearch] = useState('');",
      "const [quickSearch, setQuickSearch] = useState('');\n  const [selectedZone, setSelectedZone] = useState<string>('all');"
    );
  }

  // 2. Add Zone List & Filtering Logic
  const zoneList = ['all', 'တောင်ကြီးဇုန်', 'ကလောဇုန်', 'လွိုင်လင်/နမ့်စန်ဇုန်', 'အခြား'];

  // Add zone filtering in levelStats calculation
  if (!content.includes('filteredSchoolsByZone')) {
    content = content.replace(
      "const levelStats = useMemo(() => {\n    return getUnifiedSchoolLevels(schoolLevels, schools).filter(l => l.total > 0);\n  }, [schools, schoolLevels]);",
      `const filteredSchoolsByZone = useMemo(() => {
    if (selectedZone === 'all') return schools;
    if (selectedZone === 'အခြား') {
      return schools.filter(s => !s.zone || !['တောင်ကြီးဇုန်', 'ကလောဇုန်', 'လွိုင်လင်/နမ့်စန်ဇုန်'].includes(s.zone));
    }
    return schools.filter(s => s.zone === selectedZone);
  }, [schools, selectedZone]);

  const levelStats = useMemo(() => {
    return getUnifiedSchoolLevels(schoolLevels, filteredSchoolsByZone).filter(l => l.total > 0);
  }, [filteredSchoolsByZone, schoolLevels]);`
    );
  }

  // 3. Add Zone Tabs UI and update Level Breakdown Section
  const levelSectionRegex = /<section className="bg-white p-3 rounded-xl border border-slate-100 shadow-none space-y-2">[\s\S]*?<\/section>/;
  
  const newLevelSection = `<section className="bg-white p-3 rounded-xl border border-slate-100 shadow-none space-y-3">
        <div className="flex items-center justify-between border-b border-slate-50 pb-1">
          <h3 className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
            <span>ကျောင်းအဆင့် ခွဲခြမ်းမှု (ဇုန်အလိုက်)</span>
          </h3>
          <Link to="/contacts" className="text-[10px] font-bold text-sky-700 hover:underline">
            List အားလုံးကြည့်ရန် &rarr;
          </Link>
        </div>

        {/* Zone Tabs */}
        <div className="flex overflow-x-auto gap-1 pb-1">
          {['all', 'တောင်ကြီးဇုန်', 'ကလောဇုန်', 'လွိုင်လင်/နမ့်စန်ဇုန်', 'အခြား'].map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition \${
                selectedZone === zone
                  ? 'bg-sky-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }\`}
            >
              {zone === 'all' ? 'အားလုံး' : zone}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {levelStats.map((item) => (
            <Link
              key={item.id}
              to={\`/contacts?level=\${encodeURIComponent(item.name)}&zone=\${encodeURIComponent(selectedZone)}\`}
              className={\`p-2.5 rounded-lg \${item.color.bg} border \${item.color.border} space-y-1 hover:brightness-95 transition group block\`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={\`\${item.color.text} truncate group-hover:underline\`} title={item.name}>
                  {item.name}
                </span>
                <span className={\`\${item.color.accent} font-extrabold shrink-0 ml-1\`}>
                  {item.total}
                </span>
              </div>
              <div className={\`w-full \${item.color.barBg} rounded-full h-1 overflow-hidden\`}>
                <div
                  className={\`\${item.color.bar} h-1 rounded-full transition-all\`}
                  style={{ width: \`\${item.pct}%\` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>`;

  content = content.replace(levelSectionRegex, newLevelSection);

  fs.writeFileSync(homePath, content, 'utf8');
  console.log("✅ Home.tsx တွင် ဇုန်အလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှု ထည့်ပြီးပါပြီ");
}

// ==========================================
// 4. Version Bump & Change Log
// ==========================================
const srcDir = path.join(__dirname, 'src');
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v12.5'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v12.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'ဇုန်အလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှုစနစ် (Zone-based Level Breakdown)',
    changes: [
      { type: 'feat', text: 'ပင်မစာမျက်နှာတွင် တောင်ကြီးဇုန်၊ ကလောဇုန်နှင့် လွိုင်လင်/နမ့်စန်ဇုန်များအလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှုကို ကြည့်ရှုနိုင်စေရန် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ဇုန်တစ်ခုချင်းစီအတွက် ကျောင်းအဆင့်များကို သီးသန့် ခွဲခြမ်းပြသပေးပြီး အရေအတွက်များကို တိကျစွာ တွက်ချက်ပေးခြင်း' },
      { type: 'improve', text: 'ကျောင်းစာရင်းအားလုံးကို List ပုံစံဖြင့် အလွယ်တကူ ကြည့်ရှုနိုင်ရန် လင့်ခ်များ ထည့်သွင်းပေးခြင်း' }
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