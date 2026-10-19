import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SportInfo, SportOfficial } from '../../types';
import { toast } from 'sonner';
import { FileText, Users, Plus, Trash2, Save } from 'lucide-react';

export default function AdminSportInfoManager({ activeSport }: { activeSport: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [rules, setRules] = useState('');
  const [info, setInfo] = useState('');
  const [officials, setOfficials] = useState<SportOfficial[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'officials'>('rules');

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'sport_info', activeSport);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as SportInfo;
          setRules(data.rules || '');
          setInfo(data.info || '');
          setOfficials(data.officials || []);
        } else {
          setRules(''); setInfo(''); setOfficials([]);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [activeSport]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sport_info', activeSport), {
        sportType: activeSport, rules, info, officials,
        updatedAt: new Date().toISOString()
      });
      toast.success(`${activeSport} ၏ အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ`);
    } catch (err) { toast.error('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်'); } 
    finally { setSaving(false); }
  };

  const addOfficial = () => setOfficials([...officials, { id: Date.now().toString(), name: '', role: '', phone: '' }]);
  const removeOfficial = (id: string) => setOfficials(officials.filter(o => o.id !== id));
  const updateOfficial = (id: string, field: keyof SportOfficial, value: string) => {
    setOfficials(officials.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">ခဏစောင့်ပါ...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
        <h3 className="font-bold text-slate-800">{activeSport} စည်းမျဉ်းနှင့် ဒိုင်များ</h3>
        <button onClick={handleSave} disabled={saving} className="bg-sky-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-sky-800 transition">
          <Save className="w-4 h-4" /> {saving ? 'သိမ်းနေပါသည်...' : 'သိမ်းဆည်းမည်'}
        </button>
      </div>

      <div className="flex border-b bg-slate-50 px-2 pt-2 gap-1">
        <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === 'rules' ? 'bg-white text-sky-900 border-t border-x border-slate-200' : 'text-slate-500'}`}>
          <FileText className="w-3.5 h-3.5 inline mr-1" /> စည်းမျဉ်းနှင့် သတင်းအချက်အလက်
        </button>
        <button onClick={() => setActiveTab('officials')} className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === 'officials' ? 'bg-white text-sky-900 border-t border-x border-slate-200' : 'text-slate-500'}`}>
          <Users className="w-3.5 h-3.5 inline mr-1" /> ဒိုင်နှင့် ကော်မတီ ({officials.length})
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">စည်းမျဉ်းစည်းကမ်းများ</label>
              <textarea value={rules} onChange={e => setRules(e.target.value)} rows={6} className="w-full p-3 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">သိရှိရန် အချက်အလက်များ</label>
              <textarea value={info} onChange={e => setInfo(e.target.value)} rows={4} className="w-full p-3 border rounded-xl text-sm" />
            </div>
          </div>
        )}

        {activeTab === 'officials' && (
          <div className="space-y-3 animate-in fade-in">
            <button onClick={addOfficial} className="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-sky-100 border border-sky-200">
              <Plus className="w-3.5 h-3.5" /> ဒိုင်/ကော်မတီဝင် ထပ်ထည့်ရန်
            </button>
            {officials.map(o => (
              <div key={o.id} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-xl border">
                <input value={o.name} onChange={e => updateOfficial(o.id, 'name', e.target.value)} placeholder="အမည်" className="flex-1 p-2 border rounded-lg text-xs" />
                <input value={o.role} onChange={e => updateOfficial(o.id, 'role', e.target.value)} placeholder="ရာထူး" className="flex-1 p-2 border rounded-lg text-xs" />
                <input value={o.phone} onChange={e => updateOfficial(o.id, 'phone', e.target.value)} placeholder="ဖုန်း" className="flex-1 p-2 border rounded-lg text-xs" />
                <button onClick={() => removeOfficial(o.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
