import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { Association } from '../../types';
import { Building2, Edit2, Trash2 } from 'lucide-react';

const associationSchema = z.object({
  name: z.string().min(1, 'အသင်းအမည် လိုအပ်သည်'),
  township: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  members: z.array(
    z.object({
      name: z.string().min(1, 'အဖွဲ့ဝင်အမည် လိုအပ်သည်'),
      role: z.string().min(1, 'ရာထူး လိုအပ်သည်'),
      school: z.string().optional(),
      phone: z.string().optional(),
      viber: z.string().optional(),
      telegram: z.string().optional(),
      photoUrl: z.string().optional(),
    })
  ),
});

interface AdminAssociationsTabProps {
  associations: Association[];
  onRefresh: () => void;
}

export default function AdminAssociationsTab({ associations, onRefresh }: AdminAssociationsTabProps) {
  const [editingAssociationId, setEditingAssociationId] = useState<string | null>(null);
  const associationForm = useForm({
    resolver: zodResolver(associationSchema),
    defaultValues: { name: '', township: '', address: '', phone: '', email: '', logoUrl: '', description: '', members: [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] },
  });
  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({ control: associationForm.control, name: 'members' });

  const startEditAssociation = (a: Association) => {
    setEditingAssociationId(a.id);
    associationForm.reset({ ...a, members: a.members?.length ? a.members : [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditAssociation = () => {
    setEditingAssociationId(null);
    associationForm.reset({ name: '', township: '', address: '', phone: '', email: '', logoUrl: '', description: '', members: [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] });
  };
  const onAssociationSubmit = async (data: any) => {
    try {
      if (editingAssociationId) { await updateDoc(doc(db, 'associations', editingAssociationId), { ...data, updatedAt: new Date().toISOString() }); toast.success('အသင်းအဖွဲ့ ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addDoc(collection(db, 'associations'), { ...data, createdAt: new Date().toISOString() }); toast.success('အသင်းအဖွဲ့အသစ် ထည့်သွင်းပြီးပါပြီ'); }
      cancelEditAssociation(); onRefresh();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); }
  };
  const deleteAssociation = async (id: string) => {
    if (!(await confirmDialog('ဤအသင်းအဖွဲ့ကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try { await deleteDoc(doc(db, 'associations', id)); toast.success('ဖျက်ပြီးပါပြီ'); onRefresh(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <form onSubmit={associationForm.handleSubmit(onAssociationSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            {editingAssociationId ? 'အသင်းအဖွဲ့ ပြင်ဆင်ရန်' : 'အသင်းအဖွဲ့အသစ် ထည့်သွင်းရန်'}
          </h3>
          {editingAssociationId && (
            <button type="button" onClick={cancelEditAssociation} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer">ပြင်ဆင်မှု ပယ်ဖျက်ရန်</button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">အသင်းအဖွဲ့ အမည် *</label>
            <input {...associationForm.register('name')} placeholder="အသင်းအမည်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">မြို့နယ်</label>
            <input {...associationForm.register('township')} placeholder="ဥပမာ - တောင်ကြီး" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ဖုန်းနံပါတ်</label>
            <input {...associationForm.register('phone')} placeholder="09..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">လိပ်စာနှင့် ဖော်ပြချက်</label>
            <input {...associationForm.register('description')} placeholder="အသင်းအကြောင်း အကျဉ်းချုပ်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL</label>
            <input {...associationForm.register('logoUrl')} placeholder="https://..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-800">အမှုဆောင် အဖွဲ့ဝင်များ ({memberFields.length})</h4>
            <button type="button" onClick={() => appendMember({ name: '', role: 'အဖွဲ့ဝင်', school: '', phone: '', viber: '', telegram: '', photoUrl: '' })} className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition cursor-pointer">
              + အဖွဲ့ဝင် ထပ်ထည့်ရန်
            </button>
          </div>
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {memberFields.map((field, index) => (
              <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid sm:grid-cols-5 gap-2.5 items-center">
                <input {...associationForm.register(`members.${index}.name` as const)} placeholder="အမည် *" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                <input {...associationForm.register(`members.${index}.role` as const)} placeholder="ရာထူး *" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                <input {...associationForm.register(`members.${index}.school` as const)} placeholder="ကိုယ်စားပြုကျောင်း" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                <input {...associationForm.register(`members.${index}.phone` as const)} placeholder="ဖုန်းနံပါတ်" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                <div className="flex items-center gap-1.5">
                  <input {...associationForm.register(`members.${index}.photoUrl` as const)} placeholder="ပုံ Link" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                  {memberFields.length > 1 && (
                    <button type="button" onClick={() => removeMember(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="bg-sky-900 hover:bg-sky-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer">
          {editingAssociationId ? 'အသင်းအဖွဲ့ ပြင်ဆင်ချက် သိမ်းမည်' : 'အသင်းအဖွဲ့ သိမ်းဆည်းမည်'}
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {associations.map(a => (
          <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{a.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{a.township || 'ရှမ်းပြည်နယ် (တောင်ပိုင်း)'} • အဖွဲ့ဝင် {a.members?.length || 0} ဦး</p>
                {a.description && <p className="text-xs text-slate-600 mt-2">{a.description}</p>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEditAssociation(a)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteAssociation(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
