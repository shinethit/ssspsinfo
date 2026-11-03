import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { School, Athlete, EventItem, SchoolUpdateRequest, STUDENT_RANGE_TIERS, DEFAULT_SCHOOL_LEVELS, getStudentRangeTier } from '../types';
import { useData } from '../context/DataContext';
import { clearAdminSession } from '../lib/adminAuth';
import { isCurrentYearPaid } from '../lib/academicYear';
import { toast } from 'sonner';
import { confirmDialog } from '../components/ConfirmModal';
import { LogOut, Save, School as SchoolIcon, Phone, MapPin, Users, Eye, ShieldCheck, UserCheck, Calendar, Clock, Trash2, Send, FileText } from 'lucide-react';
import { STANDARD_ZONES } from '../constants';
import ImageUploadDropzone from '../components/ImageUploadDropzone';

// Fields a school can ask the admin to change (it cannot edit these itself).
const REQUESTABLE_FIELDS = [
  { value: 'name', label: 'ကျောင်းအမည်' },
  { value: 'level', label: 'ကျောင်းအဆင့်' },
  { value: 'studentRange', label: 'ကျောင်းသားဦးရေ Range' },
  { value: 'founderPhone', label: 'တည်ထောင်သူ ဖုန်း' },
  { value: 'adminPhone', label: 'စီမံအုပ်ချုပ်သူ ဖုန်း' },
  { value: 'contactPhone', label: 'တာဝန်ခံ (၁) ဖုန်း' },
  { value: 'contact2Phone', label: 'တာဝန်ခံ (၂) ဖုန်း' },
] as const;

