const fs = require('fs');
const path = require('path');

console.log("🚀 Wave 1: အခြေခံစနစ်များ ဖန်တီးနေပါသည် (Types, Sports, Documents)...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const componentsDir = path.join(srcDir, 'components');

// ==========================================
// 1. Update types/index.ts
// ==========================================
const typesPath = path.join(srcDir, 'types', 'index.ts');
if (fs.existsSync(typesPath)) {
  let content = fs.readFileSync(typesPath, 'utf8');
  
  if (!content.includes('export interface SportsEvent')) {
    content += `

// --- NEW WAVE 1 TYPES ---

export interface SportsMatchResult {
  id: string;
  teamA: string;
  scoreA: number;
  teamB: string;
  scoreB: number;
  winner?: string;
}

export interface SportsEvent {
  id: string;
  title: string;
  sportType: string; // 'ဘောလုံး', 'ဘော်လီဘော', စသဖြင့်
  status: 'upcoming' | 'ongoing' | 'finished';
  startDate: string;
  location: string;
  results: SportsMatchResult[];
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string; // 'စည်းမျဉ်း', 'ဖောင်ပုံစံ', 'အစီရင်ခံစာ'
  fileUrl: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  schoolId: string;
  schoolName: string;
  contactPhone: string;
  attendeesCount: number;
  registeredAt: string;
}
`;
    fs.writeFileSync(typesPath, content, 'utf8');
    console.log("✅ Types များ ထည့်သွင်းပြီးပါပြီ");
  }
}

// ==========================================
// 2. Create Sports.tsx
// ==========================================
const sportsPath = path.join(pagesDir, 'Sports.tsx');
const sportsContent = `import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, MapPin, ChevronRight, ArrowLeft, Medal } from 'lucide-react';
import { SportsEvent } from '../types';

export default function Sports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'finished'>('finished');

  // Mock data for UI demonstration
  const mockEvents: SportsEvent[] = [
    {
      id: '1', title: 'ရှမ်းတောင်ပိုင်း ကိုယ်ပိုင်ကျောင်းများ ဘောလုံးပြိုင်ပွဲ', sportType: 'ဘောလုံး',
      status: 'finished', startDate: '2026-10-15', location: 'တောင်ကြီး အားကစားကွင်း',
      results: [
        { id: 'm1', teamA: 'ရွှေမင်းသား', scoreA: 2, teamB: 'ပညာရောင်ခြည်', scoreB: 1, winner: 'ရွှေမင်းသား' },
        { id: 'm2', teamA: 'အောင်ပန်း', scoreA: 0, teamB: 'ကလော', scoreB: 0, winner: 'သရေ' }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-900 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black">အားကစားပြိုင်ပွဲများ</h1>
        </div>
        <p className="text-emerald-100 text-sm max-w-2xl">အသင်းဝင်ကျောင်းများ၏ အားကစားပြိုင်ပွဲ သတင်းများနှင့် ရလဒ်များ</p>
      </div>

      <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
        {(['upcoming', 'ongoing', 'finished'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={\`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition \${activeTab === tab ? 'bg-sky-100 text-sky-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}\`}>
            {tab === 'upcoming' ? 'လာမည့်ပွဲစဉ်များ' : tab === 'ongoing' ? 'ယှဉ်ပြိုင်နေဆဲ' : 'ရလဒ်များ'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'finished' ? (
          mockEvents.filter(e => e.status === 'finished').map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-2 inline-block">{event.sportType}</span>
                    <h3 className="font-bold text-slate-900 text-base">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.startDate}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ပွဲရလဒ်များ</h4>
                {event.results.map(match => (
                  <div key={match.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className={\`flex-1 text-right font-bold \${match.winner === match.teamA ? 'text-sky-900' : 'text-slate-600'}\`}>{match.teamA}</div>
                    <div className="px-4 font-mono font-black text-lg text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm mx-2">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <div className={\`flex-1 text-left font-bold \${match.winner === match.teamB ? 'text-sky-900' : 'text-slate-600'}\`}>{match.teamB}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            ဤကဏ္ဍတွင် ပြိုင်ပွဲများ မရှိသေးပါ။
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync(sportsPath, sportsContent, 'utf8');
console.log("✅ Sports.tsx ဖန်တီးပြီးပါပြီ");

// ==========================================
// 3. Create Documents.tsx
// ==========================================
const docsPath = path.join(pagesDir, 'Documents.tsx');
const docsContent = `import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Download, Search, FolderOpen, ArrowLeft, File } from 'lucide-react';

