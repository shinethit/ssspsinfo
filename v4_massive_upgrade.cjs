const fs = require('fs');
const path = require('path');

console.log("🚀 App ကို ဗားရှင်း 4.0 အဖြစ် အကြီးအကျယ် ပြင်ဆင်နေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. DASHBOARD SIMPLIFICATION (Hide Complex Tables by Default)
// ==========================================
const dashPath = path.join(pagesDir, 'Dashboard.tsx');
if (fs.existsSync(dashPath)) {
  let content = fs.readFileSync(dashPath, 'utf8');
  
  // Add state to toggle the complex breakdown
  if (!content.includes('showDetailedBreakdown')) {
    content = content.replace(
      "const [feeBreakdownTab, setFeeBreakdownTab] = useState<'level' | 'student_range' | 'amount' | 'matrix'>('level');",
      "const [feeBreakdownTab, setFeeBreakdownTab] = useState<'level' | 'student_range' | 'amount' | 'matrix'>('level');\n  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);"
    );
  }

  // Wrap the giant breakdown section in a toggle
  // Find the start of the breakdown section
  const sectionStart = content.indexOf('{/* 3. CORE ANNUAL FEE BREAKDOWN SECTION');
  // Find the start of the announcements section (which comes after the breakdown)
  const sectionEnd = content.indexOf('{/* 4. LATEST ANNOUNCEMENTS */');

  if (sectionStart !== -1 && sectionEnd !== -1) {
    const originalSection = content.substring(sectionStart, sectionEnd);
    
    const wrappedSection = `{/* Toggle Button for Detailed Breakdown */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
        >
          {showDetailedBreakdown ? 'အသေးစိတ် ဇယားများကို ပိတ်မည် ▲' : 'အသေးစိတ် ကိန်းဂဏန်းဇယားများ ကြည့်ရန် ▼'}
        </button>
      </div>

      {/* The original breakdown section, conditionally rendered */}
      {showDetailedBreakdown && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          ${originalSection}
        </div>
      )}

      `;
    
    content = content.substring(0, sectionStart) + wrappedSection + content.substring(sectionEnd);
    fs.writeFileSync(dashPath, content, 'utf8');
    console.log("✅ Dashboard ကို ရိုးရှင်းအောင် ပြင်ပြီးပါပြီ (ဇယားများကို ဖျောက်ထားသည်)");
  }
}

// ==========================================
// 2. SCHOOL DETAIL UI REFACTOR (Clean Cards)
// ==========================================
const detailPath = path.join(pagesDir, 'SchoolDetail.tsx');
if (fs.existsSync(detailPath)) {
  let content = fs.readFileSync(detailPath, 'utf8');
  
  // Replace the messy Contact Roles Grid with a cleaner layout
  const contactGridStart = content.indexOf('{/* Contact Roles Grid (Founder, Admin, Coordinator 1, Coordinator 2) */}');
  const contactGridEnd = content.indexOf('{/* Notes */}');
  
  if (contactGridStart !== -1 && contactGridEnd !== -1) {
    const newContactGrid = `
        {/* Contact Roles Grid (Founder, Admin, Coordinator 1, Coordinator 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Founder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sky-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> တည်ထောင်သူ (Founder)
            </h3>
            <p className="text-base font-semibold text-slate-900">{school.founderName || 'မဖော်ပြထားပါ'}</p>
            {(() => {
              const phones = [school.founderPhone, school.founderPhone2, ...(Array.isArray(school.founderPhones) ? school.founderPhones : [])].filter(Boolean);
              if (phones.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  {phones.map((ph, idx) => (
                    <a key={idx} href={\`tel:\${ph}\`} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium">
                      <Phone className="w-4 h-4 text-sky-500 shrink-0" /> {ph}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Administrator / Principal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sky-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> စီမံအုပ်ချုပ်သူ (Principal)
            </h3>
            <p className="text-base font-semibold text-slate-900">{school.adminName || 'မဖော်ပြထားပါ'}</p>
            {(() => {
              const phones = [school.adminPhone, school.adminPhone2, ...(Array.isArray(school.adminPhones) ? school.adminPhones : [])].filter(Boolean);
              if (phones.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  {phones.map((ph, idx) => (
                    <a key={idx} href={\`tel:\${ph}\`} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium">
                      <Phone className="w-4 h-4 text-sky-500 shrink-0" /> {ph}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Coordinator 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sky-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> တာဝန်ခံ (၁)
            </h3>
            <p className="text-base font-semibold text-slate-900">{school.responsiblePerson1Name || school.contactName || 'မဖော်ပြထားပါ'}</p>
            {(() => {
              const phones = [school.responsiblePerson1Phone, school.contactPhone, ...(Array.isArray(school.responsiblePerson1Phones) ? school.responsiblePerson1Phones : [])].filter((p, i, self) => Boolean(p) && self.indexOf(p) === i);
              if (phones.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  {phones.map((ph, idx) => (
                    <a key={idx} href={\`tel:\${ph}\`} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium">
                      <Phone className="w-4 h-4 text-sky-500 shrink-0" /> {ph}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Coordinator 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sky-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> တာဝန်ခံ (၂)
            </h3>
            <p className="text-base font-semibold text-slate-900">{school.responsiblePerson2Name || school.contact2Name || 'မဖော်ပြထားပါ'}</p>
            {(() => {
              const phones = [school.responsiblePerson2Phone, school.contact2Phone, ...(Array.isArray(school.responsiblePerson2Phones) ? school.responsiblePerson2Phones : [])].filter((p, i, self) => Boolean(p) && self.indexOf(p) === i);
              if (phones.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  {phones.map((ph, idx) => (
                    <a key={idx} href={\`tel:\${ph}\`} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium">
                      <Phone className="w-4 h-4 text-sky-500 shrink-0" /> {ph}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
    `;
    
    content = content.substring(0, contactGridStart) + newContactGrid + content.substring(contactGridEnd);
    fs.writeFileSync(detailPath, content, 'utf8');
    console.log("✅ SchoolDetail ကို သပ်ရပ်တဲ့ Card ပုံစံသို့ ပြောင်းပြီးပါပြီ");
  }
}

// ==========================================
// 3. FIX EXCEL UPLOAD IN ADMIN
// ==========================================
const adminPath = path.join(pagesDir, 'Admin.tsx');
const managerPath = path.join(adminDir, 'AdminSchoolManager.tsx');

// Pass handleExcelImport to the manager component
if (fs.existsSync(adminPath) && fs.existsSync(managerPath)) {
  let adminContent = fs.readFileSync(adminPath, 'utf8');
  let managerContent = fs.readFileSync(managerPath, 'utf8');

  // 1. Add prop in Admin.tsx
  adminContent = adminContent.replace(
    "onCleanDuplicates={cleanExistingDuplicates}",
    "onCleanDuplicates={cleanExistingDuplicates}\n          onExcelUpload={handleExcelImport}"
  );
  fs.writeFileSync(adminPath, adminContent, 'utf8');

  // 2. Receive prop in Manager
  managerContent = managerContent.replace(
    "onCleanDuplicates: () => void;",
    "onCleanDuplicates: () => void;\n  onExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;"
  );
  managerContent = managerContent.replace(
    "onCleanDuplicates, isUploadingExcel, excelUploadState",
    "onCleanDuplicates, onExcelUpload, isUploadingExcel, excelUploadState"
  );

  // 3. Connect the input onChange
  managerContent = managerContent.replace(
    "<input type=\"file\" accept=\".xlsx, .xls\" className=\"hidden\" onChange={(e) => { /* Trigger parent's excel upload */ }} />",
    "<input type=\"file\" accept=\".xlsx, .xls\" className=\"hidden\" onChange={onExcelUpload} />"
  );
  
  fs.writeFileSync(managerPath, managerContent, 'utf8');
  console.log("✅ Excel Upload Function ကို ပြန်လည် ချိတ်ဆက်ပြီးပါပြီ");
}

// ==========================================
// 4. VERSION BUMP & HISTORY
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v4.0'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v4.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'အကြီးစား ပြင်ဆင်မှုများ - Dashboard ရိုးရှင်းခြင်း၊ School Detail အသစ်နှင့် Excel ပြန်လည်ချိတ်ဆက်ခြင်း',
    changes: [
      { type: 'improve', text: 'Dashboard တွင် ရှုပ်ထွေးသော ကိန်းဂဏန်းဇယားကြီးများကို ဖျောက်ထားပြီး လိုအပ်မှသာ ခလုတ်နှိပ်၍ ကြည့်ရှုနိုင်စေရန် ပြင်ဆင်ခြင်း' },
      { type: 'improve', text: 'ကျောင်းအသေးစိတ် စာမျက်နှာ (SchoolDetail) ကို ဖတ်ရလွယ်ကူပြီး သပ်ရပ်သော Card ပုံစံသစ်ဖြင့် ပြန်လည်ဖန်တီးခြင်း' },
      { type: 'fix', text: 'Admin Panel မှ Excel ဖြင့် ကျောင်းစာရင်း တင်သွင်းသည့် (Excel Import) စနစ် အလုပ်မလုပ်တော့ခြင်းကို ပြန်လည်ပြင်ဆင်ခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 Batch Update ပြီးဆုံးပါပြီ! 'npm run dev' ကို Run ပြီး အပြောင်းအလဲအားလုံးကို တစ်ခါတည်း စမ်းသပ်ကြည့်ပါ။");