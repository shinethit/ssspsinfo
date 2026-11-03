import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { confirmDialog } from '../components/ConfirmModal';
import * as XLSX from 'xlsx';
import { Association, NewsTicker, AdminUser, School } from '../types';
import { useData, sortAnnouncementsByEventDate } from '../context/DataContext';
import { getUnifiedSchoolLevels } from '../lib/schoolLevels';
import {
  FileText, School as SchoolIcon, Building2,
  Megaphone, Calendar, Layers, History, Mail,
  HardDriveDownload, XCircle, Trophy,
  FolderOpen, Coins, UserCog, LayoutDashboard, Images
} from 'lucide-react';
import { createSchoolAccount } from '../lib/schoolAuth';
import { getAdminSession, clearAdminSession, changeAdminPassword, sendAdminPasswordReset, mapFirebaseAuthError } from '../lib/adminAuth';
import { getGlobalAcademicYear } from '../lib/academicYear';
import { recordAnnualFeePayment } from '../lib/finance';
import { recordAuditLog } from '../lib/audit';
import { canAccessTab } from '../lib/roles';
import { normalizeSchoolRow, exportSchoolsToExcel } from '../lib/excel';
import SchoolForm from '../components/admin/SchoolForm';
import AdminSchoolManager from '../components/admin/AdminSchoolManager';
import AdminEventManager from '../components/admin/AdminEventManager';
import AdminFinanceManager from '../components/admin/AdminFinanceManager';
import AdminSportsManager from '../components/admin/AdminSportsManager';
import AdminDocumentManager from '../components/admin/AdminDocumentManager';
import AdminGalleryManager from '../components/admin/AdminGalleryManager';
import AdminRequestsManager from '../components/admin/AdminRequestsManager';
import AdminNavigation, { AdminNavItem } from '../components/admin/AdminNavigation';
import AdminDashboardTab from '../components/admin/AdminDashboardTab';
import AdminAnnouncementsTab from '../components/admin/AdminAnnouncementsTab';
import AdminAssociationsTab from '../components/admin/AdminAssociationsTab';
import AdminLevelsTab from '../components/admin/AdminLevelsTab';
import AdminTickersTab from '../components/admin/AdminTickersTab';
import AdminAccountsTab from '../components/admin/AdminAccountsTab';
import AdminAuditLogsTab from '../components/admin/AdminAuditLogsTab';
import AdminBackupTab from '../components/admin/AdminBackupTab';

