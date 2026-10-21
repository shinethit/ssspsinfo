// D:\ssspsinfo-main\fix-sw.cjs
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Cache version ကို v2 သို့ ပြောင်းခြင်း
swContent = swContent.replace(/ssspsinfo-live-v1/g, 'ssspsinfo-live-v2');

fs.writeFileSync(swPath, swContent);
console.log('✅ sw.js ရဲ့ Cache Version ကို v2 သို့ မြှင့်တင်ပြီးပါပြီ။');