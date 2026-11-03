import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MapPin, Edit2, Plus, Users, Phone, FileText } from 'lucide-react';
import ImageUploadDropzone from '../ImageUploadDropzone';
import { STUDENT_RANGE_TIERS } from '../../types';
import { STANDARD_ZONES } from '../../constants';
import { getGlobalAcademicYear } from '../../lib/academicYear';

const schoolSchema = z.object({
  logoUrl: z.string().optional(), name: z.string().min(1, 'ကျောင်းအမည် လိုအပ်သည်'),
  level: z.string().min(1, 'ကျောင်းအဆင့် လိုအပ်သည်'), address: z.string().optional(),
  township: z.string().optional(), city: z.string().optional(), zone: z.string().optional(),
  studentRange: z.string().optional(), studentCount: z.union([z.number(), z.string()]).optional(),
  feeAmount: z.union([z.number(), z.string()]).optional(), feeAcademicYear: z.string().optional(),
  feePaidDate: z.string().optional(), schoolPhone: z.string().optional(), schoolPhone2: z.string().optional(),
  founderName: z.string().optional(), founderPhone: z.string().optional(), founderPhone2: z.string().optional(),
  founderViber: z.string().optional(), founderTelegram: z.string().optional(),
  adminName: z.string().optional(), adminPhone: z.string().optional(), adminPhone2: z.string().optional(),
  adminViber: z.string().optional(), adminTelegram: z.string().optional(),
  contactName: z.string().optional(), contactRole: z.string().optional(), contactPhone: z.string().optional(),
  contactPhone2: z.string().optional(), contactViber: z.string().optional(), contactTelegram: z.string().optional(),
  contact2Name: z.string().optional(), contact2Role: z.string().optional(), contact2Phone: z.string().optional(),
  contact2Phone2: z.string().optional(), contact2Viber: z.string().optional(), contact2Telegram: z.string().optional(),
  schoolNote: z.string().optional(), note: z.string().optional(),
  status: z.enum(['active', 'under_review', 'inactive']).optional(),
});

interface SchoolFormProps {
  initialData?: any; isEditing: boolean; onCancel: () => void;
  onSubmit: (data: any) => Promise<void>; schoolLevels: any[]; setActiveTab: (tab: any) => void;
}

