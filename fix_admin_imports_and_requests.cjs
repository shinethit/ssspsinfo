const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️ Admin.tsx Error များ ပြင်ဆင်ခြင်းနှင့် Update Request စနစ် ထည့်သွင်းနေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. Fix Admin.tsx Missing Icons
// ==========================================
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  // Add Trophy and FolderOpen to lucide-react imports if not present
  if (!content.includes('Trophy,')) {
    // We find the closing bracket of the lucide-react import block
    const importEndRegex = /(FileSpreadsheet,\s*\n)(\} from 'lucide-react';)/;
    
    if (importEndRegex.test(content)) {
      content = content.replace(importEndRegex, "$1  Trophy,\n  FolderOpen,\n$2");
    } else {
      // Fallback: Just replace the last known icon
      content = content.replace(
        "FileSpreadsheet,\n} from 'lucide-react';",
        "FileSpreadsheet,\n  Trophy,\n  FolderOpen,\n} from 'lucide-react';"
      );
    }
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log("✅ Admin.tsx တွင် လိုအပ်သော Icons များ ထည့်သွင်းပြီးပါပြီ");
  }
}

// ==========================================
// 2. Add Types for Update Requests
// ==========================================
const typesPath = path.join(srcDir, 'types', 'index.ts');
if (fs.existsSync(typesPath)) {
  let content = fs.readFileSync(typesPath, 'utf8');
  
  if (!content.includes('export interface SchoolUpdateRequest')) {
    content += `

export interface SchoolUpdateRequest {
  id: string;
  schoolId: string;
  schoolName: string;
  requestedBy: string; // Email or Name of the person requesting
  contactPhone: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
`;
    fs.writeFileSync(typesPath, content, 'utf8');
    console.log("✅ Types များ ထည့်သွင်းပြီးပါပြီ");
  }
}

