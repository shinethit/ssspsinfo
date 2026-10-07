import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { School } from '../types';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Send, School as SchoolIcon, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchool = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const docRef = doc(db, 'schools', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchool({ id: docSnap.id, ...docSnap.data() } as School);
        } else {
          setSchool(null);
        }
      } catch (err) {
        console.error('Error fetching school detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [id]);

  const handleDeleteSchool = async () => {
    if (!school) return;
    if (!confirm(`"${school.name}" ၏ အချက်အလက်များကို အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`)) return;
    try {
      await deleteDoc(doc(db, 'schools', school.id));
      toast.success('ကျောင်းအချက်အလက်ကို ဖျက်ပြီးပါပြီ');
      navigate('/contacts');
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const handleToggleFeeStatus = async () => {
    if (!school) return;
    try {
      const nextStatus = !school.isAnnualFeePaid;
      await updateDoc(doc(db, 'schools', school.id), {
        isAnnualFeePaid: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setSchool({ ...school, isAnnualFeePaid: nextStatus });
      toast.success(
        nextStatus
          ? `"${school.name}" ၏ နှစ်စဉ်ကြေးကို ပေးသွင်းပြီးအဖြစ် ပြောင်းလဲလိုက်ပါပြီ`
          : `"${school.name}" ၏ နှစ်စဉ်ကြေးကို မပေးသွင်းရသေးအဖြစ် ပြောင်းလဲလိုက်ပါပြီ`
      );
    } catch (err) {
      toast.error('ပြောင်းလဲ၍ မရပါ');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-md w-1/3 mx-auto"></div>
        <div className="h-4 bg-slate-100 rounded-md w-1/2 mx-auto"></div>
        <div className="h-40 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <SchoolIcon className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold text-slate-700">ကျောင်းအချက်အလက် ရှာမတွေ့ပါ</h3>
        <p className="text-slate-500 text-sm">ရှာဖွေနေသော ကျောင်းအချက်အလက် မရှိတော့ပါ သို့မဟုတ် ဖျက်လိုက်ပြီး ဖြစ်နိုင်ပါသည်။</p>
        <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
          <ArrowLeft className="w-4 h-4" /> အသင်းဝင်ကျောင်းများသို့ ပြန်သွားရန်
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
      <Link
        to="/contacts"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-800 hover:text-sky-950 transition"
      >
        <ArrowLeft className="w-4 h-4" /> အသင်းဝင်ကျောင်းများသို့ ပြန်သွားရန်
      </Link>

      {/* Admin Quick Control Bar (if signed in) */}
      {user && (
        <div className="bg-sky-50 border border-sky-200 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>အက်ဒမင် စီမံခန့်ခွဲမှု (Admin Controls):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick 1-Click Fee Toggle */}
            <button
              onClick={handleToggleFeeStatus}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
                school.isAnnualFeePaid
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="နှစ်စဉ်ကြေး အခြေအနေ ပြောင်းရန်"
            >
              {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေး: ပေးပြီး ✓' : 'နှစ်စဉ်ကြေး: မပေးသေး ✗'}
            </button>

            {/* Edit School Button */}
            <Link
              to={`/admin?tab=schools&editSchoolId=${school.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition shadow-2xs"
              title="ဤကျောင်းအချက်အလက်ကို ပြင်ဆင်ရန်"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>ပြင်ဆင်ရန် (Edit)</span>
            </Link>

            {/* Delete School Button */}
            <button
              onClick={handleDeleteSchool}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition shadow-2xs cursor-pointer"
              title="ဤကျောင်းကို အပြီးပိုင် ဖျက်ရန်"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ဖျက်ရန် (Delete)</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-8 w-full overflow-hidden">
        {/* Header Profile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-b border-slate-100 pb-6 min-w-0">
          {school.logoUrl ? (
            <img
              src={school.logoUrl}
              alt={school.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 bg-white p-1 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-sky-900 text-white flex items-center justify-center shrink-0">
              <SchoolIcon className="w-10 h-10" />
            </div>
          )}
          <div className="space-y-2 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-950 break-words">
              {school.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {school.level && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {school.level}
                </span>
              )}

              {/* School Status Indicator Badge */}
              {school.status === 'under_review' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>စိစစ်ဆဲ (Under Review)</span>
                </span>
              ) : school.status === 'inactive' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>ယာယီရပ်နား (Inactive)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>လည်ပတ်ဆဲ (Active)</span>
                </span>
              )}
              {school.isAnnualFeePaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>နှစ်စဉ်ကြေး ပေးသွင်းပြီး</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>နှစ်စဉ်ကြေး မပေးသွင်းရသေး</span>
                </span>
              )}
            </div>
            {school.schoolPhone && (
              <p className="text-sm text-slate-600 flex items-center gap-1.5 pt-1">
                <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                <a href={`tel:${school.schoolPhone}`} className="text-sky-700 font-semibold hover:underline break-all">
                  ကျောင်းဖုန်း: {school.schoolPhone}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Annual Fee Status Section (ပြည့်စုံသော နှစ်စဉ်ကြေး အခြေအနေ ဖော်ပြချက်) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            school.isAnnualFeePaid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                school.isAnnualFeePaid
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {school.isAnnualFeePaid ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">နှစ်စဉ်ကြေး ပေးသွင်းမှု အခြေအနေ</p>
              <h3 className="font-extrabold text-base sm:text-lg">
                {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေး ပေးသွင်းပြီးဖြစ်ပါသည်' : 'နှစ်စဉ်ကြေး မပေးသွင်းရသေးပါ'}
              </h3>
            </div>
          </div>
          <div className="sm:text-right text-xs font-medium text-slate-500 pl-11 sm:pl-0">
            {school.isAnnualFeePaid ? (
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                အသင်းဝင် အခွင့်အရေး အပြည့်အဝရရှိထားသည်
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold border border-slate-300">
                နှစ်စဉ်ကြေး ပေးသွင်းရန် ဆိုင်းငံ့ဆဲ
              </span>
            )}
          </div>
        </div>

        {/* Contact Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Founder */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 min-w-0">
            <h3 className="font-bold text-sky-900 border-b border-slate-200 pb-2 text-sm">
              တည်ထောင်သူ (Founder)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.founderName || 'မဖော်ပြထားပါ'}
            </p>
            {school.founderPhone && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <a href={`tel:${school.founderPhone}`} className="hover:underline font-medium break-all">
                  {school.founderPhone}
                </a>
              </p>
            )}
            <div className="flex items-center gap-3 text-xs pt-1">
              {school.founderViber && (
                <a
                  href={`viber://chat?number=${school.founderViber.replace(/[^0-9]/g, '')}`}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Viber: {school.founderViber}
                </a>
              )}
              {school.founderTelegram && (
                <a
                  href={`https://t.me/${school.founderTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  <Send className="w-3 h-3" /> {school.founderTelegram}
                </a>
              )}
            </div>
          </div>

          {/* Administrator / Principal */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 min-w-0">
            <h3 className="font-bold text-sky-900 border-b border-slate-200 pb-2 text-sm">
              စီမံအုပ်ချုပ်သူ (Admin / Principal)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.adminName || 'မဖော်ပြထားပါ'}
            </p>
            {school.adminPhone && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <a href={`tel:${school.adminPhone}`} className="hover:underline font-medium break-all">
                  {school.adminPhone}
                </a>
              </p>
            )}
            <div className="flex items-center gap-3 text-xs pt-1">
              {school.adminViber && (
                <a
                  href={`viber://chat?number=${school.adminViber.replace(/[^0-9]/g, '')}`}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Viber: {school.adminViber}
                </a>
              )}
              {school.adminTelegram && (
                <a
                  href={`https://t.me/${school.adminTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  <Send className="w-3 h-3" /> {school.adminTelegram}
                </a>
              )}
            </div>
          </div>

          {/* Coordinator */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 min-w-0 sm:col-span-2 lg:col-span-1">
            <h3 className="font-bold text-sky-900 border-b border-slate-200 pb-2 text-sm">
              တာဝန်ခံ (Coordinator)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.contactName || 'မဖော်ပြထားပါ'}
              {school.contactRole ? ` (${school.contactRole})` : ''}
            </p>
            {school.contactPhone && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <a href={`tel:${school.contactPhone}`} className="hover:underline font-medium break-all">
                  {school.contactPhone}
                </a>
              </p>
            )}
            <div className="flex items-center gap-3 text-xs pt-1">
              {school.contactViber && (
                <a
                  href={`viber://chat?number=${school.contactViber.replace(/[^0-9]/g, '')}`}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Viber: {school.contactViber}
                </a>
              )}
              {school.contactTelegram && (
                <a
                  href={`https://t.me/${school.contactTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  <Send className="w-3 h-3" /> {school.contactTelegram}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {(school.schoolNote || school.note) && (
          <div className="border-t border-slate-100 pt-6 space-y-4">
            {school.schoolNote && (
              <div>
                <h3 className="font-bold text-sm text-sky-900 mb-1">ကျောင်းဘက်မှ မှတ်ချက်</h3>
                <p className="text-slate-700 text-sm whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {school.schoolNote}
                </p>
              </div>
            )}
            {school.note && (
              <div>
                <h3 className="font-bold text-sm text-sky-900 mb-1">မှတ်စုတို</h3>
                <p className="text-slate-700 text-sm whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {school.note}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
