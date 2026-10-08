import { History, GitCommit, Sparkles, CheckCircle2, Shield, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VersionItem {
  version: string;
  date: string;
  isLatest?: boolean;
  title: string;
  changes: {
    type: 'feat' | 'improve' | 'fix';
    text: string;
  }[];
}

const VERSIONS: VersionItem[] = [
  {
    version: 'v2.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'တာဝန်ခံ (၁) / တာဝန်ခံ (၂) ခွဲခြားမှု၊ ဖုန်းနံပါတ် အများအပြား ထည့်သွင်းနိုင်မှုနှင့် Excel Export စနစ်',
    changes: [
      {
        type: 'feat',
        text: 'ကျောင်းစီမံခန့်ခွဲမှုတွင် တာဝန်ခံကို "တာဝန်ခံ (၁)" နှင့် "တာဝန်ခံ (၂)" ဟူ၍ ၂ ဦး သီးခြားစီ အမည်၊ ရာထူး၊ ဖုန်းနှင့် ဆက်သွယ်ရန်လိပ်စာများ ပြည့်စုံစွာ ခွဲခြားထည့်သွင်းနိုင်သည့် စနစ်သစ်',
      },
      {
        type: 'feat',
        text: 'တာဝန်ခံ ၁ ဦးစီအတွက် ဖုန်းနံပါတ် အနည်းဆုံး ၂ လုံးစီ (ဖုန်း ၁၊ ဖုန်း ၂) နှင့် လိုအပ်ပါက နောက်ထပ် ဖုန်းနံပါတ်များ ထပ်မံထည့်သွင်းနိုင်သော Dynamic Phone Inputs ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်း ဆက်သွယ်ရန်ဖုန်း (School Phone) ကိုလည်း ၁ လုံးနှင့်အထက် (အဓိကဖုန်း၊ အရန်ဖုန်းနှင့် နောက်ထပ်ဖုန်းများ) စိတ်ကြိုက် လွတ်လပ်စွာ ဖြည့်သွင်းနိုင်ခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်းစာရင်း အချက်အလက်အားလုံးကို Excel ဖိုင် (.xlsx) အဖြစ် တစ်ချက်နှိပ်ရုံဖြင့် ဒေါင်းလုဒ်ထုတ်ယူနိုင်သည့် (Export to Excel) စနစ်ကို Admin Panel နှင့် ကျောင်းများစာရင်းတွင် ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ကျောင်းအသေးစိတ် စာမျက်နှာ (School Detail)၊ အသင်းဝင်ကျောင်းများစာရင်း (Contacts) နှင့် ရှာဖွေမှုစနစ် (Search) တို့တွင် တာဝန်ခံ (၁)၊ တာဝန်ခံ (၂) နှင့် ဖုန်းနံပါတ်အားလုံးဖြင့် တိုက်ရိုက်ရှာဖွေဆက်သွယ်နိုင်အောင် အဆင့်မြှင့်တင်ခြင်း',
      },
    ],
  },
  {
    version: 'v2.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'နှစ်စဉ်ကြေး ထည့်ဝင်မှု ခွဲခြမ်းစိတ်ဖြာခြင်း (ကျောင်းအဆင့် / ကျောင်းသားဦးရေ Range / သတ်မှတ်ပမာဏ) နှင့် Real-Time Data Sync စနစ်သစ်',
    changes: [
      {
        type: 'feat',
        text: 'Dashboard တွင် နှစ်စဉ်ကြေး ထည့်ဝင်ထားသော ကျောင်းအရေအတွက်ကို (၁) ကျောင်းအဆင့်အလိုက်၊ (၂) ကျောင်းသားဦးရေ Range အလိုက်၊ (၃) ထည့်ဝင်ထားသော သတ်မှတ်ပမာဏအလိုက် နှင့် (၄) အဆင့်ဆင့် ပေါင်းစပ်ဇယား (Matrix Table) ဖြင့် ပြည့်စုံစွာ စစ်ထုတ်ခွဲခြမ်းကြည့်ရှုနိုင်သည့် စနစ်သစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'Database နှင့် Admin Panel တွင် ကျောင်းအလိုက် ကျောင်းသားဦးရေ Range (၁-၁၀၀ ဦး၊ ၁၀၁-၃၀၀ ဦး၊ ၃၀၁-၅၀၀ ဦး၊ ၅၀၁-၁၀၀၀ ဦး၊ ၁၀၀၀+ ဦး)၊ တိကျသော ကျောင်းသားဦးရေ၊ နှစ်စဉ်ကြေး သတ်မှတ်ပမာဏ (၅၀,၀၀၀ မှ ၃၀၀,၀၀၀ ကျပ်ထိ)၊ ပညာသင်နှစ်နှင့် ပေးသွင်းသည့်ရက်စွဲများကို စနစ်တကျ ထည့်သွင်းသတ်မှတ်နိုင်ခြင်း',
      },
      {
        type: 'fix',
        text: 'ကျောင်းစာရင်း အသစ်ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း၊ ဖျက်ပစ်ခြင်း (Add/Edit/Delete) ပြုလုပ်ပြီးနောက် Hard Refresh လုပ်ရာတွင် ကျောင်းစာရင်းများ ပျောက်သွားခြင်း သို့မဟုတ် ကြာမှ ပြန်ပေါ်ခြင်းကို Real-Time Firestore Listener (onSnapshot) နှင့် Optimistic Cache Update ဖြင့် ချက်ချင်း (0ms) ပေါ်စေရန် အပြီးတိုင် ဖြေရှင်းပြင်ဆင်ခြင်း',
      },
      {
        type: 'feat',
        text: 'Excel Template ဒေါင်းလုဒ်နှင့် Batch Import စနစ်တွင်လည်း ကျောင်းသားဦးရေ Range နှင့် နှစ်စဉ်ကြေး သတ်မှတ်ပမာဏတို့ကို အလိုအလျောက် သတ်မှတ်ထည့်သွင်းနိုင်အောင် မြှင့်တင်ပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ကျောင်းအသေးစိတ် စာမျက်နှာ (School Detail) နှင့် အသင်းဝင်ကျောင်းများ စာရင်းတွင်လည်း ကျောင်းသားဦးရေ Range နှင့် နှစ်စဉ်ကြေး ထည့်ဝင်မှု အချက်အလက်များကို ပိုမိုရှင်းလင်းစွာ ဖော်ပြပေးခြင်း',
      },
    ],
  },
  {
    version: 'v2.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ကျောင်းများ စာရင်းကို Category အလိုက် ခွဲခြားပြသမှု၊ မြန်မာအက္ခရာစဉ် Sorting နှင့် Offline Sync စနစ်သစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်ကျောင်းများစာရင်း (/contacts) ကို အထက်တန်း၊ အလယ်တန်း၊ မူလတန်း၊ မူလတန်းကြို စသည့် ကဏ္ဍ/အဆင့်အလိုက် (Grouped by Category) သပ်ရပ်စွာ အုပ်စုဖွဲ့ပြသပေးခြင်းနှင့် ချက်ချင်းစစ်ထုတ်နိုင်သော Category Tabs များ ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'မြန်မာအက္ခရာစဉ် (က မှ အ ထိ) နှင့် အဆင့်ဦးစားပေး စနစ်တကျ စီစဉ်မှု (Alphabetical & Educational Level Sorting) ထည့်သွင်းပြီး အသုံးပြုသူ စိတ်ကြိုက် ပြောင်းလဲစီစဉ်နိုင်သည့် Sorting Controls များ ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'Offline Sync & Persistent Data Cache စနစ် အပြည့်အစုံ ထည့်သွင်းခြင်း — စာမျက်နှာ ကူးပြောင်းချိန်တိုင်း Data ထပ်မံဆွဲစရာမလိုဘဲ စက္ကန့်ပိုင်းအတွင်း ချက်ချင်းဖွင့်ဖတ်နိုင်ကာ အင်တာနက် လိုင်းမရှိချိန်တွင်လည်း အချက်အလက်များအားလုံးကို အော့ဖ်လိုင်း ဆက်လက်ဖတ်ရှုနိုင်ခြင်း',
      },
      {
        type: 'feat',
        text: 'Header နှင့် စာမျက်နှာများတွင် Offline Sync အခြေအနေကို ဖော်ပြပေးပြီး အချိန်မရွေး နောက်ဆုံးဒေတာကို ၁-ကလစ်ဖြင့် ရယူနိုင်သည့် Manual Sync ခလုတ်များ ထည့်သွင်းခြင်း',
      },
      {
        type: 'improve',
        text: 'ပင်မစာမျက်နှာ (Home) ရှိ Dashboard အစိတ်အပိုင်းများကို ပိုမိုကျစ်လစ်သိပ်သည်းစွာ ပြင်ဆင်ပြီး ကျောင်းအဆင့် ခွဲခြမ်းမှုကတ်များမှ သက်ဆိုင်ရာ Category စာရင်းသို့ တိုက်ရိုက်သွားရောက်နိုင်စေခြင်း',
      },
    ],
  },
  {
    version: 'v1.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Dashboard တွင် နောက်ဆုံးရ ထုတ်ပြန်ကြေညာချက် ၂ ခုကို ထိပ်ဆုံးသို့ ရွှေ့ပြောင်းဖော်ပြပေးခြင်း',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းချုပ် ဒက်ရှ်ဘုတ် (/dashboard) နှင့် ပင်မစာမျက်နှာတို့တွင် နောက်ဆုံးရ အရေးကြီး ထုတ်ပြန်ကြေညာချက် ၂ ခုကို အပေါ်ဆုံးသို့ ရွှေ့ပြောင်းကာ မျက်ဝါးထင်ထင် ချက်ချင်းဖတ်ရှုနိုင်စေရန် ပုံစံသစ်ဖြင့် ဖော်ပြပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ကြေညာချက်တစ်ခုချင်းစီအတွက် Category Badge၊ ထုတ်ပြန်သည့်ရက်စွဲ၊ ပူးတွဲဖိုင်ပါဝင်မှု အချက်အလက်များနှင့် တိုက်ရိုက်ဖတ်ရှုနိုင်သော Link များ ထည့်သွင်းခြင်း',
      },
    ],
  },
  {
    version: 'v1.8',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Audit Log အသိပေးချက် ခေါင်းလောင်း (Notification Bell) နှင့် ဗားရှင်းသတ်မှတ်ချက် စံသစ် (x.x Standard)',
    changes: [
      {
        type: 'feat',
        text: 'Dashboard Header တွင် မကြာသေးမီက စနစ်အတွင်း ကျောင်းများ၊ ကြေညာချက်များ၊ အက်ဒမင်များ ပြင်ဆင်/ဖျက်ပစ်ခဲ့သော လုပ်ဆောင်ချက်များကို အချိန်နှင့်တပြေးညီ ကြည့်ရှုနိုင်သည့် အသိပေးချက် ခေါင်းလောင်း (Audit Notification Bell) အသစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'အသစ်လုပ်ဆောင်ထားသော မှတ်တမ်းများကို မဖတ်ရသေးပါက Notification Badge အရေအတွက်ဖြင့် အလိုအလျောက် သတိပေးဖော်ပြပေးပြီး "ဖတ်ပြီးမှတ်မည်" နှင့် Admin သို့ တိုက်ရိုက်သွားရောက်နိုင်မှု စနစ်',
      },
      {
        type: 'improve',
        text: 'ဗားရှင်း နံပါတ်သတ်မှတ်မှုကို x.x စနစ်အဖြစ် တရားဝင် ပြောင်းလဲသတ်မှတ်ခြင်း (x.9 ပြည့်ပါက ရှေ့ဂဏန်း ၁ တိုးမြှင့်မည့် စနစ်သစ်)',
      },
    ],
  },
  {
    version: 'v1.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အသင်းချုပ် ဒက်ရှ်ဘုတ် (Association Dashboard)၊ Quick Overview Summary Cards နှင့် Admin စီမံခန့်ခွဲမှုစနစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်များအားလုံးအတွက် ပင်မစာမျက်နှာတွင် စာရင်းဇယားများ၊ ပညာသင်ကြားမှုအဆင့် ခွဲခြမ်းမှု (High/Middle/Primary Breakdown) နှင့် Instant School Search ပါဝင်သော အသင်းချုပ် ဒက်ရှ်ဘုတ် (Association Overview Dashboard) အသစ် တည်ဆောက်ခြင်း',
      },
      {
        type: 'feat',
        text: 'Admin Panel ၏ ထိပ်ဆုံးတွင် စုစုပေါင်း ကျောင်းအရေအတွက်၊ လည်ပတ်ဆဲ (Active)၊ စိစစ်ဆဲ (Under Review)၊ နှစ်စဉ်ကြေး ပေးသွင်းမှု အခြေအနေများကို ၁-ချက်နှိပ်ရုံဖြင့် စစ်ထုတ်ကြည့်ရှုနိုင်သည့် Quick Summary Cards များ ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'အက်ဒမင်များ စီမံခန့်ခွဲမှုစနစ် (Admin Management & Roles) ထည့်သွင်းပြီး အခြားတာဝန်ခံများ၏ Email များကို အက်ဒမင်အဖြစ် လွတ်လပ်စွာ ခန့်အပ်ခြင်း၊ အခွင့်အရေး သတ်မှတ်ခြင်းနှင့် ဖယ်ရှားနိုင်မှု စနစ်',
      },
      {
        type: 'improve',
        text: 'Firestore Security Rules တွင် Dynamic Multi-Admin Verification စနစ် အားဖြည့်ပေးထားခြင်း',
      },
    ],
  },
  {
    version: 'v1.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Admin Audit Log စနစ်၊ ကျောင်း Status Indicators နှင့် အများအပြား ဖျက်ပစ်နိုင်မှုစနစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်း၏ ဒေတာဘေ့စ်တွင် မည်သည့်အက်ဒမင်မှ မည်သည့်အချက်အလက်ကို ပြင်ဆင်/ဖျက်ပစ်ခဲ့သည်ကို အချိန်နှင့်တပြေးညီ တိကျစွာ မှတ်တမ်းတင်ပေးသည့် Admin Audit Log System ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်းများ၏ လက်ရှိအခြေအနေကို လည်ပတ်ဆဲ (Active)၊ စိစစ်ဆဲ (Under Review)၊ ယာယီရပ်နား (Inactive) အဖြစ် အရောင်ခွဲ Status Indicators တံဆိပ်များနှင့် စစ်ထုတ်မှုစနစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'Admin Panel တွင် Checkbox များဖြင့် ကျောင်းများစွာကို တစ်ပြိုင်နက် ရွေးချယ်ပြီး ၁-ကလစ်ဖြင့် အပြီးပိုင် ဖျက်ပစ်နိုင်သည့် Bulk Deletion စနစ်',
      },
      {
        type: 'improve',
        text: 'Firestore Connection နှင့် WebSocket Auto Long-Polling စနစ် အားဖြည့်ပြင်ဆင်ပေးထားခြင်း',
      },
    ],
  },
  {
    version: 'v1.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Progressive Web App (PWA) နှင့် In-App Install စနစ် အပြည့်အစုံ ထည့်သွင်းခြင်း',
    changes: [
      {
        type: 'feat',
        text: 'မိုဘိုင်းဖုန်း (Android, iOS) နှင့် ကွန်ပျူတာ (Chrome, Edge, Desktop) တို့တွင် Native App ကဲ့သို့ ပင်မမျက်နှာပြင်သို့ တိုက်ရိုက်သွင်းယူနိုင်သည့် PWA (Web App Manifest + Service Worker) စနစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'အသုံးပြုသူများ အက်ပ်ကို အလွယ်တကူ သွင်းယူနိုင်စေရန် Header နှင့် Sidebar များတွင် In-App Install ခလုတ်များ ထည့်သွင်းပေးထားခြင်း',
      },
      {
        type: 'feat',
        text: 'iPhone နှင့် iPad (iOS Safari) အသုံးပြုသူများအတွက် Add to Home Screen ပြုလုပ်နည်း အဆင့်ဆင့် လမ်းညွှန်ချက် (Guided Step-by-Step Modal)',
      },
      {
        type: 'feat',
        text: 'အင်တာနက် လိုင်းပြတ်တောက်နေချိန်တွင် အသိပေးပြီး မကြာသေးမီက ဒေတာများကို ဆက်လက်ဖတ်ရှုနိုင်စေမည့် Offline Connectivity Status စနစ်',
      },
      {
        type: 'improve',
        text: 'Google Fonts နှင့် အဓိက Assets များကို Workbox Runtime Caching ဖြင့် အလိုအလျောက် သိုလှောင်ပေးခြင်း',
      },
    ],
  },
  {
    version: 'v1.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    title: 'Admin စာတန်းပြေး Announcement (News Ticker Bar) နှင့် Auto Assign စနစ်',
    changes: [
      {
        type: 'feat',
        text: 'ဝဘ်ဆိုက်၏ ထိပ်ဆုံးတွင် အရေးကြီး သတင်းလွှာများကို အချိန်နှင့်တစ်ပြေးညီ ရွေ့လျားဖော်ပြပေးသည့် စာတန်းပြေး (Live News Ticker Bar) စနစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'Admin Area တွင် စာတန်းပြေးများကို အချိန်မရွေး လွတ်လပ်စွာ ရေးသားခြင်း၊ ပြင်ဆင်ခြင်းနှင့် ၁-ကလစ်ဖြင့် Live ဖွင့်/ပိတ် (Active/Inactive Toggle) ပြုလုပ်နိုင်သော စီမံခန့်ခွဲမှုစနစ်',
      },
      {
        type: 'feat',
        text: 'တင်သည့်အချိန်တွင် ရက်စွဲနှင့် အချိန်ကို အလိုအလျောက် တွက်ချက်ထည့်သွင်းပေးသည့် Date & Time Auto Assign စနစ်နှင့် စိတ်ကြိုက် ပြင်ဆင်နိုင်မှု',
      },
      {
        type: 'feat',
        text: 'အရေးကြီးအဆင့်အလိုက် ဦးစားပေး အရောင်ခွဲခြားမှု (အထူးကြေညာချက် - နီ၊ သတိပေးချက် - ဝါ၊ သတင်း - ပြာ) နှင့် အသုံးပြုသူ ဖတ်ရှုရလွယ်ကူစေရန် Hover-to-Pause စနစ်',
      },
    ],
  },
  {
    version: 'v1.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    title: 'Sidebar၊ ကဏ္ဍခွဲစနစ်နှင့် အသင်းအမှုဆောင်အဖွဲ့ဝင်များ စနစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းများနှင့် အမှုဆောင်အဖွဲ့ဝင်များ (Associations & Executive Committee Members) စာမျက်နှာနှင့် အက်ဒမင်စီမံခန့်ခွဲမှုစနစ် အသစ်ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'ကြေညာချက်များတွင် ကဏ္ဍအလိုက် (Important, Meeting, Events, Training, General) စစ်ထုတ်ကြည့်ရှုနိုင်သော Category Filtering စနစ်',
      },
      {
        type: 'feat',
        text: 'စနစ်တစ်ခုလုံးအတွက် အမြဲတန်း အသုံးပြုရလွယ်ကူသော Sidebar Navigation နှင့် Fixed Header စနစ် တည်ဆောက်ခြင်း',
      },
      {
        type: 'feat',
        text: 'အက်ပ်၏ ဗားရှင်းမှတ်တမ်း (Version History & Changelog) စာမျက်နှာ ထည့်သွင်းခြင်း',
      },
      {
        type: 'improve',
        text: 'မိုဘိုင်းဖုန်းအားလုံးတွင် ဘေးတိုက်လှိမ့်ရခြင်း (Horizontal Scroll) လုံးဝမဖြစ်စေရန် 100% Mobile Responsive စနစ် အဆင့်မြှင့်တင်ခြင်း',
      },
    ],
  },
  {
    version: 'v1.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    title: 'Excel Import စနစ်နှင့် ကျောင်းအချက်အလက် အသေးစိတ် Profile',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်ကျောင်းများစွာကို Excel (.xlsx) ဖြင့် တစ်ကြိမ်တည်း Batch Import တင်သွင်းနိုင်သည့် စနစ်နှင့် ဒေါင်းလုဒ်လုပ်နိုင်သော Excel Template ဖိုင်',
      },
      {
        type: 'feat',
        text: 'ကျောင်းအချက်အလက် ပြည့်စုံစွာ ဖြည့်သွင်းနိုင်သော Form (တည်ထောင်သူ၊ စီမံအုပ်ချုပ်သူ၊ တာဝန်ခံ၊ ဖုန်း၊ Viber၊ Telegram နှင့် မှတ်ချက်များ)',
      },
      {
        type: 'feat',
        text: 'ကျောင်းများနှင့် ကြေညာချက်များ တစ်ခုချင်းစီအတွက် သီးသန့် အသေးစိတ်ကြည့်ရှုနိုင်သော Detail Pages (/schools/:id, /announcements/:id)',
      },
      {
        type: 'improve',
        text: 'အင်တာနက်ပြတ်တောက်နေချိန်တွင်လည်း ဒေတာများ ကြည့်ရှုနိုင်စေရန် Firestore Offline Persistence စနစ် ထည့်သွင်းခြင်း',
      },
    ],
  },
  {
    version: 'v1.1',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    title: 'အချိန်နှင့်တစ်ပြေးညီ Chat ခန်းနှင့် ကြေညာချက်များ',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်များ အချင်းချင်း စကားပြောဆိုနိုင်သော Real-time Chat Room စနစ်',
      },
      {
        type: 'feat',
        text: 'ကြေညာချက်များ တင်ခြင်း၊ ဖျက်ခြင်းနှင့် စာမျက်နှာအလိုက် ကြည့်ရှုနိုင်သော Pagination စနစ်',
      },
      {
        type: 'feat',
        text: 'အက်ဒမင်ဧရိယာအတွက် လုံခြုံရေး Protected Route နှင့် Firebase Authentication စနစ်',
      },
      {
        type: 'improve',
        text: 'ကျောင်းဖုန်းနံပါတ်များကို ကလစ်တစ်ချက်နှိပ်ရုံဖြင့် တိုက်ရိုက်ခေါ်ဆိုနိုင်သော tel: လင့်ခ်များနှင့် ရှာဖွေမှုစနစ်',
      },
    ],
  },
  {
    version: 'v1.0',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    title: 'အခြေခံစနစ် စတင်တည်ဆောက်ခြင်း (Initial Release)',
    changes: [
      {
        type: 'feat',
        text: 'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — သတင်းနှင့် ပြန်ကြားရေးဌာန Web App စတင်မိတ်ဆက်ခြင်း',
      },
      {
        type: 'feat',
        text: 'React + TypeScript + Tailwind CSS + Firebase (Firestore & Storage) အခြေခံစနစ် ထူထောင်ခြင်း',
      },
      {
        type: 'feat',
        text: 'မြန်မာဘာသာ အဓိကအသုံးပြုထားသော သန့်ရှင်းသပ်ရပ်သည့် Empty-state UI စနစ်',
      },
    ],
  },
];

