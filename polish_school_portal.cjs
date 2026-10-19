const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️ School Portal UI ကို ပိုမိုကောင်းမွန်အောင် ပြင်ဆင်နေပါသည်...");

const portalPath = path.join(__dirname, 'src', 'pages', 'SchoolPortal.tsx');

if (fs.existsSync(portalPath)) {
  let content = fs.readFileSync(portalPath, 'utf8');
  
  // Add Eye and Link icons to imports
  if (!content.includes('Eye')) {
    content = content.replace(
      "import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users } from 'lucide-react';",
      "import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users, Eye, ShieldCheck, Clock } from 'lucide-react';"
    );
  }

  // Add a banner at the top of the form
  const headerRegex = /<h2 className="text-lg font-bold text-slate-900 border-b pb-3">သင့်ကျောင်း၏ အချက်အလက်များ ပြင်ဆင်ရန်<\/h2>/;
  const newHeader = `<div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-sky-950">လုံခြုံရေး အသိပေးချက်</h3>
              <p className="text-xs text-sky-800 mt-1">ဤအကောင့်သည် သင့်ကျောင်း၏ အချက်အလက်များကိုသာ ပြင်ဆင်ခွင့်ရှိပါသည်။ အခြားကျောင်းများ၏ ဒေတာများကို လုံးဝ ပြင်ဆင်၍ မရနိုင်ပါ။</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-3 mb-6">
            <h2 className="text-lg font-bold text-slate-900">အချက်အလက်များ ပြင်ဆင်ရန်</h2>
            <Link to={\`/schools/\${school.id}\`} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 transition flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> လူအများမြင်နေရသော Profile ကြည့်ရန်
            </Link>
          </div>`;
          
  content = content.replace(headerRegex, newHeader);

  // Add Link import from react-router-dom
  if (!content.includes('import { Link, useNavigate }')) {
    content = content.replace(
      "import { useNavigate } from 'react-router-dom';",
      "import { Link, useNavigate } from 'react-router-dom';"
    );
  }

  fs.writeFileSync(portalPath, content, 'utf8');
  console.log("✅ SchoolPortal UI ပြင်ဆင်ပြီးပါပြီ");
}

// Version Bump
const constantsPath = path.join(__dirname, 'src', 'constants.ts');
if (fs.existsSync(constantsPath)) {
  let constContent = fs.readFileSync(constantsPath, 'utf8');
  constContent = constContent.replace(/CURRENT_VERSION = '.*?'/, "CURRENT_VERSION = 'v7.2'");
  fs.writeFileSync(constantsPath, constContent, 'utf8');
}

console.log("🎉 ပြီးဆုံးပါပြီ! Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်! Error တစ်ခုမှ မရှိပါဘူး။");
} catch (error) {
  console.error("\n❌ Error ရှိနေပါတယ်။");
}