export default function SchoolPortal() {
  const [school, setSchool] = useState<School | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  // v24.13 S1: loading-aware auth — auth.currentUser is null on a fresh
  // page load until Firebase restores the session, so the old synchronous
  // read kicked the school out to /school-login on every refresh.
  const [authUser, authLoading] = useAuthState(auth);
  const { schoolLevels } = useData();
  // v24.15 (P4): the receipt link target — the school doc's stored
  // transaction id, shown only after a public single-doc get confirms the
  // transaction exists. (The old transactions LIST query was moderator-only
  // and was denied on every portal load.)
  const [receiptTxnId, setReceiptTxnId] = useState<string | null>(null);
  const [resettingPw, setResettingPw] = useState(false);
  // v24.15 (P22): true when the school's own requests could not be read —
  // new requests are then BLOCKED instead of silently passing the
  // duplicate check.
  const [requestsLoadFailed, setRequestsLoadFailed] = useState(false);

  // Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [township, setTownship] = useState('');
  const [zone, setZone] = useState('');
  // v24.15 (P17): the school's ORIGINAL zone, captured when the school
  // loads — it stays in the zone options for the whole edit session even
  // after another zone is picked (the old code rebuilt the options from
  // the CURRENT zone, so a non-standard zone vanished mid-session).
  const [originalZone, setOriginalZone] = useState('');
  const [studentCount, setStudentCount] = useState('');

  const [activities, setActivities] = useState<EventItem[]>([]);
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actTime, setActTime] = useState('');
  const [actLocation, setActLocation] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actImage, setActImage] = useState('');
  const [isSubmittingAct, setIsSubmittingAct] = useState(false);

  // Change requests (v24.7: the Admin "တောင်းဆိုမှုများ" tab had no creator,
  // so it was always empty. Schools can now ask for changes to fields they
  // cannot edit themselves; the admin approves them in that tab. The five
  // contact fields above stay directly editable — a phone number must not
  // wait for approval.)
  const [myRequests, setMyRequests] = useState<SchoolUpdateRequest[]>([]);
  const [reqField, setReqField] = useState<string>('name');
  const [reqValue, setReqValue] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // v24.13 S2: refetch the school's own change requests (used after submit).
  // v24.15 (P22): fetch by requestedByUid AND by schoolId — requests
  // created before v24.7 carry no requestedByUid and were invisible to the
  // school, so a duplicate sailed through. If either read fails, the
  // duplicate check cannot be trusted — new requests are BLOCKED (see
  // handleSubmitRequest) instead of silently passing.
  const fetchMyRequests = async (uid: string, schoolId?: string) => {
    try {
      const results = await Promise.allSettled([
        getDocs(query(collection(db, 'school_update_requests'), where('requestedByUid', '==', uid))),
        ...(schoolId ? [getDocs(query(collection(db, 'school_update_requests'), where('schoolId', '==', schoolId)))] : []),
      ]);
      const byId = new Map<string, SchoolUpdateRequest>();
      let failed = false;
      for (const r of results) {
        if (r.status === 'fulfilled') {
          r.value.docs.forEach(d => byId.set(d.id, { id: d.id, ...d.data() } as SchoolUpdateRequest));
        } else {
          failed = true;
        }
      }
      const reqData = [...byId.values()];
      reqData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyRequests(reqData);
      setRequestsLoadFailed(failed);
    } catch {
      setRequestsLoadFailed(true);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const user = authUser;
    if (!user) { navigate('/school-login'); return; }
    const fetchSchoolData = async () => {

      try {
        // v24.13 S3: legacy accounts have no authUid — fall back to the
        // accountEmail lookup, exactly as SchoolLogin does.
        let snap = await getDocs(query(collection(db, 'schools'), where('authUid', '==', user.uid)));
        if (snap.empty && user.email) {
          snap = await getDocs(query(collection(db, 'schools'), where('accountEmail', '==', user.email)));
        }

        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as School;
          // v24.15 (P2): legacy email-only account — adopt it once: link
          // this Auth uid to the school doc. Needs the published adopt rule;
          // if the write is denied (rules not yet published) show a
          // one-time toast and continue read-only — the portal must NOT
          // break. After adoption, saving and event posting work.
          if (!data.authUid && user.email && data.accountEmail && data.accountEmail === user.email) {
            try {
              await updateDoc(doc(db, 'schools', data.id), { authUid: user.uid, updatedAt: new Date().toISOString() });
              data.authUid = user.uid;
            } catch {
              toast.error('အကောင့် ချိတ်ဆက်မှု မအောင်မြင်ပါ — Admin ကို ဆက်သွယ်ပါ');
            }
          }
          setSchool(data);
          setPhone(data.schoolPhone || '');
          setAddress(data.address || '');
          setTownship(data.township || '');
          setZone(data.zone || '');
          setOriginalZone(data.zone || '');
          setStudentCount(data.studentCount?.toString() || '');

          // Fetch athletes for this school — v24.7: match by the school's
          // document id first (athletes created since v24.7 carry schoolId).
          // Older records only have the free-text school name, so fall back
          // to the name match for those.
          const athleteByIdQuery = query(collection(db, 'athletes'), where('schoolId', '==', data.id));
          const athleteByIdSnap = await getDocs(athleteByIdQuery);
          let athleteDocs = athleteByIdSnap.docs;
          if (athleteDocs.length === 0) {
            const athleteQuery = query(collection(db, 'athletes'), where('school', '==', data.name));
            const athleteSnap = await getDocs(athleteQuery);
            athleteDocs = athleteSnap.docs;
          }
          setAthletes(athleteDocs.map(d => ({ id: d.id, ...d.data() } as Athlete)));

          // v24.15 (P4): the transactions LIST is moderator-only, so the old
          // list query was denied on every portal load and the voucher /
          // receipt link could never render. The voucher + transaction id
          // now live on the school doc (stored at payment time); the receipt
          // link is shown only after a public single-doc get confirms the
          // transaction exists.
          if (data.feeTransactionId) {
            try {
              const txnSnap = await getDoc(doc(db, 'transactions', data.feeTransactionId));
              if (txnSnap.exists()) setReceiptTxnId(txnSnap.id);
            } catch {
              // Receipt link stays hidden; the fee flag values still show.
            }
          }

          const actQuery = query(collection(db, 'events'), where('schoolId', '==', data.id));
          const actSnap = await getDocs(actQuery);
          setActivities(actSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));

          // The school's own change requests (readable by the requester
          // since v24.7 — see firestore.rules).
          await fetchMyRequests(user.uid, data.id);
        } else {
          toast.error('ကျောင်းအချက်အလက် ရှာမတွေ့ပါ');
        }
      } catch (err) {
        toast.error('ဒေတာဆွဲယူရာတွင် အမှားဖြစ်ပွားပါသည်');
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [authUser, authLoading, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        schoolPhone: phone,
        address,
        township,
        zone,
        studentCount: studentCount ? Number(studentCount) : null,
        updatedAt: new Date().toISOString()
      });
      // v24.13 S2: refresh local state so the page (and new activities,
      // which stamp the school's zone/name) use the just-saved values.
      // v24.15 (P17): the saved zone becomes the session's original zone.
      setOriginalZone(zone);
      setSchool(prev => prev ? {
        ...prev,
        schoolPhone: phone,
        address,
        township,
        zone,
        studentCount: studentCount ? Number(studentCount) : null,
      } : prev);
      toast.success('အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ');
    } catch (err) {
      toast.error('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setIsSubmittingAct(true);
    try {
      const payload = {
        title: actTitle,
        date: actDate,
        time: actTime,
        location: actLocation,
        description: actDesc,
        imageUrl: actImage,
        zone: school.zone || '',
        schoolId: school.id,
        schoolName: school.name,
        eventType: 'school_activity' as const,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'events'), payload);
      setActivities([...activities, { id: docRef.id, ...payload }]);
      toast.success('လှုပ်ရှားမှု တင်ပြီးပါပြီ');
      setActTitle(''); setActDate(''); setActTime(''); setActLocation(''); setActDesc(''); setActImage('');
    } catch (err) {
      toast.error('တင်၍ မရပါ');
    } finally {
      setIsSubmittingAct(false);
    }
  };

  // v24.7: ask the admin to change a field the school cannot edit itself.
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const user = auth.currentUser;
    if (!user) { toast.error('အကောင့် ဝင်ထားမှု မရှိပါ'); return; }
    const fieldDef = REQUESTABLE_FIELDS.find(f => f.value === reqField);
    const newValue = reqValue.trim();
    if (!fieldDef || !newValue) { toast.error('ပြောင်းလိုသော အချက်အလက်ကို ဖြည့်ပါ'); return; }
    // v24.15 (P22): when the school's own requests could not be read, the
    // duplicate check cannot be trusted — BLOCK the new request with an
    // honest error instead of silently passing it.
    if (requestsLoadFailed) { toast.error('တောင်းဆိုမှု စာရင်း ဖတ်၍မရပါ — ထပ်နေသော တောင်းဆိုမှု ရှိ၊ မရှိ စစ်၍မရသောကြောင့် ခဏစောင့်ပြီး ပြန်ကြိုးစားပါ'); return; }
    const oldValue = String((school as any)[reqField] ?? '');
    // v24.15 (P22): normalize tier values through the alias map before the
    // same-value comparison — a stored legacy range ('101-300', '၁၀၁ - ၁၅၀
    // ဦး') is the same tier as the new key ('101-150') and must count as
    // a no-op, not as a change.
    const normalizeForCompare = (field: string, value: string) =>
      field === 'studentRange' ? (getStudentRangeTier(value)?.key ?? value) : value;
    if (normalizeForCompare(reqField, oldValue) === normalizeForCompare(reqField, newValue)) { toast.info('တန်ဖိုး အသစ်က လက်ရှိ တန်ဖိုးနဲ့ အတူတူပဲ ဖြစ်နေပါတယ်'); return; }
    // v24.13 S6: one pending request per field — a second one for the same
    // field would sit behind the first and confuse the admin queue.
    const hasPendingSameField = myRequests.some(r => r.status === 'pending' && r.changes.some(c => c.field === reqField));
    if (hasPendingSameField) { toast.error('ဤအချက်အတွက် စစ်ဆေးရန် ကျန်နေသော တောင်းဆိုမှု ရှိပြီးသားပါ — အတည်ပြု/ပယ်ဖျက်ပြီးမှ အသစ်တောင်းဆိုနိုင်ပါသည်'); return; }
    setIsSubmittingReq(true);
    try {
      const docRef = await addDoc(collection(db, 'school_update_requests'), {
        schoolId: school.id,
        schoolName: school.name,
        requestedBy: user.email || school.name,
        requestedByUid: user.uid,
        contactPhone: school.schoolPhone || '',
        changes: [{ field: reqField, oldValue, newValue }],
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      // v24.13 S2: refetch from Firestore so the list reflects the server.
      await fetchMyRequests(user.uid, school.id);
      setReqValue('');
      toast.success('တောင်းဆိုမှု ပေးပို့ပြီးပါပြီ — Admin အတည်ပြုပြီးမှ ပြောင်းလဲပါမည်');
    } catch (err) {
      toast.error('တောင်းဆို၍ မရပါ');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // v24.7: a school can remove an activity it posted (create-only before).
  const handleDeleteActivity = async (id: string) => {
    if (!(await confirmDialog('ဤလှုပ်ရှားမှုကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('ဖျက်ပြီးပါပြီ');
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  // v24.13 S4: password reset from inside the portal (the Accounts tab
  // belongs to another agent, so the portal is where the school does this).
  const handleSendPasswordReset = async () => {
    const targetEmail = school?.accountEmail || authUser?.email;
    if (!targetEmail) { toast.error('ဤကျောင်းအကောင့်တွင် အီးမေးလ် မှတ်တမ်းမရှိပါ — Admin ကို ဆက်သွယ်ပါ'); return; }
    setResettingPw(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      toast.success(`စကားဝှက် ပြန်လည်သတ်မှတ်ရန် လင့်ခ်ကို ${targetEmail} သို့ ပို့ပြီးပါပြီ`);
    } catch {
      toast.error('စကားဝှက် ပြန်လည်သတ်မှတ်ရန် အီးမေးလ် ပို့၍ မရပါ');
    } finally {
      setResettingPw(false);
    }
  };

  const handleLogout = async () => {
    // v24.15 (P33): clear the cached admin session too (best-effort — the
    // portal still navigates even if the sign-out itself fails).
    await clearAdminSession();
    navigate('/school-login');
  };

  if (loading || authLoading) return <div className="p-10 text-center">ခဏစောင့်ပါ...</div>;
  // v24.15 (P3): the old bare "ကျောင်းအချက်အလက် မရှိပါ။" was a dead end —
  // no logout, no link, and SchoolLogin used to bounce the user straight
  // back here. Now it explains, offers logout, and links to Contacts/Help.
  if (!school) return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
          <SchoolIcon className="w-7 h-7" />
        </div>
        <h1 className="font-bold text-lg text-slate-900">ကျောင်းအချက်အလက် ရှာမတွေ့ပါ</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          ဤအကောင့်နှင့် ချိတ်ဆက်ထားသော ကျောင်းအချက်အလက် မရှိသေးပါ။ အကောင့်ကို ကျောင်းတစ်ခုနှင့် ချိတ်ဆက်ပေးရန် အသင်း Admin ကို ဆက်သွယ်ပေးပါ။
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={handleLogout} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> အကောင့်မှ ထွက်မည်
          </button>
          <div className="flex gap-2">
            <Link to="/contacts" className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-800 py-2.5 rounded-xl font-bold text-sm border border-sky-200">အသင်းဝင်ကျောင်းများ</Link>
            <Link to="/help" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-sm border border-slate-200">အသုံးပြုနည်း</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <SchoolIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">{school.name}</h1>
              <p className="text-xs text-slate-500">School Member Portal</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg">
            <LogOut className="w-4 h-4" /> ထွက်မည်
          </button>
        </div>

        {/* v24.13 S5: annual-fee status — paid/unpaid, amount, academic year,
            paid date and voucher (from the school doc).
            v24.15 (P21): never fall back to the device-local global year —
            this browser's localStorage is not the admin's global setting.
            When no year is known, say so honestly. v24.15 (P4): voucher +
            receipt link come from the school doc's stored feeVoucherNo /
            feeTransactionId, not from a (moderator-only) list query. */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3 ${isCurrentYearPaid(school) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-slate-500">{school.feeAcademicYear ? `နှစ်စဉ်ကြေး အခြေအနေ (${school.feeAcademicYear} ပညာသင်နှစ်)` : 'နှစ်စဉ်ကြေး အခြေအနေ (ပညာသင်နှစ် မဖော်ပြထားပါ)'}</p>
            <p className="font-bold text-slate-900 text-base mt-0.5">{isCurrentYearPaid(school) ? '✅ ပေးသွင်းပြီးပါပြီ' : '⏳ ပေးသွင်းရန် ကျန်ရှိပါသည်'}</p>
            {school.feeAmount != null && (
              <p className="text-sm text-slate-700 mt-0.5">ပမာဏ: <span className="font-bold">{Number(school.feeAmount).toLocaleString('my-MM')} ကျပ်</span></p>
            )}
            {school.feePaidDate && (
              <p className="text-sm text-slate-700">ပေးသွင်းသည့်ရက်: <span className="font-bold">{school.feePaidDate}</span></p>
            )}
            {school.feeVoucherNo && (
              <p className="text-sm text-slate-700">ဖြတ်ပိုင်းအမှတ်: <span className="font-mono font-bold">{school.feeVoucherNo}</span></p>
            )}
            {!isCurrentYearPaid(school) && (
              <p className="text-xs text-slate-500 mt-1">နှစ်စဉ်ကြေး ပေးသွင်းရန် အသင်း Admin ကို ဆက်သွယ်ပါ။</p>
            )}
          </div>
          {receiptTxnId && (
            <Link to={`/receipt/${receiptTxnId}`} className="text-xs font-bold text-sky-700 bg-white px-3 py-2 rounded-lg border border-sky-200 hover:bg-sky-50 transition shrink-0">
              ဖြတ်ပိုင်း ကြည့်ရန်
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Profile Edit Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-sky-950">လုံခြုံရေး အသိပေးချက်</h3>
                <p className="text-xs text-sky-800 mt-1">ဤအကောင့်သည် သင့်ကျောင်း၏ အချက်အလက်များကိုသာ ပြင်ဆင်ခွင့်ရှိပါသည်။</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">အချက်အလက် ပြင်ဆင်ရန်</h2>
              <Link to={`/schools/${school.id}`} className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 transition flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Profile ကြည့်ရန်
              </Link>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-3 h-3 text-sky-600"/> ကျောင်းဖုန်း</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><Users className="w-3 h-3 text-sky-600"/> ကျောင်းသားဦးရေ</label>
                <input type="number" value={studentCount} onChange={e => setStudentCount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-sky-600"/> ကျောင်းလိပ်စာ</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">မြို့နယ်</label>
                <input type="text" value={township} onChange={e => setTownship(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-600"/> ဇုန် (Zone)</label>
                <select value={zone} onChange={e => setZone(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="">- ဇုန် မသတ်မှတ်ရသေး -</option>
                  {/* v24.15 (P17): the ORIGINAL zone (captured at load) stays
                      in the options for the whole edit session — the old
                      code rebuilt from the current zone, so a non-standard
                      zone vanished once another zone was picked. */}
                  {([...STANDARD_ZONES] as string[]).concat(originalZone && !(STANDARD_ZONES as readonly string[]).includes(originalZone) ? [originalZone] : []).map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button type="submit" disabled={saving} className="w-full bg-sky-900 hover:bg-sky-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'အချက်အလက်များ သိမ်းမည်'}
                </button>
                {/* v24.13 S4: password reset from the portal */}
                <button type="button" onClick={handleSendPasswordReset} disabled={resettingPw} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50">
                  {resettingPw ? 'ပို့နေပါသည်...' : 'စကားဝှက် မေ့နေပါသလား? — ပြန်လည်သတ်မှတ်ရန် အီးမေးလ် ပို့မည်'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Registered Athletes */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" /> သင့်ကျောင်း၏ အားကစားသမားများ
            </h2>
            
            {athletes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                <p className="text-sm">အားကစားသမား စာရင်း မရှိသေးပါ။</p>
                <p className="text-xs text-slate-400 mt-1">Admin ထံမှ အချက်အလက်များ ဖြည့်သွင်းရန် လိုအပ်ပါသည်။</p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    {a.photoUrl ? (
                      <img src={a.photoUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">အတန်း: {a.grade} | အသက်: {a.age}</p>
                      <div className="flex gap-1 mt-1">
                        {a.sports.map(s => (
                          <span key={s} className="text-xs bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Requests (v24.7) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> အခြား အချက်အလက် ပြောင်းလဲရန် တောင်းဆိုမည်
            </h2>
          </div>
          <p className="text-xs text-slate-500">ကျောင်းအမည်၊ အဆင့်၊ ကျောင်းသားဦးရေ Range နှင့် တည်ထောင်သူ/စီမံအုပ်ချုပ်သူ/တာဝန်ခံတို့၏ ဖုန်းနံပါတ်များကို ကိုယ်တိုင် ပြင်၍မရပါ — Admin ထံ တောင်းဆိုနိုင်ပါသည်။ ကျောင်းဖုန်း၊ လိပ်စာ၊ မြို့နယ်၊ ဇုန်၊ ကျောင်းသားဦးရေတို့ကိုတော့ အပေါ်က form မှာပဲ တိုက်ရိုက် ပြင်နိုင်ပါသည်။</p>
          <form onSubmit={handleSubmitRequest} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ပြောင်းလိုသော အချက်</label>
              <select value={reqField} onChange={e => { setReqField(e.target.value); setReqValue(''); }} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                {REQUESTABLE_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">တန်ဖိုး အသစ်</label>
              {reqField === 'level' ? (
                <select required value={reqValue} onChange={e => setReqValue(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="">- အဆင့် ရွေးပါ -</option>
                  {(schoolLevels.length > 0 ? schoolLevels.map(l => l.name) : DEFAULT_SCHOOL_LEVELS).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : reqField === 'studentRange' ? (
                <select required value={reqValue} onChange={e => setReqValue(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="">- Range ရွေးပါ -</option>
                  {STUDENT_RANGE_TIERS.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <input required value={reqValue} onChange={e => setReqValue(e.target.value)} placeholder="ဥပမာ - ပညာရောင်ခြည် ကိုယ်ပိုင်အထက်တန်းကျောင်း" className="w-full p-2.5 border rounded-xl text-sm" />
              )}
            </div>
            <button type="submit" disabled={isSubmittingReq} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" /> {isSubmittingReq ? 'ပို့နေပါသည်...' : 'တောင်းဆိုမည်'}
            </button>
          </form>
          {myRequests.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-800">ပေးပို့ထားသော တောင်းဆိုမှုများ ({myRequests.length})</h3>
              {myRequests.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-slate-800">{r.changes.map(c => `${REQUESTABLE_FIELDS.find(f => f.value === c.field)?.label || c.field}: ${c.oldValue || '(အလွတ်)'} → ${c.newValue}`).join(', ')}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${r.status === 'pending' ? 'bg-amber-100 text-amber-800' : r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {r.status === 'pending' ? 'စစ်ဆေးရန် ကျန်' : r.status === 'approved' ? 'အတည်ပြုပြီး' : 'ပယ်ဖျက်ပြီး'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> ကျောင်း၏ လှုပ်ရှားမှုများ (Activities)
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleAddActivity} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">လှုပ်ရှားမှုအသစ် တင်ရန်</h3>
              <input required placeholder="ခေါင်းစဉ် *" value={actTitle} onChange={e => setActTitle(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                <input placeholder="အချိန် (Optional)" value={actTime} onChange={e => setActTime(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              </div>
              <input placeholder="နေရာ (Optional)" value={actLocation} onChange={e => setActLocation(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <textarea placeholder="အသေးစိတ် (Optional)" value={actDesc} onChange={e => setActDesc(e.target.value)} rows={2} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              <ImageUploadDropzone
                value={actImage}
                onChange={setActImage}
                label="ဓာတ်ပုံ (Optional)"
                folder="school-activities"
              />
              <button type="submit" disabled={isSubmittingAct} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer">
                {isSubmittingAct ? 'တင်နေပါသည်...' : '+ လှုပ်ရှားမှု တင်မည်'}
              </button>
            </form>
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">တင်ထားသော လှုပ်ရှားမှုများ ({activities.length})</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">လှုပ်ရှားမှု မရှိသေးပါ</p>
              ) : (
                [...activities].sort((a,b) => b.date.localeCompare(a.date)).map(act => (
                  <div key={act.id} className="p-3 bg-white border border-slate-200 rounded-xl flex gap-3 shadow-2xs">
                    {act.imageUrl && <img src={act.imageUrl} alt={act.title} className="w-14 h-14 rounded-lg object-cover border shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900">{act.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {act.date} {act.time && `• ${act.time}`}</p>
                      {act.location && <p className="text-xs text-slate-400 mt-1"><MapPin className="w-2.5 h-2.5 inline"/> {act.location}</p>}
                    </div>
                    <button onClick={() => handleDeleteActivity(act.id)} className="self-start p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0" title="ဖျက်ရန်">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
