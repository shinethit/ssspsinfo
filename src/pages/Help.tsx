import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Home,
  BookOpen,
  Users,
  Ticket,
  Trophy,
  Award,
  FolderOpen,
  Images,
  BarChart3,
  Calendar,
  MessageSquare,
  Building2,
  School,
  ShieldCheck,
  LogIn,
  Phone,
  Lock,
  Eye,
  CircleHelp,
} from 'lucide-react';

function SectionCard({ icon: Icon, iconBg, title, subtitle, children }: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-3 rounded-2xl ${iconBg}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FeatureItem({ icon: Icon, title, text, to }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  to: string;
}) {
  return (
    <Link to={to} className="flex gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 transition group">
      <Icon className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-slate-900 text-sm group-hover:text-sky-900">{title}</p>
        <p className="text-sm text-slate-600 leading-relaxed mt-0.5">{text}</p>
      </div>
    </Link>
  );
}

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">အသုံးပြုနည်း</h1>
            <p className="text-sm text-slate-500">ဒီ App ကို ဘယ်လိုသုံးရမလဲ — လွယ်လွယ်ရှင်းရှင်း ဖော်ပြထားပါတယ်</p>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed">
          ဒီ App သည် <span className="font-bold">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း</span> ၏
          သတင်းအချက်အလက် မျှဝေရာ နေရာဖြစ်သည်။ ကျောင်းများ၊ မိဘများ၊ ပြည်သူများ —
          မည်သူမဆို အချက်အလက်များကို <span className="font-bold">login ဝင်စရာမလိုဘဲ</span> ကြည့်ရှုနိုင်သည်။
          ပြင်ဆင်လိုမှသာ အကောင့်ဖြင့် login ဝင်ရန် လိုအပ်သည်။
        </p>
      </div>

      {/* For everyone */}
      <SectionCard icon={Eye} iconBg="bg-emerald-100 text-emerald-700" title="လူတိုင်းအတွက် — login မလိုပါ" subtitle="အောက်ပါစာမျက်နှာများကို မည်သူမဆို ဖွင့်ကြည့်နိုင်ပါသည်">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureItem icon={Home} title="ပင်မစာမျက်နှာ" text="အသင်းရဲ့ နောက်ဆုံးသတင်း၊ ကြေညာချက်နဲ့ အရေးကြီးအချက်အလက်များကို တစ်နေရာတည်း ကြည့်နိုင်သည်။" to="/" />
          <FeatureItem icon={BookOpen} title="ကြေညာချက်များ" text="အသင်းက ထုတ်ပြန်တဲ့ ကြေညာချက်အားလုံးကို ဖတ်နိုင်သည်။ တစ်ခုချင်းစီကို နှိပ်ပြီး အသေးစိတ် ဖတ်နိုင်သည်။" to="/announcements" />
          <FeatureItem icon={Users} title="အသင်းဝင်ကျောင်းများ / ဆက်သွယ်ရန်" text="ကျောင်းတစ်ကျောင်းချင်းစီရဲ့ ဖုန်းနံပါတ်၊ လိပ်စာ၊ မြို့နယ်တို့ကို ရှာပြီး တိုက်ရိုက်ဆက်သွယ်နိုင်သည်။ ကျောင်းကို နှိပ်ရင် အသေးစိတ်စာမျက်နှာ ပွင့်သည်။" to="/contacts" />
          <FeatureItem icon={Ticket} title="ပွဲများ" text="အသင်းရဲ့ ပွဲတွေ၊ အခမ်းအနားတွေ ဘယ်နေ့၊ ဘယ်မှာလုပ်မလဲဆိုတာ ကြည့်နိုင်သည်။" to="/events" />
          <FeatureItem icon={Calendar} title="ပြက္ခဒိန်" text="ပွဲရက်စွဲများကို ပြက္ခဒိန်ပုံစံနဲ့ ကြည့်နိုင်သည်။" to="/calendar" />
          <FeatureItem icon={Trophy} title="အားကစား" text="အားကစားပြိုင်ပွဲများ၊ ပြိုင်ပွဲရလဒ်များကို ကြည့်နိုင်သည်။" to="/sports" />
          <FeatureItem icon={Award} title="ဆုတံဆိပ်ဇယား" text="ကျောင်းအလိုက် ရရှိထားတဲ့ ဆုတံဆိပ်အရေအတွက်ကို ဇယားနဲ့ ကြည့်နိုင်သည်။" to="/medals" />
          <FeatureItem icon={FolderOpen} title="စာရွက်စာတမ်းများ" text="အသင်းနဲ့ သက်ဆိုင်တဲ့ စာရွက်စာတမ်းဖိုင်များကို ဒေါင်းလုဒ်ဆွဲနိုင်သည်။" to="/documents" />
          <FeatureItem icon={Images} title="ဓာတ်ပုံများ" text="အသင်းရဲ့ လှုပ်ရှားမှုဓာတ်ပုံများကို ကြည့်နိုင်သည်။" to="/gallery" />
          <FeatureItem icon={BarChart3} title="ဒက်ရှ်ဘုတ် (စာရင်းအင်း)" text="အသင်းဝင် ကျောင်းအရေအတွက်၊ ငွေကြေးစာရင်း အကျဉ်းချုပ်ကို ကြည့်နိုင်သည်။" to="/dashboard" />
          <FeatureItem icon={Building2} title="အသင်းများ" text="အသင်းအဖွဲ့ဝင်အသင်းများအကြောင်း ကြည့်နိုင်သည်။" to="/associations" />
        </div>
      </SectionCard>

      {/* v24.13 P8: Chat is signed-in-only (rules + Chat page) — it was wrongly
          listed above under "login မလိုပါ". It lives here now. */}
      <SectionCard icon={LogIn} iconBg="bg-amber-100 text-amber-700" title="login ဝင်ပြီးမှ သုံးနိုင်သော စာမျက်နှာ" subtitle="အောက်ပါစာမျက်နှာကို အကောင့်ဖြင့် login ဝင်ပြီးမှသာ သုံးနိုင်ပါသည်">
        <div className="grid sm:grid-cols-2 gap-3">
          <FeatureItem icon={MessageSquare} title="Chat ဆွေးနွေးခန်း" text="အသင်းဝင်များ အချင်းချင်း စကားပြော ဆွေးနွေးနိုင်သော နေရာဖြစ်သည်။ အကောင့်ဖြင့် login ဝင်ပြီးမှ မက်ဆေ့ခ်ျ ဖတ်/ပို့နိုင်သည်။" to="/chat" />
        </div>
      </SectionCard>

      {/* For schools */}
      <SectionCard icon={School} iconBg="bg-sky-100 text-sky-700" title="ကျောင်းများအတွက် — School Portal" subtitle="ကိုယ့်ကျောင်းရဲ့ အချက်အလက်ကို ကိုယ်တိုင်ပြင်နိုင်ပါသည်">
        <ol className="space-y-3 text-sm text-slate-700 leading-relaxed list-none">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center mt-0.5">1</span>
            <p><span className="font-bold text-slate-900">အကောင့်ရယူပါ။</span> ကျောင်း၏ login အကောင့်ကို အသင်း Admin က ဖွင့်ပေးရသည်။ အကောင့်မရှိသေးလျှင် အသင်း Admin ကို ဆက်သွယ်ပါ။</p>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center mt-0.5">2</span>
            <p><span className="font-bold text-slate-900">login ဝင်ပါ။</span> <Link to="/school-login" className="text-sky-700 font-bold underline">School Login စာမျက်နှာ</Link> တွင် အကောင့်ဖြင့် ဝင်ပါ။</p>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center mt-0.5">3</span>
            <p><span className="font-bold text-slate-900">ကိုယ့်အချက်အလက်ကို ပြင်ပါ။</span> School Portal ထဲတွင် ဖုန်းနံပါတ်၊ လိပ်စာ၊ မြို့နယ်၊ ဇုန်၊ ကျောင်းသားဦးရေတို့ကို ပြင်ဆင်သိမ်းဆည်းနိုင်သည်။</p>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center mt-0.5">4</span>
            <p><span className="font-bold text-slate-900">ကိုယ့်ပွဲကို တင်ပါ။</span> ကိုယ့်ကျောင်းရဲ့ လှုပ်ရှားမှု၊ အခမ်းအနားများကို Events တွင် တင်နိုင်သည်။</p>
          </li>
        </ol>
        <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <span className="font-bold">သတိပြုရန် —</span> ကျောင်းအနေဖြင့် ကြေးငွေနှင့် အခြေအနေ (status) တို့ကို
            ပြင်၍မရပါ။ ထိုအချက်အလက်များကို Admin ကသာ ပြင်ဆင်သည်။ တခြားကျောင်းရဲ့ အချက်အလက်ကိုလည်း
            ပြင်၍မရပါ — ကိုယ့်ကျောင်းကိုယ်သာ ပြင်နိုင်သည်။
          </p>
        </div>
      </SectionCard>

      {/* Roles: exactly 4 */}
      <SectionCard icon={ShieldCheck} iconBg="bg-violet-100 text-violet-700" title="အသုံးပြုသူ အမျိုးအစားများ — ၄ မျိုး" subtitle="ဘယ်သူက ဘာလုပ်နိုင်လဲ">
        <div className="space-y-4">
          <div>
            <p className="font-bold text-slate-900 text-sm">၁။ Guest — အကောင့်မရှိသူ</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">login ဝင်စရာမလိုပါ။ Contact နဲ့ ဖုန်းနံပါတ်များ၊ ကော်မတီများ၊ သတင်းများ၊ အားကစားပွဲများ၊ စာရွက်စာတမ်းများ၊ ဓာတ်ပုံများ၊ Dashboard ကို ကြည့်နိုင်သည်။ ဘာကိုမှ ပြင်၍မရပါ။</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">၂။ User — အကောင့်ရှိသူ (ကျောင်းအကောင့်)</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">Admin က ဖွင့်ပေးသော ကျောင်းအကောင့်ဖြင့် School Login ဝင်ပြီးနောက် ကိုယ့်ကျောင်း၏ ဖုန်း၊ လိပ်စာ၊ မြို့နယ်၊ ဇုန်၊ ကျောင်းသားဦးရေတို့ကို ပြင်နိုင်ပြီး ကိုယ့်ပွဲများကို တင်နိုင်သည်။ တခြားကျောင်း၊ ကြေးငွေ၊ အခြေအနေ (status) တို့ကို ပြင်၍မရပါ။</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">၃။ Moderator</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1"><Link to="/login" className="text-sky-700 font-bold underline">Admin Login</Link> ဖြင့် ဝင်ရောက်ပြီး Admin ဧရိယာတွင် ကျောင်းတိုင်းကို ပြင်နိုင်သည် — ကော်မတီ၊ ကြေညာချက်၊ ပွဲများ၊ အားကစား၊ စာရွက်စာတမ်း၊ ဓာတ်ပုံ၊ ငွေစာရင်း၊ Contact များအပါအဝင်။ ကျောင်းအကောင့်များ ဖွင့်ပေးနိုင်သည်။ Moderator/Admin အကောင့် ဖွင့်ခြင်း/ဖျက်ခြင်း၊ Backup၊ Audit log တို့ကို လုပ်၍မရပါ။</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">၄။ Admin</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">Moderator လုပ်နိုင်တာအားလုံး အပြင် Moderator/Admin အသစ် ခန့်ခြင်း/ဖြုတ်ခြင်း၊ Backup၊ Audit log ကြည့်ခြင်းတို့ကို လုပ်နိုင်သည်။</p>
          </div>
        </div>
      </SectionCard>

      {/* FAQ */}
      <SectionCard icon={CircleHelp} iconBg="bg-rose-100 text-rose-700" title="အမေးများသော မေးခွန်းများ" subtitle="သိထားသင့်သော အချက်များ">
        <div className="space-y-4">
          <div>
            <p className="font-bold text-slate-900 text-sm flex gap-2"><Phone className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" /> ဖုန်းနံပါတ်တွေကို login မဝင်ဘဲ ဘာလို့ မြင်ရတာလဲ?</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1 pl-6">လူတိုင်း ကျောင်းကို လွယ်လွယ်ဆက်သွယ်နိုင်အောင်ပါ။ မိဘတစ်ယောက် ကျောင်းကို ဖုန်းဆက်ချင်လျှင် အကောင့်ဖွင့်စရာ မလိုဘဲ ဖုန်းနံပါတ်ကို ချက်ချင်းမြင်ရမည်။</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm flex gap-2"><Eye className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" /> ဒီ App က အများပြည်သူအတွက် ဖွင့်ထားတာလား?</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1 pl-6">အချက်အလက်များကို ကြည့်ရှုခြင်းသည် လူတိုင်းအတွက် ဖွင့်ထားသော်လည်း၊ ဤ App သည် အသင်း၏ အတွင်းပိုင်းအသုံးပြုမှုအတွက်သာ ရည်ရွယ်သည်။ Google ကဲ့သို့ search engine များတွင် ရှာမတွေ့နိုင်အောင် စီစဉ်ထားသည်။</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm flex gap-2"><LogIn className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" /> အကောင့်လိုချင်လျှင် (သို့) အချက်အလက်မှားနေလျှင် ဘယ်သူ့ကို ဆက်သွယ်ရမလဲ?</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1 pl-6">အသင်း၏ Admin ကို ဆက်သွယ်ပါ။ ကျောင်းအကောင့် ဖွင့်ပေးခြင်း၊ အချက်အလက်ပြင်ဆင်ခြင်းတို့ကို Admin က ဆောင်ရွက်ပေးသည်။ Admin နှင့် ကျောင်းတာဝန်ခံများ၏ ဖုန်းနံပါတ်များကို <Link to="/contacts" className="text-sky-700 font-bold underline">ဆက်သွယ်ရန် စာမျက်နှာ (Contacts)</Link> တွင် ကြည့်နိုင်ပါသည်။</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
