import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Association, NewsTicker, SchoolLevelItem } from '../../types';
import { getCloudinaryConfig, saveCloudinaryConfig } from '../../lib/cloudinary';
import { findRecoverableCache, restoreRecoveredCacheToFirestore, RecoverableCacheData } from '../../lib/cacheRecovery';
import { Cloud, Database, Download, RefreshCw } from 'lucide-react';

interface AdminBackupTabProps {
  schools: any[];
  announcements: any[];
  associations: Association[];
  tickers: NewsTicker[];
  schoolLevels: SchoolLevelItem[];
  onRestoreDone: () => void;
}

export default function AdminBackupTab({ schools, announcements, associations, tickers, schoolLevels, onRestoreDone }: AdminBackupTabProps) {
  const [isExportingBackup, setIsExportingBackup] = useState(false);
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
      const backupObj = {
        exportedAt: new Date().toISOString(),
        schools,
        announcements,
        associations,
        tickers,
        schoolLevels,
      };
      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssspsinfo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Database Backup JSON ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
    } catch (e) {
      toast.error('Backup ထုတ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsExportingBackup(false);
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
      await restoreRecoveredCacheToFirestore(recoverableCache);
      toast.success('Cache မှ ဒေတာများ အောင်မြင်စွာ ပြန်လည်ထည့်သွင်းပြီးပါပြီ');
      setRecoverableCache(null);
      onRestoreDone();
    } catch (e) {
      toast.error('Restore လုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsRestoringCache(false);
    }
  };

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(cloudinaryCloudName, cloudinaryPreset, cloudinaryFolder);
    toast.success('Cloudinary Settings သိမ်းဆည်းပြီးပါပြီ');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><Database className="w-5 h-5 text-sky-600" /> Database Backup & Cache Recovery</h3>
        <p className="text-xs text-slate-500">စနစ်တစ်ခုလုံးရှိ ကျောင်းများ၊ ကြေညာချက်များနှင့် အသင်းအဖွဲ့ ဒေတာအားလုံးကို JSON ဖိုင်အဖြစ် သိမ်းဆည်းထားနိုင်ပါသည်။</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={handleExportFullBackup} disabled={isExportingBackup} className="bg-sky-900 hover:bg-sky-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" /> Full Backup (JSON) ဒေါင်းလုဒ်ဆွဲမည်
          </button>
          <button onClick={handleScanCacheManually} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Local Cache စစ်ဆေးမည်
          </button>
        </div>
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
