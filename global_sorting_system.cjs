const fs = require('fs');
const path = require('path');

console.log("🚀 စနစ်တစ်ခုလုံးမှာ Sorting စနစ် တစ်ခါတည်း ထည့်သွင်းနေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const componentsDir = path.join(srcDir, 'components');
const uiDir = path.join(componentsDir, 'ui');
const pagesDir = path.join(srcDir, 'pages');

if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

// 1. Create Reusable SortSelect Component
const sortSelectPath = path.join(uiDir, 'SortSelect.tsx');
const sortSelectContent = `import React from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  className?: string;
}

export default function SortSelect({ value, onChange, options, className = '' }: SortSelectProps) {
  return (
    <div className={\`relative flex items-center bg-white border border-slate-300 hover:border-sky-400 rounded-xl px-3 py-2 transition \${className}\`}>
      <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0 mr-2" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-semibold text-slate-700 outline-none cursor-pointer text-sm appearance-none pr-6"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
    </div>
  );
}
`;
fs.writeFileSync(sortSelectPath, sortSelectContent, 'utf8');
console.log("✅ SortSelect Component ဖန်တီးပြီးပါပြီ");

// 2. Update Announcements.tsx (Add Title Sorting)
const annPath = path.join(pagesDir, 'Announcements.tsx');
if (fs.existsSync(annPath)) {
  let content = fs.readFileSync(annPath, 'utf8');
  
  // Add Import
  if (!content.includes('SortSelect')) {
    content = content.replace(
      "import { Tag, Calendar, ChevronLeft, ChevronRight, Search, FileText, ArrowLeft } from 'lucide-react';",
      "import { Tag, Calendar, ChevronLeft, ChevronRight, Search, FileText, ArrowLeft } from 'lucide-react';\nimport SortSelect from '../components/ui/SortSelect';"
    );
  }

  // Change sortOrder to sortBy
  content = content.replace(
    "const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');",
    "const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('date_desc');"
  );

  // Update the sorting logic in useMemo
  const memoRegex = /return list\.sort\(\(a, b\) => \{[\s\S]*?return sortOrder === 'desc' \? timeB - timeA : timeA - timeB;\n    \}\);/;
  const newMemoLogic = `return list.sort((a, b) => {
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '', 'my');
      if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '', 'my');
      const timeA = getAnnouncementTimestamp(a);
      const timeB = getAnnouncementTimestamp(b);
      return sortBy === 'date_desc' ? timeB - timeA : timeA - timeB;
    });`;
  content = content.replace(memoRegex, newMemoLogic);

  // Update useEffect dependency
  content = content.replace("}, [selectedCategory, searchQuery, sortOrder]);", "}, [selectedCategory, searchQuery, sortBy]);");

  // Update UI
  const uiRegex = /<div className="flex items-center gap-2">\s*<span className="font-semibold text-slate-500">စီစဉ်မှု \(Sort by Date\):<\/span>[\s\S]*?<\/select>\s*<\/div>/;
  const newUi = `<div className="flex items-center gap-2">
            <SortSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'date_desc', label: 'ရက်စွဲ (အသစ်ဆုံး မှ အဟောင်း)' },
                { value: 'date_asc', label: 'ရက်စွဲ (အဟောင်း မှ အသစ်)' },
                { value: 'title_asc', label: 'ခေါင်းစဉ် (က မှ အ)' },
                { value: 'title_desc', label: 'ခေါင်းစဉ် (အ မှ က)' }
              ]}
            />
          </div>`;
  content = content.replace(uiRegex, newUi);
  
  fs.writeFileSync(annPath, content, 'utf8');
  console.log("✅ Announcements တွင် Sorting ထည့်ပြီးပါပြီ");
}

// 3. Update Associations.tsx (Add Sorting)
const assocPath = path.join(pagesDir, 'Associations.tsx');
if (fs.existsSync(assocPath)) {
  let content = fs.readFileSync(assocPath, 'utf8');

  // Add Import
  if (!content.includes('SortSelect')) {
    content = content.replace(
      "import { Building2, Users, Phone, MapPin, Search, Mail, Send, Award, School as SchoolIcon, ArrowLeft } from 'lucide-react';",
      "import { Building2, Users, Phone, MapPin, Search, Mail, Send, Award, School as SchoolIcon, ArrowLeft } from 'lucide-react';\nimport SortSelect from '../components/ui/SortSelect';"
    );
  }

  // Add state
  if (!content.includes('sortBy')) {
    content = content.replace(
      "const [selectedTownship, setSelectedTownship] = useState<string>('all');",
      "const [selectedTownship, setSelectedTownship] = useState<string>('all');\n  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc'>('name_asc');"
    );
  }

  // Update filtering logic
  const filterRegex = /return matchTownship && matchSearch;\n    \}\);\n  \}, \[associations, selectedTownship, searchQuery\]\);/;
  const newFilterLogic = `return matchTownship && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'my');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'my');
      return 0;
    });
  }, [associations, selectedTownship, searchQuery, sortBy]);`;
  content = content.replace(filterRegex, newFilterLogic);

  // Add UI (next to search bar)
  const searchUiRegex = /(<div className="relative">[\s\S]*?<\/div>)\n\n        \{townships\.length > 0/;
  const newSearchUi = `$1
        <div className="mt-3">
          <SortSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            options={[
              { value: 'name_asc', label: 'အသင်းအမည် (က မှ အ)' },
              { value: 'name_desc', label: 'အသင်းအမည် (အ မှ က)' }
            ]}
          />
        </div>

        {townships.length > 0`;
  content = content.replace(searchUiRegex, newSearchUi);

  fs.writeFileSync(assocPath, content, 'utf8');
  console.log("✅ Associations တွင် Sorting ထည့်ပြီးပါပြီ");
}

