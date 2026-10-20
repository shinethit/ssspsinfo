const fs = require('fs');

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('\r\n')) c = c.replace(/\r\n/g, '\n');
  return c;
}
function write(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('  ✅ ' + p); }

function safeReplace(content, find, replace, label) {
  if (!content.includes(find)) {
    console.log(`\n  ❌ [${label}] NOT FOUND: ${JSON.stringify(find.substring(0, 50))}...`);
    throw new Error(`Pattern not found: ${label}`);
  }
  return content.replace(find, replace);
}

console.log('\n🚀 Updating Event Labels (v15.4)\n');

// 1) Layout.tsx - Sidebar Label
console.log('\n📝 src/components/Layout.tsx');
let L = read('src/components/Layout.tsx');
L = safeReplace(L, 
  `{ to: '/events', label: 'ပွဲတော်များ', labelEn: 'Events', icon: Ticket },`,
  `{ to: '/events', label: 'ပွဲနှင့် အခမ်းအနားများ', labelEn: 'Events', icon: Ticket },`,
  'L1 sidebar label');
write('src/components/Layout.tsx', L);

// 2) Events.tsx - Public Page
console.log('\n📝 src/pages/Events.tsx');
let E = read('src/pages/Events.tsx');
E = safeReplace(E,
  `<h1 className="text-2xl sm:text-3xl font-black">ပွဲစဉ်များနှင့် သင်တန်းများ</h1>`,
  `<h1 className="text-2xl sm:text-3xl font-black">ပွဲနှင့် အခမ်းအနားများ</h1>`,
  'E1 header');
E = safeReplace(E,
  `toast.success('ပွဲစဉ်အတွက် စာရင်းသွင်းမှု အောင်မြင်ပါသည်!');`,
  `toast.success('ပွဲ/အခမ်းအနားအတွက် စာရင်းသွင်းမှု အောင်မြင်ပါသည်!');`,
  'E2 toast');
E = safeReplace(E,
  `လက်ရှိတွင် ပွဲစဉ်အသစ်များ မရှိသေးပါ။`,
  `လက်ရှိတွင် ပွဲ/အခမ်းအနားအသစ်များ မရှိသေးပါ။`,
  'E3 empty state');
write('src/pages/Events.tsx', E);

// 3) CalendarPage.tsx
console.log('\n📝 src/pages/CalendarPage.tsx');
let C = read('src/pages/CalendarPage.tsx');
C = safeReplace(C,
  `<CalendarIcon className="w-6 h-6 text-sky-600" /> ပွဲတော်နှင့် လှုပ်ရှားမှု ပြက္ခဒိန်`,
  `<CalendarIcon className="w-6 h-6 text-sky-600" /> ပွဲနှင့် အခမ်းအနား ပြက္ခဒိန်`,
  'C1 header');
C = safeReplace(C,
  `<option value="festival">ပွဲတော်</option>`,
  `<option value="festival">ပွဲ/အခမ်းအနား</option>`,
  'C2 filter option');
C = safeReplace(C,
  `ဤရက်တွင် ပွဲတော်/လှုပ်ရှားမှု မရှိပါ`,
  `ဤရက်တွင် ပွဲ/အခမ်းအနား မရှိပါ`,
  'C3 day empty');
C = safeReplace(C,
  `ဤကာလအတွင်း ပွဲတော်/လှုပ်ရှားမှု မရှိပါ`,
  `ဤကာလအတွင်း ပွဲ/အခမ်းအနား မရှိပါ`,
  'C4 range empty');
// There are two instances of the eventType badge logic
C = C.replaceAll(
  `ev.eventType === 'festival' ? 'ပွဲတော်' : 'အထွေထွေ'`,
  `ev.eventType === 'festival' ? 'ပွဲ/အခမ်းအနား' : 'အထွေထွေ'`
);
write('src/pages/CalendarPage.tsx', C);

// 4) AdminEventManager.tsx
console.log('\n📝 src/components/admin/AdminEventManager.tsx');
let A = read('src/components/admin/AdminEventManager.tsx');
A = safeReplace(A,
  `<Plus className="w-5 h-5 text-sky-600" /> ပွဲစဉ်အသစ် တင်ရန်`,
  `<Plus className="w-5 h-5 text-sky-600" /> ပွဲ/အခမ်းအနား အသစ် တင်ရန်`,
  'A1 header');
A = safeReplace(A,
  `placeholder="ပွဲစဉ် ခေါင်းစဉ်"`,
  `placeholder="ပွဲ/အခမ်းအနား ခေါင်းစဉ်"`,
  'A2 placeholder');
A = safeReplace(A,
  `toast.success('ပွဲစဉ်အသစ် တင်ပြီးပါပြီ');`,
  `toast.success('ပွဲ/အခမ်းအနား အသစ် တင်ပြီးပါပြီ');`,
  'A3 toast');
A = safeReplace(A,
  `'ပွဲစဉ် တင်မည်'`,
  `'ပွဲ/အခမ်းအနား တင်မည်'`,
  'A4 btn');
A = safeReplace(A,
  `ပွဲစဉ် များကို ဇုန်အလိုက် စစ်ထုတ်နိုင်ပါသည်`,
  `ပွဲ/အခမ်းအနားများကို ဇုန်အလိုက် စစ်ထုတ်နိုင်ပါသည်`,
  'A5 filter text');
A = safeReplace(A,
  `တင်ထားသော ပွဲစဉ်များ`,
  `တင်ထားသော ပွဲ/အခမ်းအနားများ`,
  'A6 list header');
write('src/components/admin/AdminEventManager.tsx', A);

// 5) Version Bump -> v15.4
console.log('\n📝 src/constants.ts -> v15.4');
let VC = read('src/constants.ts');
VC = VC.replace(/CURRENT_VERSION = 'v[\d.]+'/, "CURRENT_VERSION = 'v15.4'");
write('src/constants.ts', VC);

// 6) Versions.ts -> Add v15.4
console.log('\n📝 src/data/versions.ts -> v15.4 entry');
let V = read('src/data/versions.ts');
if (!V.includes("version: 'v15.4'")) {
  V = safeReplace(V,
    `version: 'v15.3',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: true,`,
    `version: 'v15.3',\n    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',\n    isLatest: false,`,
    'V demote v15.3'
  );
  V = safeReplace(V,
    `export const VERSIONS: VersionItem[] = [`,
    `export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'ပွဲစဉ်များ၏ အမည်ကို ပြောင်းလဲခြင်း (Rename Events)',
    changes: [
      { type: 'improve', text: 'Sidebar နှင့် စာမျက်နှာအတွင်းရှိ "ပွဲတော်များ" နှင့် "ပွဲစဉ်များ" ဆိုသော စာသားများကို "ပွဲနှင့် အခမ်းအနားများ" ဟု ပြောင်းလဲခြင်း' },
    ],
  },`,
    'V add v15.4'
  );
  write('src/data/versions.ts', V);
}

console.log('\n✅ DONE\n');