const fs = require('fs');
const path = require('path');

console.log("🛠️ Production အတွက် အခြေခံအုတ်မြစ်များ ခိုင်မာအောင် ပြင်ဆင်နေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const libDir = path.join(srcDir, 'lib');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. Create phoneUtils.ts (Extract Duplicate Logic)
// ==========================================
const phoneUtilsPath = path.join(libDir, 'phoneUtils.ts');
const phoneUtilsContent = `import { School } from '../types';

export const toBurmeseNumber = (num: number): string => {
  const digits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return String(num).replace(/\\d/g, (d) => digits[parseInt(d, 10)]);
};

export interface CategorizedSchoolPhone {
  key: string;
  category: 'founder' | 'admin' | 'contact1' | 'contact2' | 'school';
  fullLabel: string;
  personName?: string;
  personRole?: string;
  number: string;
  cleanDial: string;
}

export const getCategorizedSchoolPhones = (school: School): CategorizedSchoolPhone[] => {
  const results: CategorizedSchoolPhone[] = [];

  const parseNumbers = (rawInputs: (string | undefined | null | string[])[]): string[] => {
    const list: string[] = [];
    const seen = new Set<string>();

    for (const input of rawInputs) {
      if (!input) continue;
      if (Array.isArray(input)) {
        for (const item of input) {
          if (!item || typeof item !== 'string') continue;
          const parts = item.split(/[/,\\n;]+/).map((p) => p.trim()).filter(Boolean);
          for (const p of parts) {
            const clean = p.replace(/[^0-9+]/g, '');
            if (clean && clean.length >= 5 && !seen.has(clean)) {
              seen.add(clean);
              list.push(p);
            }
          }
        }
      } else if (typeof input === 'string') {
        const parts = input.split(/[/,\\n;]+/).map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          const clean = p.replace(/[^0-9+]/g, '');
          if (clean && clean.length >= 5 && !seen.has(clean)) {
            seen.add(clean);
            list.push(p);
          }
        }
      }
    }
    return list;
  };

  const getPhoneLabel = (categoryPrefix: string, index: number): string => {
    if (index === 0) return \`\${categoryPrefix} ဖုန်း (၁)\`;
    if (index === 1) return \`\${categoryPrefix} ဖုန်း (၂)\`;
    return \`\${categoryPrefix} ဖုန်း (\${toBurmeseNumber(index + 1)})\`;
  };

  // 1. တည်ထောင်သူ ဖုန်း
  const founderNums = parseNumbers([school.founderPhone, school.founderPhone2, school.founderPhones]);
  founderNums.forEach((num, idx) => {
    results.push({
      key: \`founder-\${idx}-\${num}\`, category: 'founder', fullLabel: getPhoneLabel('တည်ထောင်သူ', idx),
      personName: school.founderName?.trim() || undefined, personRole: 'တည်ထောင်သူ (Founder)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 2. စီမံအုပ်ချုပ်သူ ဖုန်း
  const adminNums = parseNumbers([school.adminPhone, school.adminPhone2, school.adminPhones]);
  adminNums.forEach((num, idx) => {
    results.push({
      key: \`admin-\${idx}-\${num}\`, category: 'admin', fullLabel: getPhoneLabel('စီမံအုပ်ချုပ်သူ', idx),
      personName: school.adminName?.trim() || undefined, personRole: 'စီမံအုပ်ချုပ်သူ (Admin/Principal)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 3. တာဝန်ခံ (၁) ဖုန်း
  const contact1Nums = parseNumbers([school.responsiblePerson1Phone, school.contactPhone, school.responsiblePerson1Phone2, school.contactPhone2, school.responsiblePerson1Phones, school.contactPhones]);
  const contact1Name = (school.responsiblePerson1Name || school.contactName)?.trim();
  const contact1Role = (school.responsiblePerson1Role || school.contactRole)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၁)';
  contact1Nums.forEach((num, idx) => {
    results.push({
      key: \`contact1-\${idx}-\${num}\`, category: 'contact1', fullLabel: getPhoneLabel('တာဝန်ခံ (၁)', idx),
      personName: contact1Name || undefined, personRole: contact1Role,
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 4. တာဝန်ခံ (၂) ဖုန်း
  const contact2Nums = parseNumbers([school.responsiblePerson2Phone, school.contact2Phone, school.responsiblePerson2Phone2, school.contact2Phone2, school.responsiblePerson2Phones, school.contact2Phones]);
  const contact2Name = (school.responsiblePerson2Name || school.contact2Name)?.trim();
  const contact2Role = (school.responsiblePerson2Role || school.contact2Role)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၂)';
  contact2Nums.forEach((num, idx) => {
    results.push({
      key: \`contact2-\${idx}-\${num}\`, category: 'contact2', fullLabel: getPhoneLabel('တာဝန်ခံ (၂)', idx),
      personName: contact2Name || undefined, personRole: contact2Role,
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 5. ကျောင်း ဖုန်း
  const schoolNums = parseNumbers([school.schoolPhone, school.schoolPhone2, school.schoolPhones]);
  schoolNums.forEach((num, idx) => {
    results.push({
      key: \`school-\${idx}-\${num}\`, category: 'school', fullLabel: getPhoneLabel('ကျောင်း', idx),
      personRole: 'ကျောင်း ရုံးခန်း (School Office)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  return results;
};
`;
fs.writeFileSync(phoneUtilsPath, phoneUtilsContent, 'utf8');
console.log("✅ src/lib/phoneUtils.ts ဖန်တီးပြီးပါပြီ");

// ==========================================
// 2. Update Contacts.tsx and SchoolDetail.tsx to use phoneUtils
// ==========================================
const contactsPath = path.join(pagesDir, 'Contacts.tsx');
if (fs.existsSync(contactsPath)) {
  let content = fs.readFileSync(contactsPath, 'utf8');
  // Remove old definitions
  content = content.replace(/export interface SchoolPhoneItem[\s\S]*?return results;\n\};/, '');
  // Add import
  if (!content.includes('import { getCategorizedSchoolPhones, toBurmeseNumber }')) {
    content = content.replace(
      "import { downloadSchoolTemplate, exportSchoolsToExcel } from '../lib/excel';",
      "import { downloadSchoolTemplate, exportSchoolsToExcel } from '../lib/excel';\nimport { getCategorizedSchoolPhones, toBurmeseNumber } from '../lib/phoneUtils';"
    );
  }
  fs.writeFileSync(contactsPath, content, 'utf8');
  console.log("✅ Contacts.tsx ကို phoneUtils သုံးအောင် ပြင်ပြီးပါပြီ");
}

