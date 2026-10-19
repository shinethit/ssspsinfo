const fs = require('fs');
const path = require('path');

console.log("🚀 App ကို အများသုံးရန် အပြီးသတ် ပြင်ဆင်နေပါသည် (Final Production Polish)...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');

// ==========================================
// 1. Add Pagination to Contacts.tsx
// ==========================================
const contactsPath = path.join(pagesDir, 'Contacts.tsx');
if (fs.existsSync(contactsPath)) {
  let content = fs.readFileSync(contactsPath, 'utf8');

  // Add ChevronLeft, ChevronRight to imports
  if (!content.includes('ChevronLeft')) {
    content = content.replace(
      "ChevronDown,\n  ChevronUp,",
      "ChevronDown,\n  ChevronUp,\n  ChevronLeft,\n  ChevronRight,"
    );
  }

  // Add currentPage state
  if (!content.includes('const [currentPage, setCurrentPage]')) {
    content = content.replace(
      "const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);",
      "const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 20;"
    );
  }

  // Reset page when filters change
  if (!content.includes('useEffect(() => { setCurrentPage(1); }')) {
    content = content.replace(
      "useEffect(() => {\n    const urlSearch = searchParams.get('search');",
      "useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategoryTab, feeFilter, sortOption, viewMode]);\n\n  useEffect(() => {\n    const urlSearch = searchParams.get('search');"
    );
  }

  // Pagination Logic (Slice the data)
  // 1. Update flat list rendering
  const flatListRegex = /\{sortedSchools\.map\(\(s, idx\) => \{/;
  const flatListReplacement = `{sortedSchools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s, idx) => {`;
  content = content.replace(flatListRegex, flatListReplacement);

  // 2. Update grouped list rendering
  const groupedRegex = /const catSchools = sortedSchools\.filter\(\(s\) => \{/;
  const groupedReplacement = `const catSchools = sortedSchools.filter((s) => {`;
  content = content.replace(groupedRegex, groupedReplacement);

  // Note: For grouped view, we filter from the full sortedSchools, then slice the final paginated array.
  // Actually, if we group, we need to paginate the flat array first, then group the paginated items.
  const groupedMemoRegex = /unifiedLevels\.forEach\(\(lvl\) => \{\n      const catSchools = sortedSchools\.filter\(\(s\) => \{[\s\S]*?\}\n    \}\);/;
  const newGroupedMemo = `const paginatedSchools = sortedSchools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    unifiedLevels.forEach((lvl) => {
      const catSchools = paginatedSchools.filter((s) => {
        const schoolCat = getSchoolCategory(s);
        return schoolCat.id === lvl.id;
      });

      if (catSchools.length > 0) {
        groups.push({
          config: lvl,
          schools: catSchools,
        });
      }
    });`;
  content = content.replace(groupedMemoRegex, newGroupedMemo);

  // Add Pagination UI at the bottom
  const paginationUI = `
      {/* Global Pagination Controls */}
      {sortedSchools.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 mt-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">
            စာမျက်နှာ {currentPage} / {Math.ceil(sortedSchools.length / itemsPerPage)} (စုစုပေါင်း {sortedSchools.length} ကျောင်း)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> ရှေ့သို့
            </button>
            <button
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage >= Math.ceil(sortedSchools.length / itemsPerPage)}
              className="px-4 py-2 text-xs font-bold bg-sky-100 text-sky-800 rounded-xl hover:bg-sky-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              နောက်သို့ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
  // Replace the final closing tags
  content = content.replace(/\n    <\/div>\n  \);\n\}\s*$/, paginationUI);

  fs.writeFileSync(contactsPath, content, 'utf8');
  console.log("✅ Contacts.tsx တွင် Pagination စနစ် ထည့်သွင်းပြီးပါပြီ");
}

// ==========================================
// 2. Bump Version & Changelog
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v5.1'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v5.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'အများသုံးရန် အပြီးသတ် ပြင်ဆင်ခြင်း - Contacts Pagination နှင့် စနစ်တည်ငြိမ်မှု',
    changes: [
      { type: 'feat', text: 'အသင်းဝင်ကျောင်းများ (Contacts) စာမျက်နှာတွင် ကျောင်းစာရင်းများ များပြားလာပါက အလွန်လေးလံမသွားစေရန် Pagination (စာမျက်နှာခွဲပြသခြင်း) စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Pagination အသစ်ကြောင့် ဖုန်း (Mobile) နှင့် ကွန်ပျူတာ (Desktop) နှစ်မျိုးလုံးတွင် စာမျက်နှာ ကူးပြောင်းရ ပိုမိုလွယ်ကူပြီး မြန်ဆန်လာစေရန် ပြင်ဆင်ခြင်း' },
      { type: 'fix', text: 'Data တင်သည့်အခါနှင့် ရှာဖွေသည့်အခါတွင် စာမျက်နှာ (Page) များ ရှုပ်ထွေးမနေစေရန် အလိုအလျောက် ပထမစာမျက်နှာသို့ ပြန်ရောက်စေရန် ပြင်ဆင်ခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 အားလုံး ပြီးဆုံးပါပြီ! 'npm run dev' ကို Run ပြီး စိတ်အေးလက်အေး စမ်းသပ်နိုင်ပါပြီ။");