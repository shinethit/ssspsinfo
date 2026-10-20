export interface VersionItem {
  version: string;
  date: string;
  isLatest?: boolean;
  title: string;
  changes: { type: 'feat' | 'improve' | 'fix'; text: string }[];
}

export const VERSIONS: VersionItem[] = [
  {
    version: 'v15.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
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
