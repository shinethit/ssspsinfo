const { execSync } = require('child_process');

console.log("🔍 တစ်ခုလုံးကို Error ရှိမရှိ စစ်ဆေးနေပါသည် (TypeScript Compiler)...");
console.log("⏳ ခဏစောင့်ပါ (၅ စက္ကန့်လောက် ကြာနိုင်ပါတယ်)...\n");

try {
  // Run tsc --noEmit (This checks for Type and Syntax errors without building files)
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("\n✅ အားလုံး အောင်မြင်ပါတယ်။ Error တစ်ခုမှ မရှိပါဘူး။ (Safe to Run)");
} catch (error) {
  console.error("\n❌ အပေါ်မှာ ပြထားတဲ့ Error တွေကို သေချာဖတ်ပြီး ကျွန်တော့်ကို ပြောပြပါ။");
  console.error("ကျွန်တော် ချက်ချင်း ပြင်ပေးပါမယ်။");
}