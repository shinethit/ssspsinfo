import React, { useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as secondarySignOut, deleteUser } from 'firebase/auth';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { AdminUser, School } from '../../types';
import { mapFirebaseAuthError } from '../../lib/adminAuth';
import { recordAuditLog } from '../../lib/audit';
import { Trash2, UserCog } from 'lucide-react';

interface AdminAccountsTabProps {
  admins: AdminUser[];
  schools: any[];
  isAdmin: boolean;
  onRefreshAdmins: () => void;
  onCreateSchoolAccount: (school: School) => void;
  // v24.13 (A5): removes the school↔Auth link so a NEW account can be
  // created afterwards. The old Auth account itself can only be deleted
  // in Firebase Console — the client SDK cannot delete another user's
  // Auth account, which is why "re-create" could never succeed before.
  onUnlinkSchoolAccount: (school: School) => void;
}

export default function AdminAccountsTab({ admins, schools, isAdmin, onRefreshAdmins, onCreateSchoolAccount, onUnlinkSchoolAccount }: AdminAccountsTabProps) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'moderator'>('moderator');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [extraAdminUserPhones, setExtraAdminUserPhones] = useState<string[]>([]);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); if (!isAdmin) { toast.error('Admin သာ ခွင့်ပြုချက်ရှိသည်'); return; }
    const ce = newAdminEmail.trim().toLowerCase(); const cp = newAdminPassword.trim();
    if (!ce.includes('@') || cp.length < 6) { toast.error('အီးမေးလ်နှင့် စကားဝှက် (၆ လုံး) စစ်ဆေးပါ'); return; }
    try {
      setAddingAdmin(true);
      const sa = initializeApp(firebaseConfig, 'sa_' + Date.now()); const sau = getAuth(sa);
      let nu = '';
      try {
        const uc = await createUserWithEmailAndPassword(sau, ce, cp); nu = uc.user.uid;
        try {
          await setDoc(doc(db, 'admins', nu), { uid: nu, email: ce, name: newAdminName.trim() || 'အက်ဒမင်', role: newAdminRole, phone: newAdminPhone.trim(), phones: [newAdminPhone.trim(), ...extraAdminUserPhones.map(p => p.trim())].filter(Boolean), note: newAdminNote.trim(), addedBy: auth.currentUser?.email || 'Admin', createdAt: new Date().toISOString() });
          // v24.13 (A6): admin add/remove had no audit log at all.
          await recordAuditLog({ action: 'create', entityType: 'admin', entityId: nu, entityName: ce, details: `Admin အကောင့် ခန့်အပ်ခြင်း (${newAdminRole === 'admin' ? 'Admin' : 'Moderator'})` });
        } catch (docErr) {
          // v24.7: the admins-doc write failed — delete the just-created
          // Auth user while still signed in on the secondary app, so it
          // cannot linger (it could sign in but Login would reject it as
          // not-an-admin).
          try { if (sau.currentUser) await deleteUser(sau.currentUser); } catch { /* rollback failed; report below */ }
          toast.error('Admin မှတ်တမ်း သိမ်း၍မရပါ — အကောင့် ပြန်ဖျက်ပြီးပါပြီ၊ ပြန်စမ်းပါ');
          return;
        }
      } catch (ae: any) { toast.error(mapFirebaseAuthError(ae.code)); return; } finally { try { await secondarySignOut(sau); await deleteApp(sa); } catch {} }
      toast.success('အက်ဒမင် ခန့်အပ်ပြီးပါပြီ'); setNewAdminEmail(''); setNewAdminPassword(''); setNewAdminName(''); setNewAdminPhone(''); setExtraAdminUserPhones([]); setNewAdminNote(''); setNewAdminRole('moderator'); onRefreshAdmins();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setAddingAdmin(false); }
  };
  const handleDeleteAdmin = async (a: AdminUser) => { if (!isAdmin) return; if (a.id === auth.currentUser?.uid) { toast.error('မိမိကိုယ်ကို ဖယ်ရှား၍မရပါ'); return; } if (!(await confirmDialog('ဖယ်ရှားရန် သေချာပါသလား?'))) return; try { await deleteDoc(doc(db, 'admins', a.id)); await recordAuditLog({ action: 'delete', entityType: 'admin', entityId: a.id, entityName: a.email || a.name, details: 'Admin အကောင့် ဖယ်ရှားခြင်း' }); toast.success('ဖယ်ရှားပြီးပါပြီ — Firebase Console > Authentication မှာ အဲဒီ email ရဲ့ အကောင့်ကိုလည်း ဖျက်ပေးပါ (App ထဲကနေ သူများအကောင့်ကို ဖျက်၍မရပါ)'); onRefreshAdmins(); } catch (e) { toast.error('ဖယ်ရှား၍မရပါ'); } };

  // v24.13 (S4): admin can send a password-reset email to a linked school
  // account (the school can also do this itself from SchoolLogin/Portal).
  const handleSendSchoolPasswordReset = async (s: any) => {
    if (!s.accountEmail) { toast.error('ဤကျောင်းတွင် email မရှိပါ'); return; }
    if (!(await confirmDialog(`"${s.name}" ၏ ${s.accountEmail} သို့ စကားဝှက် ပြန်လည်သတ်မှတ်ခြင်း email ပို့ပါမည်။ သေချာပါသလား?`))) return;
    try {
      await sendPasswordResetEmail(auth, s.accountEmail);
      await recordAuditLog({ action: 'update', entityType: 'admin', entityId: s.id, entityName: s.name, details: `ကျောင်း အကောင့် စကားဝှက် ပြန်လည်သတ်မှတ်ခြင်း email ပို့ခြင်း (${s.accountEmail})` });
      toast.success('စကားဝှက် ပြန်လည်သတ်မှတ်ခြင်း email ပို့ပြီးပါပြီ');
    } catch (e) { toast.error('email ပို့၍မရပါ'); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in">
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-600" /> Admin / Moderator အကောင့်သစ်ဖွင့်ရန်
          </h3>
          <form onSubmit={handleAddAdmin} className="space-y-3">
            <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} placeholder="အမည် (ဥပမာ - ဦးအောင်)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Email လိပ်စာ *" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <input type="password" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="Password (အနည်းဆုံး ၆ လုံး) *" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as 'admin' | 'moderator')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none">
              <option value="moderator">Moderator (ကန့်သတ်ခွင့်ပြုချက်)</option>
              <option value="admin">Admin (အခွင့်အရေး အပြည့်အစုံ)</option>
            </select>
            <button type="submit" disabled={addingAdmin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition cursor-pointer">
              {addingAdmin ? 'ဖန်တီးနေပါသည်...' : 'Admin အကောင့် ဖန်တီးမည်'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          <div className="p-4 font-bold text-sm text-slate-900">လက်ရှိ Admin များ ({admins.length})</div>
          {admins.map(a => (
            <div key={a.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-900">{a.name || a.email}</p>
                <p className="text-xs text-slate-500">{a.email} • <span className="uppercase font-bold text-indigo-600">{a.role}</span></p>
              </div>
              {a.id !== auth.currentUser?.uid && (
                <button onClick={() => handleDeleteAdmin(a)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4"/></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col max-h-[650px]">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-lg text-slate-900">ကျောင်း (User) အကောင့်များ ({schools.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">ကျောင်းကိုယ်စားပြု Login ဝင်ရောက်နိုင်မည့် အကောင့်များ</p>
          <p className="text-xs text-slate-500 mt-1">အကောင့်ချိတ်ဆက်မှု ဖြုတ်လိုက်လျှင် အကောင့်အသစ် ထပ်ဖွင့်နိုင်ပါသည် — အကောင့်အဟောင်းကိုယ်တိုင်ကိုတော့ Firebase Console &gt; Authentication တွင် ဖျက်ရပါမည်။</p>
        </div>
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {schools.map(s => (
            <div key={s.id} className="p-4 flex justify-between items-center gap-3 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                {s.authUid || s.accountEmail ? (
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">✓ {s.accountEmail || 'အကောင့်ချိတ်ဆက်ပြီး'}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">အကောင့် မရှိသေးပါ</p>
                )}
              </div>
              {/* v24.13 (A5): "အသစ်ပြန်ဖွင့်မည်" could never succeed — the
                  create path refuses when an account already exists, and
                  the client SDK cannot delete another user's Auth account.
                  A linked school now offers unlinking instead, so a new
                  account can be created afterwards. */}
              <div className="flex items-center gap-1.5 shrink-0">
                {s.authUid && s.accountEmail && (
                  <button onClick={() => handleSendSchoolPasswordReset(s)} title="စကားဝှက် ပြန်လည်သတ်မှတ်ခြင်း email ပို့ရန်" className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                    စကားဝှက် ပြန်ပို့မည်
                  </button>
                )}
                {s.authUid ? (
                  <button onClick={() => onUnlinkSchoolAccount(s)} className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                    ချိတ်ဆက်မှု ဖြုတ်မည်
                  </button>
                ) : (
                  <button onClick={() => onCreateSchoolAccount(s)} className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                    + အကောင့်ဖွင့်မည်
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
