export interface VersionItem {
  version: string;
  date: string;
  isLatest?: boolean;
  title: string;
  changes: { type: 'feat' | 'improve' | 'fix'; text: string }[];
}

export const VERSIONS: VersionItem[] = [
  {
    version: 'v22.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Global Academic Year & Voucher Formatting',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်းတွင် ပညာသင်နှစ်ကို ဗဟိုမှ (Global) သတ်မှတ်နိုင်ပြီး Form များတွင် Default အဖြစ် အသုံးပြုနိုင်ခြင်း။' },
      { type: 'feat', text: 'သွင်းပြီးသား ကျောင်းများအားလုံးကို ပညာသင်နှစ်အသစ်သို့ တစ်ချက်တည်း Batch ပြောင်းလဲနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Voucher/Receipt နံပါတ်များကို SSSPSFV-YYYYMMDD ဖော်မတ်ဖြင့် စနစ်တကျ ထုတ်ပေးခြင်း။' },
      { type: 'improve', text: 'Receipt တွင် မှတ်စု (Note) နှင့် ပညာသင်နှစ်ကို ရှင်းလင်းစွာ ပြသခြင်း။' }
    ],
  },
  {
    version: 'v21.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Receipt Details Update',
    changes: [
      { type: 'improve', text: 'ကျောင်းအချက်အလက် ပြင်ဆင်သည့်နေရာတွင် ပညာသင်နှစ် (Academic Year) ထည့်သွင်းနိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'နှစ်စဉ်ကြေး ဖြတ်ပိုင်းတွင် ကျောင်းသားဦးရေ (Range) ကို ထည့်သွင်းပြသခြင်း။' },
      { type: 'improve', text: '"ငွေကိုင်ဌာန" နေရာတွင် "ဘဏ္ဍာရေးမှူး" ဟု ပြောင်းလဲပြသခြင်း။' }
    ],
  },
  {
    version: 'v21.8',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Ultimate Finance Sync & Receipt Fixes',
    changes: [
      { type: 'fix', text: 'နှစ်စဉ်ကြေး သွင်းထားသော ကျောင်းများ၏ အချက်အလက်များ ငွေစာရင်းတွင် ချက်ချင်း Sync ဖြစ်ပြီး ဖြတ်ပိုင်း (Printer) ခလုတ် ပေါ်လာစေရန် အပြည့်အဝ ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် စနစ်ကို အသစ်တည်ဆောက်ခြင်း။' },
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်း တင်သည့်အခါ ရက်စွဲ (Payment Date) ကို မဖြစ်မနေ ထည့်သွင်းရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
  {
    version: 'v21.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Finance Manager Receipts Fix & Mandatory Dates',
    changes: [
      { type: 'fix', text: 'နှစ်စဉ်ကြေး (Annual Fee) သွင်းထားသော ကျောင်းများအတွက် ငွေစာရင်းတွင် Printer ပုံပေါ်လာစေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်း တင်သည့်အခါ မည်သည့်ကြေးမဆို ရက်စွဲ (Payment Date) မဖြစ်မနေ ထည့်သွင်းရန် ပြင်ဆင်ခြင်း။' },
      { type: 'feat', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် ခလုတ်များ ထည့်သွင်းခြင်း။' }
    ],
  },
  {
    version: 'v21.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Finance Manager Receipts & Date Fixes',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း Manager တွင် နှစ်စဉ်ကြေး (Annual Fee) ကို မှတ်တမ်းအနေဖြင့် ပြသပြီး ဖြတ်ပိုင်း တိုက်ရိုက်ထုတ်ယူနိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'improve', text: 'အခြားကြေး သွင်းသည့်အခါ လက်ခံရရှိ ရက်စွဲ (Paid Date) ကို ကိုယ်တိုင်ရွေးချယ်နိုင်စေရန် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Receipt (ဖြတ်ပိုင်း) များကို PDF နှင့် JPEG အဖြစ် တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' }
    ],
  },
  {
    version: 'v21.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Annual Fee Receipts & Date Tracking',
    changes: [
      { type: 'feat', text: 'နှစ်စဉ်ကြေး သွင်းပြီးပါက ကျောင်းတစ်ခုချင်းစီအတွက် ဖြတ်ပိုင်း (Receipt) ကို PDF သို့မဟုတ် JPEG အဖြစ် ထုတ်ယူနိုင်သည့် စနစ် ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'နှစ်စဉ်ကြေး သွင်းသည့်အခါ ရက်စွဲ (Payment Date) ကို ထည့်သွင်းနိုင်စေရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
  {
    version: 'v21.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Finance Export Feature',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း မှတ်တမ်းအားလုံးကို တစ်ခါတည်း Excel ဖိုင်အဖြစ် ထုတ်ယူနိုင်သည့် Export All စနစ် ထည့်သွင်းခြင်း။' }
    ],
  },
  {
    version: 'v21.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Finance Update: Annual Fee & Spelling Fix',
    changes: [
      { type: 'feat', text: 'ငွေစာရင်း ထည့်သွင်းရာတွင် နှစ်စဉ်ကြေး (Annual Fee) ကို Certificate/Voucher ထုတ်ပေးနိုင်ရန် ထည့်သွင်းပေးခြင်း။' },
      { type: 'fix', text: '"အခြေး/အခြားကြေး" ဟု စာလုံးပေါင်းမှားနေခြင်းကို "အခြားကြေး (Other Fee)" ဟု ပြင်ဆင်ခြင်း။' }
    ],
  },
  {
    version: 'v21.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'UI Cleanup: Zone Badges in School Manager',
    changes: [
      { type: 'improve', text: 'ကျောင်းစီမံခန့်ခွဲမှု (School Manager) တွင် မြို့နယ်မသတ်မှတ်ထားသော ကျောင်းများအတွက် "မြို့နယ်မသတ်မှတ်" ဆိုသော စာသားများကို ဖယ်ရှားခြင်း။' },
      { type: 'improve', text: 'မြို့နယ်/ဇုန် အချက်အလက်များကို ပိုမိုရှင်းလင်းသော Badge ပုံစံဖြင့် ပြသစေရန် ပြင်ဆင်ခြင်း။' }
    ],
  },
  {
    version: 'v21.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Global Button UX & Feedback Enhancement',
    changes: [
      { type: 'improve', text: 'ခလုတ်များကို နှိပ်လိုက်ပါက ချက်ချင်း တုံ့ပြန်မှုရှိစေရန် (Active state နှင့် Transition) စနစ်တကျ ထည့်သွင်းခြင်း။' },
      { type: 'improve', text: 'Loading ဖြစ်နေစဉ်အတွင်း ခလုတ်များ အလုပ်မလုပ်တော့ခြင်းနှင့် Spinner ပြသခြင်းတို့ကို ပိုမိုရှင်းလင်းစွာ မြင်တွေ့နိုင်စေရန် ပြင်ဆင်ခြင်း။' },
      { type: 'fix', text: 'ခလုတ်များ နှိပ်လိုက်ပါက အသံတိတ်နေခြင်း (No feedback) ပြဿနာကို ဖြေရှင်းခြင်း။' }
    ],
  },
  {
    version: 'v21.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Performance Optimization & Lazy Loading',
    changes: [
      { type: 'improve', text: 'App ၏ performance ကို မြှင့်တင်ရန် Lazy Loading (Code Splitting) စနစ် ထည့်သွင်းခြင်း' },
      { type: 'fix', text: 'စာမျက်နှာများ ကူးပြောင်းရာတွင် ထစ်နေခြင်း (Lagging) ပြဿနာကို ဖြေရှင်းခြင်း' },
      { type: 'fix', text: 'Service Worker Cache Version ကို v2 သို့ မြှင့်တင်ပြီး Cache အဟောင်းများကို ရှင်းလင်းခြင်း' }
    ],
  },
  {
    version: 'v20.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Major PWA Overhaul (Custom Service Worker)',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် ချိတ်ဆက်မှု ပြတ်တောက်ခြင်းကို ဖြေရှင်းရန် Workbox ကို ဖယ်ရှားပြီး Custom Service Worker သို့ ပြောင်းလဲခြင်း' },
      { type: 'improve', text: 'ကွန်ရက်နှေးသွားပါက ၁.၅ စက္ကန့်အတွင်း Cache မှ အလိုအလျောက် ပြန်လည်ဖွင့်ပေးသည့် fetchWithTimeout စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
  {
    version: 'v19.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'iOS Cache Bypass & Normal PWA Restore',
    changes: [
      { type: 'fix', text: 'iOS Safari တွင် sw.js ကို Cache မလုပ်စေရန် _headers ဖိုင်အား ဘေးကင်းစွာ ပြန်လည်ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'PWA စနစ်အား Force Update (skipWaiting + clientsClaim) ဖြင့် ပုံမှန်အတိုင်း ပြန်လည်ထူထောင်ခြင်း' }
    ],
  },
  {
    version: 'v19.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Zombie Service Worker Killer (Force Reset)',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် ပိတ်မိနေသော Service Worker များကို ကိုယ်တိုင် ဖျက်ဆီးပစ်သည့် Self-Destructing SW စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
  {
    version: 'v19.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Emergency PWA Core Fix & iOS/Windows Compatibility',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် Error တက်စေသော _headers ဖိုင်အား လုံးဝ ဖယ်ရှားခြင်း' },
      { type: 'fix', text: 'main.tsx ရှိ Force Reload (Self-healing) ကုဒ်များအား ဖယ်ရှားပြီး မူလ Vite PWA AutoUpdate စနစ်အတိုင်း ပြန်လည်ထားရှိခြင်း' },
      { type: 'improve', text: 'Version များကို စနစ်တကျ ပြန်လည်သတ်မှတ်ပြီး တည်ငြိမ်မှုရှိစေရန် ပြင်ဆင်ခြင်း' }
    ],
  },
  {
    version: 'v19.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Emergency PWA Core Fix & iOS/Windows Compatibility',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows တွင် Error တက်စေသော _headers ဖိုင်အား လုံးဝ ဖယ်ရှားခြင်း' },
      { type: 'fix', text: 'main.tsx ရှိ Force Reload (Self-healing) ကုဒ်များအား ဖယ်ရှားပြီး မူလ Vite PWA AutoUpdate စနစ်အတိုင်း ပြန်လည်ထားရှိခြင်း' },
      { type: 'improve', text: 'Version များကို စနစ်တကျ ပြန်လည်သတ်မှတ်ပြီး တည်ငြိမ်မှုရှိစေရန် ပြင်ဆင်ခြင်း' }
    ],
  },
  {
    version: 'v17.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Auto Cache Clearing & Self-Healing System',
    changes: [
      { type: 'fix', text: 'iOS နှင့် Windows များတွင် အဟောင်း PWA Cache များ စွဲကျန်နေခြင်းကို အလိုအလျောက် ရှင်းလင်းပြီး အသစ်သို့ တိုက်ရိုက်ပြောင်းလဲပေးသည့် Self-Healing စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'အသုံးပြုသူများအနေဖြင့် လက်ဖြင့် Cache ရှင်းလင်းရန် မလိုအပ်တော့ဘဲ App ဖွင့်တိုင်း အသစ်ဆုံး Version ကို အလိုအလျောက် ရရှိစေခြင်း' },
    ],
  },
  {
    version: 'v16.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA Auto-Update တည်ငြိမ်စေရန် နှင့် Cloudflare Block ပြဿနာ ဖြေရှင်းခြင်း',
    changes: [
      { type: 'fix', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် visibilitychange ကုဒ်များအား ဖယ်ရှားခြင်း' },
      { type: 'improve', text: 'Vite PWA ၏ မူလ Auto-Update စနစ်အတိုင်း ပြန်လည်ထားရှိခြင်း' },
    ],
  },
  {
    version: 'v15.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဖုန်း (Mobile) များတွင် PWA Auto-Update အပြည့်အစုံ အလုပ်လုပ်နိုင်စေရန် ပြင်ဆင်ခြင်း',
    changes: [
      { type: 'fix', text: 'App ဖွင့်တိုင်း နှင့် ဖုန်း Screen ပြန်ဖွင့်တိုင်း Cloud နှင့် Local Version ကို အလိုအလျောက် တိုက်စစ်ပြီး အသစ်ရှိပါက ချက်ချင်း Update ဖြစ်စေခြင်း' },
      { type: 'improve', text: 'Cloudflare မှ sw.js နှင့် index.html ဖိုင်များကို Cache မလုပ်တော့ဘဲ အမြဲတမ်း အသစ်ဆုံး Version ကို ဆွဲယူစေခြင်း' },
    ],
  },
  {
    version: 'v15.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA Auto Update စနစ် အပြည့်အစုံ ပြန်လည်ထည့်သွင်းခြင်း',
    changes: [
      { type: 'fix', text: 'PWA စနစ် (App ကဲ့သို့ သွင်းယူနိုင်ခြင်း) ပြန်လည်အလုပ်လုပ်နိုင်ရန် Service Worker အား မှန်ကန်စွာ ပြန်လည်မှတ်ပုံတင်ခြင်း' },
      { type: 'feat', text: 'App ဖွင့်ဖွင့်ချင်း Cloud နှင့် Local Version ကို အလိုအလျောက် တိုက်စစ်ပြီး Version အသစ်ရှိပါက ချက်ချင်း Update ဖြစ်စေခြင်း' },
    ],
  },
  {
    version: 'v15.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ပွဲစဉ်များ၏ အမည်ကို ပြောင်းလဲခြင်း (Rename Events)',
    changes: [
      { type: 'improve', text: 'Sidebar နှင့် စာမျက်နှာအတွင်းရှိ "ပွဲတော်များ" နှင့် "ပွဲစဉ်များ" ဆိုသော စာသားများကို "ပွဲနှင့် အခမ်းအနားများ" ဟု ပြောင်းလဲခြင်း' },
    ],
  },
  {
    version: 'v15.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဆိုက်အား ပုံမှန်အခြေအနေသို့ ပြန်လည်ရောက်ရှိစေခြင်း (Final Cleanup)',
    changes: [
      { type: 'fix', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် Service Worker Loop ကုဒ်များအား လုံးဝ ဖယ်ရှားခြင်း' },
      { type: 'improve', text: 'မူလ Vite PWA AutoUpdate စနစ်အား ပြန်လည်ထည့်သွင်းပြီး အလိုအလျောက် Update ဖြစ်စေရန် ပြင်ဆင်ခြင်း' },
    ],
  },
  {
    version: 'v15.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA စနစ် မူလအတိုင်း ပြန်လည်ထူထောင်ခြင်း (Restore)',
    changes: [
      { type: 'fix', text: 'မူလက အလုပ်လုပ်နေသော Vite PWA autoUpdate စနစ်အား မူလအတိုင်း ပြန်လည်ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Cloudflare Rate Limit ဖြစ်စေသော ပိုလျှံနေသည့် Manual Polling ကုဒ်များအား လုံးဝ ဖယ်ရှားခြင်း' },
    ],
  },
  {
    version: 'v15.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA Auto-Update ပိတ်သိမ်းခြင်း (Emergency Fix)',
    changes: [
      { type: 'fix', text: 'PWA Service Worker ကြောင့် ဖြစ်ပေါ်နေသော Cloudflare ERR_CONNECTION_RESET ပြဿနာကို ရပ်တန့်ရန် PWA စနစ်အား ယာယီပိတ်သိမ်းခြင်း' },
      { type: 'improve', text: 'ဆိုက်အား ပုံမှန်အခြေအနေသို့ ပြန်လည်ရောက်ရှိစေရန် Core စနစ်များကိုသာ ဦးစားပေးလုပ်ဆောင်ခြင်း' },
    ],
  },
  {
    version: 'v15.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Cloudflare Rate Limit ပြဿနာ ဖြေရှင်းခြင်း (Connection Reset Fix)',
    changes: [
      { type: 'fix', text: 'Service Worker ကို ၃၀ စက္ကန့်တိုင်း လှမ်းမေးနေသည့် စနစ်ကို ဖယ်ရှားပြီး Cloudflare မှ IP ပိတ်ခံရခြင်းကို ရပ်တန့်စေခြင်း' },
      { type: 'fix', text: 'မလိုအပ်တော့သည့် _headers ဖိုင်ကို ဖယ်ရှားပြီး Edge Connection ပြန်လည်ကောင်းမွန်စေခြင်း' },
      { type: 'improve', text: 'Page စတင်ဖွင့်ချိန်တွင်သာ Update စစ်ဆေးမည်ဖြစ်ပြီး လိုအပ်မှသာ Manual Force Update နှိပ်နိုင်စေခြင်း' },
    ],
  },
  {
    version: 'v14.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA Auto-Update အပြည့်အစုံ ပြင်ဆင်ခြင်း (Cloudflare Cache Bypass)',
    changes: [
      { type: 'fix', text: 'Cloudflare Pages တွင် sw.js နှင့် index.html ကို Cache မ လုပ်စေရန် _headers ဖိုင် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Service Worker အသစ် Activate ဖြစ်သည်နှင့် Page ကို အလိုအလျောက် Reload လုပ်သည့် controllerchange စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'Page load တိုင်းနှင့် ၃၀ စက္ကန့်တိုင်း SW Update ကို အလိုအလျောက် စစ်ဆေးခြင်း' },
      { type: 'feat', text: 'VersionUpdateModal တွင် Update Now နှင့် Force Reload ခလုတ်များ ထည့်သွင်းခြင်း' },
    ],
  },
  {
    version: 'v14.8',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Event Smart Calendar နှင့် ကျောင်း Activity တင်ခြင်းစနစ်',
    changes: [
      { type: 'feat', text: 'Home Page တွင်သာ Share နှင့် QR စနစ်ကို ထည့်သွင်းပြီး အခြားစာမျက်နှာများမှ ဖယ်ရှားခြင်း' },
      { type: 'feat', text: 'ပွဲတော်နှင့် လှုပ်ရှားမှုများကို ကြည့်ရှုနိုင်သည့် ပြက္ခဒိန် (/calendar) စနစ်သစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ပြက္ခဒိန်တွင် လအလိုက် (Month View) နှင့် ရက်အပိုင်းအခြား (Date Range) အလိုက် စစ်ထုတ်ကြည့်ရှုနိုင်ခြင်း' },
      { type: 'feat', text: 'အသင်းဝင်ကျောင်းများကိုယ်တိုင် ၎င်းတို့၏ Activity များကို ဓာတ်ပုံများနှင့်တကွ တင်နိုင်သည့် စနစ် (SchoolPortal)' },
      { type: 'improve', text: 'Sidebar ရှိ "အားကစားရလဒ်များ" ကို "အားကစား" နှင့် "ပွဲစဉ်များ" ကို "ပွဲတော်များ" အဖြစ် ပြောင်းလဲခြင်း' },
    ],
  },
  {
    version: 'v14.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'PWA Update စနစ် အပြည့်အစုံ ပြင်ဆင်ခြင်း (Real Force Update)',
    changes: [
      { type: 'fix', text: 'Force Update ခလုတ်သည် Service Worker Update ကို တကယ်လုပ်ဆောင်ပေးပြီး Cloudflare Cache ကို ကျော်ဖြတ်နိုင်သည်' },
      { type: 'feat', text: 'VersionUpdateModal တွင် "Update Now" နှင့် "Force Reload (Hard Reset)" ခလုတ်များ ထည့်သွင်းခြင်း' },
      { type: 'fix', text: 'Cloudflare Pages တွင် sw.js ကို Cache မလုပ်စေရန် _headers ဖိုင် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'Service Worker တွင် cleanupOutdatedCaches ဖွင့်ခြင်းဖြင့် version ဟောင်း Cache များ အလိုအလျောက် ရှင်းလင်းခြင်း' },
    ],
  },
  {
    version: 'v14.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Share/QR စနစ်နှင့် ပွဲချိန် (Match Time) Optional ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Share Button (Native Share + Copy Link + QR Code) ကို ကျောင်းအသေးစိတ်၊ အားကစားပြိုင်ပွဲနှင့် အားကစားသမားစာရင်းတွင် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'အားကစားပွဲစဉ်များတွင် ပွဲချိန် (Match Time) ကို Optional ထည့်သွင်းနိုင်ခြင်း' },
      { type: 'improve', text: 'အားကစားသမား စာရင်းကို Public (အမည်၊ အတန်း၊ အသက်၊ ကိုယ်စားပြုကျောင်း) သာ ပြသနိုင်စေရန် ပြင်ဆင်ခြင်း' },
    ],
  },
  {
    version: 'v14.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ကြေညာချက်နှင့် ပွဲစဉ်များတွင် ဇုန် (Optional) ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Announcements နှင့် Events တွင် ဇုန် (Optional) သတ်မှတ်နိုင်ခြင်း' },
      { type: 'feat', text: 'ဇုန် မသတ်မှတ်ပါက Association-wide အနေဖြင့် အားလုံးအတွက် ပြသခြင်း' },
    ],
  },
  {
    version: 'v14.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အားကစား၊ တောင်းဆိုမှုနှင့် ကျောင်း Portal တွင် ဇုန်စနစ်',
    changes: [
      { type: 'feat', text: 'AdminSportsManager — ဇုန်အလိုက် ကျောင်းစစ်ထုတ်မှု' },
      { type: 'feat', text: 'AdminRequestsManager — ဇုန်အလိုက် တောင်းဆိုမှုစစ်ထုတ်မှု' },
      { type: 'feat', text: 'SchoolPortal — ကျောင်း ကိုယ်တိုင် ဇုန်ရွေးနိုင်ခြင်း' },
    ],
  },
  {
    version: 'v14.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Contacts Page တွင် ဇုန်စစ်ထုတ်မှု',
    changes: [
      { type: 'feat', text: 'Contacts တွင် ဇုန်စစ်ထုတ်မှု + URL sync' },
    ],
  },
  {
    version: 'v14.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Dashboard နှင့် Admin Managers တွင် ဇုန်စနစ်',
    changes: [
      { type: 'feat', text: 'Dashboard, AdminSchoolManager, AdminFinanceManager, SchoolForm တွင် ဇုန်စနစ်' },
    ],
  },
  {
    version: 'v14.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Global Zone Filters + PWA Auto-Update Hardening',
    changes: [
      { type: 'feat', text: 'Home နှင့် Admin တွင် ဇုန် Filter' },
      { type: 'fix', text: 'PWA autoUpdate hardening (skipWaiting + clientsClaim)' },
    ],
  },
  {
    version: 'v13.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဇုန်ဒေတာများ အပြည့်အစုံ ချိတ်ဆက်ခြင်း (Zone Data Flow)',
    changes: [
      { type: 'feat', text: 'ကျောင်းအချက်အလက် ထည့်သွင်းရာတွင် ဇုန်ကို စာသားရိုက်ထည့်ခြင်းမှ Dropdown ဖြင့် ရွေးချယ်နိုင်စေရန် ပြင်ဆင်ခြင်း' },
      { type: 'feat', text: 'Admin ကျောင်းစီမံခန့်ခွဲမှု စာမျက်နှာတွင် ဇုန်အလိုက် စစ်ထုတ်ကြည့်ရှုနိုင်သည့် Filter စနစ် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ဇုန်အမည်များကို တစ်နေရာတည်းတွင် သတ်မှတ်ထားသဖြင့် စာလုံးပေါင်းမှားယွင်းမှုကြောင့် Data မကိုက်ညီခြင်းများ လုံးဝ မဖြစ်ပေါ်တော့ခြင်း' }
    ],
  },
  {
    version: 'v12.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဇုန်အလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှုစနစ် (Zone-based Level Breakdown)',
    changes: [
      { type: 'feat', text: 'ပင်မစာမျက်နှာတွင် တောင်ကြီးဇုန်၊ ကလောဇုန်နှင့် လွိုင်လင်/နမ့်စန်ဇုန်များအလိုက် ကျောင်းအဆင့် ခွဲခြမ်းမှုကို ကြည့်ရှုနိုင်စေရန် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ဇုန်တစ်ခုချင်းစီအတွက် ကျောင်းအဆင့်များကို သီးသန့် ခွဲခြမ်းပြသပေးပြီး အရေအတွက်များကို တိကျစွာ တွက်ချက်ပေးခြင်း' },
      { type: 'improve', text: 'ကျောင်းစာရင်းအားလုံးကို List ပုံစံဖြင့် အလွယ်တကူ ကြည့်ရှုနိုင်ရန် လင့်ခ်များ ထည့်သွင်းပေးခြင်း' }
    ],
  },
  {
    version: 'v12.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဘုံဒက်ရှ်ဘုတ် (Unified Dashboard) နှင့် စနစ်တကျ စာရင်းအင်းများ ထည့်သွင်းခြင်း',
    changes: [
      { type: 'feat', text: 'Dashboard တွင် အားကစားသမား ဦးရေ၊ အားကစားပွဲစဉ် အရေအတွက်၊ ရရှိထားသော အားကစားကြေးနှင့် စာရင်းသွင်းနိုင်သော ပွဲစဉ်များကို တစ်ချက်တည်း မြင်နိုင်စေရန် ထည့်သွင်းခြင်း' },
      { type: 'improve', text: 'ဒက်ရှ်ဘုတ်ကို ပိုမိုအသုံးဝင်စေရန် အချက်အလက်အသစ်များကို Grid ပုံစံဖြင့် သပ်ရပ်စွာ စီစဉ်ပြသခြင်း' },
      { type: 'fix', text: 'ဒေတာများ ဆွဲယူရာတွင် Firebase Permission Error မတက်စေရန် ကာကွယ်မှုများ ထည့်သွင်းခြင်း' }
    ],
  },
  {
    version: 'v11.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အားကစား စီမံခန့်ခွဲမှုစနစ် အပြည့်အစုံနှင့် ငွေစာရင်း ဒေတာခွဲထုတ်ခြင်း (Comprehensive Sports & Finance System)',
    changes: [
      { type: 'feat', text: 'အားကစားသမားများ၏ အမည်၊ အဖအမည်၊ မွေးသက္ကရာဇ် (အသက်အလိုအလျောက်တွက်)၊ အတန်း၊ ကျောင်းဝင်အမှတ်နှင့် ကိုယ်စားပြုကျောင်းများကို အပြည့်အစုံ ထည့်သွင်းနိုင်သည့် စနစ်သစ်' },
      { type: 'feat', text: 'အားကစားနည်းတစ်ခုချင်းစီအတွက် စည်းမျဉ်းစည်းကမ်းများ၊ ဒိုင်လူကြီးများနှင့် ကော်မတီဝင်များကို သီးသန့် သိမ်းဆည်းနိုင်သည့် စနစ်' },
      { type: 'improve', text: 'ရလဒ်ထည့်သွင်းရာတွင် ကျောင်းအမည်နှင့် အားကစားသမားကို Dropdown မှ ချိတ်ဆက်ရွေးချယ်နိုင်ပြီး အမှားအယွင်းမရှိစေရန် ပြင်ဆင်ခြင်း' },
      { type: 'feat', text: 'ငွေစာရင်းများကို ကျောင်း Document အောက်မှ မထားတော့ဘဲ သီးသန့် transactions Collection အဖြစ် ခွဲထုတ်ပြီး ငွေလက်ခံဖြတ်ပိုင်း တစ်ခုချင်းစီ ထုတ်ယူနိုင်သည့် စနစ်' },
      { type: 'improve', text: 'အသုံးပြုသူ (Public) မျက်နှာပြင်တွင် အားကစားနည်းအလိုက် ရလဒ်များ၊ စည်းမျဉ်းများ၊ ဒိုင်များနှင့် အားကစားသမားစာရင်းများကို Tab များဖြင့် သပ်ရပ်စွာ ကြည့်ရှုနိုင်စေရန် ပြင်ဆင်ခြင်း' }
    ],
  },
  {
    version: 'v10.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ငွေစာရင်း ဒေတာများကို သီးသန့် ခွဲထုတ်ခြင်း (Finance Data Separation)',
    changes: [
      { type: 'improve', text: 'ငွေသွင်းမှတ်တမ်းများကို သီးသန့် transactions Collection အဖြစ် ခွဲထုတ်ခြင်းဖြင့် ဒေတာများပြားလာချိန်တွင် စနစ်တည်ငြိမ်မှုရှိစေရန် ပြုလုပ်ခြင်း' },
      { type: 'feat', text: 'ယခင်က ကျောင်း Document အောက်တွင် သိမ်းဆည်းထားသော ငွေသွင်းမှတ်တမ်းများကို စနစ်အသစ်သို့ အလိုအလျောက် ရွှေ့ပြောင်းပေးသည့် (Migrate) စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
  {
    version: 'v9.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အားကစား အချက်အလက်၊ စည်းမျဉ်းနှင့် ဒိုင်များ စီမံခန့်ခွဲမှုစနစ်',
    changes: [
      { type: 'feat', text: 'အားကစားနည်းတစ်ခုချင်းစီအတွက် စည်းမျဉ်းများ၊ ဒိုင်များနှင့် အားကစားသမားများကို သီးသန့် ထည့်သွင်းနိုင်သည့် AdminSportInfoManager စနစ် ထည့်သွင်းခြင်း' }
    ],
  },
  {
    version: 'v9.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Role-Based Access Control (RBAC) နှင့် အားကစားစနစ် အခြေခံ',
    changes: [
      { type: 'feat', text: 'Admin များကို ရာထူးအလိုက် (Sports Moderator, News Editor စသဖြင့်) ခွဲခြားပြီး သက်ဆိုင်ရာ လုပ်ဆောင်ချက်များကိုသာ မြင်တွေ့ခွင့်ပြုသည့် စနစ် ထည့်သွင်းခြင်း' },
      { type: 'feat', text: 'ကျောင်းများ ကိုယ်တိုင်ဝင်ရောက်ပြင်ဆင်နိုင်သည့် Member Portal စနစ် ထည့်သွင်းခြင်း' }
    ],
  }
];
