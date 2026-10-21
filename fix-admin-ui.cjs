// D:\ssspsinfo-main\fix-admin-ui.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Admin UI ကို ပြန်လည် သန့်ရှင်းရေးလုပ်နေပါသည်...');

const adminPath = path.join(__dirname, 'src', 'pages', 'Admin.tsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// 1. Header ကို သပ်ရပ်အောင် ပြင်ဆင်ခြင်း
const oldHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950">အက်ဒမင် ဧရိယာ (Admin Area)</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">အသင်းများ၊ ကြေညာချက်များ၊ အသင်းဝင်ကျောင်းများ၊ အက်ဒမင်များနှင့် လုပ်ဆောင်ချက် မှတ်တမ်းများ</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-sky-900">{adminSession.email || 'khunthanshwe@gmail.com'}</span>
            <span>•</span>
            <span className="text-slate-400">စနစ်ထိန်းချုပ်ခွင့် အပြည့်အစုံ ရရှိထားပါသည်</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTargetChangePassEmail(adminSession.email || 'khunthanshwe@gmail.com');
              setNewAdminPasswordInput('');
              setIsChangingPassModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition cursor-pointer shadow-2xs"
            title="အက်ဒမင် စကားဝှက် ပြောင်းလဲမည်"
          >
            <KeyRound className="w-4 h-4 text-sky-700" />
            <span>စကားဝှက် ပြောင်းမည်</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Admin အကောင့်မှ ထွက်ခွာမည်"
          >
            <LogOut className="w-4 h-4" />
            <span>အကောင့်ထွက်မည် (Logout)</span>
          </button>
        </div>
      </div>`;

const newHeader = `<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950">အက်ဒမင် ဧရိယာ (Admin Area)</h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> Super Admin
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">အသင်းများ၊ ကြေညာချက်များ၊ အသင်းဝင်ကျောင်းများ၊ အက်ဒမင်များနှင့် လုပ်ဆောင်ချက် မှတ်တမ်းများ</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
            <span className="font-semibold text-sky-900">{adminSession.email || 'khunthanshwe@gmail.com'}</span>
            <span>•</span>
            <span className="text-slate-400">စနစ်ထိန်းချုပ်ခွင့် အပြည့်အစုံ</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTargetChangePassEmail(adminSession.email || 'khunthanshwe@gmail.com');
              setNewAdminPasswordInput('');
              setIsChangingPassModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition cursor-pointer shadow-2xs"
            title="အက်ဒမင် စကားဝှက် ပြောင်းလဲမည်"
          >
            <KeyRound className="w-4 h-4 text-sky-700" />
            <span>စကားဝှက် ပြောင်းမည်</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Admin အကောင့်မှ ထွက်ခွာမည်"
          >
            <LogOut className="w-4 h-4" />
            <span>အကောင့်ထွက်မည် (Logout)</span>
          </button>
        </div>
      </div>`;

if (adminContent.includes(oldHeader)) {
  adminContent = adminContent.replace(oldHeader, newHeader);
  console.log('✅ Admin Header ကို သပ်ရပ်အောင် ပြင်ပြီးပါပြီ။');
}

// 2. Tab ခလုတ်များကို အရောင်စုံဖြစ်နေတာကို ပြင်ပြီး သပ်ရပ်သော Style တစ်ခုတည်း ဖြစ်စေရန် ပြင်ဆင်ခြင်း
const oldTabsBlockStart = `<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">`;
const newTabsBlockStart = `<div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 w-full overflow-x-auto">`;

if (adminContent.includes(oldTabsBlockStart)) {
  adminContent = adminContent.replace(oldTabsBlockStart, newTabsBlockStart);
}

// တစ်ခုချင်းစီရဲ့ Active/Inactive Style တွေကို ပြောင်းခြင်း (ရှုပ်ထွေးနေတဲ့ အရောင်တွေကို ဖျက်ပြီး စံချိန်မှီ Style သုံးမယ်)
const tabStyleRegex = /className=\{`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1\.5 cursor-pointer col-span-2 sm:col-span-1 \$\{[^}]+\}`\}/g;
const cleanTabStyle = 'className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === activeTab ? \'bg-sky-900 text-white shadow-md\' : \'bg-transparent text-slate-600 hover:bg-white hover:text-sky-900\'}`}';

// (ဒီ Regex က အတိအကျ မက်ချင်မှ မိနိုင်တာမို့ အခြေခံကျတဲ့ အစားထိုးနည်းကို သုံးပါမယ်)

adminContent = adminContent.replace(/className=\{`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1\.5 cursor-pointer col-span-2 sm:col-span-1 \$\{[\s\S]*?\}`\}/g, 'className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === \'__ID__\' ? \'bg-sky-900 text-white shadow-md\' : \'bg-transparent text-slate-600 hover:bg-white hover:text-sky-900\'}`}');

adminContent = adminContent.replace(/className=\{`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1\.5 cursor-pointer \$\{[\s\S]*?\}`\}/g, 'className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === \'__ID__\' ? \'bg-sky-900 text-white shadow-md\' : \'bg-transparent text-slate-600 hover:bg-white hover:text-sky-900\'}`}');

// __ID__ တွေကို သက်ဆိုင်ရာ Tab နာမည်တွေနဲ့ အစားထိုးခြင်း
const tabNames = ['announcements', 'associations', 'schools', 'levels', 'tickers', 'events', 'sports', 'documents', 'finance', 'requests', 'audit_logs', 'admins', 'backup'];
tabNames.forEach(name => {
  adminContent = adminContent.replace(`'__ID__'`, `'${name}'`);
});

// 3. User Account ဖန်တီးခြင်းကို ပိုမိုရှင်းလင်းစေရန် အညွှန်းစာသား ထည့်ခြင်း
// AdminSchoolManager ကို ခေါ်တဲ့ နေရာမှာ သတိပေးချက် ထည့်မယ်
const schoolManagerCall = `<AdminSchoolManager
          role={role}
          schools={schoolsForZone}`;

const schoolManagerNewCall = `{/* ကျောင်းများ စီမံခန့်ခွဲမှု အပိုင်း */}
      {activeTab === 'schools' && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl mb-4 text-sky-900 text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <span>ကျောင်းအကောင့် (User Account) ဖန်တီးရန် အောက်ပါစာရင်းမှ ကျောင်းတစ်ခုချင်းစီ၏ ညာဘက်ရှိ <b>👤+ (UserPlus) ခလုတ်</b> ကို နှိပ်ပါ။</span>
        </div>
      )}

      <AdminSchoolManager
          role={role}
          schools={schoolsForZone}`;

if (adminContent.includes(schoolManagerCall)) {
  adminContent = adminContent.replace(schoolManagerCall, schoolManagerNewCall);
}

// 4. School Manager UI ကို ပိုမိုရှင်းလင်းအောင် ပြင်ဆင်ခြင်း (UserPlus ခလုတ်ကို ပိုမိုထင်ရှားစေရန်)
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

const oldActionButtons = `<div className="flex items-center gap-2 shrink-0 ml-14 md:ml-0">`;
const newActionButtons = `<div className="flex items-center gap-1.5 shrink-0 ml-14 md:ml-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">`;

if (managerContent.includes(oldActionButtons)) {
  managerContent = managerContent.replace(oldActionButtons, newActionButtons);
}

// UserPlus ခလုတ်ကို အရောင်တောက်တောက် ပြောင်းမယ်
const oldUserPlus = `<button onClick={() => onCreateAccount(school)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="ကျောင်းအကောင့် ဖန်တီးရန်">
                            <UserPlus className="w-4 h-4" />
                          </button>`;

const newUserPlus = `<button onClick={() => onCreateAccount(school)} className="p-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition shadow-sm border border-emerald-200" title="ကျောင်းအကောင့် (User Account) ဖန်တီးရန်">
                            <UserPlus className="w-4 h-4" />
                          </button>`;

if (managerContent.includes(oldUserPlus)) {
  managerContent = managerContent.replace(oldUserPlus, newUserPlus);
}

// Edit, Delete တွေကို ပြန်ညှိမယ်
managerContent = managerContent.replace(
  `<Link to={\`/schools/\${school.id}\`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">`,
  `<Link to={\`/schools/\${school.id}\`} className="p-2 text-slate-500 hover:text-sky-700 hover:bg-sky-100 rounded-lg transition" title="ကြည့်ရန်">`
);
managerContent = managerContent.replace(
  `<button onClick={() => onEdit(school)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition" title="ပြင်ဆင်ရန်">`,
  `<button onClick={() => onEdit(school)} className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition" title="ပြင်ဆင်ရန်">`
);

fs.writeFileSync(managerPath, managerContent);
console.log('✅ AdminSchoolManager.tsx တွင် User Account ခလုတ်ကို ပိုမိုထင်ရှားအောင် ပြင်ပြီးပါပြီ။');

// 5. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v22.6';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v22\.5',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v22.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Admin UI Cleanup & User Account Visibility',
    changes: [
      { type: 'improve', text: 'Admin Area ၏ ခေါင်းစဉ်နှင့် Tab ခလုတ်များကို သပ်ရပ်ပြီး ခေတ်မီသော ပုံစံသို့ ပြင်ဆင်ခြင်း။' },
      { type: 'improve', text: 'ကျောင်းအကောင့် (User Account) ဖန်တီးသည့် ခလုတ်ကို ပိုမိုထင်ရှားစွာ မြင်တွေ့နိုင်စေရန် အစိမ်းရောင် Highlight ပြုလုပ်ပေးခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v22.6 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 6. Build & Push
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
  execSync('git commit -m "ui(admin): clean up admin header, tabs, and highlight user account creation button"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 7. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'fix-admin-ui.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}