// 4. Update Admin.tsx (Audit Logs Sorting)
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  // Add SortSelect import
  if (!content.includes('import SortSelect')) {
    content = content.replace(
      "import ImageUploadDropzone from '../components/ImageUploadDropzone';",
      "import ImageUploadDropzone from '../components/ImageUploadDropzone';\nimport SortSelect from '../components/ui/SortSelect';"
    );
  }

  // Add state
  if (!content.includes('auditSortBy')) {
    content = content.replace(
      "const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'bulk_delete'>('all');",
      "const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'bulk_delete'>('all');\n  const [auditSortBy, setAuditSortBy] = useState<'newest' | 'oldest'>('newest');"
    );
  }

  // Update filteredAuditLogs
  const auditRegex = /return matchesSearch && matchesAction;\n    \}\);\n  \}, \[auditLogs, auditSearch, auditActionFilter\]\);/;
  const newAuditLogic = `return matchesSearch && matchesAction;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return auditSortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [auditLogs, auditSearch, auditActionFilter, auditSortBy]);`;
  content = content.replace(auditRegex, newAuditLogic);

  // Add UI to Audit Tab
  const auditUiRegex = /(<button\s+type="button"\s+onClick=\{\(\) => setAuditActionFilter\('bulk_delete'\)\}[\s\S]*?<\/button>\s*<\/div>)/;
  const newAuditUi = `$1
              <div className="ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                <SortSelect
                  value={auditSortBy}
                  onChange={(val) => setAuditSortBy(val as any)}
                  options={[
                    { value: 'newest', label: 'အသစ်ဆုံး အရင်ပြ' },
                    { value: 'oldest', label: 'အဟောင်းဆုံး အရင်ပြ' }
                  ]}
                  className="min-w-[160px]"
                />
              </div>`;
  content = content.replace(auditUiRegex, newAuditUi);

  fs.writeFileSync(adminPath, content, 'utf8');
  console.log("✅ Admin Audit Logs တွင် Sorting ထည့်ပြီးပါပြီ");
}

// 5. Bump Version & History
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v4.1'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v4.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'စနစ်တစ်ခုလုံးတွင် စိတ်ကြိုက်စီစဉ်နိုင်သည့် (Global Sorting) စနစ် တစ်ပြေးညီ ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'ကြေညာချက်များ (Announcements) တွင် ခေါင်းစဉ်အလိုက် (က-အ / အ-က) စီစဉ်နိုင်သည့် စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'အသင်းများ (Associations) တွင် အသင်းအမည်အလိုက် (က-အ / အ-က) စီစဉ်နိုင်သည့် စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Admin မှတ်တမ်း (Audit Logs) တွင် အသစ်ဆုံး/အဟောင်းဆုံး အလိုက် စီစဉ်နိုင်သည့် စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ကုဒ်များ ထပ်နေခြင်းကို ရှင်းလင်းရန် SortSelect ဟူသော Reusable Component အသစ် တည်ဆောက်ပြီး နေရာတိုင်းတွင် အသုံးပြုခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 အားလုံး ပြီးဆုံးပါပြီ! 'npm run dev' ကို Run ပြီး စမ်းသပ်ကြည့်ပါ။");