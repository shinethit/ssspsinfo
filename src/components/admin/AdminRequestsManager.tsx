import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolUpdateRequest, DEFAULT_SCHOOL_LEVELS, getStudentRangeTier } from '../../types';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { CheckCircle2, XCircle, Clock, FileText, Check, X, MapPin, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';
import { recordAuditLog } from '../../lib/audit';
import { parseStoredDate, formatMyanmarDate } from '../../lib/myanmarDate';
import { toLatinDigits } from '../../lib/myanmarDigits';

// Field names the School Portal can request changes for, shown in Burmese.
const FIELD_LABELS: Record<string, string> = {
  name: 'ကျောင်းအမည်',
  level: 'ကျောင်းအဆင့်',
  studentRange: 'ကျောင်းသားဦးရေ Range',
  founderPhone: 'တည်ထောင်သူ ဖုန်း',
  adminPhone: 'စီမံအုပ်ချုပ်သူ ဖုန်း',
  contactPhone: 'တာဝန်ခံ (၁) ဖုန်း',
  contact2Phone: 'တာဝန်ခံ (၂) ဖုန်း',
};

// v24.15 (P5): only these fields may ever be written to a school doc by
// approving a request. A crafted request naming authUid / isAnnualFeePaid /
// feeAmount / accountEmail must be rejected, not applied.
const REQUESTABLE_FIELDS = new Set(['name', 'level', 'studentRange', 'founderPhone', 'adminPhone', 'contactPhone', 'contact2Phone']);
const PHONE_FIELDS = new Set(['founderPhone', 'adminPhone', 'contactPhone', 'contact2Phone']);

/** A phone number is plausible when it has 7–15 digits (Myanmar digits converted first). */
function isPlausiblePhone(value: string): boolean {
  const digits = toLatinDigits(value).replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<SchoolUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSchool, schools, schoolLevels } = useData();
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // v24.15 (P5): levels a request may set — the admin-configured levels,
  // plus the built-in defaults (a legacy level in either list is known).
  const knownLevels = new Set([
    ...schoolLevels.map(l => l.name),
    ...DEFAULT_SCHOOL_LEVELS,
  ]);

  // v24.15 (P5): validate every change BEFORE anything is written.
  // Returns a Burmese error message, or null when all changes are valid.
  const validateChanges = (changes: SchoolUpdateRequest['changes']): string | null => {
    for (const change of changes) {
      if (!REQUESTABLE_FIELDS.has(change.field)) {
        return `တောင်းဆိုထားသော အချက် (${change.field}) ကို အတည်ပြု၍မရပါ — ခွင့်ပြုထားသော အချက်သာ ဖြစ်ရပါမည်`;
      }
      const value = String(change.newValue ?? '').trim();
      if (!value) {
        return `တန်ဖိုး အလွတ်ဖြင့် အတည်ပြု၍မရပါ (${FIELD_LABELS[change.field] || change.field})`;
      }
      if (change.field === 'level' && !knownLevels.has(value)) {
        return `ကျောင်းအဆင့် "${value}" သည် သိရှိထားသော အဆင့် မဟုတ်ပါ`;
      }
      if (change.field === 'studentRange' && !getStudentRangeTier(value)) {
        return `ကျောင်းသားဦးရေ Range "${value}" သည် သိရှိထားသော Range မဟုတ်ပါ`;
      }
      if (PHONE_FIELDS.has(change.field) && !isPlausiblePhone(value)) {
        return `ဖုန်းနံပါတ် "${value}" သည် မှန်ကန်သော ဖုန်းနံပါတ် ပုံစံ မဟုတ်ပါ`;
      }
    }
    return null;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'school_update_requests'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolUpdateRequest));
      // Sort by newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (req: SchoolUpdateRequest) => {
    if (!(await confirmDialog('ဤပြင်ဆင်ချက်များကို အတည်ပြုပြီး ကျောင်းအချက်အလက်သို့ ထည့်သွင်းရန် သေချာပါသလား?'))) return;

    // v24.15 (P5): validate first — a crafted request naming authUid /
    // isAnnualFeePaid / feeAmount, an unknown level/tier, a bad phone, or
    // an empty value is rejected before anything is written.
    const validationError = validateChanges(req.changes);
    if (validationError) { toast.error(validationError); return; }

    let schoolUpdated = false;
    try {
      // v24.15 (P14): re-check the request is still pending AT approve
      // time, not just in the UI — two admins approving the same request
      // used to re-apply the values and duplicate the audit entry.
      const freshSnap = await getDoc(doc(db, 'school_update_requests', req.id));
      if (!freshSnap.exists() || (freshSnap.data() as any).status !== 'pending') {
        toast.error('ဤတောင်းဆိုမှုကို အခြား Admin က ဆုံးဖြတ်ပြီးပါပြီ');
        return;
      }

      // Build the update payload (only validated, requestable fields).
      const updates: Record<string, any> = {};
      req.changes.forEach(change => {
        updates[change.field] = change.newValue;
      });

      // 1. Update School
      await updateSchool(req.schoolId, updates);
      schoolUpdated = true;

      // 2. Mark request as approved
      try {
        await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'approved' });
      } catch (statusErr) {
        // v24.15 (P14): the school WAS changed but the status write failed
        // — say the truth (not "အမှားဖြစ်ပွားပါသည်") and still write the
        // audit log, so the change is on record.
        toast.error('ကျောင်းအချက်အလက် ပြောင်းပြီးပါပြီ — အခြေအနေ မှတ်တမ်းတင်ရာတွင် အမှားဖြစ်ပါသည်');
        await recordAuditLog({ action: 'update', entityType: 'request', entityId: req.schoolId, entityName: req.schoolName, details: `ပြင်ဆင်ခွင့် တောင်းဆိုမှု အတည်ပြုခြင်း (${req.changes.map(c => FIELD_LABELS[c.field] || c.field).join(', ')}) — အခြေအနေ မှတ်တမ်းတင်မှု မအောင်မြင်` });
        return;
      }

      await recordAuditLog({ action: 'update', entityType: 'request', entityId: req.schoolId, entityName: req.schoolName, details: `ပြင်ဆင်ခွင့် တောင်းဆိုမှု အတည်ပြုခြင်း (${req.changes.map(c => FIELD_LABELS[c.field] || c.field).join(', ')})` });
      toast.success('အတည်ပြုပြီး ကျောင်းအချက်အလက် Update လုပ်ပြီးပါပြီ');
    } catch (err) {
      // Only report a generic approve failure when the school itself was
      // NOT changed — otherwise the message above already told the truth.
      if (!schoolUpdated) toast.error('အတည်ပြုရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      // v24.15 (P14): refresh the list whatever happened, so a failed
      // approve can never be retried forever against a stale list.
      fetchRequests();
    }
  };

  const handleReject = async (req: SchoolUpdateRequest) => {
    if (!(await confirmDialog('ဤတောင်းဆိုချက်ကို ပယ်ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'rejected' });
      await recordAuditLog({ action: 'update', entityType: 'request', entityId: req.schoolId, entityName: req.schoolName, details: 'ပြင်ဆင်ခွင့် တောင်းဆိုမှု ပယ်ဖျက်ခြင်း' });
      toast.success('တောင်းဆိုချက်ကို ပယ်ဖျက်လိုက်ပါပြီ');
      fetchRequests();
    } catch (err) {
      toast.error('ပယ်ဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog('မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try {
      const target = requests.find(r => r.id === id);
      await deleteDoc(doc(db, 'school_update_requests', id));
      // v24.13 (A6): request delete had no audit log (approve/reject did).
      await recordAuditLog({ action: 'delete', entityType: 'request', entityId: target?.schoolId, entityName: target?.schoolName, details: 'ပြင်ဆင်ခွင့် တောင်းဆိုမှု မှတ်တမ်း ဖျက်ခြင်း' });
      toast.success('မှတ်တမ်း ဖျက်ပြီးပါပြီ');
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
    fetchRequests();
  };

  const getSchoolZone = (schoolId: string): string => {
    const sch = schools.find(s => s.id === schoolId);
    return sch?.zone || '';
  };

  const filteredRequests = requests.filter(req => {
    if (zoneFilter === 'all') return true;
    const schoolZone = getSchoolZone(req.schoolId);
    return isSchoolInZone(schoolZone, zoneFilter);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-sky-600" /> ကျောင်းများ၏ အချက်အလက်ပြင်ဆင်ခွင့် တောင်းဆိုမှုများ
        </h3>

        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            ဇုန် အလိုက် စစ်ထုတ်ရန်:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ZONE_FILTER_OPTIONS.map(opt => {
              const count = opt.value === 'all'
                ? requests.length
                : requests.filter(r => isSchoolInZone(getSchoolZone(r.schoolId), opt.value)).length;
              return (
                <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ` +
                    (zoneFilter === opt.value
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}>
                  <span>{opt.label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ` +
                    (zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200')}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">ဒေတာများ ဆွဲယူနေပါသည်...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">တောင်းဆိုမှု မရှိသေးပါ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-600">ဤဇုန်တွင် တောင်းဆိုမှု မရှိပါ</p>
              </div>
            ) : filteredRequests.map(req => (
              <div key={req.id} className={`border rounded-xl p-4 transition ${req.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : req.status === 'approved' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200/60 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{req.schoolName}</h4>
                      {getSchoolZone(req.schoolId) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{getSchoolZone(req.schoolId)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {req.status === 'pending' ? <><Clock className="w-3 h-3"/> စစ်ဆေးရန် ကျန်</> : 
                         req.status === 'approved' ? <><CheckCircle2 className="w-3 h-3"/> အတည်ပြုပြီး</> : 
                         <><XCircle className="w-3 h-3"/> ပယ်ဖျက်ပြီး</>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">တောင်းဆိုသူ: {req.requestedBy} • ဖုန်း: {req.contactPhone} • ရက်စွဲ: {formatMyanmarDate(parseStoredDate(req.createdAt))}</p>
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleReject(req)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> ပယ်မည်
                      </button>
                      <button onClick={() => handleApprove(req)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> အတည်ပြုမည်
                      </button>
                    </div>
                  )}
                  {/* v24.13 A6: decided requests can be cleared — the delete
                      handler (with its audit log) previously had no button. */}
                  {req.status !== 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleDelete(req.id)} className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition flex items-center gap-1" title="မှတ်တမ်း ဖျက်ရန်">
                        <Trash2 className="w-3.5 h-3.5" /> ဖျက်မည်
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">ပြင်ဆင်လိုသော အချက်အလက်များ:</span>
                  {req.changes.map((change, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                      <div className="font-semibold text-slate-600">{FIELD_LABELS[change.field] || change.field}</div>
                      <div className="text-rose-600 line-through truncate">{change.oldValue || '(အလွတ်)'}</div>
                      <div className="text-emerald-700 font-bold truncate">➔ {change.newValue || '(အလွတ်)'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