const detailPath = path.join(pagesDir, 'SchoolDetail.tsx');
if (fs.existsSync(detailPath)) {
  let content = fs.readFileSync(detailPath, 'utf8');
  if (!content.includes('import { getCategorizedSchoolPhones }')) {
    content = content.replace(
      "import { getAdminSession } from '../lib/adminAuth';",
      "import { getAdminSession } from '../lib/adminAuth';\nimport { getCategorizedSchoolPhones } from '../lib/phoneUtils';"
    );
  }
  fs.writeFileSync(detailPath, content, 'utf8');
}

// ==========================================
// 3. Simplify onSchoolSubmit in Admin.tsx (Remove Legacy Data Mess)
// ==========================================
const adminPath = path.join(pagesDir, 'Admin.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  
  // Find the giant payload object
  const payloadRegex = /const payload = \{\n        \.\.\.data,[\s\S]*?feePaidDate: data\.feePaidDate \|\| '',\n      \};/;
  
  // Create a much cleaner payload
  const newPayload = `const payload = {
        ...data,
        address: data.address?.trim() || '',
        township: data.township?.trim() || '',
        city: data.city?.trim() || '',
        zone: data.zone?.trim() || '',
        schoolPhone: data.schoolPhone?.trim() || '',
        schoolPhone2: data.schoolPhone2?.trim() || '',
        schoolPhones: extraSchoolPhones.map(p => p.trim()).filter(Boolean),
        
        founderName: data.founderName?.trim() || '',
        founderPhone: data.founderPhone?.trim() || '',
        founderPhone2: data.founderPhone2?.trim() || '',
        founderPhones: extraFounderPhones.map(p => p.trim()).filter(Boolean),
        founderViber: data.founderViber?.trim() || '',
        founderTelegram: data.founderTelegram?.trim() || '',

        adminName: data.adminName?.trim() || '',
        adminPhone: data.adminPhone?.trim() || '',
        adminPhone2: data.adminPhone2?.trim() || '',
        adminPhones: extraAdminPhones.map(p => p.trim()).filter(Boolean),
        adminViber: data.adminViber?.trim() || '',
        adminTelegram: data.adminTelegram?.trim() || '',

        // Clean mapping for Responsible Person 1
        responsiblePerson1Name: data.contactName?.trim() || '',
        responsiblePerson1Role: data.contactRole?.trim() || '',
        responsiblePerson1Phone: data.contactPhone?.trim() || '',
        responsiblePerson1Phone2: data.contactPhone2?.trim() || '',
        responsiblePerson1Phones: extraCoord1Phones.map(p => p.trim()).filter(Boolean),
        responsiblePerson1Viber: data.contactViber?.trim() || '',
        responsiblePerson1Telegram: data.contactTelegram?.trim() || '',
        // Keep old fields for backward compatibility
        contactName: data.contactName?.trim() || '',
        contactRole: data.contactRole?.trim() || '',
        contactPhone: data.contactPhone?.trim() || '',
        contactPhone2: data.contactPhone2?.trim() || '',
        contactPhones: extraCoord1Phones.map(p => p.trim()).filter(Boolean),
        contactViber: data.contactViber?.trim() || '',
        contactTelegram: data.contactTelegram?.trim() || '',

        // Clean mapping for Responsible Person 2
        responsiblePerson2Name: data.contact2Name?.trim() || '',
        responsiblePerson2Role: data.contact2Role?.trim() || '',
        responsiblePerson2Phone: data.contact2Phone?.trim() || '',
        responsiblePerson2Phone2: data.contact2Phone2?.trim() || '',
        responsiblePerson2Phones: extraCoord2Phones.map(p => p.trim()).filter(Boolean),
        responsiblePerson2Viber: data.contact2Viber?.trim() || '',
        responsiblePerson2Telegram: data.contact2Telegram?.trim() || '',
        // Keep old fields for backward compatibility
        contact2Name: data.contact2Name?.trim() || '',
        contact2Role: data.contact2Role?.trim() || '',
        contact2Phone: data.contact2Phone?.trim() || '',
        contact2Phone2: data.contact2Phone2?.trim() || '',
        contact2Phones: extraCoord2Phones.map(p => p.trim()).filter(Boolean),
        contact2Viber: data.contact2Viber?.trim() || '',
        contact2Telegram: data.contact2Telegram?.trim() || '',

        studentRange: data.studentRange || '0-100',
        studentCount: cleanStudentCount,
        feeAmount: cleanFeeAmount,
        feeAcademicYear: data.feeAcademicYear || '၂၀၂၄-၂၀၂၅',
        feePaidDate: data.feePaidDate || '',
      };`;

  if (payloadRegex.test(content)) {
    content = content.replace(payloadRegex, newPayload);
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log("✅ Admin.tsx ထဲက ရှုပ်ထွေးနေတဲ့ Form Submit Logic ကို ရှင်းလင်းပြီးပါပြီ");
  } else {
    console.log("⚠️ Admin.tsx ထဲမှာ Payload Logic ကို ရှာမတွေ့ပါ။");
  }
}

