// D:\ssspsinfo-main\ultimate-account-control.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Account Control Center နှင့် Role ခွင့်ပြုချက်များ စနစ်တကျ ပြင်ဆင်နေပါသည်...');

// 1. types/index.ts တွင် permissions ထည့်သွင်းခြင်း
const typesPath = path.join(__dirname, 'src', 'types', 'index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');
if (!typesContent.includes('permissions?: {')) {
  typesContent = typesContent.replace(
    "  role: 'super_admin' | 'admin' | 'editor' | 'sports_moderator' | 'news_editor';",
    `  role: 'super_admin' | 'admin' | 'editor' | 'sports_moderator' | 'news_editor';\n  permissions?: {\n    manage_schools?: boolean;\n    delete_schools?: boolean;\n    manage_announcements?: boolean;\n    manage_events?: boolean;\n    manage_sports?: boolean;\n    manage_documents?: boolean;\n    manage_finance?: boolean;\n    manage_users?: boolean;\n  };`
  );
  fs.writeFileSync(typesPath, typesContent);
  console.log('✅ types/index.ts တွင် permissions ထည့်သွင်းပြီးပါပြီ။');
}

// 2. AdminSchoolManager.tsx တွင် Delete ခလုတ်ကို ခွင့်ပြုချက်အလိုက် ကာကွယ်ခြင်း
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

if (!managerContent.includes('canDelete')) {
  // Props တွင် ထည့်ခြင်း
  managerContent = managerContent.replace(
    "  excelUploadState: any;\n}",
    "  excelUploadState: any;\n  canDelete?: boolean;\n}"
  );
  managerContent = managerContent.replace(
    "  isUploadingExcel, excelUploadState, role = 'admin'\n}: AdminSchoolManagerProps) {",
    "  isUploadingExcel, excelUploadState, role = 'admin', canDelete = true\n}: AdminSchoolManagerProps) {"
  );
  
  // Delete ခလုတ်ကို ကာကွယ်ခြင်း
  const oldDeleteBtn = `<button onClick={() => onDelete(school.id, school.name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="ဖျက်ရန်">
                            <Trash2 className="w-4 h-4" />
                          </button>`;
  const newDeleteBtn = `{canDelete && (
                            <button onClick={() => onDelete(school.id, school.name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="ဖျက်ရန်">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}`;
  
  if (managerContent.includes(oldDeleteBtn)) {
    managerContent = managerContent.replace(oldDeleteBtn, newDeleteBtn);
  }
  fs.writeFileSync(managerPath, managerContent);
  console.log('✅ AdminSchoolManager.tsx တွင် Delete ခလုတ် ကာကွယ်ပြီးပါပြီ။');
}

