// D:\ssspsinfo-main\restore-school-account-btn.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ကျောင်းအကောင့် ဖန်တီးသည့် ခလုတ်ကို ပြန်လည်ထည့်သွင်းနေပါသည်...');

// 1. AdminSchoolManager.tsx တွင် အကောင့်ဖန်တီးသည့် ခလုတ် ပြန်ထည့်ခြင်း
const managerPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSchoolManager.tsx');
let managerContent = fs.readFileSync(managerPath, 'utf8');

// UserPlus icon ကို import လုပ်ထားခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း
if (!managerContent.includes('UserPlus')) {
  managerContent = managerContent.replace(
    "ArrowLeft, ChevronRight, Printer, UserPlus, MapPin",
    "ArrowLeft, ChevronRight, Printer, UserPlus, MapPin"
  );
}

// ခလုတ်ထည့်ရန် နေရာရှာခြင်း (Edit နှင့် Delete ခလုတ်ကြား)
const oldButtonBlock = `<Link to={\`/schools/\${school.id}\`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onEdit(school)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition" title="ပြင်ဆင်ရန်">
                            <Edit2 className="w-4 h-4" />
                          </button>`;

const newButtonBlock = `<Link to={\`/schools/\${school.id}\`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onCreateAccount(school)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="ကျောင်းအကောင့် ဖန်တီးရန်">
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(school)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition" title="ပြင်ဆင်ရန်">
                            <Edit2 className="w-4 h-4" />
                          </button>`;

if (managerContent.includes(oldButtonBlock)) {
  managerContent = managerContent.replace(oldButtonBlock, newButtonBlock);
  fs.writeFileSync(managerPath, managerContent);
  console.log('✅ AdminSchoolManager.tsx တွင် ကျောင်းအကောင့်ဖန်တီးသည့် ခလုတ် (UserPlus) ပြန်ထည့်ပြီးပါပြီ။');
} else {
  console.log('⚠️ ခလုတ်ထည့်ရန် နေရာကို ရှာမတွေ့ပါ။ ကိုယ်တိုင်စစ်ဆေးပါ။');
}

// 2. Version & Change Log
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(/export const CURRENT_VERSION = 'v\d+\.\d+';/, "export const CURRENT_VERSION = 'v22.1';");
fs.writeFileSync(constantsPath, constantsContent);

const versionsPath = path.join(__dirname, 'src', 'data', 'versions.ts');
let versionsContent = fs.readFileSync(versionsPath, 'utf8');
versionsContent = versionsContent.replace(/(version: 'v22\.0',\s*date: '.*?',\s*)isLatest: true/, "$1isLatest: false");

const newLog = `  {
    version: 'v22.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Restore School Account Creation',
    changes: [
      { type: 'fix', text: 'ကျောင်းစီမံခန့်ခွဲမှု (School Manager) တွင် ကျောင်းအကောင့် (School Portal Account) ဖန်တီးပေးနိုင်သည့် ခလုတ် ပျောက်ဆုံးနေခြင်းကို ပြန်လည်ဖြည့်စွက်ခြင်း။' }
    ],
  },
`;
versionsContent = versionsContent.replace('export const VERSIONS: VersionItem[] = [\n', 'export const VERSIONS: VersionItem[] = [\n' + newLog);
fs.writeFileSync(versionsPath, versionsContent);
console.log('✅ Version v22.1 နှင့် Change Log ထည့်သွင်းပြီးပါပြီ။');

// 3. Build & Push
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
  execSync('git commit -m "fix(ui): restore create account button in AdminSchoolManager"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub သို့ အောင်မြင်စွာ Push လုပ်ပြီးပါပြီ။');
} catch (error) {
  console.warn('⚠️ Git Push မအောင်မြင်ပါ သို့မဟုတ် ပြင်စရာ မရှိပါ။');
}

// 4. Cleanup
console.log('🧹 ယာယီဖိုင်များကို PowerShell ဖြင့် ရှင်းလင်းနေပါသည်...');
try {
  execSync('powershell -Command "Remove-Item -Path \'restore-school-account-btn.cjs\' -ErrorAction SilentlyContinue"', { stdio: 'inherit' });
  console.log('✅ ဖိုင်များ ရှင်းလင်းပြီးပါပြီ။');
} catch (e) {
  console.warn('⚠️ ဖိုင်ရှင်းလင်းရာတွင် အမှားအနည်းငယ် ရှိနေပါသည်။');
}