export default function VersionHistory() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-900 text-white rounded-2xl shadow-xs">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-950">
              ဗားရှင်းမှတ်တမ်း <span className="text-lg font-normal text-slate-500">(Version History & Changelog)</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              ဝဘ်အက်ပလီကေးရှင်း၏ ဗားရှင်းအလိုက် ပြုပြင်မွမ်းမံမှုများနှင့် အသစ်ထည့်သွင်းထားသော လုပ်ဆောင်ချက်များ
            </p>
          </div>
        </div>
      </div>

      {/* Version Cards Timeline */}
      <div className="space-y-6">
        {VERSIONS.map((item, idx) => (
          <article
            key={item.version}
            className={`bg-white rounded-2xl border p-6 sm:p-8 shadow-xs transition ${
              item.isLatest
                ? 'border-sky-300 ring-2 ring-sky-100 shadow-sm'
                : 'border-slate-200'
            }`}
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base sm:text-lg font-black text-sky-950 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                  {item.version}
                </span>
                {item.isLatest && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" /> လက်ရှိဗားရှင်း (Latest)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.date}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-sky-950 mt-4 mb-3">
              {item.title}
            </h2>

            {/* Change list */}
            <ul className="space-y-2.5">
              {item.changes.map((change, cIdx) => (
                <li key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {change.type === 'feat' ? (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      NEW
                    </span>
                  ) : change.type === 'improve' ? (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      UPDATE
                    </span>
                  ) : (
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      FIX
                    </span>
                  )}
                  <span className="break-words">{change.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-slate-100/70 rounded-2xl border border-slate-200 text-center space-y-2 text-xs sm:text-sm text-slate-600">
        <p className="font-semibold text-slate-800">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း</p>
        <p>သတင်းနှင့် ပြန်ကြားရေးဌာန နည်းပညာအဖွဲ့မှ စဉ်ဆက်မပြတ် အဆင့်မြှင့်တင် ပေးလျက်ရှိပါသည်။</p>
        <div className="pt-2">
          <Link to="/" className="text-sky-800 font-bold hover:underline">
            ← ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    </div>
  );
}
