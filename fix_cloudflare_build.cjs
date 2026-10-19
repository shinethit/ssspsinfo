const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️ Cloudflare Build Error ကို ဖြေရှင်းနေပါသည်...");

const npmrcPath = path.join(__dirname, '.npmrc');

// 1. Create .npmrc file to force legacy-peer-deps during build
fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n', 'utf8');
console.log("✅ .npmrc ဖိုင် ဖန်တီးပြီးပါပြီ (legacy-peer-deps=true)");

// 2. Auto-Check
console.log("🎉 Error ရှိမရှိ အလိုအလျောက် စစ်ဆေးပါမည်...\n");

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ ကုဒ်အပိုင်း Error မရှိပါဘူး။ ယခု Git ကို Push လုပ်ပါ။");
  console.log("PowerShell မှာ အောက်ပါ Command တွေကို ရိုက်ပါ -");
  console.log("git add .");
  console.log("git commit -m \"Fix: Add .npmrc to resolve Cloudflare build dependency conflict\"");
  console.log("git push origin main");
} catch (error) {
  console.error("\n❌ ကုဒ်အပိုင်း Error ရှိနေပါတယ်။");
}