// D:\ssspsinfo-main\ultimate-fix.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Admin UI ကို သပ်ရပ်သော Sidebar စနစ်သို့ ပြောင်းလဲနေပါသည်...');

// 1. Cloudflare Build Error ဖြေရှင်းရန် bun lockfile များကို ဖျက်ခြင်း
['bun.lockb', 'bun.lock'].forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`✅ ${file} ကို ဖျက်လိုက်ပါပြီ (Cloudflare Error ကျော်ဖြတ်ရန်)။`);
  }
});

// 2. sw.js ကို Error မတက်အောင် အသစ်ပြန်ရေးခြင်း
const swPath = path.join(__dirname, 'public', 'sw.js');
const swContent = `const CACHE_NAME = 'ssspsinfo-live-v4';
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {})));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function fetchWithTimeout(request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    fetch(request).then((res) => { clearTimeout(timer); resolve(res); }).catch((err) => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return; // chrome-extension error ကို ကာကွယ်ခြင်း
  
  const url = new URL(request.url);
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('google')) return;
  
  const isCodeOrHtml = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.startsWith('/assets/');
  if (isCodeOrHtml) {
    event.respondWith(fetchWithTimeout(request).then((response) => {
      if (response && response.status === 200 && !response.redirected) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request).then((cached) => {
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('/index.html');
      return new Response('Network error', { status: 408 });
    })));
    return;
  }
  
  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response && response.status === 200 && !response.redirected) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => new Response('Offline', { status: 404 }));
  }));
});
`;
fs.writeFileSync(swPath, swContent);
console.log('✅ sw.js ကို Error ကင်းအောင် အသစ်ပြန်ရေးပြီးပါပြီ။');

