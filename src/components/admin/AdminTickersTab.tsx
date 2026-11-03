import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { NewsTicker } from '../../types';
import { Edit2, Megaphone, Trash2 } from 'lucide-react';

interface AdminTickersTabProps {
  tickers: NewsTicker[];
  onRefresh: () => void;
}

export default function AdminTickersTab({ tickers, onRefresh }: AdminTickersTabProps) {
  const [tickerText, setTickerText] = useState('');
  const [tickerPriority, setTickerPriority] = useState<'info' | 'urgent' | 'warning'>('info');
  const [tickerLink, setTickerLink] = useState('');
  const [tickerIsActive, setTickerIsActive] = useState(true);
  const [autoAssignDateTime, setAutoAssignDateTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState('');
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [submittingTicker, setSubmittingTicker] = useState(false);

  const getFormattedDateTime = () => new Date().toLocaleString('en-GB', { hour12: true });

  const onTickerSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tickerText.trim()) return;
    try {
      setSubmittingTicker(true);
      const ddt = autoAssignDateTime ? getFormattedDateTime() : (customDateTime.trim() || getFormattedDateTime());
      if (editingTickerId) {
        await updateDoc(doc(db, 'tickers', editingTickerId), { text: tickerText.trim(), priority: tickerPriority, link: tickerLink.trim(), isActive: tickerIsActive, autoTimestamp: autoAssignDateTime, displayDateTime: ddt, updatedAt: new Date().toISOString() });
        toast.success('စာတန်းပြေး ပြင်ဆင်ပြီးပါပြီ'); setEditingTickerId(null);
      } else {
        await addDoc(collection(db, 'tickers'), { text: tickerText.trim(), priority: tickerPriority, link: tickerLink.trim(), isActive: tickerIsActive, autoTimestamp: autoAssignDateTime, displayDateTime: ddt, createdAt: new Date().toISOString() });
        toast.success('စာတန်းပြေးအသစ် တင်ပြီးပါပြီ');
      }
      setTickerText(''); setTickerLink(''); setTickerPriority('info'); setTickerIsActive(true); setAutoAssignDateTime(true); setCustomDateTime(''); onRefresh();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setSubmittingTicker(false); }
  };
  const toggleTickerStatus = async (t: NewsTicker) => { try { await updateDoc(doc(db, 'tickers', t.id), { isActive: !t.isActive, updatedAt: new Date().toISOString() }); onRefresh(); } catch (e) { toast.error('ပြောင်း၍မရပါ'); } };
  const deleteTicker = async (id: string) => { if (!(await confirmDialog('ဖျက်ရန် သေချာပါသလား?'))) return; try { await deleteDoc(doc(db, 'tickers', id)); toast.success('ဖျက်ပြီးပါပြီ'); onRefresh(); } catch (e) { toast.error('ဖျက်၍မရပါ'); } };
  const startEditTicker = (t: NewsTicker) => { setEditingTickerId(t.id); setTickerText(t.text); setTickerPriority(t.priority || 'info'); setTickerLink(t.link || ''); setTickerIsActive(t.isActive); setAutoAssignDateTime(t.autoTimestamp ?? true); setCustomDateTime(t.displayDateTime || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditTicker = () => { setEditingTickerId(null); setTickerText(''); setTickerLink(''); setTickerPriority('info'); setTickerIsActive(true); setAutoAssignDateTime(true); setCustomDateTime(''); };

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in">
      <div className="lg:col-span-5">
        <form onSubmit={onTickerSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-600" />
            {editingTickerId ? 'စာတန်းပြေး ပြင်ဆင်ရန်' : 'စာတန်းပြေးအသစ် တင်ရန်'}
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">စာတန်းပြေး စာသား *</label>
            <textarea required rows={3} value={tickerText} onChange={e => setTickerText(e.target.value)} placeholder="အရေးကြီး သတင်းစကား..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">အရေးကြီးမှု အဆင့်</label>
              <select value={tickerPriority} onChange={e => setTickerPriority(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                <option value="info">🔵 သာမန် (Info)</option>
                <option value="warning">🟡 သတိပေးချက် (Warning)</option>
                <option value="urgent">🔴 အရေးပေါ် (Urgent)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ချိတ်ဆက်မည့် Link</label>
              <input value={tickerLink} onChange={e => setTickerLink(e.target.value)} placeholder="/announcements..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={tickerIsActive} onChange={e => setTickerIsActive(e.target.checked)} className="w-4 h-4 rounded" />
            ချက်ချင်း ထုတ်လွှင့်မည် (Active)
          </label>
          <div className="flex gap-2">
            {editingTickerId && <button type="button" onClick={cancelEditTicker} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-bold cursor-pointer">Cancel</button>}
            <button type="submit" disabled={submittingTicker} className="flex-1 bg-sky-900 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
              {editingTickerId ? 'ပြင်ဆင်မည်' : 'ထုတ်လွှင့်မည်'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {tickers.length === 0 ? (
            <div className="p-10 text-center text-slate-400">စာတန်းပြေး မရှိသေးပါ</div>
          ) : (
            tickers.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {t.isActive ? 'လွှင့်ထားဆဲ' : 'ပိတ်ထားသည်'}
                    </span>
                    <span className="text-xs text-slate-400">{t.displayDateTime}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{t.text}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleTickerStatus(t)} className="px-2.5 py-1 text-xs font-bold border rounded-lg hover:bg-slate-50 cursor-pointer">
                    {t.isActive ? 'ပိတ်မည်' : 'ဖွင့်မည်'}
                  </button>
                  <button onClick={() => startEditTicker(t)} className="p-2 text-slate-400 hover:text-amber-600 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteTicker(t.id)} className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