// ==========================================
// 4. Add Pagination to AdminSchoolManager.tsx
// ==========================================
const managerPath = path.join(adminDir, 'AdminSchoolManager.tsx');
if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  
  // Add page state
  if (!content.includes('const [currentPage, setCurrentPage]')) {
    content = content.replace(
      "const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'fee_paid' | 'fee_unpaid'>('name_asc');",
      "const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'fee_paid' | 'fee_unpaid'>('name_asc');\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 20;"
    );
  }

  // Slice the grouped data
  const renderRegex = /\{groupedData\.map\(group => \{/;
  const renderReplacement = `{groupedData.map(group => {
            const startIdx = (currentPage - 1) * itemsPerPage;
            const paginatedSchools = group.schools.slice(startIdx, startIdx + itemsPerPage);
            if (paginatedSchools.length === 0) return null;
`;
  content = content.replace(renderRegex, renderReplacement);

  // Replace group.schools.map with paginatedSchools.map
  content = content.replace(/\{group\.schools\.map\(school => \(/, `{paginatedSchools.map(school => (`);

  // Add pagination controls at the bottom of the list
  const footerRegex = /<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);/;
  const paginationUI = `</div>
              </div>
            );
          })
        )}
        
        {/* Pagination Controls */}
        {groupedData.length > 0 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl mt-4">
            <span className="text-xs text-slate-500">
              စာမျက်နှာ {currentPage} / {Math.ceil(groupedData[0].schools.length / itemsPerPage)} (စုစုပေါင်း {groupedData[0].schools.length} ကျောင်း)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                ရှေ့သို့
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(groupedData[0].schools.length / itemsPerPage)}
                className="px-3 py-1.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-lg hover:bg-sky-200 disabled:opacity-50"
              >
                နောက်သို့
              </button>
            </div>
          </div>
        )}
      </div>
    );
  });`;
  
  // Note: The regex here is a bit fragile, so I'm just doing a simple string replace for the end of the file
  content = content.replace("</div>\n    </div>\n  );\n}", paginationUI);

  fs.writeFileSync(managerPath, content, 'utf8');
  console.log("✅ AdminSchoolManager.tsx တွင် Pagination (စာမျက်နှာခွဲခြင်း) ထည့်ပြီးပါပြီ");
}

// 5. Bump Version
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v5.0'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

// 6. Update Version History
const versionsPath = path.join(srcDir, 'data', 'versions.ts');
if (fs.existsSync(versionsPath)) {
  let content = fs.readFileSync(versionsPath, 'utf8');
  const newEntry = `  {
    version: 'v5.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Production အတွက် အခြေခံအုတ်မြစ် ခိုင်မာအောင် ပြင်ဆင်ခြင်း (Production Hardening)',
    changes: [
      { type: 'improve', text: 'Code များ ထပ်နေခြင်းကို ရှင်းလင်းရန် ဖုန်းနံပါတ်ခွဲထုတ်သည့် စနစ် (phoneUtils) ကို သီးသန့် ဖိုင်အဖြစ် ခွဲထုတ်ခြင်း' },
      { type: 'fix', text: 'ကျောင်းအချက်အလက် သိမ်းဆည်းရာတွင် Data Field အဟောင်းနှင့် အသစ် ရောထွေးနေမှုကို ရှင်းလင်းပြီး တစ်ပြေးညီ ဖြစ်စေရန် ပြင်ဆင်ခြင်း' },
      { type: 'feat', text: 'ကျောင်းစာရင်း (၅၀၀) ကျော် ရှိလာပါက App လေးလံမသွားစေရန် Admin Panel တွင် Pagination (စာမျက်နှာခွဲပြသခြင်း) စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
`;
  content = content.replace("isLatest: true,", "isLatest: false,");
  content = content.replace("export const VERSIONS: VersionItem[] = [\n", "export const VERSIONS: VersionItem[] = [\n" + newEntry);
  fs.writeFileSync(versionsPath, content, 'utf8');
}

console.log("🎉 အားလုံး ပြီးဆုံးပါပြီ! 'npm run dev' ကို Run ပြီး စမ်းသပ်ကြည့်ပါ။");