export default function SchoolForm({ initialData, isEditing, onCancel, onSubmit, schoolLevels, setActiveTab }: SchoolFormProps) {
  const [activeTab, setActiveTabState] = useState<'basic' | 'phones' | 'persons'>('basic');

  const schoolForm = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '', level: schoolLevels[0]?.name || '၁။ အထက်တန်း', address: '', township: '', city: '', zone: '',
      studentRange: '0-100', studentCount: '', feeAmount: '', feeAcademicYear: getGlobalAcademicYear(), feePaidDate: '',
      logoUrl: '', schoolPhone: '', schoolPhone2: '', founderName: '', founderPhone: '', founderPhone2: '',
      founderViber: '', founderTelegram: '', adminName: '', adminPhone: '', adminPhone2: '',
      adminViber: '', adminTelegram: '', contactName: '', contactRole: '', contactPhone: '', contactPhone2: '',
      contactViber: '', contactTelegram: '', contact2Name: '', contact2Role: '', contact2Phone: '',
      contact2Phone2: '', contact2Viber: '', contact2Telegram: '', schoolNote: '', note: '',
      status: 'active',
    },
  });

  const [extraSchoolPhones, setExtraSchoolPhones] = useState<string[]>([]);
  // v24.15 (P17): the school's ORIGINAL zone, captured when the edit starts,
  // so a non-standard zone stays selectable for the whole edit session even
  // after another zone is picked (the options used to be built from the
  // CURRENT value only, so the original vanished mid-edit).
  const [originalZone, setOriginalZone] = useState<string>('');
  const [extraFounderPhones, setExtraFounderPhones] = useState<string[]>([]);
  const [extraAdminPhones, setExtraAdminPhones] = useState<string[]>([]);
  const [extraCoord1Phones, setExtraCoord1Phones] = useState<string[]>([]);
  const [extraCoord2Phones, setExtraCoord2Phones] = useState<string[]>([]);

  // v24.13 (A12): reset only when the editing school's ID changes (or the
  // modal opens for a new school), NOT on every initialData identity
  // change — initialData is schools.find(...), so every onSnapshot /
  // fetchSchools rebuilds the array with new object identities and the
  // old effect wiped unsaved input mid-edit.
  const lastResetKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const editingId = isEditing && (initialData as any)?.id ? (initialData as any).id : null;
    const key = editingId ?? '__new__';
    if (lastResetKeyRef.current === key) return;
    lastResetKeyRef.current = key;
    if (initialData) {
      schoolForm.reset({ ...initialData, studentCount: initialData.studentCount ?? '', feeAmount: initialData.feeAmount ?? '' });
      setOriginalZone((initialData as any)?.zone || '');
      setExtraSchoolPhones(Array.isArray(initialData.schoolPhones) ? [...initialData.schoolPhones] : []);
      setExtraFounderPhones(Array.isArray(initialData.founderPhones) ? [...initialData.founderPhones] : []);
      setExtraAdminPhones(Array.isArray(initialData.adminPhones) ? [...initialData.adminPhones] : []);
      setExtraCoord1Phones(Array.isArray(initialData.contactPhones) ? [...initialData.contactPhones] : []);
      setExtraCoord2Phones(Array.isArray(initialData.contact2Phones) ? [...initialData.contact2Phones] : []);
    } else {
      schoolForm.reset();
      setOriginalZone('');
      setExtraSchoolPhones([]);
      setExtraFounderPhones([]);
      setExtraAdminPhones([]);
      setExtraCoord1Phones([]);
      setExtraCoord2Phones([]);
    }
  }, [initialData, isEditing, schoolForm]);

  // v24.13 (A1): invalid submits used to fail silently — no onInvalid
  // handler and formState.errors was never rendered. Name the first
  // missing/invalid field in a toast; inline errors render under the fields.
  const formErrors = schoolForm.formState.errors;
  const handleInvalidSubmit = (errors: any) => {
    const firstMessage =
      errors?.name?.message || errors?.level?.message || 'လိုအပ်သော အချက်အလက် ဖြည့်စွက်ပေးပါ';
    toast.error(String(firstMessage));
  };

  // v24.13 (A9): the Cloudinary settings live on the Backup tab — switching
  // tabs behind the still-open SchoolForm modal left the admin staring at
  // the form with no visible change. Close the modal first, then switch.
  const handleOpenCloudinarySettings = () => {
    onCancel();
    setActiveTab('backup');
    toast.info('Cloudinary ဆက်တင်များသည် Backup & Cloud tab တွင် ရှိပါသည်');
  };

  const handleLocalSubmit = async (data: any) => {
    // v24.13 (F2a): the form must never send isAnnualFeePaid — a paid flag
    // with no transaction is a bare flag. On edit the existing flag is
    // preserved by omitting the key entirely; on create it defaults false.
    // (The field is also gone from the schema, so zod strips it from data;
    // this destructure is the belt-and-braces guard for the reset path,
    // which still spreads initialData.)
    const { isAnnualFeePaid: _droppedFeeFlag, ...rest } = data;
    const payload = {
      ...rest, ...(isEditing ? {} : { isAnnualFeePaid: false }),
      schoolPhones: extraSchoolPhones.map(p => p.trim()).filter(Boolean),
      founderPhones: extraFounderPhones.map(p => p.trim()).filter(Boolean),
      adminPhones: extraAdminPhones.map(p => p.trim()).filter(Boolean),
      contactPhones: extraCoord1Phones.map(p => p.trim()).filter(Boolean),
      contact2Phones: extraCoord2Phones.map(p => p.trim()).filter(Boolean),
    };
    await onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/50 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isEditing ? <Edit2 className="w-5 h-5 text-sky-700" /> : <Plus className="w-5 h-5 text-sky-700" />}
          <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'ကျောင်းအချက်အလက် ပြင်ဆင်ရန်' : 'ကျောင်းအသစ် ထည့်သွင်းရန်'}</h3>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button type="button" onClick={() => setActiveTabState('basic')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === 'basic' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>အခြေခံအချက်အလက်</button>
          <button type="button" onClick={() => setActiveTabState('phones')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === 'phones' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>ဖုန်းနံပါတ်များ</button>
          <button type="button" onClick={() => setActiveTabState('persons')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === 'persons' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>တာဝန်ခံများ & မှတ်စု</button>
        </div>
      </div>

      <form onSubmit={schoolForm.handleSubmit(handleLocalSubmit, handleInvalidSubmit)} className="p-4 sm:p-6 space-y-6">
        
        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="grid sm:grid-cols-2 gap-5 animate-in fade-in">
            <div className="sm:col-span-2">
              <ImageUploadDropzone value={schoolForm.watch('logoUrl') || ''} onChange={(url) => schoolForm.setValue('logoUrl', url)} label="ကျောင်း Logo / အမှတ်တံဆိပ်" folder="shan-state-schools" onOpenSettings={handleOpenCloudinarySettings} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းအမည် *</label>
              <input {...schoolForm.register('name')} placeholder="ကျောင်းအမည်" className="w-full p-2.5 border rounded-lg text-sm focus:border-sky-500 outline-none" />
              {formErrors.name && <p className="text-xs text-rose-600 font-semibold mt-1">{String(formErrors.name.message)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းအဆင့် *</label>
              <select {...schoolForm.register('level')} className="w-full p-2.5 border rounded-lg text-sm bg-white font-bold focus:border-sky-500 outline-none">
                {schoolLevels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
              {formErrors.level && <p className="text-xs text-rose-600 font-semibold mt-1">{String(formErrors.level.message)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်း အခြေအနေ</label>
              <select {...schoolForm.register('status')} className="w-full p-2.5 border rounded-lg text-sm bg-white focus:border-sky-500 outline-none">
                <option value="active">🟢 လည်ပတ်ဆဲ (Active)</option>
                <option value="under_review">🟡 စိစစ်ဆဲ (Under Review)</option>
                <option value="inactive">⚪ ရပ်နား (Inactive)</option>
              </select>
            </div>
            {/* v24.13 (F2a): the Paid checkbox is gone — ticking it used to
                set isAnnualFeePaid with no transaction, amount or voucher.
                A fee is marked paid only through the fee modal / Finance /
                toggle paths, which record a real transaction. The year and
                payment-date fields stay: they describe the fee, not its
                paid state. */}
            <div className="space-y-3 p-3 border rounded-xl bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">ပညာသင်နှစ် (Academic Year)</label>
                  <input type="text" {...schoolForm.register('feeAcademicYear')} placeholder="ဥပမာ - ၂၀၂၄-၂၀၂၅" className="w-full p-2 border rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">သွင်းသည့် ရက်စွဲ (Payment Date)</label>
                  <input type="date" {...schoolForm.register('feePaidDate')} className="w-full p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
               <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-sky-600" /> တည်နေရာ</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input {...schoolForm.register('address')} placeholder="ကျောင်းလိပ်စာ" className="w-full p-2.5 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('township')} placeholder="မြို့နယ်" className="w-full p-2.5 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('city')} placeholder="မြို့" className="w-full p-2.5 border rounded-lg text-sm bg-white" />
                  <select {...schoolForm.register('zone')} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                    <option value="">- ဇုန် ရွေးပါ -</option>
                    {/* v24.15 (P17): a non-standard zone (e.g. from Excel import)
                        is kept as an extra option for the whole edit session —
                        the school's ORIGINAL zone (captured at edit start) plus
                        the current value — so it can be re-selected after
                        picking another zone, instead of vanishing mid-edit. */}
                    {(() => {
                      const currentZone: string | undefined = schoolForm.watch('zone');
                      const extras = [currentZone, originalZone].filter(
                        (z): z is string => !!z && !(STANDARD_ZONES as readonly string[]).includes(z)
                      );
                      const zones = ([...STANDARD_ZONES] as string[]).concat([...new Set(extras)]);
                      return zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ));
                    })()}
                  </select>
               </div>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းသားဦးရေ Range</label>
                <select 
                  {...schoolForm.register('studentRange')} 
                  onChange={(e) => {
                    schoolForm.register('studentRange').onChange(e);
                    // v24.7: changing the range no longer overwrites a fee
                    // the admin typed by hand with the tier default.
                  }}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white"
                >
                  {STUDENT_RANGE_TIERS.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">တိကျသော ဦးရေ</label>
                <input 
                  type="number" 
                  {...schoolForm.register('studentCount')} 
                  onChange={(e) => {
                    schoolForm.register('studentCount').onChange(e);
                    const count = Number(e.target.value);
                    if (!isNaN(count)) {
                      const tier = STUDENT_RANGE_TIERS.find(t => count >= t.min && count <= t.max);
                      if (tier) {
                        schoolForm.setValue('studentRange', tier.key);
                        // v24.7: the fee is no longer auto-overwritten here.
                      }
                    }
                  }}
                  placeholder="ဥပမာ - 500" 
                  className="w-full p-2.5 border rounded-lg text-sm bg-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">နှစ်စဉ်ကြေး (ကျပ်)</label>
                <input 
                  type="number" 
                  {...schoolForm.register('feeAmount')} 
                  className="w-full p-2.5 border rounded-lg text-sm bg-white font-bold text-sky-900" 
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHONES */}
        {activeTab === 'phones' && (
          <div className="grid sm:grid-cols-2 gap-5 animate-in fade-in">
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Phone className="w-4 h-4 text-sky-600"/> ကျောင်း ဖုန်း</h4>
                <button type="button" onClick={() => setExtraSchoolPhones(prev => [...prev, ''])} className="text-xs text-sky-700 font-bold cursor-pointer hover:underline">+ ထပ်ထည့်</button>
              </div>
              <input type="tel" inputMode="tel" {...schoolForm.register('schoolPhone')} placeholder="ဖုန်း (၁)" className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" inputMode="tel" {...schoolForm.register('schoolPhone2')} placeholder="ဖုန်း (၂)" className="w-full p-2.5 border rounded-lg text-sm" />
              {extraSchoolPhones.map((ph, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" inputMode="tel" value={ph} onChange={(e) => { const n = [...extraSchoolPhones]; n[idx] = e.target.value; setExtraSchoolPhones(n); }} placeholder="ဖုန်းနံပါတ်" className="flex-1 p-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => setExtraSchoolPhones(extraSchoolPhones.filter((_, i) => i !== idx))} className="px-3 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">ဖယ်</button>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-600"/> တည်ထောင်သူ ဖုန်း</h4>
                <button type="button" onClick={() => setExtraFounderPhones(prev => [...prev, ''])} className="text-xs text-sky-700 font-bold cursor-pointer hover:underline">+ ထပ်ထည့်</button>
              </div>
              <input {...schoolForm.register('founderName')} placeholder="အမည်" className="w-full p-2.5 border rounded-lg text-sm bg-slate-50" />
              <input type="tel" inputMode="tel" {...schoolForm.register('founderPhone')} placeholder="ဖုန်း (၁)" className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" inputMode="tel" {...schoolForm.register('founderPhone2')} placeholder="ဖုန်း (၂)" className="w-full p-2.5 border rounded-lg text-sm" />
              {extraFounderPhones.map((ph, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" inputMode="tel" value={ph} onChange={(e) => { const n = [...extraFounderPhones]; n[idx] = e.target.value; setExtraFounderPhones(n); }} placeholder="ဖုန်းနံပါတ်" className="flex-1 p-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => setExtraFounderPhones(extraFounderPhones.filter((_, i) => i !== idx))} className="px-3 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">ဖယ်</button>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-600"/> စီမံအုပ်ချုပ်သူ ဖုန်း</h4>
                <button type="button" onClick={() => setExtraAdminPhones(prev => [...prev, ''])} className="text-xs text-sky-700 font-bold cursor-pointer hover:underline">+ ထပ်ထည့်</button>
              </div>
              <input {...schoolForm.register('adminName')} placeholder="အမည်" className="w-full p-2.5 border rounded-lg text-sm bg-slate-50" />
              <input type="tel" inputMode="tel" {...schoolForm.register('adminPhone')} placeholder="ဖုန်း (၁)" className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" inputMode="tel" {...schoolForm.register('adminPhone2')} placeholder="ဖုန်း (၂)" className="w-full p-2.5 border rounded-lg text-sm" />
              {extraAdminPhones.map((ph, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" inputMode="tel" value={ph} onChange={(e) => { const n = [...extraAdminPhones]; n[idx] = e.target.value; setExtraAdminPhones(n); }} placeholder="ဖုန်းနံပါတ်" className="flex-1 p-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => setExtraAdminPhones(extraAdminPhones.filter((_, i) => i !== idx))} className="px-3 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">ဖယ်</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONS & NOTES */}
        {activeTab === 'persons' && (
          <div className="grid sm:grid-cols-2 gap-5 animate-in fade-in">
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-600"/> တာဝန်ခံ (၁)</h4>
                <button type="button" onClick={() => setExtraCoord1Phones(prev => [...prev, ''])} className="text-xs text-sky-700 font-bold cursor-pointer hover:underline">+ ထပ်ထည့်</button>
              </div>
              <input {...schoolForm.register('contactName')} placeholder="အမည်" className="w-full p-2.5 border rounded-lg text-sm" />
              <input {...schoolForm.register('contactRole')} placeholder="ရာထူး" className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" inputMode="tel" {...schoolForm.register('contactPhone')} placeholder="ဖုန်း (၁)" className="w-full p-2.5 border rounded-lg text-sm" />
              {extraCoord1Phones.map((ph, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" inputMode="tel" value={ph} onChange={(e) => { const n = [...extraCoord1Phones]; n[idx] = e.target.value; setExtraCoord1Phones(n); }} placeholder="ဖုန်းနံပါတ်" className="flex-1 p-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => setExtraCoord1Phones(extraCoord1Phones.filter((_, i) => i !== idx))} className="px-3 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">ဖယ်</button>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-600"/> တာဝန်ခံ (၂)</h4>
                <button type="button" onClick={() => setExtraCoord2Phones(prev => [...prev, ''])} className="text-xs text-sky-700 font-bold cursor-pointer hover:underline">+ ထပ်ထည့်</button>
              </div>
              <input {...schoolForm.register('contact2Name')} placeholder="အမည်" className="w-full p-2.5 border rounded-lg text-sm" />
              <input {...schoolForm.register('contact2Role')} placeholder="ရာထူး" className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" inputMode="tel" {...schoolForm.register('contact2Phone')} placeholder="ဖုန်း (၁)" className="w-full p-2.5 border rounded-lg text-sm" />
              {extraCoord2Phones.map((ph, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" inputMode="tel" value={ph} onChange={(e) => { const n = [...extraCoord2Phones]; n[idx] = e.target.value; setExtraCoord2Phones(n); }} placeholder="ဖုန်းနံပါတ်" className="flex-1 p-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => setExtraCoord2Phones(extraCoord2Phones.filter((_, i) => i !== idx))} className="px-3 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">ဖယ်</button>
                </div>
              ))}
            </div>

            <div className="sm:col-span-2 space-y-2">
               <label className="block text-xs font-semibold text-slate-600">ကျောင်းဘက်မှ မှတ်ချက်</label>
               <textarea {...schoolForm.register('schoolNote')} rows={2} placeholder="မှတ်ချက်..." className="w-full p-2.5 border rounded-lg text-sm focus:border-sky-500 outline-none" />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {isEditing && (
            <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition">မလုပ်တော့ပါ</button>
          )}
          <button type="submit" className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-sm ${isEditing ? 'bg-sky-700 hover:bg-sky-800' : 'bg-sky-900 hover:bg-sky-950'}`}>
            {isEditing ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'ကျောင်းအသစ် သိမ်းမည်'}
          </button>
        </div>
      </form>
    </div>
  );
}