// ==========================================
// 3. Create AdminRequestsManager.tsx
// ==========================================
const requestsPath = path.join(adminDir, 'AdminRequestsManager.tsx');
const requestsContent = `import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolUpdateRequest } from '../../types';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, Check, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<SchoolUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSchool } = useData();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'school_update_requests'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolUpdateRequest));
      // Sort by newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (req: SchoolUpdateRequest) => {
    if (!confirm('ဤပြင်ဆင်ချက်များကို အတည်ပြုပြီး ကျောင်းအချက်အလက်သို့ ထည့်သွင်းရန် သေချာပါသလား?')) return;
    
    try {
      // Build the update payload
      const updates: Record<string, any> = {};
      req.changes.forEach(change => {
        updates[change.field] = change.newValue;
      });

      // 1. Update School
      await updateSchool(req.schoolId, updates);

      // 2. Mark request as approved
      await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'approved' });
      
      toast.success('အတည်ပြုပြီး ကျောင်းအချက်အလက် Update လုပ်ပြီးပါပြီ');
      fetchRequests();
    } catch (err) {
      toast.error('အတည်ပြုရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handleReject = async (req: SchoolUpdateRequest) => {
    if (!confirm('ဤတောင်းဆိုချက်ကို ပယ်ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'rejected' });
      toast.success('တောင်းဆိုချက်ကို ပယ်ဖျက်လိုက်ပါပြီ');
      fetchRequests();
    } catch (err) {
      toast.error('ပယ်ဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'school_update_requests', id));
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-sky-600" /> ကျောင်းများ၏ အချက်အလက်ပြင်ဆင်ခွင့် တောင်းဆိုမှုများ
        </h3>

        {loading ? (
          <div className="text-center py-10 text-slate-500">ဒေတာများ ဆွဲယူနေပါသည်...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">တောင်းဆိုမှု မရှိသေးပါ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className={\`border rounded-xl p-4 transition \${req.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : req.status === 'approved' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50'}\`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200/60 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{req.schoolName}</h4>
                      <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 \${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }\`}>
                        {req.status === 'pending' ? <><Clock className="w-3 h-3"/> စစ်ဆေးရန် ကျန်</> : 
                         req.status === 'approved' ? <><CheckCircle2 className="w-3 h-3"/> အတည်ပြုပြီး</> : 
                         <><XCircle className="w-3 h-3"/> ပယ်ဖျက်ပြီး</>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">တောင်းဆိုသူ: {req.requestedBy} • ဖုန်း: {req.contactPhone} • ရက်စွဲ: {new Date(req.createdAt).toLocaleDateString('my-MM')}</p>
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleReject(req)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> ပယ်မည်
                      </button>
                      <button onClick={() => handleApprove(req)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> အတည်ပြုမည်
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">ပြင်ဆင်လိုသော အချက်အလက်များ:</span>
                  {req.changes.map((change, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                      <div className="font-semibold text-slate-600">{change.field}</div>
                      <div className="text-rose-600 line-through truncate">{change.oldValue || '(အလွတ်)'}</div>
                      <div className="text-emerald-700 font-bold truncate">➔ {change.newValue || '(အလွတ်)'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync(requestsPath, requestsContent, 'utf8');
console.log("✅ AdminRequestsManager.tsx ဖန်တီးပြီးပါပြီ");

// ==========================================
// 4. Update Admin.tsx to include Requests Tab
// ==========================================
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  if (!content.includes('AdminRequestsManager')) {
    content = content.replace(
      "import AdminDocumentManager from '../components/admin/AdminDocumentManager';",
      "import AdminDocumentManager from '../components/admin/AdminDocumentManager';\nimport AdminRequestsManager from '../components/admin/AdminRequestsManager';"
    );
  }

  // Add to activeTab type
  content = content.replace(
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup' | 'events' | 'sports' | 'documents'",
    "'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup' | 'events' | 'sports' | 'documents' | 'requests'"
  );

  // Add Tab Button
  const tabRegex = /<button\s+onClick=\{\(\) => setActiveTab\('documents'\)\}[\s\S]*?<\/button>/;
  const newTab = `<button
            onClick={() => setActiveTab('documents')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'documents'
                ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <FolderOpen className="w-4 h-4 shrink-0 text-amber-600" /> စာရွက်စာတမ်း (Docs)
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            type="button"
            className={\`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer \${
              activeTab === 'requests'
                ? 'bg-white text-rose-900 shadow-xs ring-1 ring-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <FileText className="w-4 h-4 shrink-0 text-rose-600" /> တောင်းဆိုမှုများ
          </button>`;
  content = content.replace(tabRegex, newTab);

  // Render Tab Content
  const renderRegex = /\{activeTab === 'documents' && \(\s*<AdminDocumentManager \/>\s*\)\}/;
  const newRender = `{activeTab === 'documents' && (
        <AdminDocumentManager />
      )}

      {activeTab === 'requests' && (
        <AdminRequestsManager />
      )}`;
  content = content.replace(renderRegex, newRender);

  fs.writeFileSync(adminPath, content, 'utf8');
  console.log("✅ Admin.tsx တွင် Requests Tab ထည့်သွင်းပြီးပါပြီ");
}

// ==========================================
// 5. Update Version & Auto Check
// ==========================================
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
    title: 'Import Error များ ပြင်ဆင်ခြင်းနှင့် ကျောင်းများ အချက်အလက်ပြင်ဆင်ခွင့် (Update Requests) စနစ် ထည့်သွင်းခြင်း',
    changes: [
      { type: 'fix', text: 'Admin Panel တွင် လိုအပ်သော Icon များ (Trophy, FolderOpen) Import မလုပ်ထားခြင်းကြောင့် ဖြစ်ပေါ်နေသော TypeScript Error များကို ပြင်ဆင်ခြင်း' },
      { type: 'feat', text: 'ကျောင်းများမှ ၎င်းတို့၏ အချက်အလက်များ ပြင်ဆင်လိုပါက တောင်းဆိုနိုင်သည့် (Update Request) စနစ် အပြည့်အစုံ ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Admin အနေဖြင့် တောင်းဆိုမှုများကို ကြည့်ရှုစစ်ဆေးပြီး အတည်ပြု/ပယ်ဖျက် လုပ်ဆောင်နိုင်သည့် စီမံခန့်ခွဲမှု စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 အားလုံး ပြီးဆုံးပါပြီ! ယခု Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ အပေါ်မှာ ပြထားတဲ့ Error တွေကို ကျွန်တော့်ကို ပြောပြပါ။ ချက်ချင်း ပြင်ပေးပါမယ်။");
}