const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️ TypeScript Error များကို အလိုအလျောက် ပြင်ဆင်နေပါသည်...");

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const adminDir = path.join(srcDir, 'components', 'admin');

// ==========================================
// 1. Fix AdminSchoolManager.tsx (Type mismatch)
// ==========================================
const managerPath = path.join(adminDir, 'AdminSchoolManager.tsx');
if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  content = content.replace(
    "onUpdateStatus: (school: School, status: string) => void;",
    "onUpdateStatus: (school: School, status: 'active' | 'under_review' | 'inactive') => void;"
  );
  fs.writeFileSync(managerPath, content, 'utf8');
  console.log("✅ AdminSchoolManager.tsx Type Error ပြင်ပြီးပါပြီ");
}

// ==========================================
// 2. Fix Announcements.tsx (Undefined sortOrder)
// ==========================================
const annPath = path.join(pagesDir, 'Announcements.tsx');
if (fs.existsSync(annPath)) {
  let content = fs.readFileSync(annPath, 'utf8');
  content = content.replace(
    "}, [announcements, selectedCategory, searchQuery, sortOrder]);",
    "}, [announcements, selectedCategory, searchQuery, sortBy]);"
  );
  fs.writeFileSync(annPath, content, 'utf8');
  console.log("✅ Announcements.tsx Sort Error ပြင်ပြီးပါပြီ");
}

// ==========================================
// 3. Fix Contacts.tsx (Remove duplicate local declarations)
// ==========================================
const contactsPath = path.join(pagesDir, 'Contacts.tsx');
if (fs.existsSync(contactsPath)) {
  let content = fs.readFileSync(contactsPath, 'utf8');

  // Regex to match from the old Burmese numbers converter down to the end of the old getCategorizedSchoolPhones function
  const duplicateBlockRegex = /\/\/ Burmese numbers converter[\s\S]*?return results;\n\};\n/;
  
  if (duplicateBlockRegex.test(content)) {
    content = content.replace(duplicateBlockRegex, '');
    fs.writeFileSync(contactsPath, content, 'utf8');
    console.log("✅ Contacts.tsx ထဲက ထပ်နေတဲ့ Code အဟောင်းများကို ဖျက်ပြီးပါပြီ");
  } else {
    console.log("⚠️ Contacts.tsx ထဲမှာ ဖျက်ရမယ့် Code အဟောင်းကို ရှာမတွေ့ပါ။");
  }
}

// ==========================================
// 4. Version Bump
// ==========================================
const constantsPath = path.join(srcDir, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v5.3'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

// ==========================================
// 5. AUTO-CHECK: Run TypeScript Compiler
// ==========================================
console.log("\n🔍 ပြင်ဆင်မှု အောင်မြင်မှုရှိမရှိ စစ်ဆေးနေပါသည်...");
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိတော့ပါဘူး။ 'npm run dev' ကို Run နိုင်ပါပြီ။");
} catch (error) {
  console.error("\n❌ နောက်ထပ် Error တွေ ရှိနေပါသေးတယ်။ အပေါ်က စာသားကို ကြည့်ပြီး ကျွန်တော့်ကို ပြောပြပါ။");
}