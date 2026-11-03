import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Association, NewsTicker, SchoolLevelItem } from '../../types';
import { getCloudinaryConfig, saveCloudinaryConfig } from '../../lib/cloudinary';
import { findRecoverableCache, restoreRecoveredCacheToFirestore, RecoverableCacheData } from '../../lib/cacheRecovery';
import { recordAuditLog } from '../../lib/audit';
import { confirmDialog } from '../../components/ConfirmModal';
import { Cloud, Database, Download, RefreshCw, Upload } from 'lucide-react';

interface AdminBackupTabProps {
  schools: any[];
  announcements: any[];
  associations: Association[];
  tickers: NewsTicker[];
  schoolLevels: SchoolLevelItem[];
  onRestoreDone: () => void;
}

// v24.13 (F8): every Firestore collection the app reads or writes, by its
// real collection name. The old "Full Backup" exported only 5 of these
// (from in-memory props) and could not be restored at all.
const BACKUP_COLLECTIONS = [
  'schools',
  'announcements',
  'associations',
  'tickers',
  'school_levels',
  'transactions',
  'events',
  'sports_events',
  'athletes',
  'documents',
  'gallery',
  'messages',
  'event_registrations',
  'school_update_requests',
  'audit_logs',
  'admins',
  // v24.15 (V19): sport_info was missing — a backup/restore cycle silently
  // lost all sports-info content (AdminSportInfoManager writes it,
  // Sports.tsx reads it). 17 collections total now.
  'sport_info',
] as const;

