import { History, GitCommit, Sparkles, CheckCircle2, Shield, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
    version: 'v2.10',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: true,
    title: 'Back (နောက်သို့) ခလုတ် ထည့်သွင်းခြင်း၊ Admin သီးသန့် ခလုတ်များ ဖယ်ရှားခြင်းနှင့် Header ရှင်းလင်းမှု (Header Clean & Navigation UX)',
    changes: [
      {
        type: 'feat',
        text: 'Navbar ထိပ်တန်းတွင် ပင်မစာမျက်နှာမှအပ မည်သည့်စာမျက်နှာမဆို ရှေ့သို့ ချက်ချင်းပြန်သွားနိုင်သော "နောက်သို့ (Back)" ခလုတ် ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'အသင်းဝင်ကျောင်းများ စာမျက်နှာ ထိပ်ပိုင်းတွင် သီးခြား "နောက်သို့ (Back)" ခလုတ် ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'အသင်းဝင်ကျောင်းများ စာမျက်နှာတွင် သာမန်အသုံးပြုသူများအတွက် မလိုအပ်သော Admin ခလုတ်များ (Offline Sync၊ Excel Template၊ Admin Excel သွင်းရန်) ကို ရှင်းထုတ်ပေးပြီး စာမျက်နှာအမြင် သန့်ရှင်းကျစ်လျစ်စေခြင်း',
      },
      {
        type: 'improve',
        text: 'Navbar ထိပ်တန်းမှ Version Update အမဲခလုတ်ကို ဖြုတ်ပယ်ပြီး Sidebar မီနူးထဲတွင်သာ သပ်ရပ်စွာ ထားရှိပေးခြင်း',
      },
    ],
  },
  {
    version: 'v2.9',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ဖုန်း Screen ပေါ်တွင် ကျောင်းအမည် အပြည့်အစုံ ပေါ်လွင်စေခြင်းနှင့် ရှာဖွေမှု / ကဏ္ဍ ရွေးချယ်မှု နေရာယူမှု အလွန်ကျစ်လျစ်အောင် ပြင်ဆင်ခြင်း (Mobile UI Optimization)',
    changes: [
      {
        type: 'fix',
        text: 'ဖုန်းဖြင့် ကြည့်ရှုချိန်တွင် ကျောင်းအမည်များ ခလုတ်များကြား ညပ်ပြီး ပျောက်ကွယ်မသွားစေဘဲ ထိပ်ဆုံးတွင် အကျယ်ပြန့်ဆုံး နေရာယူကာ မြန်မာစာ စာလုံးမပြတ် အပြည့်အစုံ ပေါ်လွင်အောင် ပြင်ဆင်ပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ကျောင်းကတ်တစ်ခုစီရှိ "ဖုန်းခေါ်ရန်" နှင့် "အသေးစိတ်" ခလုတ်များကို ဖုန်းတွင် သီးခြား အောက်ဘက်တန်းသို့ သပ်ရပ်စွာ ခွဲထုတ်ပေးသဖြင့် လက်မဖြင့် နှိပ်ရ ပိုမိုလွယ်ကူစေခြင်း',
      },
      {
        type: 'improve',
        text: 'စာမျက်နှာထိပ်ရှိ Category Select၊ Search Bar နှင့် Filter ကတ်များကို တစ်ခုတည်းအဖြစ် ပေါင်းစည်းကျစ်လျစ်စေပြီး မိုဘိုင်းမျက်နှာပြင်တွင် နေရာယူမှု ၆၅% အထိ လျှော့ချပေးခြင်းဖြင့် ကျောင်းစာရင်းများကို ချက်ချင်း မြင်တွေ့စေခြင်း',
      },
    ],
  },
  {
    version: 'v2.8',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'အသင်းနှင့် အမှုဆောင်အဖွဲ့ဝင်များ ပြင်ဆင်နိုင်သည့် စနစ် (Association Edit & Committee Update)၊ မြန်မာစာ တတ်နိုင်သမျှ စာလုံးမပျောက်ဘဲ အပြည့်အစုံ ဖော်ပြမှု ပြင်ဆင်ခြင်း',
    changes: [
      {
        type: 'feat',
        text: 'Admin စာမျက်နှာရှိ အသင်းများ (Associations Tab) တွင် အသင်းအမည်၊ မြို့နယ်၊ ဖုန်း၊ လိပ်စာနှင့် အမှုဆောင်အဖွဲ့ဝင်များအားလုံးကို တိုက်ရိုက် ပြင်ဆင်မွမ်းမံနိုင်သော (Edit Association) စနစ် ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'fix',
        text: 'အသင်းများနှင့် အမှုဆောင်များ စာမျက်နှာတွင် မြန်မာစာ ကျောင်းအမည်များနှင့် ရာထူးများ တတ်နိုင်သမျှ စာလုံးမပြတ်ဘဲ အပြည့်အစုံ စနစ်တကျ ပေါ်လွင်စေရန် ပြင်ဆင်ပေးခြင်း',
      },
      {
        type: 'fix',
        text: 'Category / ကျောင်းအဆင့် ကိန်းဂဏန်း အရေအတွက်များ Dashboard, Contacts Directory နှင့် Admin စာမျက်နှာတို့တွင် တိကျစွာ ကိုက်ညီအောင် ပြင်ဆင်ပေးထားခြင်း',
      },
    ],
  },
  {
    version: 'v2.7',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Category / ကျောင်းအဆင့် ရွေးချယ်မှု စနစ်သစ် (Clean Dropdown Select)၊ Edit & Sync စနစ် ပြည့်စုံစွာ ပြင်ဆင်ခြင်း၊ Category ပြင်ဆင်ပါက ကျောင်းများ အလိုအလျောက် Sync ဖြစ်ခြင်း နှင့် Auto Collapse Mode',
    changes: [
      {
        type: 'feat',
        text: 'Admin Form နှင့် စာမျက်နှာအသီးသီးရှိ Category ရွေးချယ်မှုကို Dropdown (<select>) စနစ်ဖြင့် သပ်ရပ်စွာ ပြင်ဆင်ပေးပြီး Overflow မဖြစ်စေဘဲ မည်သည့် Screen တွင်မဆို ကြည့်ကောင်းအောင် ပြုလုပ်ပေးခြင်း',
      },
      {
        type: 'fix',
        text: 'Category / ကျောင်းအဆင့် အမည် ပြင်ဆင် (Edit) ခဲ့ပါက သက်ဆိုင်ရာ ကျောင်းများ၏ Category ကိုပါ အလိုအလျောက် Firestore Batch Update ဖြင့် ချက်ချင်း Sync လုပ်ပေးသဖြင့် ကျောင်းများ သီးခြားကွဲထွက်ခြင်းနှင့် ပျောက်ဆုံးခြင်း လုံးဝ မဖြစ်ပေါ်စေခြင်း',
      },
      {
        type: 'feat',
        text: 'Category တစ်ခုခုကို ဖျက်ပစ်ခဲ့လျှင်လည်း ကျောင်းဒေတာများ ပျောက်ပျက်မသွားဘက် "အဆင့် သတ်မှတ်ရန်လို (Unassigned)" ကဏ္ဍအောက်သို့ အလိုအလျောက် စနစ်တကျ ပြောင်းရွှေ့ကျန်ရှိနေစေခြင်း',
      },
      {
        type: 'improve',
        text: 'Contacts Directory ရှိ Category အုပ်စုများကို Auto Collapse Mode အဖြစ် မူလထားရှိပေးထားပြီး မိမိကြည့်လိုသော ကဏ္ဍတစ်ခုချင်းစီကိုသာ နှိပ်၍ ဖြေလျော့ကြည့်ရှုနိုင်စေခြင်း',
      },
      {
        type: 'fix',
        text: 'School Details နှင့် Admin Table မှ ကျောင်းအချက်အလက် ပြင်ဆင်ရန် (Edit) ခလုတ်များ နှိပ်လိုက်ပါက Admin Form သို့ တိုက်ရိုက်ရောက်ရှိပြီး စာရွက်စာတမ်း အချက်အလက်များအားလုံး တိကျစွာ ပြင်ဆင်နိုင်စေခြင်း',
      },
    ],
  },
  {
    version: 'v2.6',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'နာမည်နှင့် ရာထူးများ အပြည့်အစုံ ဖော်ပြသည့် Dropdown ဖုန်း Directory စနစ်၊ ကျောင်းတည်နေရာ ၄-ပိုင်း (လိပ်စာ၊ မြို့နယ်၊ မြို့၊ ဇုန်) ခွဲခြားသတ်မှတ်မှု၊ ကျောင်း Logo ပုံများ ချိတ်ဆက်မှုနှင့် Automatic Version History စနစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်ကျောင်းများ Contacts Phone Directory တွင် နာမည်နှင့် ရာထူးများ စာလုံးตัด/စာလုံးပျောက်ခြင်းမရှိဘဲ သီးခြား ပေါ်လွင်သော Badge လှလှလေးများဖြင့် အပြည့်အစုံ ဖော်ပြပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်းကတ်တစ်ခုစီတွင် "📞 ဖုန်းခေါ်ရန် Dropdown ▾" စနစ်ဖြင့် နှိပ်လိုက်မှ ဖုန်းနံပါတ်စာရင်း ပေါ်ထွက်လာပြီး Overflow မဖြစ်စေဘဲ စာမျက်နှာအမြင် ရှင်းလင်းကျစ်လျစ်စေရန် ဖန်တီးပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်းအချက်အလက်များတွင် ကျောင်းလိပ်စာ၊ မြို့နယ်၊ မြို့ နှင့် ဇုန် (Zone) ဟူ၍ ၄-ပိုင်း သီးခြား ခွဲခြားထည့်သွင်းနိုင်ပြီး Admin Form၊ ကျောင်းအသေးစိတ်နှင့် Excel Export/Import များတွင် စနစ်တကျ ချိတ်ဆက်ပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ကျောင်း Logo ပုံများ ထည့်သွင်းထားပါက Dashboard စာရင်း၊ Contacts စာရင်း၊ Admin ဇယားနှင့် ကျောင်းအသေးစိတ် စာမျက်နှာများတွင် သက်ဆိုင်ရာကျောင်း Logo အလိုအလျောက် တိုက်ရိုက် ပေါ်ထွက်လာစေခြင်း',
      },
      {
        type: 'feat',
        text: 'စနစ်အတွင်း ပြင်ဆင်မှုနှင့် အပ်ဒိတ်များ ပြုလုပ်တိုင်း Version History မှတ်တမ်းအပြည့်အစုံကို အလိုအလျောက် အမြဲတမ်း ထိန်းသိမ်း ဖော်ပြပေးသွားမည်ဖြစ်ပြီး အနက်ရောင် Version Update v2.6 တံဆိပ် ထည့်သွင်းပေးခြင်း',
      },
    ],
  },
  {
    version: 'v2.5',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'တန်းပြီး ဖုန်းခေါ်ဆိုနိုင်သော အသင်းဝင်ကျောင်းများ Phone Directory စနစ်၊ လှပသပ်ရပ်သော Responsive Directory Grid၊ နှစ်စဉ်ကြေး မသွင်းရသေး စံသတ်မှတ်ချက်နှင့် Version Update စနစ်သစ်',
    changes: [
      {
        type: 'feat',
        text: 'အသင်းဝင်ကျောင်းများ စာရင်း (Contacts) တွင် အထဲထိ ဝင်စရာမလိုဘဲ တိုက်ရိုက် ၁-ချက်နှိပ် ဖုန်းခေါ်ဆိုနိုင်သည့် Directory စနစ်သစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'ကျောင်းအလိုက် တည်ထောင်သူ ဖုန်း (၁/၂)၊ စီမံအုပ်ချုပ်သူ ဖုန်း (၁/၂)၊ တာဝန်ခံ (၁) ဖုန်း (၁/၂)၊ တာဝန်ခံ (၂) ဖုန်း (၁/၂) နှင့် ကျောင်းဖုန်း (၁/၂) တို့ကို တာဝန်အဆင့်အတန်းအလိုက် တိကျရှင်းလင်းစွာ ခွဲခြားပြသပြီး ရှိသမျှ ဖုန်းနံပါတ်အားလုံးကို တန်းပြီး ဖုန်းခေါ်ဆိုနိုင်အောင် စီစဉ်ပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'ဖုန်းနံပါတ်များကို ပျံ့ကြဲမနေစေဘဲ မိုဘိုင်းနှင့် ကွန်ပျူတာ အလိုက် ညီညာသပ်ရပ်သော Responsive Directory Grid Layout (လှလှလေးစီထားသော စနစ်) ဖြင့် အမြင်ရှင်းလင်း အသုံးပြုရ လွယ်ကူစေရန် ပြင်ဆင်ခြင်း',
      },
      {
        type: 'improve',
        text: 'စနစ်တစ်ခုလုံးရှိ "ကြေးမပေးရသေး" အခေါ်အဝေါ်အားလုံးကို "နှစ်စဉ်ကြေး မသွင်းရသေး" ဟူ၍ တရားဝင် စံသတ်မှတ်ပြင်ဆင်ပြီး Contacts၊ Dashboard၊ Admin နှင့် School Detail တို့တွင် ပေါ်လွင်သော Status Badges များဖြင့် ပြသပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'အသစ်ပါဝင်လာသော စနစ်လုပ်ဆောင်ချက်များကို အသုံးပြုသူတိုင်း အလွယ်တကူ သိရှိစေရန် အနက်ရောင် Version Update (အမဲ) v2.5 တံဆိပ်နှင့် What\'s New Modal စနစ်သစ် ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'fix',
        text: 'Cloudflare Pages Deploy စနစ်နှင့် Standalone npm package-lock.json dependency sync တည်ငြိမ်မှု အဆင့်မြှင့်တင်ခြင်း',
      },
    ],
  },
  {
    version: 'v2.4',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'ကျောင်းအဆင့်များ သုံးဘက်ညီ (Contacts, Dashboard, Admin) တပြေးညီ ချိတ်ဆက်မှု၊ ကျစ်လျစ်သပ်ရပ်သော Notification စနစ်၊ ခေါင်းလောင်း အသိပေးချက် (Bell Notification) နှင့် Version Update အမဲ တံဆိပ် စနစ်သစ်',
    changes: [
      {
        type: 'feat',
        text: 'Contacts (ပထမပုံ)၊ Dashboard (ဒုတိယပုံ) နှင့် Admin (တတိယပုံ) တို့ရှိ ကျောင်းအဆင့် (School Levels) များကို တပြေးညီ (Inline Real-time Sync) ချိတ်ဆက်ပေးပြီး Admin တွင် ပြင်ဆင်/အတိုးအလျှော့ ပြုလုပ်မှုတိုင်း မျက်နှာပြင်အားလုံးတွင် တိုက်ရိုက် အလိုအလျောက် ပြောင်းလဲသွားစေခြင်း',
      },
      {
        type: 'feat',
        text: 'ခေါင်းလောင်း အသိပေးချက် (Notification Bell) ကို Preview နှင့် အသုံးပြုသူ မျက်နှာပြင်အားလုံးတွင် မပျောက်ကွယ်ဘဲ အမြဲတစေ ပေါ်လွင်ထင်ရှားစွာ မြင်တွေ့နိုင်အောင် ဖန်တီးပေးပြီး စနစ်လုပ်ဆောင်ချက်များ (ကျောင်းထည့်/ပြင်/ဖျက်) နှင့် ဗားရှင်းအသစ်များကို အချိန်နှင့်တပြေးညီ အသိပေးစေခြင်း',
      },
      {
        type: 'feat',
        text: 'စနစ်အတွင်း တခုခုပြောင်းတိုင်း၊ ပြင်တိုင်း၊ Improve လုပ်တိုင်း နဂိုအခြေအနေနှင့် မတူသည်များကို ချက်ချင်း သိရှိစေရန် အနက်ရောင် (Black) "Version Update v2.4" တံဆိပ်ကို Header၊ Sidebar၊ Footer နှင့် Version History တို့တွင် အထင်အရှား ထည့်သွင်းပေးခြင်း',
      },
      {
        type: 'improve',
        text: 'အသုံးပြုသူ ကြည့်ရှုအသုံးပြုရာတွင် အဆင်မပြေဖြစ်စေသော အရှည်ကြီးဖြစ်နေသည့် Notification များနှင့် Toast များကို ကျစ်လျစ်သိပ်သည်းပြီး မျက်စိရှင်းလင်းစွာ ဖတ်ရှုနိုင်သော Compact Alert Strip နှင့် စက္ကန့်တို Toast စနစ်အဖြစ် ပြောင်းလဲပြင်ဆင်ခြင်း',
      },
      {
        type: 'improve',
        text: 'Admin Excel File တင်သွင်းမှု (Import) လုပ်ဆောင်နေချိန်နှင့် ပြီးဆုံးချိန် အသိပေးချက်များကို စာကြောင်းအရှည်ကြီး မဖြစ်စေဘဲ စာရင်းအသစ် (+), အပ်ဒိတ် (↺) စသည့် တိုတိုရှင်းရှင်း အရေအတွက်ပြ Compact Status Bar ဖြင့် အစားထိုးခြင်း',
      },
    ],
  },
  {
    version: 'v2.3',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
    title: 'Admin စကားဝှက် (Password) လုံခြုံရေး စနစ်သစ်၊ မိမိစိတ်ကြိုက် စကားဝှက် ပြောင်းလဲသတ်မှတ်နိုင်မှုနှင့် Cloudflare Pages Build အဆင့်မြှင့်တင်ခြင်း',
    changes: [
      {
        type: 'feat',
        text: 'Admin Portal Login တွင် လုံခြုံစိတ်ချရသော Firebase Authentication စနစ်ဖြင့် စစ်ဆေးဝင်ရောက်နိုင်အောင် စီစဉ်ပေးခြင်း',
      },
      {
        type: 'feat',
        text: 'Admin စနစ်ထဲသို့ ဝင်ရောက်ပြီးနောက် အချိန်မရွေး ထိပ်ဆုံး Header Bar နှင့် Admin စာမျက်နှာရှိ "စကားဝှက် ပြောင်းမည် (Change Password)" ခလုတ်မှတစ်ဆင့် မိမိစိတ်ကြိုက် စကားဝှက်အသစ်သို့ လွတ်လပ်စွာ ပြောင်းလဲသတ်မှတ်နိုင်သည့် စနစ်သစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'feat',
        text: 'Login စာမျက်နှာတွင်လည်း စကားဝှက် မေ့လျော့နေပါက သို့မဟုတ် အသစ်ပြောင်းလိုပါက Password Reset Link ကို မိမိအီးမေးလ်သို့ ပို့ဆောင်ပြီး လုံခြုံစွာ ပြန်လည်သတ်မှတ်နိုင်သည့် စနစ် ထည့်သွင်းခြင်း',
      },
      {
        type: 'improve',
        text: 'စကားဝှက် ပြောင်းလဲမှုတိုင်းကို Audit Log တွင် အချိန်နှင့်တပြေးညီ မှတ်တမ်းတင်ထားရှိစေပြီး ခွင့်ပြုချက်မရှိဘဲ ကျူးကျော်ဝင်ရောက်ခြင်းမှ ကာကွယ်ပေးခြင်း',
      },
      {
        type: 'fix',
        text: 'Cloudflare Pages Deploy ပြုလုပ်ရာတွင် bun package manager list-all 403 Forbidden ကြောင့် Build Fail ဖြစ်ပွားခဲ့သော ပြဿနာကို node & npm standalone architecture ဖြင့် အောင်မြင်စွာ တည်ဆောက်နိုင်အောင် ဖြေရှင်းပြင်ဆင်ခြင်း',
      },
    ],
  },
  {
    version: 'v2.2',
    date: '၂၀၂၆ ခုနှစ်၊ အောက်တိုဘာလ',
    isLatest: false,
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
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Back Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
          title="နောက်သို့ (Back)"
        >
          <ArrowLeft className="w-4 h-4 text-sky-800" />
          <span>နောက်သို့ (Back)</span>
        </button>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          ပင်မစာမျက်နှာ ➔
        </Link>
      </div>

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
                ? 'border-neutral-900 ring-2 ring-neutral-900/15 shadow-md'
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-900 text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" /> လက်ရှိဗားရှင်း (Latest Version)
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
