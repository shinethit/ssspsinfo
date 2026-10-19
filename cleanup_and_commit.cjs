const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🧹 Folder သန့်ရှင်းရေးနှင့် Git Push လုပ်နေပါသည်...");

// 1. Delete all .cjs files in the root directory
const files = fs.readdirSync(__dirname);
let deletedCount = 0;

files.forEach(file => {
  if (file.endsWith('.cjs') && file !== 'cleanup_and_commit.cjs') {
    fs.unlinkSync(path.join(__dirname, file));
    deletedCount++;
  }
});
console.log(`✅ အလုပ်ပြီးသွားသော Script ဖိုင် (${deletedCount}) ခုကို ဖျက်ပြီးပါပြီ။`);

// 2. Run Git commands
try {
  console.log("📦 Git သို့ အပြောင်းအလဲများ ထည့်သွင်းနေသည်...");
  execSync('git add .', { stdio: 'inherit' });
  
  console.log("💾 Commit လုပ်နေသည်...");
  execSync('git commit -m "Major UI/UX Overhaul: Refactored Admin, Added Global Search, Standardized Forms, Professional Tone, and Automated Versioning"', { stdio: 'inherit' });
  
  console.log("🚀 GitHub သို့ Push လုပ်နေသည်...");
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("🎉 အားလုံး အောင်မြင်ပါပြီ! Folder က ပြန်ပြီး သန့်ရှင်းသွားပါပြီ။");
} catch (error) {
  console.error("❌ Git လုပ်ဆောင်ချက်မှာ အမှားဖြစ်သွားပါတယ်။ (GitHub login လိုအပ်နေလား စစ်ဆေးပါ)");
}