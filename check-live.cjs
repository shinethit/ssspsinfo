const https = require('https');

const url = 'https://ssspsinfo.pages.dev'; 

console.log(`🔍 ${url} ကို စစ်ဆေးနေပါသည်...`);

https.get(url, (res) => {
  console.log(`\n✅ Status Code: ${res.statusCode}`);
  console.log("📋 Response Headers:");
  console.log(res.headers);
  
  if (res.headers['cf-cache-status']) {
    console.log(`\n☁️ Cloudflare Cache Status: ${res.headers['cf-cache-status']}`);
  }
  
  if (res.headers['cache-control'] && res.headers['cache-control'].includes('no-store')) {
     console.log("\n⚠️ သတိထားပါ: Cache-Control တွင် 'no-store' ပါနေပါသည်။ (_headers ဖိုင်၏ လုပ်ဆောင်ချက် ဖြစ်နိုင်ပါသည်)");
  }

  res.on('data', () => {}); 
}).on('error', (e) => {
  console.error(`\n❌ ဆိုက်ကို လှမ်းစစ်၍ မရပါ (Error တက်နေပါသည်): ${e.message}`);
  console.log("👉 ဤအချက်က Cloudflare (သို့) Network Level မှ ပိတ်ဆို့ခံရခြင်း ဖြစ်နိုင်ပါသည်။");
});