// 3. Admin.tsx ကို အစအဆုံး ပြင်ဆင်ခြင်း
const adminPath = path.join(__dirname, 'src', 'pages', 'Admin.tsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// (က) Import အသစ်များ ထည့်သွင်းခြင်း
adminContent = adminContent.replace(
  "Coins } from 'lucide-react';",
  "Coins, UserCog, ShieldAlert, CheckSquare, Square, Key, UserPlus, Mail, Lock } from 'lucide-react';"
);

// (ခ) Tab အမည်များ ပြောင်းလဲခြင်း ('admins' -> 'accounts')
adminContent = adminContent.replace(
  "'admins' | 'levels' |",
  "'accounts' | 'levels' |"
);

// (ဂ) Permission Logic ကို အသစ်ပြင်ဆင်ခြင်း
const oldCanAccess = `  const canAccess: Record<string, boolean> = {
    announcements: isSuperOrAdmin || role === 'news_editor',
    associations: isSuperOrAdmin,
    schools: isSuperOrAdmin,
    levels: isSuperOrAdmin,
    tickers: isSuperOrAdmin || role === 'news_editor',
    audit_logs: isSuperOrAdmin,
    admins: role === 'super_admin',
    backup: role === 'super_admin',
    events: isSuperOrAdmin || role === 'sports_moderator',
    sports: isSuperOrAdmin || role === 'sports_moderator',
    documents: isSuperOrAdmin || role === 'news_editor',
    finance: isSuperOrAdmin,
  };`;

const newCanAccess = `  const perms = adminSession.permissions || {};

  const canAccess: Record<string, boolean> = {
    announcements: isSuperOrAdmin || perms.manage_announcements || role === 'news_editor',
    associations: isSuperOrAdmin,
    schools: isSuperOrAdmin || perms.manage_schools,
    levels: isSuperOrAdmin,
    tickers: isSuperOrAdmin || perms.manage_announcements || role === 'news_editor',
    audit_logs: isSuperOrAdmin,
    accounts: isSuperOrAdmin, // Account Center ကို Admin ပဲ ဝင်ခွင့်ပြုမည်
    backup: isSuperOrAdmin,
    events: isSuperOrAdmin || perms.manage_events || role === 'sports_moderator',
    sports: isSuperOrAdmin || perms.manage_sports || role === 'sports_moderator',
    documents: isSuperOrAdmin || perms.manage_documents || role === 'news_editor',
    finance: isSuperOrAdmin || perms.manage_finance,
  };`;

adminContent = adminContent.replace(oldCanAccess, newCanAccess);

// (ဃ) Admin Form အတွက် State အသစ်များ ထည့်သွင်းခြင်း
const oldAdminState = `  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [newAdminPhone, setNewAdminPhone] = useState('');`;
const newAdminState = `  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  
  // Permissions State
  const [adminPerms, setAdminPerms] = useState<Record<string, boolean>>({
    manage_schools: false,
    delete_schools: false,
    manage_announcements: false,
    manage_events: false,
    manage_sports: false,
    manage_documents: false,
    manage_finance: false,
    manage_users: false,
  });

  // School Account Creation State
  const [schoolAccountModal, setSchoolAccountModal] = useState<School | null>(null);
  const [schoolAccEmail, setSchoolAccEmail] = useState('');
  const [schoolAccPassword, setSchoolAccPassword] = useState('');
  const [isCreatingSchoolAcc, setIsCreatingSchoolAcc] = useState(false);`;

adminContent = adminContent.replace(oldAdminState, newAdminState);

// (င) handleAddAdmin တွင် permissions ထည့်သွင်းခြင်း
adminContent = adminContent.replace(
  "        note: newAdminNote.trim(),\n        addedBy: auth.currentUser?.email || adminSession.email || 'Super Admin',",
  "        note: newAdminNote.trim(),\n        permissions: adminPerms,\n        addedBy: auth.currentUser?.email || adminSession.email || 'Super Admin',"
);

// (စ) ကျောင်းအကောင့် ဖန်တီးသည့် Function ကို အသစ်ပြင်ဆင်ခြင်း (prompt ဖျက်ပြီး Modal သုံးမည်)
const oldHandleSchoolAcc = `  const handleCreateSchoolAccount = async (school: School) => {
    if (school.authUid) {
      toast.info('ဤကျောင်းအတွက် အကောင့် ဖန်တီးပြီးသား ဖြစ်ပါသည်။');
      return;
    }
    const email = prompt("ကျောင်းအတွက် အသုံးပြုမည့် Email ကို ရိုက်ထည့်ပါ (ဥပမာ - school@gmail.com):");
    if (!email) return;
    const password = prompt("စကားဝှက် (အနည်းဆုံး ၆ လုံး) သတ်မှတ်ပါ:");
    if (!password || password.length < 6) {
      toast.error('စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်');
      return;
    }

    try {
      toast.loading('အကောင့် ဖန်တီးနေပါသည်...', { id: 'acc-create' });
      const uid = await createSchoolAccount(email, password, school.id);
      toast.success('ကျောင်းအကောင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ', { id: 'acc-create' });
      fetchSchools();
    } catch (err: any) {
      toast.error(err.message || 'အကောင့်ဖန်တီး၍ မရပါ', { id: 'acc-create' });
    }
  };`;

const newHandleSchoolAcc = `  const handleCreateSchoolAccount = async (e: React.FormEvent) => {
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
  };`;

adminContent = adminContent.replace(oldHandleSchoolAcc, newHandleSchoolAcc);

// (ဆ) Tab ခလုတ်များထဲမှ 'အက်ဒမင်များ' ကို 'အကောင့်စီမံခန့်ခွဲမှု' အဖြစ် ပြောင်းခြင်း
const oldAdminTab = `          {canAccess.admins && (<button
            onClick={() => setActiveTab('admins')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 \${
              activeTab === 'admins'
                ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
            <span>အက်ဒမင်များ</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full">
              {admins.length}
            </span>
          </button>)}`;

const newAdminTab = `          {canAccess.accounts && (<button
            onClick={() => setActiveTab('accounts')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 \${
              activeTab === 'accounts'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-300'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <UserCog className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>အကောင့် စီမံခန့်ခွဲမှု</span>
          </button>)}`;

adminContent = adminContent.replace(oldAdminTab, newAdminTab);

// (ဇ) AdminSchoolManager သို့ canDelete ပေးပို့ခြင်း
adminContent = adminContent.replace(
  "<AdminSchoolManager\n          schools={schoolsForZone}",
  "<AdminSchoolManager\n          canDelete={isSuperOrAdmin || adminSession.permissions?.delete_schools}\n          schools={schoolsForZone}"
);

// (ဈ) Account Control Tab UI အသစ် (အဟောင်း 'admins' Tab ကို အစားထိုးမည်)
const oldTabUIStart = `      {/* Admin Management Tab */}
      {activeTab === 'admins' && (`;

const newTabUIStart = `      {/* Account Control Center Tab */}
      {activeTab === 'accounts' && (`;

adminContent = adminContent.replace(oldTabUIStart, newTabUIStart);

// Tab အတွင်းပိုင်း UI ကို အစအဆုံး အသစ်ရေးမည်
// (အဟောင်း UI ကို ရှာပြီး အသစ်နဲ့ အစားထိုးပါမယ်)
const startIdx = adminContent.indexOf(newTabUIStart);
if (startIdx !== -1) {
  // 'levels' tab စတဲ့နေရာကို ရှာပြီး အဲဒီအထိ ဖြတ်ပစ်မယ်
  const endIdx = adminContent.indexOf(`      {/* 7. SCHOOL LEVELS MANAGEMENT TAB */}`);
  if (endIdx !== -1) {
    const before = adminContent.substring(0, startIdx);
    const after = adminContent.substring(endIdx);
    
    const newUI = `      {/* Account Control Center Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-950 via-sky-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-indigo-800 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
              <UserCog className="w-3.5 h-3.5" />
              <span>အကောင့် စီမံခန့်ခွဲမှု (Account Control Center)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Admin / Moderator နှင့် ကျောင်း အကောင့်များ စီမံခန့်ခွဲခြင်း</h3>
            <p className="text-indigo-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ဤနေရာတွင် စနစ်အတွင်း ဝင်ရောက်အသုံးပြုနိုင်သော Admin/Moderator အကောင့်များကို ခွင့်ပြုချက် (Permission) သတ်မှတ်ပေးခြင်းနှင့် ကျောင်းများအတွက် User Account များ ဖန်တီးပေးခြင်းများ ပြုလုပ်နိုင်ပါသည်။
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* SECTION 1: Admin & Moderator Accounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" /> Admin / Moderator အကောင့်များ
                </h4>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">
                  {admins.length} ဦး
                </span>
              </div>

              {/* Form to Add Admin */}
              {isSuperOrAdmin ? (
                <form onSubmit={handleAddAdmin} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h5 className="font-bold text-sm text-slate-800 border-b pb-2">အကောင့်အသစ် ဖန်တီးရန်</h5>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">အီးမေးလ် *</label>
                      <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="admin@gmail.com" className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">စကားဝှက် *</label>
                      <input type="text" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="အနည်းဆုံး ၆ လုံး" className="w-full p-2 border rounded-lg text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ရာထူး</label>
                      <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as any)} className="w-full p-2 border rounded-lg text-sm bg-white">
                        <option value="admin">🛡️ Admin (အပြည့်အဝ)</option>
                        <option value="editor">✏️ Moderator (ခွင့်ပြုချက်အလိုက်)</option>
                        <option value="super_admin">👑 Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">အမည် (Optional)</label>
                      <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                  </div>

                  {/* Permissions Checkboxes */}
                  {newAdminRole !== 'super_admin' && newAdminRole !== 'admin' && (
                    <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">Moderator ခွင့်ပြုချက်များ (Permissions)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries({
                          manage_schools: 'ကျောင်းများ ပြင်ခွင့်',
                          delete_schools: 'ကျောင်းများ ဖျက်ခွင့်',
                          manage_announcements: 'ကြေညာချက် တင်ခွင့်',
                          manage_finance: 'ငွေစာရင်း ထည့်ခွင့်',
                          manage_events: 'ပွဲစဉ်များ စီမံခွင့်',
                          manage_sports: 'အားကစား စီမံခွင့်',
                          manage_documents: 'စာရွက်စာတမ်း တင်ခွင့်',
                        }).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={adminPerms[key]} onChange={e => setAdminPerms({...adminPerms, [key]: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={addingAdmin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50">
                    {addingAdmin ? 'ဖန်တီးနေပါသည်...' : '+ အကောင့်သစ် ဖန်တီးမည်'}
                  </button>
                </form>
              ) : null}

              {/* Admin List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {admins.map(adm => (
                  <div key={adm.id || adm.email} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{adm.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase">{adm.role}</span>
                        {adm.permissions && Object.entries(adm.permissions).filter(([_, v]) => v).map(([k]) => (
                          <span key={k} className="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded">{k}</span>
                        ))}
                      </div>
                    </div>
                    {isSuperOrAdmin && adm.id !== auth.currentUser?.uid && (
                      <button onClick={() => handleDeleteAdmin(adm)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: School User Accounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <SchoolIcon className="w-5 h-5 text-sky-600" /> ကျောင်း (User) အကောင့်များ
                </h4>
                <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-1 rounded-lg">
                  {schools.filter(s => s.authUid).length} / {schools.length} ဖွင့်ပြီး
                </span>
              </div>

              {/* School Account List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {schools.map(school => (
                  <div key={school.id} className="p-3 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{school.name}</p>
                      {school.authUid ? (
                        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {school.accountEmail || 'အကောင့်ရှိပြီး'}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">အကောင့် မရှိသေးပါ</p>
                      )}
                    </div>
                    {!school.authUid ? (
                      <button onClick={() => { setSchoolAccountModal(school); setSchoolAccEmail(''); setSchoolAccPassword(''); }} className="bg-sky-100 text-sky-800 hover:bg-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
                        <UserPlus className="w-3.5 h-3.5" /> အကောင့်ဖွင့်ရန်
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal for School Account Creation */}
      {schoolAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 mb-1">ကျောင်း အကောင့်ဖွင့်ရန်</h3>
            <p className="text-xs text-slate-500 mb-4">{schoolAccountModal.name}</p>
            
            <form onSubmit={handleCreateSchoolAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">အီးမေးလ် (Email) *</label>
                <input type="email" required value={schoolAccEmail} onChange={e => setSchoolAccEmail(e.target.value)} placeholder="school@gmail.com" className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">စကားဝှက် (Password) *</label>
                <input type="text" required value={schoolAccPassword} onChange={e => setSchoolAccPassword(e.target.value)} placeholder="အနည်းဆုံး ၆ လုံး" className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 font-mono" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button type="button" onClick={() => setSchoolAccountModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">မလုပ်တော့ပါ</button>
                <button type="submit" disabled={isCreatingSchoolAcc} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50">
                  {isCreatingSchoolAcc ? 'ဖန်တီးနေပါသည်...' : 'အကောင့်ဖွင့်မည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

`;
    adminContent = before + newUI + after;
    console.log('✅ Admin.tsx တွင် Account Control Center UI အသစ် ထည့်သွင်းပြီးပါပြီ။');
  }
}

// 4. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v22.7';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v22\.6',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v22.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Account Control Center & Granular Permissions',
    changes: [
      { type: 'feat', text: 'Admin/Moderator နှင့် ကျောင်း(User) အကောင့်များကို တစ်နေရာတည်းတွင် စီမံခန့်ခွဲနိုင်သည့် Account Control Center အသစ် ထည့်သွင်းခြင်း။' },
      { type: 'feat', text: 'Moderator များအတွက် ကျောင်းဖျက်ခွင့်၊ ငွေစာရင်းထည့်ခွင့် စသည့် ခွင့်ပြုချက်များကို Checkbox ဖြင့် သီးသန့်သတ်မှတ်ပေးနိုင်ခြင်း။' },
      { type: 'improve', text: 'ကျောင်းအကောင့်ဖွင့်ရာတွင် prompt() အစား သပ်ရပ်သော Popup (Modal) ဖြင့် ဖန်တီးနိုင်စေရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v22.7 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 5. Build & Push
console.log('🔨 Build လုပ်ပြီး Error စစ်ဆေးနေပါသည်...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build အောင်မြင်ပါသည်။ Error မရှိပါ။');
} catch (error) {
  console.error('❌ Build မအောင်မြင်ပါ။ Error ရှိနေလို့ Commit မလုပ်တော့ပါ။');
  process.exit(1);
}

console.log('📦 GitHub သို့ Commit နှင့် Push လုပ်နေပါသည်...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat(admin): implement Account Control Center with granular permissions and modal for school account creation"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 6. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'ultimate-account-control.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}