export default function Documents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const mockDocs = [
    { id: '1', title: 'အသင်းစည်းမျဉ်းနှင့် စည်းကမ်းချက်များ (၂၀၂၆)', category: 'စည်းမျဉ်း', fileSize: '2.4 MB', date: '2026-01-10' },
    { id: '2', title: 'ကိုယ်ပိုင်ကျောင်း မှတ်ပုံတင်ဖောင်ပုံစံ', category: 'ဖောင်ပုံစံ', fileSize: '1.1 MB', date: '2026-02-15' },
    { id: '3', title: '၂၀၂၅-၂၀၂၆ ပညာသင်နှစ် အစီရင်ခံစာ', category: 'အစီရင်ခံစာ', fileSize: '5.8 MB', date: '2026-03-20' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">စာရွက်စာတမ်း စင်တာ</h1>
            <p className="text-sm text-slate-500">အသင်းနှင့် သက်ဆိုင်သော ဖိုင်များကို ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="ဖိုင်အမည် ရှာဖွေရန်..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {mockDocs.filter(d => d.title.includes(searchQuery)).map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:bg-sky-50/50 transition group">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-sky-100 group-hover:text-sky-700 transition">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{doc.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{doc.category}</span>
                    <span>{doc.date}</span>
                    <span>{doc.fileSize}</span>
                  </div>
                </div>
              </div>
              <button className="p-2.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition shadow-sm border border-sky-100 cursor-pointer">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(docsPath, docsContent, 'utf8');
console.log("✅ Documents.tsx ဖန်တီးပြီးပါပြီ");

// ==========================================
// 4. Update Layout.tsx (Add to Sidebar)
// ==========================================
const layoutPath = path.join(componentsDir, 'Layout.tsx');
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');

  // Add imports
  if (!content.includes('Trophy')) {
    content = content.replace(
      "BarChart3,\n  ArrowLeft,",
      "BarChart3,\n  ArrowLeft,\n  Trophy,\n  FolderOpen,"
    );
  }

  // Add to navLinks
  const navLinksRegex = /const navLinks = \[[\s\S]*?\];/;
  const newNavLinks = `const navLinks = [
    { to: '/', label: 'ပင်မစာမျက်နှာ', labelEn: 'Home', icon: Home, exact: true },
    { to: '/dashboard', label: 'ဒက်ရှ်ဘုတ် (စာရင်းအင်း)', labelEn: 'Dashboard', icon: BarChart3 },
    { to: '/announcements', label: 'ကြေညာချက်များ', labelEn: 'Announcements', icon: BookOpen },
    { to: '/sports', label: 'အားကစားရလဒ်များ', labelEn: 'Sports Results', icon: Trophy },
    { to: '/documents', label: 'စာရွက်စာတမ်းများ', labelEn: 'Documents', icon: FolderOpen },
    { to: '/associations', label: 'အသင်းများ', labelEn: 'Associations', icon: Building2 },
    { to: '/contacts', label: 'အသင်းဝင်ကျောင်းများ', labelEn: 'Member Schools', icon: Users },
    { to: '/chat', label: 'Chat ဆွေးနွေးခန်း', labelEn: 'Chat Room', icon: MessageSquare },
  ];`;
  content = content.replace(navLinksRegex, newNavLinks);

  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log("✅ Layout.tsx သို့ Menu အသစ်များ ထည့်ပြီးပါပြီ");
}

// ==========================================
// 5. Update App.tsx (Add Routes)
// ==========================================
const appPath = path.join(srcDir, 'App.tsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');

  if (!content.includes('Sports')) {
    content = content.replace(
      "import VersionHistory from './pages/VersionHistory';",
      "import VersionHistory from './pages/VersionHistory';\nimport Sports from './pages/Sports';\nimport Documents from './pages/Documents';"
    );
    content = content.replace(
      "<Route path=\"announcements\" element={<Announcements />} />",
      "<Route path=\"announcements\" element={<Announcements />} />\n            <Route path=\"sports\" element={<Sports />} />\n            <Route path=\"documents\" element={<Documents />} />"
    );
    fs.writeFileSync(appPath, content, 'utf8');
    console.log("✅ App.tsx တွင် Route များ ချိတ်ဆက်ပြီးပါပြီ");
  }
}

// ==========================================
// 6. Bump Version
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v6.0'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v6.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'အဆင့်မြင့် Feature များ စတင်ထည့်သွင်းခြင်း (Wave 1: Sports & Documents)',
    changes: [
      { type: 'feat', text: 'အားကစားပြိုင်ပွဲများ၏ ရလဒ်များနှင့် သတင်းများကို သီးသန့် ကြည့်ရှုနိုင်သည့် Sports စာမျက်နှာ အသစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'အသင်း၏ စည်းမျဉ်းများ၊ ဖောင်ပုံစံများနှင့် အစီရင်ခံစာများကို စုစည်းထားသည့် Document Center စာမျက်နှာ အသစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ဘေးဘက် Menu တွင် အားကစားနှင့် စာရွက်စာတမ်း လင့်ခ်များ ထည့်သွင်းပြီး အသုံးပြုရ ပိုမိုလွယ်ကူလာစေရန် ပြင်ဆင်ခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Wave 1 ပြီးဆုံးပါပြီ! 'node check_error.cjs' ကို Run ပြီး Error ရှိမရှိ စစ်ဆေးပါ။");