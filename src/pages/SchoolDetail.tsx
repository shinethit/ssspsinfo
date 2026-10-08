import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { School } from '../types';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Send, School as SchoolIcon, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const { getSchoolById, syncData } = useData();
  const cachedSchool = id ? getSchoolById(id) : undefined;

  const [school, setSchool] = useState<School | null>(cachedSchool || null);
  const [loading, setLoading] = useState(!cachedSchool);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (cachedSchool) {
      setSchool(cachedSchool);
      setLoading(false);
    }
  }, [cachedSchool]);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!id) return;
      try {
        if (!cachedSchool) setLoading(true);
        const docRef = doc(db, 'schools', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchool({ id: docSnap.id, ...docSnap.data() } as School);
        } else if (!cachedSchool) {
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
      syncData(false);
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
      syncData(false);
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
            {(() => {
              const allSchoolPhones = [
                school.schoolPhone,
                school.schoolPhone2,
                ...(Array.isArray(school.schoolPhones) ? school.schoolPhones : []),
              ].filter(Boolean);
              if (allSchoolPhones.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                    ကျောင်းဖုန်း:
                  </span>
                  {allSchoolPhones.map((ph, idx) => (
                    <a
                      key={idx}
                      href={`tel:${ph}`}
                      className="text-sky-700 font-bold hover:underline bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 break-all"
                    >
                      {ph}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Annual Fee Status & Student Count Range Section */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
            school.isAnnualFeePaid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

          {/* Student Range & Fee Amount Details Sub-card */}
          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">ကျောင်းသားဦးရေ Range</span>
              <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                {school.studentRange ? `${school.studentRange} ဦး` : '၁ - ၁၀၀ ဦး'}
              </strong>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">တိကျသော ကျောင်းသားဦးရေ</span>
              <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                {school.studentCount ? `${Number(school.studentCount).toLocaleString('my-MM')} ဦး` : 'မဖော်ပြထားပါ'}
              </strong>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">နှစ်စဉ်ကြေး ပမာဏ</span>
              <strong className="text-sky-950 font-extrabold text-xs sm:text-sm">
                {Number(school.feeAmount || 50000).toLocaleString('my-MM')} ကျပ်
              </strong>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">ပညာသင်နှစ်</span>
              <strong className="text-slate-800 font-bold text-xs sm:text-sm">
                {school.feeAcademicYear || '၂၀၂၄-၂၀၂၅'}
              </strong>
            </div>
          </div>
        </div>

        {/* Contact Roles Grid (Founder, Admin, Coordinator 1, Coordinator 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Founder */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 min-w-0">
            <h3 className="font-bold text-sky-900 border-b border-slate-200 pb-2 text-sm">
              တည်ထောင်သူ (Founder)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.founderName || 'မဖော်ပြထားပါ'}
            </p>
            {(() => {
              const founderPhones = [
                school.founderPhone,
                school.founderPhone2,
                ...(Array.isArray(school.founderPhones) ? school.founderPhones : []),
              ].filter(Boolean);
              if (founderPhones.length === 0) return null;
              return (
                <div className="space-y-1">
                  {founderPhones.map((ph, idx) => (
                    <p key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <a href={`tel:${ph}`} className="hover:underline font-medium break-all">
                        {ph} {founderPhones.length > 1 ? (idx === 0 ? '(ဖုန်း ၁)' : idx === 1 ? '(ဖုန်း ၂)' : `(${idx + 1})`) : ''}
                      </a>
                    </p>
                  ))}
                </div>
              );
            })()}
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
            {(() => {
              const adminPhones = [
                school.adminPhone,
                school.adminPhone2,
                ...(Array.isArray(school.adminPhones) ? school.adminPhones : []),
              ].filter(Boolean);
              if (adminPhones.length === 0) return null;
              return (
                <div className="space-y-1">
                  {adminPhones.map((ph, idx) => (
                    <p key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <a href={`tel:${ph}`} className="hover:underline font-medium break-all">
                        {ph} {adminPhones.length > 1 ? (idx === 0 ? '(ဖုန်း ၁)' : idx === 1 ? '(ဖုန်း ၂)' : `(${idx + 1})`) : ''}
                      </a>
                    </p>
                  ))}
                </div>
              );
            })()}
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

          {/* Coordinator 1 */}
          <div className="bg-sky-50/60 p-5 rounded-xl border border-sky-200 space-y-3 min-w-0">
            <h3 className="font-bold text-sky-900 border-b border-sky-200 pb-2 text-sm flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-800 text-white text-[10px] flex items-center justify-center font-bold">၁</span>
              တာဝန်ခံ (၁) (Coordinator 1)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.contactName || 'မဖော်ပြထားပါ'}
              {school.contactRole ? ` (${school.contactRole})` : ''}
            </p>
            {(() => {
              const coord1Phones = [
                school.contactPhone,
                school.contactPhone2,
                ...(Array.isArray(school.contactPhones) ? school.contactPhones : []),
              ].filter(Boolean);
              if (coord1Phones.length === 0) return null;
              return (
                <div className="space-y-1">
                  {coord1Phones.map((ph, idx) => (
                    <p key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <a href={`tel:${ph}`} className="hover:underline font-medium break-all">
                        {ph} {idx === 0 ? '(ဖုန်း ၁)' : idx === 1 ? '(ဖုန်း ၂)' : ''}
                      </a>
                    </p>
                  ))}
                </div>
              );
            })()}
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

          {/* Coordinator 2 */}
          <div className="bg-indigo-50/60 p-5 rounded-xl border border-indigo-200 space-y-3 min-w-0">
            <h3 className="font-bold text-indigo-900 border-b border-indigo-200 pb-2 text-sm flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-800 text-white text-[10px] flex items-center justify-center font-bold">၂</span>
              တာဝန်ခံ (၂) (Coordinator 2)
            </h3>
            <p className="text-sm font-semibold text-slate-800 break-words">
              {school.contact2Name || 'မဖော်ပြထားပါ'}
              {school.contact2Role ? ` (${school.contact2Role})` : ''}
            </p>
            {(() => {
              const coord2Phones = [
                school.contact2Phone,
                school.contact2Phone2,
                ...(Array.isArray(school.contact2Phones) ? school.contact2Phones : []),
              ].filter(Boolean);
              if (coord2Phones.length === 0) return null;
              return (
                <div className="space-y-1">
                  {coord2Phones.map((ph, idx) => (
                    <p key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <a href={`tel:${ph}`} className="hover:underline font-medium break-all">
                        {ph} {idx === 0 ? '(ဖုန်း ၁)' : idx === 1 ? '(ဖုန်း ၂)' : ''}
                      </a>
                    </p>
                  ))}
                </div>
              );
            })()}
            <div className="flex items-center gap-3 text-xs pt-1">
              {school.contact2Viber && (
                <a
                  href={`viber://chat?number=${school.contact2Viber.replace(/[^0-9]/g, '')}`}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Viber: {school.contact2Viber}
                </a>
              )}
              {school.contact2Telegram && (
                <a
                  href={`https://t.me/${school.contact2Telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  <Send className="w-3 h-3" /> {school.contact2Telegram}
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
