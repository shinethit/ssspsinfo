import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { School, TransactionRecord, PaymentRecord } from '../../types';
import { toast } from 'sonner';
import { Coins, Plus, Search, Printer, Trash2, ArrowRightLeft, History, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';

export default function AdminFinanceManager({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [feeType, setFeeType] = useState('အားကစားကြေး (Sports Fee)');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Migration State
  const [isMigrating, setIsMigrating] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'transactions'), {
        schoolId: selectedSchool.id,
        schoolName: selectedSchool.name,
        feeType,
        amount: Number(amount),
        paidDate: new Date().toISOString().split('T')[0],
        note,
        recordedBy: auth.currentUser?.email || 'Admin',
        createdAt: new Date().toISOString()
      });
      
      toast.success('ငွေသွင်းမှု မှတ်တမ်းတင်ပြီးပါပြီ');
      setAmount(''); setNote('');
      fetchTransactions();
    } catch (err) {
      toast.error('မှတ်တမ်းတင်၍ မရပါ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('ဤငွေသွင်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('မှတ်တမ်း ဖျက်ပြီးပါပြီ');
      fetchTransactions();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  // Migrate Old Data from School Documents
  const handleMigrateData = async () => {
    const schoolsWithOldPayments = schools.filter(s => (s as any).payments && (s as any).payments.length > 0);
    if (schoolsWithOldPayments.length === 0) {
      toast.info('ရွှေ့ပြောင်းရန် မှတ်တမ်းဟောင်း မရှိပါ');
      return;
    }

    if (!confirm(`ကျောင်း (${schoolsWithOldPayments.length}) ခုတွင် ရှိသော ငွေသွင်းမှတ်တမ်းဟောင်းများကို 'transactions' သို့ ရွှေ့ပြောင်းပါမည်။ သေချာပါသလား?`)) return;

    setIsMigrating(true);
    let migratedCount = 0;
    
    try {
      for (const school of schoolsWithOldPayments) {
        if (!(school as any).payments) continue;
        
        for (const payment of (school as any).payments) {
          await addDoc(collection(db, 'transactions'), {
            schoolId: school.id,
            schoolName: school.name,
            feeType: payment.feeType,
            amount: payment.amount,
            paidDate: payment.paidDate,
            note: payment.note || '',
            recordedBy: 'System Migration',
            createdAt: new Date().toISOString()
          });
          migratedCount++;
        }
        
        // Clear the payments array in the school document
        await updateDoc(doc(db, 'schools', school.id), {
          payments: []
        });
      }
      
      toast.success(`မှတ်တမ်း (${migratedCount}) ခုကို အောင်မြင်စွာ ရွှေ့ပြောင်းပြီးပါပြီ`);
      fetchTransactions();
    } catch (err) {
      toast.error('ရွှေ့ပြောင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchSearch = s.name.includes(search);
    const matchZone = isSchoolInZone(s.zone, zoneFilter);
    return matchSearch && matchZone;
  });
  const schoolTransactions = selectedSchool 
    ? transactions.filter(t => t.schoolId === selectedSchool.id)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Migration Alert */}
      {schools.some(s => (s as any).payments && (s as any).payments.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
            <ArrowRightLeft className="w-5 h-5" />
            <span>ငွေသွင်းမှတ်တမ်းဟောင်းများ (Array) ကို တွေ့ရှိပါသည်။ စနစ်အသစ်သို့ ရွှေ့ပြောင်းရန် လိုအပ်ပါသည်။</span>
          </div>
          <button 
            onClick={handleMigrateData} 
            disabled={isMigrating}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition"
          >
            {isMigrating ? 'ရွှေ့ပြောင်းနေပါသည်...' : 'ယခု ရွှေ့ပြောင်းမည် (Migrate)'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side: School Selection & Form */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
              <Coins className="w-5 h-5 text-emerald-600" /> အခြားကြေးများ ကောက်ခံရန်
            </h3>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="ကျောင်းအမည် ရှာရန်..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" /> ဇုန် အလိုက် စစ်ထုတ်ရန်:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ZONE_FILTER_OPTIONS.map(opt => {
                  const count = opt.value === 'all' ? schools.length : schools.filter(s => isSchoolInZone(s.zone, opt.value)).length;
                  return (
                    <button key={opt.value} type="button" onClick={() => setZoneFilter(opt.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 border cursor-pointer ` +
                        (zoneFilter === opt.value ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100')}>
                      <span>{opt.label}</span>
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ` + (zoneFilter === opt.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 border border-slate-200')}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredSchools.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 italic">ကျောင်း မတွေ့ပါ</div>
              ) : filteredSchools.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSchool(s)}
                  className={`p-3 cursor-pointer transition ${selectedSchool?.id === s.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-bold text-sm text-slate-900">{s.name}</p>
                  {s.zone && (<span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"><MapPin className="w-2.5 h-2.5" />{s.zone}</span>)}
                </div>
              ))}
            </div>

            {selectedSchool && (
              <form onSubmit={handleAddPayment} className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 animate-in fade-in">
                <h4 className="font-bold text-sm text-emerald-900 border-b border-emerald-200 pb-2">ကျောင်း: {selectedSchool.name}</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ကြေးအမျိုးအစား</label>
                  <select value={feeType} onChange={e => setFeeType(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white">
                    <option value="နှစ်စဉ်ကြေး (Annual Fee)">နှစ်စဉ်ကြေး (Annual Fee)</option>
                    <option value="အားကစားကြေး (Sports Fee)">အားကစားကြေး (Sports Fee)</option>
                    <option value="သင်တန်းကြေး (Training Fee)">သင်တန်းကြေး (Training Fee)</option>
                    <option value="အခြားကြေး (Other Fee)">အခြားကြေး (Other Fee)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ပမာဏ (ကျပ်)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">မှတ်ချက်</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="(Optional)" className="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> {isSubmitting ? 'မှတ်တမ်းတင်နေပါသည်...' : 'ငွေသွင်းမှု မှတ်တမ်းတင်မည်'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Transaction History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" /> 
              {selectedSchool ? `${selectedSchool.name} ၏ မှတ်တမ်းများ` : 'ကျောင်းတစ်ခုကို ရွေးချယ်ပါ'}
            </h3>
            {selectedSchool && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                စုစုပေါင်း: {schoolTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('my-MM')} ကျပ်
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {!selectedSchool ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                မှတ်တမ်းများ ကြည့်ရန် ဘယ်ဘက်မှ ကျောင်းတစ်ခုကို ရွေးပါ
              </div>
            ) : schoolTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Coins className="w-8 h-8 text-slate-300 mb-2" />
                ငွေသွင်းမှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (
              schoolTransactions.map(t => (
                <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{t.feeType}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{t.paidDate}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-700 font-bold">{t.amount.toLocaleString('my-MM')} ကျပ်</span>
                    </div>
                    {t.note && <p className="text-[11px] text-slate-400 mt-1">({t.note})</p>}
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/receipt/${t.id}`} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="ဖြတ်ပိုင်းထုတ်ရန်">
                      <Printer className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="ဖျက်ရန်">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
