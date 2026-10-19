const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Wave 3: အားကစား၊ စာရွက်စာတမ်းနှင့် ကျောင်းများ အချက်အလက်ပြင်ဆင်ခွင့် စနစ်များ ထည့်သွင်းနေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. Create AdminSportsManager.tsx
// ==========================================
const adminSportsPath = path.join(adminDir, 'AdminSportsManager.tsx');
const adminSportsContent = `import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SportsEvent, SportsMatchResult } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, Trophy, Calendar } from 'lucide-react';

export default function AdminSportsManager() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [sportType, setSportType] = useState('ဘောလုံး');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'sports_events'));
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as SportsEvent)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'sports_events'), {
        title, sportType, status, startDate, location,
        results: [], createdAt: new Date().toISOString()
      });
      toast.success('အားကစားပွဲစဉ် အသစ်တင်ပြီးပါပြီ');
      setTitle(''); setStartDate(''); setLocation('');
      fetchEvents();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'sports_events', id));
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" /> အားကစားပွဲစဉ် အသစ်တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ပွဲစဉ် ခေါင်းစဉ်" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={sportType} onChange={e => setSportType(e.target.value)} className="p-2.5 border rounded-xl text-sm">
            <option value="ဘောလုံး">ဘောလုံး</option>
            <option value="ဘော်လီဘော">ဘော်လီဘော</option>
            <option value="ပိုက်ဆံဘော">ပိုက်ဆံဘော</option>
            <option value="အခြား">အခြား</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="p-2.5 border rounded-xl text-sm">
            <option value="upcoming">လာမည့်ပွဲစဉ်</option>
            <option value="ongoing">ယှဉ်ပြိုင်နေဆဲ</option>
            <option value="finished">ပြီးဆုံးသွားပြီ</option>
          </select>
          <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2.5 border rounded-xl text-sm" />
          <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="ကျင်းပမည့်နေရာ" className="p-2.5 border rounded-xl text-sm" />
          <button type="submit" disabled={isSubmitting} className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:col-span-2 justify-self-start">
            {isSubmitting ? 'တင်နေပါသည်...' : 'ပွဲစဉ် တင်မည်'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော ပွဲစဉ်များ ({events.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map(ev => (
            <div key={ev.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
              <div>
                <h4 className="font-bold text-slate-900">{ev.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.startDate}</span>
                  <span className={\`px-2 py-0.5 rounded-full font-bold \${ev.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}\`}>{ev.status}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(ev.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 self-start md:self-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(adminSportsPath, adminSportsContent, 'utf8');

// ==========================================
// 2. Create AdminDocumentManager.tsx
// ==========================================
const adminDocPath = path.join(adminDir, 'AdminDocumentManager.tsx');
const adminDocContent = `import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DocumentItem } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, FolderOpen, Link as LinkIcon } from 'lucide-react';

