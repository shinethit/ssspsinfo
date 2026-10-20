const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 index.html မှာ Manifest Link ထည့်ဖို့ ပြင်ဆင်နေပါသည်...");

try {
  const indexPath = path.join(__dirname, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Manifest Link ရှိပြီးသားလား စစ်မယ်
  if (!indexContent.includes('rel="manifest"')) {
    // <link rel="apple-touch-icon" ... /> ရဲ့ အပေါ်မှာ Manifest Link ကို ထည့်မယ်
    indexContent = indexContent.replace(
      /<link rel="apple-touch-icon"/,
      `<link rel="manifest" href="/manifest.webmanifest" />\n    <link rel="apple-touch-icon"`
    );
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log("✅ index.html တွင် manifest.webmanifest link ကို ထည့်သွင်းပြီးပါပြီ။");
  } else {
    console.log("ℹ️ index.html တွင် manifest link ရှိပြီးသား ဖြစ်ပါသည်။");
  }

  // စမ်းသပ်မှု ပြုလုပ်ခြင်း
  console.log("\n🔍 စမ်းသပ်မှုများ စတင်နေပါပြီ...");
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\n✅ စမ်းသပ်မှု အောင်မြင်ပါသည်။\n");

  // GitHub သို့ တင်ခြင်း
  console.log("🚀 GitHub သို့ တင်နေပါသည်...");
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "fix: add missing manifest link to index.html for PWA support"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log("\n🎉 အားလုံး ပြီးပါပြီ။ ယခု Platform ၃ ခုလုံးမှာ PWA အလုပ်လုပ်ဖို့ အသင့်ဖြစ်ပါပြီ။");

} catch (error) {
  console.error("\n❌ Error တက်နေပါသည်။ အနီရောင်စာသားကို ကြည့်ပါ။");
  process.exit(1);
}