export default function Admin() {
  // v24.7: the session is re-read whenever admin auth changes (login,
  // logout, role change). Before, it was read once at mount and fell back
  // to 'moderator', so a refreshed admin page could hide the admin-only
  // tabs until logout/login.
  const [, setAdminSessionTick] = useState(0);
  useEffect(() => {
    const handler = () => setAdminSessionTick((t) => t + 1);
    window.addEventListener('sssps_admin_auth_changed', handler);
    return () => window.removeEventListener('sssps_admin_auth_changed', handler);
  }, []);
  const adminSession = getAdminSession();
  const {
    schools: globalSchools, announcements: globalAnnouncements, schoolLevels,
    addSchool, updateSchool, deleteSchool: deleteSchoolFromContext,
  } = useData();

  // v24.7: honour ?tab=finance (and friends) so links like the Receipt
  // "back to Finance" button land on the right tab instead of Dashboard.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'accounts' | 'levels' | 'backup' | 'events' | 'sports' | 'documents' | 'gallery' | 'finance' | 'requests'>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    const validTabs = ['dashboard', 'announcements', 'associations', 'schools', 'tickers', 'audit_logs', 'accounts', 'levels', 'backup', 'events', 'sports', 'documents', 'gallery', 'finance', 'requests'];
    return (validTabs.includes(t || '') ? t : 'dashboard') as any;
  });

  // Only two roles: 'admin' (full access) and 'moderator'.
  // Legacy roles are already normalized to these two in adminAuth.normalizeRole().
  const role = adminSession?.role || 'moderator';
  const isModOrAdmin = role === 'moderator' || role === 'admin';

  const canAccess: Record<string, boolean> = {
    dashboard: canAccessTab(role, 'dashboard'),
    announcements: canAccessTab(role, 'announcements'),
    associations: canAccessTab(role, 'associations'),
    schools: canAccessTab(role, 'schools'),
    levels: canAccessTab(role, 'levels'),
    tickers: canAccessTab(role, 'tickers'),
    audit_logs: canAccessTab(role, 'audit_logs'),
    accounts: canAccessTab(role, 'accounts'),
    backup: canAccessTab(role, 'backup'),
    events: canAccessTab(role, 'events'),
    sports: canAccessTab(role, 'sports'),
    documents: canAccessTab(role, 'documents'),
    gallery: canAccessTab(role, 'gallery'),
    finance: canAccessTab(role, 'finance'),
    requests: canAccessTab(role, 'requests'),
  };

  useEffect(() => {
    if (canAccess[activeTab] === false) {
      const firstAccessible = Object.keys(canAccess).find(key => canAccess[key]);
      if (firstAccessible) setActiveTab(firstAccessible as any);
    }
  }, [activeTab, role]);

  // Shared data state (tabs receive what they need via props)
  const [schools, setSchools] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [tickers, setTickers] = useState<NewsTicker[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isSchoolFormOpen, setIsSchoolFormOpen] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelUploadState, setExcelUploadState] = useState<any>({ status: 'idle', fileName: '', stageText: '', progressPercent: 0 });

  const [schoolAccountModal, setSchoolAccountModal] = useState<School | null>(null);
  const [schoolAccEmail, setSchoolAccEmail] = useState('');
  const [schoolAccPassword, setSchoolAccPassword] = useState('');
  const [isCreatingSchoolAcc, setIsCreatingSchoolAcc] = useState(false);

  const [isChangingPassModal, setIsChangingPassModal] = useState(false);
  const [targetChangePassEmail, setTargetChangePassEmail] = useState('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [savingNewPassword, setSavingNewPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => { clearAdminSession(); toast.info('အကောင့်မှ ထွက်ပြီးပါပြီ'); navigate('/login'); };

  useEffect(() => { if (globalSchools) setSchools(globalSchools); }, [globalSchools]);
  useEffect(() => { if (globalAnnouncements) setAnnouncements(globalAnnouncements); }, [globalAnnouncements]);

  const unifiedLevels = useMemo(() => getUnifiedSchoolLevels(schoolLevels, schools), [schoolLevels, schools]);

  const fetchAnnouncements = async () => { try { const s = await getDocs(collection(db, 'announcements')); setAnnouncements(sortAnnouncementsByEventDate(s.docs.map(d => ({ id: d.id, ...d.data() })) as any)); } catch (e) { console.error(e); } };
  const fetchAssociations = async () => { try { const s = await getDocs(collection(db, 'associations')); setAssociations(s.docs.map(d => ({ id: d.id, ...d.data() })) as Association[]); } catch (e) { console.error(e); } };
  const fetchSchools = async () => { try { const s = await getDocs(collection(db, 'schools')); setSchools(s.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); } };
  const fetchTickers = async () => { try { const q = query(collection(db, 'tickers'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setTickers(s.docs.map(d => ({ id: d.id, ...d.data() })) as NewsTicker[]); } catch (e) { console.error(e); } };
  const fetchAdmins = async () => { try { const s = await getDocs(collection(db, 'admins')); setAdmins(s.docs.map(d => ({ id: d.id, ...d.data() })) as AdminUser[]); } catch (e) { console.error(e); } };

  useEffect(() => {
    fetchAssociations(); fetchTickers(); fetchAdmins();
  }, []);

  // School Accounts
  const handleCreateSchoolAccount = async (e: React.FormEvent) => {
    e.preventDefault(); if (!schoolAccountModal) return;
    if (!schoolAccEmail || !schoolAccPassword || schoolAccPassword.length < 6) { toast.error('အီးမေးလ်နှင့် စကားဝှက် (၆ လုံး) ဖြည့်စွက်ပါ'); return; }
    try { setIsCreatingSchoolAcc(true); await createSchoolAccount(schoolAccEmail, schoolAccPassword, schoolAccountModal.id); await recordAuditLog({ action: 'create', entityType: 'admin', entityId: schoolAccountModal.id, entityName: schoolAccountModal.name, details: `ကျောင်းအကောင့် ဖွင့်ခြင်း (${schoolAccEmail})` }); toast.success('ကျောင်းအကောင့် ဖန်တီးပြီးပါပြီ'); setSchoolAccountModal(null); setSchoolAccEmail(''); setSchoolAccPassword(''); fetchSchools(); } catch (e: any) { toast.error(mapFirebaseAuthError(e.code || e.message) || 'ဖန်တီး၍မရပါ'); } finally { setIsCreatingSchoolAcc(false); }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (newAdminPasswordInput.trim().length < 6) { toast.error('စကားဝှက် ၆ လုံး ရှိရပါမည်'); return; }
    setSavingNewPassword(true);
    try { const r = await changeAdminPassword(targetChangePassEmail, newAdminPasswordInput.trim()); if (!r.success) { toast.error(r.error || 'ပြောင်း၍မရပါ'); return; } if (r.error) { toast.info(r.error); } else { toast.success('ပြောင်းပြီးပါပြီ'); } setIsChangingPassModal(false); setNewAdminPasswordInput(''); } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setSavingNewPassword(false); }
  };
  const handleSendResetEmailFromModal = async () => {
    if (!targetChangePassEmail) return; setIsSendingResetEmail(true);
    try { const r = await sendAdminPasswordReset(targetChangePassEmail); if (r.success) { toast.success('Reset လင့်ခ် ပို့ပြီးပါပြီ'); setIsChangingPassModal(false); } else { toast.error(r.error || 'ပို့၍မရပါ'); } } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setIsSendingResetEmail(false); }
  };

  // School Handlers
  const startEditSchool = (s: any) => { setEditingSchoolId(s.id); setIsSchoolFormOpen(true); };
  const cancelEditSchool = () => { setEditingSchoolId(null); setIsSchoolFormOpen(false); };

  const onSchoolSubmit = async (data: any) => {
    try {
      const rawCount = (data.studentCount !== undefined && data.studentCount !== '' && data.studentCount !== null) ? Number(String(data.studentCount).replace(/[^0-9]/g, '')) : null;
      const cleanStudentCount = (rawCount !== null && !isNaN(rawCount)) ? rawCount : null;
      const rawFee = (data.feeAmount !== undefined && data.feeAmount !== '' && data.feeAmount !== null) ? Number(String(data.feeAmount).replace(/[^0-9]/g, '')) : null;
      // v24.7: no invented fee — when no amount is given the fee stays
      // empty instead of silently becoming the tier default / 200,000.
      const cleanFeeAmount = (rawFee !== null && !isNaN(rawFee)) ? rawFee : null;
      const payload = {
        ...data,
        address: data.address?.trim() || '', township: data.township?.trim() || '', city: data.city?.trim() || '', zone: data.zone?.trim() || '',
        schoolPhone: data.schoolPhone?.trim() || '', schoolPhone2: data.schoolPhone2?.trim() || '', schoolPhones: Array.isArray(data.schoolPhones) ? data.schoolPhones : [],
        founderName: data.founderName?.trim() || '', founderPhone: data.founderPhone?.trim() || '', founderPhone2: data.founderPhone2?.trim() || '', founderPhones: Array.isArray(data.founderPhones) ? data.founderPhones : [], founderViber: data.founderViber?.trim() || '', founderTelegram: data.founderTelegram?.trim() || '',
        adminName: data.adminName?.trim() || '', adminPhone: data.adminPhone?.trim() || '', adminPhone2: data.adminPhone2?.trim() || '', adminPhones: Array.isArray(data.adminPhones) ? data.adminPhones : [], adminViber: data.adminViber?.trim() || '', adminTelegram: data.adminTelegram?.trim() || '',
        responsiblePerson1Name: data.contactName?.trim() || '', responsiblePerson1Role: data.contactRole?.trim() || '', responsiblePerson1Phone: data.contactPhone?.trim() || '', responsiblePerson1Phone2: data.contactPhone2?.trim() || '', responsiblePerson1Phones: Array.isArray(data.contactPhones) ? data.contactPhones : [], responsiblePerson1Viber: data.contactViber?.trim() || '', responsiblePerson1Telegram: data.contactTelegram?.trim() || '',
        contactName: data.contactName?.trim() || '', contactRole: data.contactRole?.trim() || '', contactPhone: data.contactPhone?.trim() || '', contactPhone2: data.contactPhone2?.trim() || '', contactPhones: Array.isArray(data.contactPhones) ? data.contactPhones : [], contactViber: data.contactViber?.trim() || '', contactTelegram: data.contactTelegram?.trim() || '',
        responsiblePerson2Name: data.contact2Name?.trim() || '', responsiblePerson2Role: data.contact2Role?.trim() || '', responsiblePerson2Phone: data.contact2Phone?.trim() || '', responsiblePerson2Phone2: data.contact2Phone2?.trim() || '', responsiblePerson2Phones: Array.isArray(data.contact2Phones) ? data.contact2Phones : [], responsiblePerson2Viber: data.contact2Viber?.trim() || '', responsiblePerson2Telegram: data.contact2Telegram?.trim() || '',
        contact2Name: data.contact2Name?.trim() || '', contact2Role: data.contact2Role?.trim() || '', contact2Phone: data.contact2Phone?.trim() || '', contact2Phone2: data.contact2Phone2?.trim() || '', contact2Phones: Array.isArray(data.contact2Phones) ? data.contact2Phones : [], contact2Viber: data.contact2Viber?.trim() || '', contact2Telegram: data.contact2Telegram?.trim() || '',
        otherContacts: Array.isArray(data.otherContacts) ? data.otherContacts : [],
        studentRange: data.studentRange || '0-100', studentCount: cleanStudentCount, feeAmount: cleanFeeAmount, feeAcademicYear: data.feeAcademicYear || getGlobalAcademicYear(), feePaidDate: data.feePaidDate || '',
      };
      if (editingSchoolId) {
        await updateSchool(editingSchoolId, payload);
        await recordAuditLog({ action: 'update', entityType: 'school', entityId: editingSchoolId, entityName: data.name, details: 'ကျောင်းအချက်အလက် ပြင်ဆင်ခြင်း' });
        toast.success('ကျောင်းအချက်အလက် "' + data.name + '" ကို ပြင်ဆင်ပြီးပါပြီ');
      } else {
        const newId = await addSchool(payload);
        await recordAuditLog({ action: 'create', entityType: 'school', entityId: newId, entityName: data.name, details: 'ကျောင်းအသစ် ထည့်သွင်းခြင်း' });
        toast.success('ကျောင်းအသစ် "' + data.name + '" ကို ထည့်သွင်းပြီးပါပြီ');
      }
      cancelEditSchool(); fetchSchools();
    } catch (err) { toast.error('ကျောင်းအချက်အလက် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်'); }
  };

  const deleteSchool = async (id: string, name?: string) => {
    if (!(await confirmDialog(`"${name || 'ဤကျောင်း'}" ကို ဖျက်ရန် သေချာပါသလား?`))) return;
    try { await deleteSchoolFromContext(id); await recordAuditLog({ action: 'delete', entityType: 'school', entityId: id, entityName: name, details: 'ကျောင်း ဖျက်ခြင်း' }); toast.success('ဖျက်ပြီးပါပြီ'); fetchSchools(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  const handleToggleSchoolFee = async (school: School) => {
    if (school.isAnnualFeePaid && !(await confirmDialog(`"${school.name}" ၏ နှစ်စဉ်ကြေးပေးသွင်းပြီးမှုကို ပယ်ဖျက်မည်လား?`))) return;
    try {
      if (!school.isAnnualFeePaid) {
        // v24.7: marking paid now records the payment properly — one
        // transaction + the flag, via the shared write path.
        const amount = Number(school.feeAmount) || 0;
        if (!amount || amount <= 0) { toast.error('ဤကျောင်း၏ နှစ်စဉ်ကြေး ပမာဏ မရှိသေးပါ — ကျောင်းအချက်အလက်တွင် ပမာဏ ထည့်ပြီးမှ အမှတ်အသားလုပ်ပါ'); return; }
        const { voucherNo } = await recordAnnualFeePayment({ school, amount, paidDate: new Date().toISOString().split('T')[0], academicYear: school.feeAcademicYear || getGlobalAcademicYear() });
        await recordAuditLog({ action: 'create', entityType: 'transaction', entityId: school.id, entityName: school.name, details: `နှစ်စဉ်ကြေး ${amount.toLocaleString('my-MM')} ကျပ် ပေးပြီးအဖြစ် အမှတ်အသားလုပ်ခြင်း (${voucherNo})` });
      } else {
        // Un-marking only clears the flag. The transaction record stays in
        // Finance (money history is never silently deleted) — delete it
        // there if the payment was recorded by mistake.
        await updateDoc(doc(db, 'schools', school.id), { isAnnualFeePaid: false, updatedAt: new Date().toISOString() });
        await recordAuditLog({ action: 'update', entityType: 'school', entityId: school.id, entityName: school.name, details: 'နှစ်စဉ်ကြေး ပေးပြီးအမှတ် ပယ်ဖျက်ခြင်း (ငွေသွင်းမှတ်တမ်းကိုတော့ Finance တွင် ဆက်ထားပါသည်)' });
      }
      toast.success('နှစ်စဉ်ကြေးအခြေအနေ ပြောင်းလဲပြီးပါပြီ');
      fetchSchools();
    } catch (e) { toast.error('ပြောင်းလဲ၍မရပါ'); }
  };

  const handleUpdateSchoolStatus = async (school: School, status: 'active' | 'under_review' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'schools', school.id), { status, updatedAt: new Date().toISOString() });
      toast.success('ကျောင်းအခြေအနေ ပြောင်းလဲပြီးပါပြီ');
      fetchSchools();
    } catch (e) { toast.error('ပြောင်းလဲ၍မရပါ'); }
  };

  const handleCleanDuplicateSchools = async () => {
    if (!(await confirmDialog('အမည် + မြို့နယ် တူသော ထပ်နေသော ကျောင်းများကို ရှာဖွေရှင်းလင်းမည်လား?'))) return;
    // v24.7: the dedup key is now name + township (+ zone) — before, two
    // different schools sharing only a name could lose one. Each delete is
    // guarded so one failure no longer aborts the whole cleanup silently.
    const seen = new Map<string, any>();
    let removed = 0;
    const failed: string[] = [];
    for (const s of schools) {
      const key = [(s.name || '').trim().toLowerCase(), (s.township || '').trim().toLowerCase(), (s.zone || '').trim().toLowerCase()].join('|');
      if (!key.replace(/\|/g, '')) continue;
      if (seen.has(key)) {
        try {
          await deleteSchoolFromContext(s.id);
          removed++;
        } catch (e) {
          failed.push(s.name || s.id);
        }
      } else {
        seen.set(key, s);
      }
    }
    if (removed > 0) await recordAuditLog({ action: 'bulk_delete', entityType: 'school', details: `ထပ်နေသော ကျောင်း (${removed}) ခု ရှင်းလင်းခြင်း` });
    if (failed.length > 0) {
      toast.error(`ထပ်နေသော ကျောင်း (${removed}) ခု ရှင်းပြီး၊ (${failed.length}) ခု ဖျက်၍မရပါ: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}`);
    } else {
      toast.success(`ထပ်နေသော ကျောင်း (${removed}) ခုကို ရှင်းလင်းပြီးပါပြီ`);
    }
    fetchSchools();
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingExcel(true);
      setExcelUploadState({ status: 'reading', fileName: file.name, stageText: 'Excel ဖိုင်ဖတ်နေပါသည်...', progressPercent: 25 });
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      // v24.7: re-uploading the same file used to create duplicate schools,
      // and one bad row failed the whole import with only a generic error.
      // Now duplicates (same name + township) are skipped, each row is
      // guarded, and the summary says exactly what happened.
      const existingKeys = new Set(schools.map(s => [(s.name || '').trim().toLowerCase(), (s.township || '').trim().toLowerCase()].join('|')));
      let count = 0;
      let skipped = 0;
      const failedRows: number[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const normalized = normalizeSchoolRow(row);
          if (!normalized || !normalized.name) { skipped++; continue; }
          const key = [(normalized.name || '').trim().toLowerCase(), (normalized.township || '').trim().toLowerCase()].join('|');
          if (existingKeys.has(key)) { skipped++; continue; }
          await addSchool(normalized);
          existingKeys.add(key);
          count++;
          setExcelUploadState({ status: 'uploading', fileName: file.name, stageText: `ကျောင်းများ ထည့်သွင်းနေသည် (${count}/${rows.length})...`, progressPercent: Math.round((count / rows.length) * 100) });
        } catch (err) {
          failedRows.push(i + 2); // +1 header row, +1 for 1-based numbering
        }
      }
      if (count > 0) await recordAuditLog({ action: 'create', entityType: 'school', details: `Excel မှ ကျောင်း (${count}) ကျောင်း တင်သွင်းခြင်း (${file.name})` });
      if (failedRows.length > 0) {
        toast.error(`Excel တင်သွင်းခြင်း — (${count}) ကျောင်း အောင်မြင်ပြီး၊ (${skipped}) ခု ကျော်ပြီး၊ (${failedRows.length}) တန်း မအောင်မြင်ပါ (အတန်း: ${failedRows.slice(0, 5).join(', ')}${failedRows.length > 5 ? '…' : ''})`);
      } else {
        toast.success(`Excel မှ ကျောင်းပေါင်း (${count}) ကျောင်း အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ${skipped > 0 ? ` (ထပ်နေသော ${skipped} ခု ကျော်ထားပါသည်)` : ''}`);
      }
      fetchSchools();
    } catch (err) {
      toast.error('Excel တင်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsUploadingExcel(false);
      e.target.value = '';
    }
  };

  const navItems: AdminNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'schools', label: 'ကျောင်းများ', icon: SchoolIcon, show: canAccess.schools },
    { id: 'announcements', label: 'ကြေညာချက်များ', icon: FileText, show: canAccess.announcements },
    { id: 'associations', label: 'အသင်းအဖွဲ့များ', icon: Building2, show: canAccess.associations },
    { id: 'levels', label: 'ကျောင်းအဆင့်များ', icon: Layers, show: canAccess.levels },
    { id: 'tickers', label: 'စာတန်းပြေး (Ticker)', icon: Megaphone, show: canAccess.tickers },
    { id: 'events', label: 'ပွဲစဉ်များ (Events)', icon: Calendar, show: canAccess.events },
    { id: 'sports', label: 'အားကစားပြိုင်ပွဲ', icon: Trophy, show: canAccess.sports },
    { id: 'documents', label: 'စာရွက်စာတမ်းများ', icon: FolderOpen, show: canAccess.documents },
    { id: 'gallery', label: 'ဓာတ်ပုံများ (Gallery)', icon: Images, show: canAccess.gallery },
    { id: 'finance', label: 'ငွေစာရင်း (Finance)', icon: Coins, show: canAccess.finance },
    { id: 'requests', label: 'တောင်းဆိုမှုများ', icon: Mail, show: true },
    { id: 'accounts', label: 'အကောင့် စီမံခန့်ခွဲမှု', icon: UserCog, show: canAccess.accounts },
    { id: 'audit_logs', label: 'မှတ်တမ်း (Audit Logs)', icon: History, show: canAccess.audit_logs },
    { id: 'backup', label: 'Backup & Cloud', icon: HardDriveDownload, show: canAccess.backup },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100/70">
      <AdminNavigation
        navItems={navItems}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        role={role}
        email={adminSession.email || ''}
        onChangePassword={() => { setTargetChangePassEmail(adminSession.email || ''); setIsChangingPassModal(true); }}
        onLogout={handleLogout}
      />

      {/* Main Content Area — v24.11: NO overflow-y-auto here. It made the admin
          content scroll inside its own inner box, separately from the page,
          while the sticky Admin Console bar sits outside that box — so the
          banner/form titles slid up and were cut off at the bar's edge
          instead of the bar sticking. The whole page scrolls as one now. */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <AdminDashboardTab
                schools={schools}
                announcements={announcements}
                tickers={tickers}
                associations={associations}
                admins={admins}
                onAddSchool={() => { setEditingSchoolId(null); setIsSchoolFormOpen(true); }}
                onGoToTab={(tab) => setActiveTab(tab as any)}
              />
            )}

            {/* TAB 2: SCHOOLS */}
            {activeTab === 'schools' && (
              <div className="space-y-4">
              <AdminSchoolManager
                role={role}
                canDelete={isModOrAdmin}
                schools={schools}
                schoolLevels={schoolLevels}
                onEdit={startEditSchool}
                onDelete={deleteSchool}
                onToggleFee={handleToggleSchoolFee}
                onUpdateStatus={handleUpdateSchoolStatus}
                onCreateAccount={(s) => setSchoolAccountModal(s)}
                onOpenExcel={() => { setEditingSchoolId(null); setIsSchoolFormOpen(true); }}
                onExportExcel={() => exportSchoolsToExcel(schools)}
                onCleanDuplicates={handleCleanDuplicateSchools}
                onExcelUpload={handleExcelUpload}
                isUploadingExcel={isUploadingExcel}
                excelUploadState={excelUploadState}
              />
              </div>
            )}

            {/* TAB 3: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <AdminAnnouncementsTab announcements={announcements} onRefresh={fetchAnnouncements} />
            )}

            {/* TAB 4: ASSOCIATIONS */}
            {activeTab === 'associations' && (
              <AdminAssociationsTab associations={associations} onRefresh={fetchAssociations} />
            )}

            {/* TAB 5: SCHOOL LEVELS */}
            {activeTab === 'levels' && (
              <AdminLevelsTab unifiedLevels={unifiedLevels} />
            )}

            {/* TAB 6: TICKERS */}
            {activeTab === 'tickers' && (
              <AdminTickersTab tickers={tickers} onRefresh={fetchTickers} />
            )}

            {/* TAB 7: ACCOUNTS */}
            {activeTab === 'accounts' && (
              <AdminAccountsTab
                admins={admins}
                schools={schools}
                isAdmin={role === 'admin'}
                onRefreshAdmins={fetchAdmins}
                onCreateSchoolAccount={(s) => setSchoolAccountModal(s)}
              />
            )}

            {/* TAB 8: AUDIT LOGS */}
            {activeTab === 'audit_logs' && (
              <AdminAuditLogsTab />
            )}

            {/* TAB 9: BACKUP & CLOUD */}
            {activeTab === 'backup' && (
              <AdminBackupTab
                schools={schools}
                announcements={announcements}
                associations={associations}
                tickers={tickers}
                schoolLevels={schoolLevels}
                onRestoreDone={() => { fetchSchools(); fetchAnnouncements(); }}
              />
            )}

            {/* OTHER MODULAR TABS */}
            {activeTab === 'events' && <AdminEventManager />}
            {activeTab === 'sports' && <AdminSportsManager schools={schools} />}
            {activeTab === 'documents' && <AdminDocumentManager />}
            {activeTab === 'gallery' && <AdminGalleryManager />}
            {activeTab === 'finance' && <AdminFinanceManager schools={schools} />}
            {activeTab === 'requests' && <AdminRequestsManager />}
          </div>
        </main>
      </div>

      {/* Modal: Create School Account */}
      {schoolAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">ကျောင်း အကောင့်ဖွင့်ရန်</h3>
            <p className="text-xs font-bold text-sky-700 mb-4">{schoolAccountModal.name}</p>
            <form onSubmit={handleCreateSchoolAccount} className="space-y-3">
              <input type="email" required value={schoolAccEmail} onChange={e => setSchoolAccEmail(e.target.value)} placeholder="ကျောင်း Email ထည့်ပါ" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
              <input type="text" required value={schoolAccPassword} onChange={e => setSchoolAccPassword(e.target.value)} placeholder="Password (အနည်းဆုံး ၆ လုံး)" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSchoolAccountModal(null)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-bold cursor-pointer">မလုပ်တော့ပါ</button>
                <button type="submit" disabled={isCreatingSchoolAcc} className="flex-1 bg-sky-900 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                  {isCreatingSchoolAcc ? 'ဖွင့်နေသည်...' : 'အကောင့်ဖွင့်မည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Admin Password */}
      {isChangingPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">စကားဝှက် ပြောင်းလဲရန်</h3>
            <form onSubmit={handleSaveNewPassword} className="space-y-3">
              <input type="password" required value={newAdminPasswordInput} onChange={e => setNewAdminPasswordInput(e.target.value)} placeholder="စကားဝှက်အသစ် (အနည်းဆုံး ၆ လုံး)" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsChangingPassModal(false)} className="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingNewPassword} className="flex-1 bg-sky-900 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">သိမ်းဆည်းမည်</button>
              </div>
            </form>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-xs text-slate-500">Email ဖြင့် Reset လုပ်လိုပါသလား?</span>
              <button type="button" onClick={handleSendResetEmailFromModal} disabled={isSendingResetEmail} className="text-xs font-bold text-sky-700 hover:underline cursor-pointer">
                Reset Link ပို့မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: School Form */}
      {isSchoolFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto">
            <div className="flex justify-end mb-2">
              <button onClick={() => setIsSchoolFormOpen(false)} className="bg-white px-4 py-2 rounded-xl font-bold shadow-md flex items-center gap-1.5 text-sm cursor-pointer">
                <XCircle className="w-5 h-5 text-rose-500" /> ပိတ်မည်
              </button>
            </div>
            <SchoolForm
              initialData={editingSchoolId ? schools.find(s => s.id === editingSchoolId) : undefined}
              isEditing={!!editingSchoolId}
              onCancel={() => setIsSchoolFormOpen(false)}
              onSubmit={async (data) => { await onSchoolSubmit(data); setIsSchoolFormOpen(false); }}
              schoolLevels={schoolLevels}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      )}
    </div>
  );
}
