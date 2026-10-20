import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolUpdateRequest } from '../../types';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, Check, X, MapPin } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<SchoolUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateSchool, schools } = useData();
  const [zoneFilter, setZoneFilter] = useState<string>('all');

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
    if (!confirm('ဤပြင်ဆင်ချက်များကို အတည်ပြုပြီး ကျောင်းအချက်အလက်သို့ ထည့်သွင်းရန် သေချာပါသလား?')) return;
    
    try {
      // Build the update payload
      const updates: Record<string, any> = {};
      req.changes.forEach(change => {
        updates[change.field] = change.newValue;
      });

      // 1. Update School
      await updateSchool(req.schoolId, updates);

      // 2. Mark request as approved
      await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'approved' });
      
      toast.success('အတည်ပြုပြီး ကျောင်းအချက်အလက် Update လုပ်ပြီးပါပြီ');
      fetchRequests();
    } catch (err) {
      toast.error('အတည်ပြုရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handleReject = async (req: SchoolUpdateRequest) => {
    if (!confirm('ဤတောင်းဆိုချက်ကို ပယ်ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await updateDoc(doc(db, 'school_update_requests', req.id), { status: 'rejected' });
      toast.success('တောင်းဆိုချက်ကို ပယ်ဖျက်လိုက်ပါပြီ');
      fetchRequests();
    } catch (err) {
      toast.error('ပယ်ဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'school_update_requests', id));
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
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ` +
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{getSchoolZone(req.schoolId)}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {req.status === 'pending' ? <><Clock className="w-3 h-3"/> စစ်ဆေးရန် ကျန်</> : 
                         req.status === 'approved' ? <><CheckCircle2 className="w-3 h-3"/> အတည်ပြုပြီး</> : 
                         <><XCircle className="w-3 h-3"/> ပယ်ဖျက်ပြီး</>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">တောင်းဆိုသူ: {req.requestedBy} • ဖုန်း: {req.contactPhone} • ရက်စွဲ: {new Date(req.createdAt).toLocaleDateString('my-MM')}</p>
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
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">ပြင်ဆင်လိုသော အချက်အလက်များ:</span>
                  {req.changes.map((change, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                      <div className="font-semibold text-slate-600">{change.field}</div>
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
