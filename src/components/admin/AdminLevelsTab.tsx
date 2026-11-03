import React, { useState } from 'react';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { UnifiedSchoolLevel } from '../../lib/schoolLevels';
import { useData } from '../../context/DataContext';
import { Edit2, Layers, RefreshCw, Trash2 } from 'lucide-react';

interface AdminLevelsTabProps {
  unifiedLevels: UnifiedSchoolLevel[];
}

export default function AdminLevelsTab({ unifiedLevels }: AdminLevelsTabProps) {
  const { addSchoolLevel, updateSchoolLevel, deleteSchoolLevel, resetSchoolLevelsToDefault } = useData();

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelNameInput, setLevelNameInput] = useState('');
  const [levelOrderInput, setLevelOrderInput] = useState<number | ''>('');
  const [levelDescInput, setLevelDescInput] = useState('');
  const [isSavingLevel, setIsSavingLevel] = useState(false);

  // A11: discovered levels (id 'discovered-…', built from school data) and
  // the 'unassigned-level' bucket are derived, not stored — there is no
  // school_levels doc to delete, so delete must not be offered for them.
  const isDerivedLevel = (l: UnifiedSchoolLevel) =>
    l.id.startsWith('discovered-') || l.id === 'unassigned-level' || !!l.isUnassigned;

  const handleStartEditLevel = (l: UnifiedSchoolLevel) => {
    // v24.13: editing a derived level is the same no-op as deleting one —
    // there is no stored school_levels doc, so the name change would land
    // nowhere (updateSchoolLevel would fail on the missing doc).
    if (isDerivedLevel(l)) { toast.error('ဤအဆင့်သည် ကျောင်းအချက်အလက်မှ အလိုအလျောက် ဖြစ်ပေါ်လာသော အဆင့် ဖြစ်သဖြင့် ပြင်၍မရပါ — ကျောင်းများ၏ အဆင့်ကို ပြင်လိုက်လျှင် သူ့အလိုလို ပြောင်းသွားပါမည်'); return; }
    setEditingLevelId(l.id); setLevelNameInput(l.name); setLevelOrderInput(l.order ?? ''); setLevelDescInput(l.description ?? ''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelEditLevel = () => { setEditingLevelId(null); setLevelNameInput(''); setLevelOrderInput(''); setLevelDescInput(''); };
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault(); if (!levelNameInput.trim()) return; setIsSavingLevel(true);
    try {
      if (editingLevelId) { await updateSchoolLevel(editingLevelId, { name: levelNameInput.trim(), order: levelOrderInput !== '' ? Number(levelOrderInput) : undefined, description: levelDescInput.trim() }); toast.success('ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addSchoolLevel(levelNameInput.trim(), levelDescInput.trim(), levelOrderInput !== '' ? Number(levelOrderInput) : undefined); toast.success('ထည့်သွင်းပြီးပါပြီ'); }
      handleCancelEditLevel();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setIsSavingLevel(false); }
  };
  const handleDeleteLevel = async (l: UnifiedSchoolLevel) => {
    // A11: discovered levels are derived from school data, not stored in
    // school_levels — deleting one "succeeded" while removing nothing.
    // The button is disabled for them; this guard is defense in depth.
    if (isDerivedLevel(l)) { toast.error('ဤအဆင့်သည် ကျောင်းအချက်အလက်မှ အလိုအလျောက် ဖြစ်ပေါ်လာသော အဆင့် ဖြစ်သဖြင့် သီးသန့် ဖျက်၍မရပါ'); return; }
    if (!(await confirmDialog('ဖျက်ရန် သေချာပါသလား?'))) return; try { await deleteSchoolLevel(l.id); toast.success('ဖျက်ပြီးပါပြီ'); } catch (e) { toast.error('ဖျက်၍မရပါ'); } };
  const handleResetLevels = async () => { if (!(await confirmDialog('မူလအတိုင်း ပြန်ထားရန် သေချာပါသလား?'))) return; try { await resetSchoolLevelsToDefault(); toast.success('ပြန်ထားပြီးပါပြီ'); } catch (e) { toast.error('ပြန်ထား၍မရပါ'); } };

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in">
      <div className="lg:col-span-5">
        <form onSubmit={handleSaveLevel} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            {editingLevelId ? 'ကျောင်းအဆင့် ပြင်ဆင်ရန်' : 'ကျောင်းအဆင့်အသစ် ထည့်ရန်'}
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ကျောင်းအဆင့် အမည် *</label>
            <input required value={levelNameInput} onChange={e => setLevelNameInput(e.target.value)} placeholder="ဥပမာ - အထက်တန်းကျောင်း (Grade 1 to 12)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">စဉ် (Order Number)</label>
            <input type="number" value={levelOrderInput} onChange={e => setLevelOrderInput(e.target.value ? Number(e.target.value) : '')} placeholder="1, 2, 3..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ဖော်ပြချက်</label>
            <textarea rows={3} value={levelDescInput} onChange={e => setLevelDescInput(e.target.value)} placeholder="အသေးစိတ်ဖော်ပြချက်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            {editingLevelId && <button type="button" onClick={handleCancelEditLevel} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-bold cursor-pointer">Cancel</button>}
            <button type="submit" disabled={isSavingLevel} className="flex-1 bg-sky-900 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
              {editingLevelId ? 'ပြင်ဆင်မည်' : 'ထည့်သွင်းမည်'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">လက်ရှိ ကျောင်းအဆင့်များ ({unifiedLevels.length})</h3>
          <button onClick={handleResetLevels} className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> မူလအတိုင်း ပြန်ထားမည်
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {unifiedLevels.map(l => (
            <div key={l.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {l.name}
                  <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold">{l.schools.length} ကျောင်း</span>
                  {isDerivedLevel(l) && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">ကျောင်းအချက်အလက်မှ အလိုအလျောက်</span>
                  )}
                </h4>
                {l.description && <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>}
                {isDerivedLevel(l) && (
                  <p className="text-xs text-slate-400 mt-0.5">ဤအဆင့်သည် ကျောင်းအချက်အလက်မှ အလိုအလျောက် ဖြစ်ပေါ်လာသဖြင့် သီးသန့် ပြင်/ဖျက်၍မရပါ — ကျောင်းများ၏ အဆင့်ကို ပြင်လိုက်လျှင် သူ့အလိုလို ပျောက်သွားပါမည်။</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleStartEditLevel(l)}
                  disabled={isDerivedLevel(l)}
                  title={isDerivedLevel(l) ? 'ကျောင်းအချက်အလက်မှ အလိုအလျောက် ဖြစ်ပေါ်လာသော အဆင့် — သီးသန့် ပြင်၍မရပါ' : 'ပြင်ရန်'}
                  className="p-2 text-slate-400 hover:text-amber-600 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                ><Edit2 className="w-4 h-4" /></button>
                <button
                  onClick={() => handleDeleteLevel(l)}
                  disabled={isDerivedLevel(l)}
                  title={isDerivedLevel(l) ? 'ကျောင်းအချက်အလက်မှ အလိုအလျောက် ဖြစ်ပေါ်လာသော အဆင့် — သီးသန့် ဖျက်၍မရပါ' : 'ဖျက်ရန်'}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                ><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