export default function AdminBackupTab({ schools, announcements, associations, tickers, schoolLevels, onRestoreDone }: AdminBackupTabProps) {
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreReport, setRestoreReport] = useState<{ counts: Record<string, number>; errors: string[] } | null>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const [recoverableCache, setRecoverableCache] = useState<RecoverableCacheData | null>(null);
  const [isRestoringCache, setIsRestoringCache] = useState(false);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => getCloudinaryConfig().cloudName);
  const [cloudinaryPreset, setCloudinaryPreset] = useState(() => getCloudinaryConfig().uploadPreset);
  const [cloudinaryFolder, setCloudinaryFolder] = useState(() => getCloudinaryConfig().folder || 'ssspsinfo');

  useEffect(() => {
    const f = findRecoverableCache(); if (f) setRecoverableCache(f);
  }, []);

  const handleExportFullBackup = async () => {
    try {
      setIsExportingBackup(true);
      // v24.13 (F8): fetch every collection fresh from Firestore — the old
      // export used only the in-memory props (5 collections, stale data).
      const collections: Record<string, any[]> = {};
      await Promise.all(BACKUP_COLLECTIONS.map(async (name) => {
        const snap = await getDocs(collection(db, name));
        collections[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }));
      const total = Object.values(collections).reduce((sum, docs) => sum + docs.length, 0);
      const backupObj = {
        app: 'ssspsinfo',
        exportedAt: new Date().toISOString(),
        collections,
      };
      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssspsinfo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const summary = BACKUP_COLLECTIONS.map(n => `${n}: ${collections[n].length}`).join(', ');
      await recordAuditLog({ action: 'create', entityType: 'school', entityName: 'Database Backup', details: `Full Backup JSON ထုတ်ယူခြင်း — စုစုပေါင်း ${total} ခု (${summary})` });
      toast.success(`Database Backup JSON ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ (စုစုပေါင်း ${total} ခု)`);
    } catch (e) {
      console.error(e);
      toast.error('Backup ထုတ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error('JSON ဖိုင် ဖတ်၍ မရပါ — ဖိုင်မှန်ကန်မှု စစ်ဆေးပါ');
      return;
    }
    // New format: { collections: { <name>: [{ id, ... }] } }. Legacy
    // pre-v24.13 exports kept the arrays at the top level instead.
    const collections = (parsed && typeof parsed === 'object' && parsed.collections && typeof parsed.collections === 'object')
      ? parsed.collections
      : parsed;
    const present = BACKUP_COLLECTIONS.filter(n => Array.isArray((collections as any)?.[n]));
    if (present.length === 0) {
      toast.error('Backup ဖိုင်တွင် ပြန်သွင်းနိုင်သော collection မတွေ့ပါ');
      return;
    }
    if (!(await confirmDialog(`Backup ဖိုင်မှ (${present.join(', ')}) တို့ကို Firestore သို့ ပြန်သွင်းပါမည်။ ဖိုင်ထဲရှိ မှတ်တမ်းများက ရှိပြီးသား မှတ်တမ်းများကို အစားထိုးပါမည်။ သေချာပါသလား?`))) return;
    try {
      setIsRestoringBackup(true);
      setRestoreReport(null);
      const counts: Record<string, number> = {};
      const errors: string[] = [];
      // v24.15 (V23): counts report only FLUSHED (actually written) docs,
      // never queued ones. Each flush is caught per chunk: a failed chunk
      // is recorded (which collection + how many docs), the rest of the
      // restore continues, and the report says exactly what was and
      // wasn't restored. onRestoreDone is called even on partial failure
      // (see finally).
      let batch = writeBatch(db);
      let ops = 0;
      // Docs queued since the last flush, per collection, so a failed
      // flush can be attributed honestly.
      const pendingByCollection = new Map<string, number>();
      const flush = async () => {
        if (ops === 0) return;
        const toCommit = batch;
        const pendingNow = new Map(pendingByCollection);
        batch = writeBatch(db);
        ops = 0;
        pendingByCollection.clear();
        try {
          await toCommit.commit();
        } catch (err) {
          for (const [name, n] of pendingNow) {
            errors.push(`${name}: မှတ်တမ်း (${n}) ခု သိမ်းဆည်း၍ မရပါ (flush မအောင်မြင်ပါ)`);
          }
          console.error('Backup restore chunk failed:', err);
          return;
        }
        for (const [name, n] of pendingNow) counts[name] = (counts[name] || 0) + n;
      };
      for (const name of present) {
        counts[name] = counts[name] || 0;
        for (const rawDoc of (collections as any)[name] as any[]) {
          try {
            if (!rawDoc || typeof rawDoc !== 'object' || !rawDoc.id) { errors.push(`${name}: id မရှိသော မှတ်တမ်း ၁ ခု ကျော်ခြင်း`); continue; }
            const { id, ...data } = rawDoc;
            batch.set(doc(db, name, String(id)), data);
            ops++;
            pendingByCollection.set(name, (pendingByCollection.get(name) || 0) + 1);
            if (ops >= 450) await flush();
          } catch (err) {
            errors.push(`${name}: မှတ်တမ်း ၁ ခု သွင်း၍ မရပါ`);
          }
        }
      }
      await flush();
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      const summary = present.map(n => `${n}: ${counts[n]}`).join(', ');
      setRestoreReport({ counts, errors });
      await recordAuditLog({ action: 'create', entityType: 'school', entityName: 'Database Backup', details: `Backup JSON ပြန်သွင်းခြင်း (${file.name}) — အမှန်တကယ် သိမ်းဆည်းပြီး ${total} ခု (${summary})${errors.length > 0 ? `၊ အမှား ${errors.length} ခု: ${errors.slice(0, 3).join('; ')}` : ''}` });
      if (errors.length > 0) {
        // v24.15 (V23): partial failure is reported honestly — how many
        // were actually written vs how many failed — not as a total failure.
        toast.error(`Backup တစ်စိတ်တစ်ပိုင်း ပြန်သွင်းပြီး — (${total}) ခု အောင်မြင်ပြီး၊ အမှား (${errors.length}) ခု ရှိပါသည်။ အောက်ပါ အကျဉ်းချုပ်တွင် အသေးစိတ် ကြည့်ပါ`);
      } else {
        toast.success(`Backup ပြန်သွင်းပြီးပါပြီ — စုစုပေါင်း (${total}) ခု (${summary})`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Restore လုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsRestoringBackup(false);
      // v24.15 (V23): refresh the parent data even on partial failure —
      // some collections were restored and the UI must show them.
      onRestoreDone();
    }
  };

  const handleScanCacheManually = () => {
    const f = findRecoverableCache();
    if (f) { setRecoverableCache(f); toast.success('Browser Cache မှ ပြန်ယူနိုင်သော ဒေတာတွေ့ရှိပါသည်'); }
    else { toast.info('Recover လုပ်နိုင်သော Cache မတွေ့ပါ'); }
  };

  const handleRestoreFromCache = async () => {
    if (!recoverableCache) return;
    try {
      setIsRestoringCache(true);
      // v24.13 (F8): show the returned counts — the old toast claimed
      // success without saying what actually came back.
      const counts = await restoreRecoveredCacheToFirestore(recoverableCache);
      await recordAuditLog({ action: 'create', entityType: 'school', entityName: 'Cache Recovery', details: `Browser Cache မှ ပြန်သွင်းခြင်း — ကျောင်း ${counts.schoolsRestored} ခု၊ ကြေညာချက် ${counts.announcementsRestored} ခု၊ အသင်းအဖွဲ့ ${counts.associationsRestored} ခု` });
      toast.success(`Cache မှ ဒေတာများ ပြန်လည်ထည့်သွင်းပြီးပါပြီ — ကျောင်း (${counts.schoolsRestored}) ခု၊ ကြေညာချက် (${counts.announcementsRestored}) ခု၊ အသင်းအဖွဲ့ (${counts.associationsRestored}) ခု`);
      setRecoverableCache(null);
      onRestoreDone();
    } catch (e) {
      // v24.15 re-audit (F8): a partial failure used to show only the
      // generic error — the real message (with counts) was swallowed.
      toast.error(`Restore လုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်${e instanceof Error && e.message ? ` — ${e.message}` : ''}`);
    } finally {
      setIsRestoringCache(false);
    }
  };

  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(cloudinaryCloudName, cloudinaryPreset, cloudinaryFolder);
    // v24.13 (F8): settings saves are audit-logged (the save itself is
    // localStorage, so a logging failure must not block the toast).
    try {
      await recordAuditLog({ action: 'update', entityType: 'admin', entityName: 'Cloudinary Settings', details: 'Cloudinary Settings သိမ်းဆည်းခြင်း' });
    } catch {
      // Audit logging must never block the save confirmation.
    }
    toast.success('Cloudinary Settings သိမ်းဆည်းပြီးပါပြီ');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><Database className="w-5 h-5 text-sky-600" /> Database Backup & Cache Recovery</h3>
        <p className="text-xs text-slate-500">စနစ်တစ်ခုလုံးရှိ ကျောင်းများ၊ ကြေညာချက်များနှင့် အသင်းအဖွဲ့ ဒေတာအားလုံးကို JSON ဖိုင်အဖြစ် သိမ်းဆည်းထားနိုင်ပါသည်။</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={handleExportFullBackup} disabled={isExportingBackup} className="bg-sky-900 hover:bg-sky-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <Download className="w-4 h-4" /> {isExportingBackup ? 'ထုတ်ယူနေပါသည်...' : 'Full Backup (JSON) ဒေါင်းလုဒ်ဆွဲမည်'}
          </button>
          <button onClick={() => restoreFileRef.current?.click()} disabled={isRestoringBackup} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <Upload className="w-4 h-4" /> {isRestoringBackup ? 'ပြန်သွင်းနေပါသည်...' : 'Backup JSON ဖြင့် ပြန်သွင်းမည်'}
          </button>
          <input ref={restoreFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleRestoreBackupFile} />
          <button onClick={handleScanCacheManually} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Local Cache စစ်ဆေးမည်
          </button>
        </div>
        {restoreReport && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <p className="text-xs font-bold text-emerald-900">ပြန်သွင်းမှု အကျဉ်းချုပ်</p>
            {Object.entries(restoreReport.counts).map(([name, n]) => (
              <p key={name} className="text-xs text-emerald-800">{name}: {n} ခု</p>
            ))}
            {restoreReport.errors.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-bold text-rose-700">အမှားများ ({restoreReport.errors.length} ခု):</p>
                {restoreReport.errors.slice(0, 5).map((err, idx) => (
                  <p key={idx} className="text-xs text-rose-600">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {recoverableCache && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-amber-900">ပြန်လည်ရယူနိုင်သော Cache ဒေတာ တွေ့ရှိပါသည်!</p>
            <button onClick={handleRestoreFromCache} disabled={isRestoringCache} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
              {isRestoringCache ? 'Restore လုပ်နေသည်...' : 'Firestore သို့ ပြန်သွင်းမည်'}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveCloudinary} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><Cloud className="w-5 h-5 text-sky-600" /> Cloudinary Image Hosting</h3>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Cloud Name</label>
          <input value={cloudinaryCloudName} onChange={e => setCloudinaryCloudName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Upload Preset (Unsigned)</label>
          <input value={cloudinaryPreset} onChange={e => setCloudinaryPreset(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Folder Name</label>
          <input value={cloudinaryFolder} onChange={e => setCloudinaryFolder(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
        </div>
        <button type="submit" className="bg-sky-900 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
          Cloudinary Settings သိမ်းဆည်းမည်
        </button>
      </form>
    </div>
  );
}
