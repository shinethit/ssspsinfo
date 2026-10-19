import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, cleanFirestoreData } from '../../lib/firebase';
import { Athlete, School } from '../../types';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Download, User } from 'lucide-react';
import { downloadAthleteTemplate, parseAthleteExcel } from '../../lib/athleteExcel';

export default function AdminAthleteManager({ activeSport, schools }: { activeSport: string, schools: School[] }) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualData, setManualData] = useState({ name: '', fatherName: '', dob: '', grade: '', rollNo: '', school: '', gender: 'Male', photoUrl: '' });

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'athletes'));
      setAthletes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAthletes(); }, []);

  const calcAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await parseAthleteExcel(file);
      const batch = writeBatch(db);
      
      let count = 0;
      data.forEach((row) => {
        const name = row['အမည်'];
        const school = row['ကိုယ်စားပြုကျောင်း'];
        if (!name || !school) return;

        const sportsString = row['ပါဝင်မည့် အားကစား (ကော်မာခြားပါ)'] || '';
        const sportsArray = sportsString.split(',').map((s: string) => s.trim()).filter(Boolean);

        const dob = row['မွေသက္ကရာဇ် (YYYY-MM-DD)'] || row['မွေးသက္ကရာဇ် (YYYY-MM-DD)'] || '';
        const docRef = doc(collection(db, 'athletes'));
        
        batch.set(docRef, cleanFirestoreData({
          name,
          fatherName: row['အဖအမည်'] || '',
          dob,
          age: calcAge(dob),
          grade: row['အတန်း'] || '',
          rollNo: row['ကျောင်းဝင်အမှတ်'] || '',
          school,
          gender: row['ကျား/မ (Male/Female)'] || 'Male',
          sports: sportsArray,
          photoUrl: row['ဓာတ်ပုံ URL (Optional)'] || '',
          createdAt: new Date().toISOString()
        }));
        count++;
      });

      await batch.commit();
      toast.success(`အားကစားသမား (${count}) ဦး အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ`);
      fetchAthletes();
    } catch (err) {
      toast.error('Excel ဖတ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.name || !manualData.school) return toast.error('အမည်နှင့် ကျောင်း ဖြည့်ပါ');
    try {
      await addDoc(collection(db, 'athletes'), cleanFirestoreData({
        ...manualData,
        age: calcAge(manualData.dob),
        sports: [activeSport],
        createdAt: new Date().toISOString()
      }));
      toast.success('အားကစားသမား ထည့်သွင်းပြီးပါပြီ');
      setShowManualAdd(false);
      setManualData({ name: '', fatherName: '', dob: '', grade: '', rollNo: '', school: '', gender: 'Male', photoUrl: '' });
      fetchAthletes();
    } catch (err) {
      toast.error('ထည့်သွင်း၍ မရပါ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ဤအားကစားသမားကို ဖျက်ရန် သေချာပါသလား?')) return;
    await deleteDoc(doc(db, 'athletes', id));
    fetchAthletes();
  };

  // Filter athletes by the selected sport
  const filteredAthletes = athletes.filter(a => a.sports.includes(activeSport));

  return (
    <div className="space-y-4">
      {showManualAdd && (
        <form onSubmit={handleManualAdd} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3 animate-in fade-in">
          <h4 className="font-bold text-amber-900 border-b border-amber-200 pb-2">အားကစားသမား အသစ်ထည့်ရန် ({activeSport})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input required placeholder="အမည် *" value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} className="p-2 border rounded-lg text-xs" />
            <input placeholder="အဖအမည်" value={manualData.fatherName} onChange={e => setManualData({...manualData, fatherName: e.target.value})} className="p-2 border rounded-lg text-xs" />
            <input type="date" value={manualData.dob} onChange={e => setManualData({...manualData, dob: e.target.value})} className="p-2 border rounded-lg text-xs" />
            <input placeholder="အတန်း" value={manualData.grade} onChange={e => setManualData({...manualData, grade: e.target.value})} className="p-2 border rounded-lg text-xs" />
            <input placeholder="ကျောင်းဝင်အမှတ်" value={manualData.rollNo} onChange={e => setManualData({...manualData, rollNo: e.target.value})} className="p-2 border rounded-lg text-xs" />
            <select required value={manualData.school} onChange={e => setManualData({...manualData, school: e.target.value})} className="p-2 border rounded-lg text-xs bg-white">
              <option value="">- ကျောင်းရွေးပါ -</option>
              {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={manualData.gender} onChange={e => setManualData({...manualData, gender: e.target.value})} className="p-2 border rounded-lg text-xs bg-white">
              <option value="Male">ကျား</option>
              <option value="Female">မ</option>
            </select>
            <input placeholder="ဓာတ်ပုံ URL" value={manualData.photoUrl} onChange={e => setManualData({...manualData, photoUrl: e.target.value})} className="p-2 border rounded-lg text-xs" />
          </div>
          <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold">သိမ်းဆည်းမည်</button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800">{activeSport} - အားကစားသမားများ</h3>
          <p className="text-xs text-slate-500 mt-0.5">စုစုပေါင်း {filteredAthletes.length} ဦး</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowManualAdd(!showManualAdd)} className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-lg hover:bg-amber-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4"/> လက်ဖြင့်ထည့်မည်
          </button>
          <button onClick={downloadAthleteTemplate} className="text-xs font-bold text-sky-700 bg-sky-100 px-3 py-2 rounded-lg hover:bg-sky-200 flex items-center gap-1.5">
            <Download className="w-4 h-4"/> Excel Template
          </button>
          <label className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg hover:bg-emerald-200 flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4"/> {isUploading ? 'တင်နေပါသည်...' : 'Excel ဖြင့် အစုလိုက်တင်မည်'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500">ခဏစောင့်ပါ...</div>
        ) : filteredAthletes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <User className="w-10 h-10 text-slate-300 mb-2" />
            <p>ဤအားကစားအတွက် အားကစားသမား မရှိသေးပါ။</p>
            <p className="text-xs text-slate-400 mt-1">Excel ဖိုင်ဖြင့် အစုလိုက် တင်သွင်းနိုင်ပါသည်။</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3 font-bold">အမည်</th>
                <th className="p-3 font-bold">ကျောင်း</th>
                <th className="p-3 font-bold">အတန်း</th>
                <th className="p-3 font-bold">အသက်</th>
                <th className="p-3 font-bold">ပါဝင်သည့် အားကစား</th>
                <th className="p-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAthletes.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {a.photoUrl ? (
                        <img src={a.photoUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User className="w-4 h-4"/></div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{a.name}</p>
                        <p className="text-[10px] text-slate-500">အဖ: {a.fatherName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-sky-800">{a.school}</td>
                  <td className="p-3">{a.grade}</td>
                  <td className="p-3 font-mono">{a.age}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {a.sports.map(s => (
                        <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(a.id)} className="text-rose-500 p-1.5 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  );
}