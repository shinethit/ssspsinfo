const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 ကျောင်းများအတွက် Account စနစ် (Member Portal) တည်ဆောက်နေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');
const typesPath = path.join(srcDir, 'types', 'index.ts');

// 1. Update Types (Add authUid to School)
if (fs.existsSync(typesPath)) {
  let content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes('authUid?: string;')) {
    content = content.replace(
      "export interface School {",
      "export interface School {\n  authUid?: string; // Linked Firebase Auth User ID\n  accountEmail?: string;"
    );
    fs.writeFileSync(typesPath, content, 'utf8');
  }
}

// 2. Create SchoolLogin.tsx
const loginPath = path.join(pagesDir, 'SchoolLogin.tsx');
const loginContent = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { School, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Authenticate
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 2. Verify this user is linked to a school
      const q = query(collection(db, 'schools'), where('authUid', '==', user.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Check by email just in case
        const q2 = query(collection(db, 'schools'), where('accountEmail', '==', user.email));
        const snap2 = await getDocs(q2);
        if (snap2.empty) {
          toast.error('ဤအကောင့်သည် ကျောင်းအကောင့်အဖြစ် သတ်မှတ်ထားခြင်း မရှိပါ');
          await auth.signOut();
          return;
        }
      }

      toast.success('အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်');
      navigate('/school-portal');
    } catch (err: any) {
      toast.error('အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-sky-100 text-sky-700 rounded-2xl mx-auto flex items-center justify-center mb-2">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">ကျောင်း အကောင့်ဝင်ရန်</h1>
          <p className="text-sm text-slate-500">Member Portal (School Login)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">အီးမေးလ် (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">စကားဝှက် (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-sky-900 text-white py-3 rounded-xl font-bold hover:bg-sky-800 transition">
            {isSubmitting ? 'စစ်ဆေးနေပါသည်...' : 'ဝင်ရောက်မည်'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-sky-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> ပင်မစာမျက်နှာသို့
          </Link>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(loginPath, loginContent, 'utf8');

// 3. Create SchoolPortal.tsx (Dashboard for Schools)
const portalPath = path.join(pagesDir, 'SchoolPortal.tsx');
const portalContent = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { School } from '../types';
import { toast } from 'sonner';
import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users } from 'lucide-react';

export default function SchoolPortal() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [township, setTownship] = useState('');
  const [studentCount, setStudentCount] = useState('');

  useEffect(() => {
    const fetchSchoolData = async () => {
      const user = auth.currentUser;
      if (!user) { navigate('/school-login'); return; }

      try {
        const q = query(collection(db, 'schools'), where('authUid', '==', user.uid));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as School;
          setSchool(data);
          setPhone(data.schoolPhone || '');
          setAddress(data.address || '');
          setTownship(data.township || '');
          setStudentCount(data.studentCount?.toString() || '');
        } else {
          toast.error('ကျောင်းအချက်အလက် ရှာမတွေ့ပါ');
        }
      } catch (err) {
        toast.error('ဒေတာဆွဲယူရာတွင် အမှားဖြစ်ပွားပါသည်');
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        schoolPhone: phone,
        address,
        township,
        studentCount: studentCount ? Number(studentCount) : null,
        updatedAt: new Date().toISOString()
      });
      toast.success('အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ');
      // Note: In a real app, you might want to set a "pending_approval" flag here
    } catch (err) {
      toast.error('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/school-login');
  };

  if (loading) return <div className="p-10 text-center">ခဏစောင့်ပါ...</div>;
  if (!school) return <div className="p-10 text-center">ကျောင်းအချက်အလက် မရှိပါ။</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <SchoolIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">{school.name}</h1>
              <p className="text-xs text-slate-500">School Member Portal</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg">
            <LogOut className="w-4 h-4" /> ထွက်မည်
          </button>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">သင့်ကျောင်း၏ အချက်အလက်များ ပြင်ဆင်ရန်</h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-3 h-3 text-sky-600"/> ကျောင်းဖုန်း</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Users className="w-3 h-3 text-sky-600"/> ကျောင်းသားဦးရေ</label>
                <input type="number" value={studentCount} onChange={e => setStudentCount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-sky-600"/> ကျောင်းလိပ်စာ</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">မြို့နယ်</label>
                <input type="text" value={township} onChange={e => setTownship(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={saving} className="bg-sky-900 hover:bg-sky-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'အချက်အလက်များ သိမ်းမည်'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(portalPath, portalContent, 'utf8');

// 4. Update AdminSchoolManager.tsx to include "Create Account" Button
const managerPath = path.join(adminDir, 'AdminSchoolManager.tsx');
if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  
  // We need to add a prop to handle account creation
  if (!content.includes('onCreateAccount')) {
    content = content.replace(
      "onUpdateStatus: (school: School, status: 'active' | 'under_review' | 'inactive') => void;",
      "onUpdateStatus: (school: School, status: 'active' | 'under_review' | 'inactive') => void;\n  onCreateAccount: (school: School) => void;"
    );
    content = content.replace(
      "onUpdateStatus, onOpenExcel,",
      "onUpdateStatus, onCreateAccount, onOpenExcel,"
    );
    // Add a user icon import
    content = content.replace("ArrowUpDown, ChevronLeft, ChevronRight, Printer", "ArrowUpDown, ChevronLeft, ChevronRight, Printer, UserPlus");
    
    // Add the button next to the receipt button
    const actionRow = `<Link to={\`/receipt/\${school.id}\`} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition" title="ငွေလက်ခံဖြတ်ပိုင်း ထုတ်ရန်">
                            <Printer className="w-4 h-4" />
                          </Link>`;
    const newActionRow = `<Link to={\`/receipt/\${school.id}\`} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition" title="ငွေလက်ခံဖြတ်ပိုင်း ထုတ်ရန်">
                            <Printer className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onCreateAccount(school)} className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition" title={school.authUid ? "အကောင့်ရှိပြီးသားဖြစ်သည်" : "ကျောင်းအကောင့် ဖန်တီးရန်"}>
                            <UserPlus className={\`w-4 h-4 \${school.authUid ? 'opacity-30' : ''}\`} />
                          </button>`;
    content = content.replace(actionRow, newActionRow);
    fs.writeFileSync(managerPath, content, 'utf8');
  }
}

// 5. Update Admin.tsx to handle Account Creation Logic
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');

  // Add imports
  if (!content.includes('createSchoolAccount')) {
    content = content.replace(
      "import { initializeApp, deleteApp } from 'firebase/app';",
      "import { initializeApp, deleteApp } from 'firebase/app';\nimport { createSchoolAccount } from '../lib/schoolAuth';"
    );
  }

  // Pass the handler to AdminSchoolManager
  if (!content.includes('onCreateAccount={handleCreateSchoolAccount}')) {
    content = content.replace(
      "onUpdateStatus={updateSchoolStatus}",
      "onUpdateStatus={updateSchoolStatus}\n          onCreateAccount={handleCreateSchoolAccount}"
    );
  }

  // Add the handler function inside the component
  if (!content.includes('const handleCreateSchoolAccount =')) {
    content = content.replace(
      "const onSchoolSubmit = async (data: any) => {",
      `const handleCreateSchoolAccount = async (school: School) => {
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
  };

  const onSchoolSubmit = async (data: any) => {`
    );
  }
  
  // Add School to imports if not there
  if (!content.includes('School, SchoolLevelItem')) {
     content = content.replace(
      "import { Association, NewsTicker, AuditLog, AdminUser, STUDENT_RANGE_TIERS, getStudentRangeTier, SchoolLevelItem } from '../types';",
      "import { Association, NewsTicker, AuditLog, AdminUser, STUDENT_RANGE_TIERS, getStudentRangeTier, SchoolLevelItem, School } from '../types';"
    );
  }

  fs.writeFileSync(adminPath, content, 'utf8');
}

// 6. Create schoolAuth.ts (Helper for creating auth accounts)
const schoolAuthPath = path.join(srcDir, 'lib', 'schoolAuth.ts');
const schoolAuthContent = `import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig, db } from './firebase';

export async function createSchoolAccount(email: string, password: string, schoolId: string): Promise<string> {
  const secondaryAppName = \`schoolWorker_\${Date.now()}\`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 1. Create User
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCred.user.uid;

    // 2. Link UID to the School document
    await updateDoc(doc(db, 'schools', schoolId), {
      authUid: uid,
      accountEmail: email
    });

    return uid;
  } finally {
    // 3. Clean up
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  }
}
`;
fs.writeFileSync(schoolAuthPath, schoolAuthContent, 'utf8');

// 7. Update App.tsx to add routes
const appPath = path.join(srcDir, 'App.tsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  if (!content.includes('SchoolLogin')) {
    content = content.replace(
      "import Receipt from './pages/Receipt';",
      "import Receipt from './pages/Receipt';\nimport SchoolLogin from './pages/SchoolLogin';\nimport SchoolPortal from './pages/SchoolPortal';"
    );
    content = content.replace(
      "<Route path=\"receipt/:id\" element={<Receipt />} />",
      "<Route path=\"receipt/:id\" element={<Receipt />} />\n            <Route path=\"school-login\" element={<SchoolLogin />} />\n            <Route path=\"school-portal\" element={<SchoolPortal />} />"
    );
    fs.writeFileSync(appPath, content, 'utf8');
  }
}

// 8. Version Bump & Auto-Check
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v7.1'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v7.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Member Portal စနစ် - ကျောင်းများ ကိုယ်တိုင်ဝင်ရောက်အသုံးပြုနိုင်သော အကောင့်စနစ် ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Admin မှ ကျောင်းများအတွက် အကောင့် (Email/Password) ဖန်တီးပေးနိုင်သည့် စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ကျောင်းများ ကိုယ်တိုင်ဝင်ရောက်ပြီး ၎င်းတို့၏ ဖုန်းနံပါတ်၊ လိပ်စာနှင့် ကျောင်းသားဦးရေများကို ပြင်ဆင်နိုင်သည့် School Portal စာမျက်နှာ ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ကျောင်းအကောင့်များကို သီးသန့် လုံခြုံသော စနစ်ဖြင့် ဖန်တီးပေးထားသဖြင့် Admin အကောင့်များနှင့် ရောထွေးမှု မရှိတော့ခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Member Portal စနစ် ပြီးဆုံးပါပြီ! Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ အပေါ်မှာ ပြထားတဲ့ Error တွေကို ကျွန်တော့်ကို ပြောပြပါ။ ချက်ချင်း ပြင်ပေးပါမယ်။");
}