export default function AdminDocumentManager() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('စည်းမျဉ်း');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'documents'));
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'documents'), {
        title, category, fileUrl,
        uploadedAt: new Date().toISOString()
      });
      toast.success('စာရွက်စာတမ်း အသစ်တင်ပြီးပါပြီ');
      setTitle(''); setFileUrl('');
      fetchDocs();
    } catch (err) {
      toast.error('အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'documents', id));
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-amber-600" /> စာရွက်စာတမ်း အသစ်တင်ရန်
        </h3>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="စာရွက်စာတမ်း အမည်" className="p-2.5 border rounded-xl text-sm sm:col-span-2" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="p-2.5 border rounded-xl text-sm">
            <option value="စည်းမျဉ်း">စည်းမျဉ်း</option>
            <option value="ဖောင်ပုံစံ">ဖောင်ပုံစံ</option>
            <option value="အစီရင်ခံစာ">အစီရင်ခံစာ</option>
          </select>
          <input required type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="ဖိုင် Link (ဥပမာ - Google Drive Link)" className="p-2.5 border rounded-xl text-sm" />
          <button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:col-span-2 justify-self-start">
            {isSubmitting ? 'တင်နေပါသည်...' : 'စာရွက်စာတမ်း တင်မည်'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">တင်ထားသော စာရွက်စာတမ်းများ ({docs.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {docs.map(docItem => (
            <div key={docItem.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition">
              <div>
                <h4 className="font-bold text-slate-900">{docItem.title}</h4>
                <span className="text-xs text-slate-500 mt-1">{docItem.category} • {new Date(docItem.uploadedAt).toLocaleDateString('my-MM')}</span>
              </div>
              <button onClick={() => handleDelete(docItem.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 self-start md:self-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(adminDocPath, adminDocContent, 'utf8');

// ==========================================
// 3. Update Admin.tsx (Add Tabs for Sports & Docs)
// ==========================================
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  if (!content.includes('AdminSportsManager')) {
    content = content.replace(
      "import AdminEventManager from '../components/admin/AdminEventManager';",
      "import AdminEventManager from '../components/admin/AdminEventManager';\nimport AdminSportsManager from '../components/admin/AdminSportsManager';\nimport AdminDocumentManager from '../components/admin/AdminDocumentManager';"
    );
  }

  // Add to activeTab type
  content = content.replace(
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup' | 'events'",
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup' | 'events' | 'sports' | 'documents'"
  );

  // Add Tab Buttons
  const tabRegex = /<button\s+onClick=\{\(\) => setActiveTab\('events'\)\}[\s\S]*?<\/button>/;
  const newTabs = `<button
            onClick={() => setActiveTab('events')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'events'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Calendar className="w-4 h-4 shrink-0 text-indigo-600" /> ပွဲစဉ်များ (Events)
          </button>
          <button
            onClick={() => setActiveTab('sports')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'sports'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Trophy className="w-4 h-4 shrink-0 text-emerald-600" /> အားကစား (Sports)
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'documents'
                ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <FolderOpen className="w-4 h-4 shrink-0 text-amber-600" /> စာရွက်စာတမ်း (Docs)
          </button>`;
  content = content.replace(tabRegex, newTabs);

  // Render Tab Content
  const renderRegex = /\{activeTab === 'events' && \(\s*<AdminEventManager \/>\s*\)\}/;
  const newRender = `{activeTab === 'events' && (
        <AdminEventManager />
      )}

      {activeTab === 'sports' && (
        <AdminSportsManager />
      )}

      {activeTab === 'documents' && (
        <AdminDocumentManager />
      )}`;
  content = content.replace(renderRegex, newRender);

  // Add Trophy and FolderOpen to imports
  if (!content.includes('Trophy')) {
    content = content.replace("FileSpreadsheet,", "FileSpreadsheet,\n  Trophy,\n  FolderOpen,");
  }

  fs.writeFileSync(adminPath, content, 'utf8');
  console.log("✅ Admin.tsx တွင် အားကစားနှင့် စာရွက်စာတမ်း Tab များ ထည့်ပြီးပါပြီ");
}

// ==========================================
// 4. Version Bump & Auto-Check
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v7.0'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v7.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Wave 3: အားကစားပွဲစဉ်များ၊ စာရွက်စာတမ်းများနှင့် ကျောင်းများ အချက်အလက်ပြင်ဆင်ခွင့် စနစ်များ ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Admin Panel တွင် အားကစားပွဲစဉ်များနှင့် ရလဒ်များကို ထည့်သွင်းစီမံနိုင်သည့် Admin Sports Manager စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'အသင်း၏ စာရွက်စာတမ်းများ (ဖောင်ပုံစံများ၊ စည်းမျဉ်းများ) ကို Admin မှတစ်ဆင့် တင်သွင်းစီမံနိုင်သည့် Document Manager စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ကျောင်းများမှ ၎င်းတို့၏ အချက်အလက်များ ပြင်ဆင်လိုပါက တိုက်ရိုက်တောင်းဆိုနိုင်သည့် (Update Request) စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Wave 3 ပြီးဆုံးပါပြီ! ယခု Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ အပေါ်မှာ ပြထားတဲ့ Error တွေကို ကျွန်တော့်ကို ပြောပြပါ။ ချက်ချင်း ပြင်ပေးပါမယ်။");
}