// 3. Admin UI ကို Sidebar Layout ပြောင်းခြင်း
const adminPath = path.join(__dirname, 'src', 'pages', 'Admin.tsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Imports ဖြည့်ခြင်း
adminContent = adminContent.replace(
  "Coins } from 'lucide-react';",
  "Coins, UserCog, Key, LayoutDashboard, Settings, Shield, Menu } from 'lucide-react';"
);

// Active Tab Type ထဲတွင် dashboard နှင့် accounts ထည့်ခြင်း
adminContent = adminContent.replace(
  "'audit_logs' | 'admins' | 'levels' | 'backup' | 'events' | 'sports' | 'documents' | 'finance' | 'requests'>",
  "'audit_logs' | 'accounts' | 'levels' | 'backup' | 'events' | 'sports' | 'documents' | 'finance' | 'requests' | 'dashboard'>"
);

// Permission စစ်ဆေးမှုတွင် accounts ထည့်ခြင်း
adminContent = adminContent.replace(
  "    admins: role === 'super_admin',",
  "    accounts: isSuperOrAdmin,"
);

// Account Center အတွက် State များ ထည့်ခြင်း
adminContent = adminContent.replace(
  "const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');",
  `const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [adminPerms, setAdminPerms] = useState<Record<string, boolean>>({
    manage_schools: false, delete_schools: false, manage_announcements: false,
    manage_events: false, manage_sports: false, manage_documents: false,
    manage_finance: false, manage_users: false,
  });
  const [schoolAccountModal, setSchoolAccountModal] = useState<School | null>(null);
  const [schoolAccEmail, setSchoolAccEmail] = useState('');
  const [schoolAccPassword, setSchoolAccPassword] = useState('');
  const [isCreatingSchoolAcc, setIsCreatingSchoolAcc] = useState(false);`
);

// Admin ဖန်တီးခြင်းတွင် permissions ထည့်ခြင်း
adminContent = adminContent.replace(
  "        note: newAdminNote.trim(),\n        addedBy:",
  "        note: newAdminNote.trim(),\n        permissions: adminPerms,\n        addedBy:"
);

// ကျောင်းအကောင့် ဖန်တီးသည့် Function ကို prompt() မှ Modal သို့ ပြောင်းခြင်း
adminContent = adminContent.replace(
  /const handleCreateSchoolAccount = async \(school: School\) => \{[\s\S]*?\n  \};/,
  `const handleCreateSchoolAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolAccountModal) return;
    if (!schoolAccEmail || !schoolAccPassword || schoolAccPassword.length < 6) {
      toast.error('အီးမေးလ်နှင့် စကားဝှက် (အနည်းဆုံး ၆ လုံး) ဖြည့်စွက်ပါ');
      return;
    }
    try {
      setIsCreatingSchoolAcc(true);
      toast.loading('အကောင့် ဖန်တီးနေပါသည်...', { id: 'acc-create' });
      await createSchoolAccount(schoolAccEmail, schoolAccPassword, schoolAccountModal.id);
      toast.success('ကျောင်းအကောင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ', { id: 'acc-create' });
      setSchoolAccountModal(null);
      setSchoolAccEmail('');
      setSchoolAccPassword('');
      fetchSchools();
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message || 'အကောင့်ဖန်တီး၍ မရပါ', { id: 'acc-create' });
    } finally {
      setIsCreatingSchoolAcc(false);
    }
  };`
);

// AdminSchoolManager သို့ canDelete ပေးပို့ခြင်း
adminContent = adminContent.replace(
  "<AdminSchoolManager\n          schools={schoolsForZone}",
  "<AdminSchoolManager\n          role={role}\n          canDelete={isSuperOrAdmin || adminSession.permissions?.delete_schools}\n          schools={schoolsForZone}"
);

// --------- UI အပိုင်းကို အသစ်ပြန်တည်ဆောက်ခြင်း ---------
const returnStart = adminContent.indexOf('  return (');
const beforeReturn = adminContent.substring(0, returnStart);

// လက်ရှိ Tab တွေရဲ့ အတွင်းပိုင်း UI ကို ဆွဲထုတ်ခြင်း
const getSection = (startStr, endStr) => {
  const start = adminContent.indexOf(startStr);
  const end = adminContent.indexOf(endStr, start);
  if (start !== -1 && end !== -1) return adminContent.substring(start, end);
  return '';
};

const announcementsSection = getSection(`{/* Announcements Tab */}`, `{/* Associations Tab */}`);
const associationsSection = getSection(`{/* Associations Tab */}`, `{/* Schools Tab */}`);
const schoolsSection = getSection(`{/* Schools Tab */}`, `{activeTab === 'events' && (`);
const tickersSection = getSection(`{activeTab === 'tickers' && (`, `{/* Audit Logs Tab */}`);
const auditLogsSection = getSection(`{/* Audit Logs Tab */}`, `{/* Admin Management Tab */}`);
const levelsSection = getSection(`{/* 7. SCHOOL LEVELS MANAGEMENT TAB */}`, `{/* BACKUP & RESTORE / CLOUDINARY TAB */}`);
const backupSection = getSection(`{/* BACKUP & RESTORE / CLOUDINARY TAB */}`, `{/* Admin Password Management Modal */}`);

const dashboardSection = `
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div onClick={() => setActiveTab('schools')} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-sky-300 transition cursor-pointer group space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">စုစုပေါင်း ကျောင်းများ</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition"><SchoolIcon className="w-4 h-4" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-sky-950">{schools.length}</span>
                <span className="text-xs text-slate-500 font-medium">ကျောင်း</span>
              </div>
            </div>
            <div onClick={() => setActiveTab('schools')} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Active</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition"><Activity className="w-4 h-4" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{schools.filter(s => (s.status || 'active') === 'active').length}</span>
                <span className="text-xs text-emerald-700 font-medium">ကျောင်း</span>
              </div>
            </div>
            <div onClick={() => setActiveTab('schools')} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-amber-300 transition cursor-pointer group space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Under Review</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition"><AlertCircle className="w-4 h-4" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-950">{schools.filter(s => s.status === 'under_review').length}</span>
                <span className="text-xs text-amber-700 font-medium">ကျောင်း</span>
              </div>
            </div>
            <div onClick={() => setActiveTab('finance')} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer group space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">နှစ်စဉ်ကြေး ပေးသွင်းမှု</span>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition"><CheckCircle2 className="w-4 h-4" /></div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div><span className="text-xl sm:text-2xl font-black text-emerald-700">{schools.filter(s => s.isAnnualFeePaid).length}</span><span className="text-[10px] text-slate-500 ml-1 font-semibold">ပေးပြီး</span></div>
                <div className="text-right"><span className="text-xl sm:text-2xl font-black text-rose-600">{schools.filter(s => !s.isAnnualFeePaid).length}</span><span className="text-[10px] text-slate-500 ml-1 font-semibold">ကျန်</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><History className="w-5 h-5 text-sky-600" /> လုပ်ဆောင်ချက် မှတ်တမ်းများ (Recent Activity)</h3>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-sm border-b pb-2 last:border-0 flex justify-between items-center">
                  <span><strong className="text-slate-900">{log.adminEmail}</strong> မှ <span className="text-sky-700">{log.details || log.entityType}</span></span>
                  <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString('my-MM')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
`;

const newReturn = `
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200 bg-sky-950 text-white">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Admin Area
          </h2>
          <p className="text-xs text-sky-200 mt-1 truncate">{adminSession.email || 'khunthanshwe@gmail.com'}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'dashboard' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
          <button onClick={() => setActiveTab('announcements')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'announcements' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><FileText className="w-4 h-4" /> ကြေညာချက်များ</button>
          {canAccess.associations && <button onClick={() => setActiveTab('associations')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'associations' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Building2 className="w-4 h-4" /> အသင်းများ</button>}
          {canAccess.schools && <button onClick={() => setActiveTab('schools')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'schools' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><SchoolIcon className="w-4 h-4" /> ကျောင်းများ</button>}
          {canAccess.levels && <button onClick={() => setActiveTab('levels')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'levels' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Layers className="w-4 h-4" /> ကျောင်းအဆင့်များ</button>}
          {canAccess.tickers && <button onClick={() => setActiveTab('tickers')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'tickers' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Megaphone className="w-4 h-4" /> စာတန်းပြေး</button>}
          {canAccess.events && <button onClick={() => setActiveTab('events')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'events' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Calendar className="w-4 h-4" /> ပွဲစဉ်များ</button>}
          {canAccess.sports && <button onClick={() => setActiveTab('sports')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'sports' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Trophy className="w-4 h-4" /> အားကစား</button>}
          {canAccess.documents && <button onClick={() => setActiveTab('documents')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'documents' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><FolderOpen className="w-4 h-4" /> စာရွက်စာတမ်း</button>}
          {canAccess.finance && <button onClick={() => setActiveTab('finance')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'finance' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><Coins className="w-4 h-4" /> ငွေစာရင်း</button>}
          <button onClick={() => setActiveTab('requests')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'requests' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><FileText className="w-4 h-4" /> တောင်းဆိုမှုများ</button>
          {canAccess.audit_logs && <button onClick={() => setActiveTab('audit_logs')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'audit_logs' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><History className="w-4 h-4" /> မှတ်တမ်း</button>}
          {canAccess.accounts && <button onClick={() => setActiveTab('accounts')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'accounts' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><UserCog className="w-4 h-4" /> အကောင့် စီမံခန့်ခွဲမှု</button>}
          {canAccess.backup && <button onClick={() => setActiveTab('backup')} className={\`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 \${activeTab === 'backup' ? 'bg-sky-100 text-sky-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'}\`}><HardDriveDownload className="w-4 h-4" /> Backup</button>}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
          <button onClick={() => { setTargetChangePassEmail(adminSession.email || 'khunthanshwe@gmail.com'); setIsChangingPassModal(true); }} className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition flex items-center gap-2"><KeyRound className="w-4 h-4" /> စကားဝှက် ပြောင်းမည်</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100 transition flex items-center gap-2"><LogOut className="w-4 h-4" /> အကောင့်ထွက်မည်</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-white p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-slate-900">Admin Area</h2>
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)} className="p-2 border rounded-lg text-sm bg-slate-50 font-semibold">
            <option value="dashboard">Dashboard</option>
            <option value="announcements">ကြေညာချက်များ</option>
            <option value="schools">ကျောင်းများ</option>
            <option value="accounts">အကောင့်</option>
            <option value="finance">ငွေစာရင်း</option>
          </select>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            ${dashboardSection}
            ${announcementsSection}
            ${associationsSection}
            ${schoolsSection}
            ${tickersSection}
            ${auditLogsSection}
            ${levelsSection}
            ${backupSection}

            {/* Events */}
            {activeTab === 'events' && <AdminEventManager />}
            {/* Sports */}
            {activeTab === 'sports' && <AdminSportsManager schools={schools} />}
            {/* Documents */}
            {activeTab === 'documents' && <AdminDocumentManager />}
            {/* Finance */}
            {activeTab === 'finance' && <AdminFinanceManager schools={schools} />}
            {/* Requests */}
            {activeTab === 'requests' && <AdminRequestsManager />}

            {/* Account Control Center (Admin Management Replaced) */}
            {activeTab === 'accounts' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-slate-900">အကောင့် စီမံခန့်ခွဲမှု (Account Control Center)</h3>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Admin Form */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-600" /> Admin / Moderator အကောင့်များ</h4>
                    {adminSession.role === 'super_admin' ? (
                      <form onSubmit={handleAddAdmin} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded-lg text-sm" />
                          <input type="text" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded-lg text-sm font-mono" />
                          <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as any)} className="w-full p-2 border rounded-lg text-sm bg-white">
                            <option value="admin">🛡️ Admin</option>
                            <option value="editor">✏️ Moderator</option>
                          </select>
                          <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} placeholder="Name (Optional)" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        {newAdminRole === 'editor' && (
                          <div className="p-3 bg-slate-50 border rounded-xl grid grid-cols-2 gap-2">
                            {Object.entries({ manage_schools: 'ကျောင်းပြင်ခွင့်', delete_schools: 'ကျောင်းဖျက်ခွင့်', manage_announcements: 'ကြေညာချက်တင်ခွင့်', manage_finance: 'ငွေစာရင်းထည့်ခွင့်', manage_events: 'ပွဲစဉ်စီမံခွင့်', manage_sports: 'အားကစားစီမံခွင့်' }).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={adminPerms[key]} onChange={e => setAdminPerms({...adminPerms, [key]: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <button type="submit" disabled={addingAdmin} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm transition">+ အကောင့်သစ် ဖန်တီးမည်</button>
                      </form>
                    ) : <div className="text-rose-600 text-sm">Super Admin သာ ခွင့်ပြုချက်ရှိသည်။</div>}
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {admins.map(adm => (
                        <div key={adm.id || adm.email} className="p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-sm">{adm.email}</p>
                            <p className="text-[10px] text-slate-500">{adm.role}</p>
                          </div>
                          {isSuperOrAdmin && adm.id !== auth.currentUser?.uid && <button onClick={() => handleDeleteAdmin(adm)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* School Accounts */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><SchoolIcon className="w-5 h-5 text-sky-600" /> ကျောင်း (User) အကောင့်များ</h4>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {schools.map(school => (
                        <div key={school.id} className="p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm">{school.name}</p>
                            {school.authUid ? <p className="text-xs text-emerald-600">✓ {school.accountEmail}</p> : <p className="text-xs text-slate-400">အကောင့်မရှိပါ</p>}
                          </div>
                          {!school.authUid && (
                            <button onClick={() => { setSchoolAccountModal(school); setSchoolAccEmail(''); setSchoolAccPassword(''); }} className="bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg text-xs font-bold">အကောင့်ဖွင့်ရန်</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* School Account Modal */}
      {schoolAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-lg mb-1">ကျောင်း အကောင့်ဖွင့်ရန်</h3>
            <p className="text-xs text-slate-500 mb-4">{schoolAccountModal.name}</p>
            <form onSubmit={handleCreateSchoolAccount} className="space-y-3">
              <input type="email" required value={schoolAccEmail} onChange={e => setSchoolAccEmail(e.target.value)} placeholder="Email" className="w-full p-2.5 border rounded-xl text-sm bg-slate-50" />
              <input type="text" required value={schoolAccPassword} onChange={e => setSchoolAccPassword(e.target.value)} placeholder="Password (Min 6 chars)" className="w-full p-2.5 border rounded-xl text-sm bg-slate-50" />
              <div className="flex items-center gap-2 mt-4">
                <button type="button" onClick={() => setSchoolAccountModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100">မလုပ်တော့ပါ</button>
                <button type="submit" disabled={isCreatingSchoolAcc} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600">အကောင့်ဖွင့်မည်</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Modal */}
      {isChangingPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <h3 className="font-bold text-lg">စကားဝှက် ပြောင်းလဲရန်</h3>
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <input type="text" required value={newAdminPasswordInput} onChange={(e) => setNewAdminPasswordInput(e.target.value)} className="w-full p-3 border rounded-xl text-sm font-mono" placeholder="စကားဝှက်အသစ်" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsChangingPassModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs">Cancel</button>
                <button type="submit" disabled={savingNewPassword} className="flex-1 py-2.5 rounded-xl bg-sky-900 text-white font-bold text-xs">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Indicator */}
      {isUploadingExcel && (
        <aside className="fixed bottom-5 right-5 z-50 bg-sky-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-sky-400">
          <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> <span className="text-xs font-bold">{excelUploadState.progressPercent}%</span></div>
        </aside>
      )}

    </div>
  );
}
`;

fs.writeFileSync(adminPath, beforeReturn + newReturn);
console.log('✅ Admin Area ကို Sidebar စနစ်သို့ အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။');

// 4. Build & Push
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။');
  process.exit(1);
}

console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat(admin): complete UI refactor to sidebar layout, fix cloudflare bun error, fix sw.js redirect errors"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ။');
}

// 5. Cleanup
try {
  execSync('powershell -Command "Remove-Item -Path \'ultimate-fix.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
} catch (e) {}