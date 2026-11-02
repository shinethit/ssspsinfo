import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AuditLog } from '../../types';
import { History } from 'lucide-react';

export default function AdminAuditLogsTab() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'bulk_delete'>('all');
  const [auditSortBy, setAuditSortBy] = useState<'newest' | 'oldest'>('newest');

  const fetchAuditLogs = async () => { try { const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setAuditLogs(s.docs.map(d => ({ id: d.id, ...d.data() })) as AuditLog[]); } catch (e) { console.error(e); } };

  useEffect(() => { fetchAuditLogs(); }, []);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(log => {
      const matchesSearch = !q || (log.adminEmail && log.adminEmail.toLowerCase().includes(q)) || (log.entityName && log.entityName.toLowerCase().includes(q)) || (log.details && log.details.toLowerCase().includes(q)) || (log.action && log.action.toLowerCase().includes(q)) || (log.entityType && log.entityType.toLowerCase().includes(q));
      const matchesAction = auditActionFilter === 'all' ? true : log.action === auditActionFilter;
      return matchesSearch && matchesAction;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime(); const timeB = new Date(b.createdAt).getTime();
      return auditSortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [auditLogs, auditSearch, auditActionFilter, auditSortBy]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><History className="w-5 h-5 text-sky-600" /> စနစ်အသုံးပြုမှု မှတ်တမ်းများ ({filteredAuditLogs.length})</h3>
        <div className="flex flex-wrap gap-2">
          <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="မှတ်တမ်း ရှာဖွေရန်..." className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
          <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
            <option value="all">လုပ်ဆောင်ချက် အားလုံး</option>
            <option value="create">အသစ်ထည့်သွင်းမှု (Create)</option>
            <option value="update">ပြင်ဆင်မှု (Update)</option>
            <option value="delete">ဖျက်ပစ်မှု (Delete)</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
        {filteredAuditLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">မှတ်တမ်း မရှိသေးပါ</div>
        ) : (
          filteredAuditLogs.map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-extrabold text-slate-900">{log.entityName || log.entityType}</span>
                <span className="text-slate-600 ml-2">{log.details}</span>
                <p className="text-slate-400 mt-0.5">By: {log.adminEmail}</p>
              </div>
              <span className="text-slate-400 font-medium shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
