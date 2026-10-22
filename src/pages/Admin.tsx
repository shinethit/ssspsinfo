import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, writeBatch, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ANNOUNCEMENT_CATEGORIES, getCategoryBadge } from './Announcements';
import { Association, NewsTicker, AuditLog, AdminUser, getStudentRangeTier, SchoolLevelItem, School } from '../types';
import { recordAuditLog } from '../lib/audit';
import { useData, sortAnnouncementsByEventDate } from '../context/DataContext';
import { getUnifiedSchoolLevels } from '../lib/schoolLevels';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../constants';
import { 
  FileText, School as SchoolIcon, Plus, Trash2, Calendar, Download, Upload, Building2, 
  UserPlus, Users, Megaphone, Clock, AlertCircle, Edit2, RefreshCw, Link as LinkIcon, 
  CheckCircle2, XCircle, Layers, Search, Shield, Activity, History, Mail, ShieldCheck, 
  HardDriveDownload, Database, Save, Cloud, LogOut, KeyRound, Loader2, Trophy, 
  FolderOpen, Coins, UserCog, LayoutDashboard, Phone, MapPin, ExternalLink
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { createSchoolAccount } from '../lib/schoolAuth';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';
import { getAdminSession, clearAdminSession, changeAdminPassword, sendAdminPasswordReset, mapFirebaseAuthError } from '../lib/adminAuth';
import { normalizeSchoolRow, exportSchoolsToExcel } from '../lib/excel';
import ImageUploadDropzone from '../components/ImageUploadDropzone';
import SchoolForm from '../components/admin/SchoolForm';
import AdminSchoolManager from '../components/admin/AdminSchoolManager';
import AdminEventManager from '../components/admin/AdminEventManager';
import AdminFinanceManager from '../components/admin/AdminFinanceManager';
import AdminSportsManager from '../components/admin/AdminSportsManager';
import AdminDocumentManager from '../components/admin/AdminDocumentManager';
import AdminRequestsManager from '../components/admin/AdminRequestsManager';
import { getCloudinaryConfig, saveCloudinaryConfig } from '../lib/cloudinary';
import { findRecoverableCache, restoreRecoveredCacheToFirestore, RecoverableCacheData } from '../lib/cacheRecovery';

const announcementSchema = z.object({
  title: z.string().min(1, 'ခေါင်းစဉ် လိုအပ်သည်'),
  body: z.string().min(1, 'အကြောင်းအရာ လိုအပ်သည်'),
  category: z.string().min(1, 'ကဏ္ဍ ရွေးချယ်ပါ'),
  eventDate: z.string().min(1, 'ကြေညာချက်ရက်စွဲ ထည့်သွင်းပေးပါ'),
  attachmentUrl: z.string().optional(),
  zone: z.string().optional(),
});

const associationSchema = z.object({
  name: z.string().min(1, 'အသင်းအမည် လိုအပ်သည်'),
  township: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  members: z.array(
    z.object({
      name: z.string().min(1, 'အဖွဲ့ဝင်အမည် လိုအပ်သည်'),
      role: z.string().min(1, 'ရာထူး လိုအပ်သည်'),
      school: z.string().optional(),
      phone: z.string().optional(),
      viber: z.string().optional(),
      telegram: z.string().optional(),
      photoUrl: z.string().optional(),
    })
  ),
});

export default function Admin() {
  const [adminSession] = useState(getAdminSession());
  const {
    schools: globalSchools, announcements: globalAnnouncements, schoolLevels,
    addSchool, updateSchool, deleteSchool: deleteSchoolFromContext,
    addAnnouncement, updateAnnouncement, deleteAnnouncement: removeAnnouncement,
    addSchoolLevel, updateSchoolLevel, deleteSchoolLevel, resetSchoolLevelsToDefault,
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'accounts' | 'levels' | 'backup' | 'events' | 'sports' | 'documents' | 'finance' | 'requests'>('dashboard');

  const role = (adminSession?.role as string) || 'admin';
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin';
  
  const canAccess: Record<string, boolean> = {
    dashboard: true,
    announcements: isSuperOrAdmin || role === 'news_editor' || !!adminSession.permissions?.manage_announcements,
    associations: isSuperOrAdmin,
    schools: isSuperOrAdmin || !!adminSession.permissions?.manage_schools,
    levels: isSuperOrAdmin,
    tickers: isSuperOrAdmin || role === 'news_editor' || !!adminSession.permissions?.manage_announcements,
    audit_logs: isSuperOrAdmin,
    accounts: isSuperOrAdmin,
    backup: role === 'super_admin',
    events: isSuperOrAdmin || role === 'sports_moderator' || !!adminSession.permissions?.manage_events,
    sports: isSuperOrAdmin || role === 'sports_moderator' || !!adminSession.permissions?.manage_sports,
    documents: isSuperOrAdmin || role === 'news_editor' || !!adminSession.permissions?.manage_documents,
    finance: isSuperOrAdmin || !!adminSession.permissions?.manage_finance,
    requests: true,
  };

  useEffect(() => {
    if (canAccess[activeTab] === false) {
      const firstAccessible = Object.keys(canAccess).find(key => canAccess[key]);
      if (firstAccessible) setActiveTab(firstAccessible as any);
    }
  }, [activeTab, role]);

  // States
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const announcementForm = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', body: '', category: 'general', eventDate: new Date().toISOString().split('T')[0], attachmentUrl: '', zone: '' },
  });

  const [editingAssociationId, setEditingAssociationId] = useState<string | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const associationForm = useForm({
    resolver: zodResolver(associationSchema),
    defaultValues: { name: '', township: '', address: '', phone: '', email: '', logoUrl: '', description: '', members: [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] },
  });
  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({ control: associationForm.control, name: 'members' });

  const [schools, setSchools] = useState<any[]>([]);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isSchoolFormOpen, setIsSchoolFormOpen] = useState(false);
  const [adminZoneFilter] = useState<string>('all');
  const [extraSchoolPhones] = useState<string[]>([]);
  const [extraFounderPhones] = useState<string[]>([]);
  const [extraAdminPhones] = useState<string[]>([]);
  const [extraCoord1Phones] = useState<string[]>([]);
  const [extraCoord2Phones] = useState<string[]>([]);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelUploadState, setExcelUploadState] = useState<any>({ status: 'idle', fileName: '', stageText: '', progressPercent: 0 });

  const [tickerText, setTickerText] = useState('');
  const [tickerPriority, setTickerPriority] = useState<'info' | 'urgent' | 'warning'>('info');
  const [tickerLink, setTickerLink] = useState('');
  const [tickerIsActive, setTickerIsActive] = useState(true);
  const [autoAssignDateTime, setAutoAssignDateTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState('');
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [submittingTicker, setSubmittingTicker] = useState(false);
  const [tickers, setTickers] = useState<NewsTicker[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'bulk_delete'>('all');
  const [auditSortBy, setAuditSortBy] = useState<'newest' | 'oldest'>('newest');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [adminPerms, setAdminPerms] = useState<Record<string, boolean>>({
    manage_schools: false, delete_schools: false, manage_announcements: false,
    manage_events: false, manage_sports: false, manage_documents: false,
    manage_finance: false, manage_users: false,
  });
  const [schoolAccountModal, setSchoolAccountModal] = useState<School | null>(null);
  const [schoolAccEmail, setSchoolAccEmail] = useState('');
  const [schoolAccPassword, setSchoolAccPassword] = useState('');
  const [isCreatingSchoolAcc, setIsCreatingSchoolAcc] = useState(false);
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [extraAdminUserPhones, setExtraAdminUserPhones] = useState<string[]>([]);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelNameInput, setLevelNameInput] = useState('');
  const [levelOrderInput, setLevelOrderInput] = useState<number | ''>('');
  const [levelDescInput, setLevelDescInput] = useState('');
  const [isSavingLevel, setIsSavingLevel] = useState(false);

  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [recoverableCache, setRecoverableCache] = useState<RecoverableCacheData | null>(null);
  const [isRestoringCache, setIsRestoringCache] = useState(false);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => getCloudinaryConfig().cloudName);
  const [cloudinaryPreset, setCloudinaryPreset] = useState(() => getCloudinaryConfig().uploadPreset);
  const [cloudinaryFolder, setCloudinaryFolder] = useState(() => getCloudinaryConfig().folder || 'ssspsinfo');

  const [isChangingPassModal, setIsChangingPassModal] = useState(false);
  const [targetChangePassEmail, setTargetChangePassEmail] = useState('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [savingNewPassword, setSavingNewPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => { clearAdminSession(); toast.info('အကောင့်မှ ထွက်ပြီးပါပြီ'); navigate('/login'); };
  const getFormattedDateTime = () => new Date().toLocaleString('en-GB', { hour12: true });

  useEffect(() => { if (globalSchools) setSchools(globalSchools); }, [globalSchools]);
  useEffect(() => { if (globalAnnouncements) setAnnouncements(globalAnnouncements); }, [globalAnnouncements]);

  const sortedAnnouncements = useMemo(() => sortAnnouncementsByEventDate(announcements as any), [announcements]);
  const unifiedLevels = useMemo(() => getUnifiedSchoolLevels(schoolLevels, schools), [schoolLevels, schools]);
  const schoolsForZone = useMemo(() => adminZoneFilter === 'all' ? schools : schools.filter(s => isSchoolInZone(s.zone, adminZoneFilter)), [schools, adminZoneFilter]);
  
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

  const fetchAnnouncements = async () => { try { const s = await getDocs(collection(db, 'announcements')); setAnnouncements(sortAnnouncementsByEventDate(s.docs.map(d => ({ id: d.id, ...d.data() })) as any)); } catch (e) { console.error(e); } };
  const fetchAssociations = async () => { try { const s = await getDocs(collection(db, 'associations')); setAssociations(s.docs.map(d => ({ id: d.id, ...d.data() })) as Association[]); } catch (e) { console.error(e); } };
  const fetchSchools = async () => { try { const s = await getDocs(collection(db, 'schools')); setSchools(s.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); } };
  const fetchTickers = async () => { try { const q = query(collection(db, 'tickers'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setTickers(s.docs.map(d => ({ id: d.id, ...d.data() })) as NewsTicker[]); } catch (e) { console.error(e); } };
  const fetchAuditLogs = async () => { try { const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setAuditLogs(s.docs.map(d => ({ id: d.id, ...d.data() })) as AuditLog[]); } catch (e) { console.error(e); } };
  const fetchAdmins = async () => { try { const s = await getDocs(collection(db, 'admins')); setAdmins(s.docs.map(d => ({ id: d.id, ...d.data() })) as AdminUser[]); } catch (e) { console.error(e); } };

  useEffect(() => {
    fetchAnnouncements(); fetchAssociations(); fetchSchools(); fetchTickers(); fetchAuditLogs(); fetchAdmins();
    const f = findRecoverableCache(); if (f) setRecoverableCache(f);
  }, []);

  // Announcements Handlers
  const startEditAnnouncement = (a: any) => {
    setEditingAnnouncementId(a.id);
    announcementForm.reset({ title: a.title || '', body: a.body || '', category: a.category || 'general', eventDate: a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : ''), attachmentUrl: a.attachments?.[0] || '', zone: a.zone || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditAnnouncement = () => {
    setEditingAnnouncementId(null);
    announcementForm.reset({ title: '', body: '', category: 'general', eventDate: new Date().toISOString().split('T')[0], attachmentUrl: '', zone: '' });
  };
  const onAnnouncementSubmit = async (data: any) => {
    try {
      const sd = data.eventDate;
      const ipa = new Date(sd + 'T12:00:00Z').toISOString();
      const pl = { ...data, eventDate: sd, publishedAt: ipa, attachments: data.attachmentUrl ? [data.attachmentUrl] : [] };
      if (editingAnnouncementId) { await updateAnnouncement(editingAnnouncementId, pl); toast.success('ကြေညာချက် ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addAnnouncement({ ...pl, createdAt: new Date().toISOString() }); toast.success('ကြေညာချက်အသစ် တင်ပြီးပါပြီ'); }
      cancelEditAnnouncement(); fetchAnnouncements();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); }
  };
  const deleteAnnouncement = async (id: string) => {
    if (!confirm('ဤကြေညာချက်ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try { await removeAnnouncement(id); toast.success('ဖျက်ပြီးပါပြီ'); fetchAnnouncements(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  // Associations Handlers
  const startEditAssociation = (a: Association) => {
    setEditingAssociationId(a.id);
    associationForm.reset({ ...a, members: a.members?.length ? a.members : [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditAssociation = () => {
    setEditingAssociationId(null);
    associationForm.reset({ name: '', township: '', address: '', phone: '', email: '', logoUrl: '', description: '', members: [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }] });
  };
  const onAssociationSubmit = async (data: any) => {
    try {
      if (editingAssociationId) { await updateDoc(doc(db, 'associations', editingAssociationId), { ...data, updatedAt: new Date().toISOString() }); toast.success('အသင်းအဖွဲ့ ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addDoc(collection(db, 'associations'), { ...data, createdAt: new Date().toISOString() }); toast.success('အသင်းအဖွဲ့အသစ် ထည့်သွင်းပြီးပါပြီ'); }
      cancelEditAssociation(); fetchAssociations();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); }
  };
  const deleteAssociation = async (id: string) => {
    if (!confirm('ဤအသင်းအဖွဲ့ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try { await deleteDoc(doc(db, 'associations', id)); toast.success('ဖျက်ပြီးပါပြီ'); fetchAssociations(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  // Tickers Handlers
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
      setTickerText(''); setTickerLink(''); setTickerPriority('info'); setTickerIsActive(true); setAutoAssignDateTime(true); setCustomDateTime(''); fetchTickers();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setSubmittingTicker(false); }
  };
  const toggleTickerStatus = async (t: NewsTicker) => { try { await updateDoc(doc(db, 'tickers', t.id), { isActive: !t.isActive, updatedAt: new Date().toISOString() }); fetchTickers(); } catch (e) { toast.error('ပြောင်း၍မရပါ'); } };
  const deleteTicker = async (id: string) => { if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return; try { await deleteDoc(doc(db, 'tickers', id)); toast.success('ဖျက်ပြီးပါပြီ'); fetchTickers(); } catch (e) { toast.error('ဖျက်၍မရပါ'); } };
  const startEditTicker = (t: NewsTicker) => { setEditingTickerId(t.id); setTickerText(t.text); setTickerPriority(t.priority || 'info'); setTickerLink(t.link || ''); setTickerIsActive(t.isActive); setAutoAssignDateTime(t.autoTimestamp ?? true); setCustomDateTime(t.displayDateTime || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEditTicker = () => { setEditingTickerId(null); setTickerText(''); setTickerLink(''); setTickerPriority('info'); setTickerIsActive(true); setAutoAssignDateTime(true); setCustomDateTime(''); };

  // Levels Handlers
  const handleStartEditLevel = (l: SchoolLevelItem) => { setEditingLevelId(l.id); setLevelNameInput(l.name); setLevelOrderInput(l.order ?? ''); setLevelDescInput(l.description ?? ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelEditLevel = () => { setEditingLevelId(null); setLevelNameInput(''); setLevelOrderInput(''); setLevelDescInput(''); };
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault(); if (!levelNameInput.trim()) return; setIsSavingLevel(true);
    try {
      if (editingLevelId) { await updateSchoolLevel(editingLevelId, { name: levelNameInput.trim(), order: levelOrderInput !== '' ? Number(levelOrderInput) : undefined, description: levelDescInput.trim() }); toast.success('ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addSchoolLevel(levelNameInput.trim(), levelDescInput.trim(), levelOrderInput !== '' ? Number(levelOrderInput) : undefined); toast.success('ထည့်သွင်းပြီးပါပြီ'); }
      handleCancelEditLevel();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setIsSavingLevel(false); }
  };
  const handleDeleteLevel = async (l: SchoolLevelItem) => { if (!confirm('ဖျက်ရန် သေချာပါသလား?')) return; try { await deleteSchoolLevel(l.id); toast.success('ဖျက်ပြီးပါပြီ'); } catch (e) { toast.error('ဖျက်၍မရပါ'); } };
  const handleResetLevels = async () => { if (!confirm('မူလအတိုင်း ပြန်ထားရန် သေချာပါသလား?')) return; try { await resetSchoolLevelsToDefault(); toast.success('ပြန်ထားပြီးပါပြီ'); } catch (e) { toast.error('ပြန်ထား၍မရပါ'); } };

  // Admin & School Accounts
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); if (adminSession.role !== 'super_admin') { toast.error('Super Admin သာ ခွင့်ပြုချက်ရှိသည်'); return; }
    const ce = newAdminEmail.trim().toLowerCase(); const cp = newAdminPassword.trim();
    if (!ce.includes('@') || cp.length < 6) { toast.error('အီးမေးလ်နှင့် စကားဝှက် (၆ လုံး) စစ်ဆေးပါ'); return; }
    try {
      setAddingAdmin(true);
      const sa = initializeApp(firebaseConfig, 'sa_' + Date.now()); const sau = getAuth(sa);
      let nu = '';
      try { const uc = await createUserWithEmailAndPassword(sau, ce, cp); nu = uc.user.uid; } catch (ae: any) { toast.error(mapFirebaseAuthError(ae.code)); return; } finally { try { await secondarySignOut(sau); await deleteApp(sa); } catch {} }
      await setDoc(doc(db, 'admins', nu), { uid: nu, email: ce, name: newAdminName.trim() || 'အက်ဒမင်', role: newAdminRole, phone: newAdminPhone.trim(), phones: [newAdminPhone.trim(), ...extraAdminUserPhones.map(p => p.trim())].filter(Boolean), note: newAdminNote.trim(), permissions: adminPerms, addedBy: auth.currentUser?.email || 'Super Admin', createdAt: new Date().toISOString() });
      toast.success('အက်ဒမင် ခန့်အပ်ပြီးပါပြီ'); setNewAdminEmail(''); setNewAdminPassword(''); setNewAdminName(''); setNewAdminPhone(''); setExtraAdminUserPhones([]); setNewAdminNote(''); setNewAdminRole('admin'); setAdminPerms({ manage_schools: false, delete_schools: false, manage_announcements: false, manage_events: false, manage_sports: false, manage_documents: false, manage_finance: false, manage_users: false }); fetchAdmins();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setAddingAdmin(false); }
  };
  const handleDeleteAdmin = async (a: AdminUser) => { if (adminSession.role !== 'super_admin') return; if (a.id === auth.currentUser?.uid) { toast.error('မိမိကိုယ်ကို ဖယ်ရှား၍မရပါ'); return; } if (!confirm('ဖယ်ရှားရန် သေချာပါသလား?')) return; try { await deleteDoc(doc(db, 'admins', a.id)); toast.success('ဖယ်ရှားပြီးပါပြီ'); fetchAdmins(); } catch (e) { toast.error('ဖယ်ရှား၍မရပါ'); } };

  const handleCreateSchoolAccount = async (e: React.FormEvent) => {
    e.preventDefault(); if (!schoolAccountModal) return;
    if (!schoolAccEmail || !schoolAccPassword || schoolAccPassword.length < 6) { toast.error('အီးမေးလ်နှင့် စကားဝှက် (၆ လုံး) ဖြည့်စွက်ပါ'); return; }
    try { setIsCreatingSchoolAcc(true); await createSchoolAccount(schoolAccEmail, schoolAccPassword, schoolAccountModal.id); toast.success('ကျောင်းအကောင့် ဖန်တီးပြီးပါပြီ'); setSchoolAccountModal(null); setSchoolAccEmail(''); setSchoolAccPassword(''); fetchSchools(); } catch (e: any) { toast.error(e.message || 'ဖန်တီး၍မရပါ'); } finally { setIsCreatingSchoolAcc(false); }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (newAdminPasswordInput.trim().length < 6) { toast.error('စကားဝှက် ၆ လုံး ရှိရပါမည်'); return; }
    setSavingNewPassword(true);
    try { const r = await changeAdminPassword(targetChangePassEmail, newAdminPasswordInput.trim()); if (!r.success) { toast.error(r.error || 'ပြောင်း၍မရပါ'); return; } toast.success('ပြောင်းပြီးပါပြီ'); setIsChangingPassModal(false); setNewAdminPasswordInput(''); } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); } finally { setSavingNewPassword(false); }
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
      const cleanFeeAmount = (rawFee !== null && !isNaN(rawFee)) ? rawFee : (getStudentRangeTier(data.studentRange)?.defaultFee ?? 200000);
      const payload = {
        ...data,
        address: data.address?.trim() || '', township: data.township?.trim() || '', city: data.city?.trim() || '', zone: data.zone?.trim() || '',
        schoolPhone: data.schoolPhone?.trim() || '', schoolPhone2: data.schoolPhone2?.trim() || '', schoolPhones: extraSchoolPhones.map(p => p.trim()).filter(Boolean),
        founderName: data.founderName?.trim() || '', founderPhone: data.founderPhone?.trim() || '', founderPhone2: data.founderPhone2?.trim() || '', founderPhones: extraFounderPhones.map(p => p.trim()).filter(Boolean), founderViber: data.founderViber?.trim() || '', founderTelegram: data.founderTelegram?.trim() || '',
        adminName: data.adminName?.trim() || '', adminPhone: data.adminPhone?.trim() || '', adminPhone2: data.adminPhone2?.trim() || '', adminPhones: extraAdminPhones.map(p => p.trim()).filter(Boolean), adminViber: data.adminViber?.trim() || '', adminTelegram: data.adminTelegram?.trim() || '',
        responsiblePerson1Name: data.contactName?.trim() || '', responsiblePerson1Role: data.contactRole?.trim() || '', responsiblePerson1Phone: data.contactPhone?.trim() || '', responsiblePerson1Phone2: data.contactPhone2?.trim() || '', responsiblePerson1Phones: extraCoord1Phones.map(p => p.trim()).filter(Boolean), responsiblePerson1Viber: data.contactViber?.trim() || '', responsiblePerson1Telegram: data.contactTelegram?.trim() || '',
        contactName: data.contactName?.trim() || '', contactRole: data.contactRole?.trim() || '', contactPhone: data.contactPhone?.trim() || '', contactPhone2: data.contactPhone2?.trim() || '', contactPhones: extraCoord1Phones.map(p => p.trim()).filter(Boolean), contactViber: data.contactViber?.trim() || '', contactTelegram: data.contactTelegram?.trim() || '',
        responsiblePerson2Name: data.contact2Name?.trim() || '', responsiblePerson2Role: data.contact2Role?.trim() || '', responsiblePerson2Phone: data.contact2Phone?.trim() || '', responsiblePerson2Phone2: data.contact2Phone2?.trim() || '', responsiblePerson2Phones: extraCoord2Phones.map(p => p.trim()).filter(Boolean), responsiblePerson2Viber: data.contact2Viber?.trim() || '', responsiblePerson2Telegram: data.contact2Telegram?.trim() || '',
        contact2Name: data.contact2Name?.trim() || '', contact2Role: data.contact2Role?.trim() || '', contact2Phone: data.contact2Phone?.trim() || '', contact2Phone2: data.contact2Phone2?.trim() || '', contact2Phones: extraCoord2Phones.map(p => p.trim()).filter(Boolean), contact2Viber: data.contact2Viber?.trim() || '', contact2Telegram: data.contact2Telegram?.trim() || '',
        studentRange: data.studentRange || '0-100', studentCount: cleanStudentCount, feeAmount: cleanFeeAmount, feeAcademicYear: data.feeAcademicYear || '၂၀၂၄-၂၀၂၅', feePaidDate: data.feePaidDate || '',
      };
      if (editingSchoolId) {
        await updateSchool(editingSchoolId, payload);
        toast.success('ကျောင်းအချက်အလက် "' + data.name + '" ကို ပြင်ဆင်ပြီးပါပြီ');
      } else {
        await addSchool(payload);
        toast.success('ကျောင်းအသစ် "' + data.name + '" ကို ထည့်သွင်းပြီးပါပြီ');
      }
      cancelEditSchool(); fetchSchools();
    } catch (err) { toast.error('ကျောင်းအချက်အလက် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်'); }
  };
  
  const deleteSchool = async (id: string, name?: string) => {
    if (!confirm(`"${name || 'ဤကျောင်း'}" ကို ဖျက်ရန် သေချာပါသလား?`)) return;
    try { await deleteSchoolFromContext(id); toast.success('ဖျက်ပြီးပါပြီ'); fetchSchools(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  const handleToggleSchoolFee = async (school: School) => {
    if (school.isAnnualFeePaid && !confirm(`"${school.name}" ၏ နှစ်စဉ်ကြေးပေးသွင်းပြီးမှုကို ပယ်ဖျက်မည်လား?`)) return;
    try {
      await updateDoc(doc(db, 'schools', school.id), { isAnnualFeePaid: !school.isAnnualFeePaid, updatedAt: new Date().toISOString() });
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
    if (!confirm('အမည်တူ ထပ်နေသော ကျောင်းများကို ရှာဖွေရှင်းလင်းမည်လား?')) return;
    const seen = new Map<string, any>();
    let removed = 0;
    for (const s of schools) {
      const key = (s.name || '').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        await deleteSchoolFromContext(s.id);
        removed++;
      } else {
        seen.set(key, s);
      }
    }
    toast.success(`ထပ်နေသော ကျောင်း (${removed}) ခုကို ရှင်းလင်းပြီးပါပြီ`);
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
      let count = 0;
      for (const row of rows) {
        const normalized = normalizeSchoolRow(row);
        if (normalized && normalized.name) {
          await addSchool(normalized);
          count++;
          setExcelUploadState({ status: 'uploading', fileName: file.name, stageText: `ကျောင်းများ ထည့်သွင်းနေသည် (${count}/${rows.length})...`, progressPercent: Math.round((count / rows.length) * 100) });
        }
      }
      toast.success(`Excel မှ ကျောင်းပေါင်း (${count}) ကျောင်း အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ`);
      fetchSchools();
    } catch (err) {
      toast.error('Excel တင်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsUploadingExcel(false);
      e.target.value = '';
    }
  };

  // Backup & Cloudinary
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
      fetchSchools(); fetchAnnouncements();
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'schools', label: 'ကျောင်းများ', icon: SchoolIcon, show: canAccess.schools },
    { id: 'announcements', label: 'ကြေညာချက်များ', icon: FileText, show: canAccess.announcements },
    { id: 'associations', label: 'အသင်းအဖွဲ့များ', icon: Building2, show: canAccess.associations },
    { id: 'levels', label: 'ကျောင်းအဆင့်များ', icon: Layers, show: canAccess.levels },
    { id: 'tickers', label: 'စာတန်းပြေး (Ticker)', icon: Megaphone, show: canAccess.tickers },
    { id: 'events', label: 'ပွဲစဉ်များ (Events)', icon: Calendar, show: canAccess.events },
    { id: 'sports', label: 'အားကစားပြိုင်ပွဲ', icon: Trophy, show: canAccess.sports },
    { id: 'documents', label: 'စာရွက်စာတမ်းများ', icon: FolderOpen, show: canAccess.documents },
    { id: 'finance', label: 'ငွေစာရင်း (Finance)', icon: Coins, show: canAccess.finance },
    { id: 'requests', label: 'တောင်းဆိုမှုများ', icon: Mail, show: true },
    { id: 'accounts', label: 'အကောင့် စီမံခန့်ခွဲမှု', icon: UserCog, show: canAccess.accounts },
    { id: 'audit_logs', label: 'မှတ်တမ်း (Audit Logs)', icon: History, show: canAccess.audit_logs },
    { id: 'backup', label: 'Backup & Cloud', icon: HardDriveDownload, show: canAccess.backup },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100/70">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-20 shadow-xs">
        <div className="p-5 border-b border-slate-200 bg-gradient-to-br from-sky-950 via-sky-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Admin Console</h2>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md">{role}</span>
            </div>
          </div>
          <p className="text-xs text-sky-200/90 mt-3 truncate font-medium">{adminSession.email || 'admin@ssspsinfo'}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter(i => i.show).map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 cursor-pointer ${
                  active ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
          <button onClick={() => { setTargetChangePassEmail(adminSession.email || ''); setIsChangingPassModal(true); }} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/80 transition flex items-center gap-2 cursor-pointer">
            <KeyRound className="w-4 h-4 text-slate-500" /> စကားဝှက် ပြောင်းမည်
          </button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/70 transition flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> အကောင့်မှ ထွက်မည်
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-sky-950 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <h2 className="font-extrabold flex items-center gap-2 text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Admin Console
          </h2>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="p-2 rounded-xl text-xs bg-sky-900 text-white border border-sky-700 font-bold outline-none"
          >
            {navItems.filter(i => i.show).map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold">မင်္ဂလာပါ၊ စီမံခန့်ခွဲမှုစနစ်မှ ကြိုဆိုပါသည်</h1>
                    <p className="text-sky-200 text-sm mt-1">ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဒေတာစင်တာ</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setEditingSchoolId(null); setIsSchoolFormOpen(true); }} className="bg-white text-sky-950 hover:bg-sky-50 px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                      <Plus className="w-4 h-4" /> ကျောင်းအသစ်ထည့်ရန်
                    </button>
                    <button onClick={() => setActiveTab('announcements')} className="bg-sky-700/60 hover:bg-sky-700 text-white border border-sky-500/40 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                      <Megaphone className="w-4 h-4" /> ကြေညာချက်တင်ရန်
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div onClick={() => setActiveTab('schools')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">စုစုပေါင်း ကျောင်းများ</span>
                      <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><SchoolIcon className="w-5 h-5" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-3">{schools.length}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1">လည်ပတ်ဆဲ {schools.filter(s => (s.status || 'active') === 'active').length} ကျောင်း</p>
                  </div>

                  <div onClick={() => setActiveTab('schools')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">နှစ်စဉ်ကြေး ပေးသွင်းပြီး</span>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-700 mt-3">{schools.filter(s => s.isAnnualFeePaid).length}</p>
                    <p className="text-[11px] font-semibold text-rose-600 mt-1">ကျန်ရှိ {schools.filter(s => !s.isAnnualFeePaid).length} ကျောင်း</p>
                  </div>

                  <div onClick={() => setActiveTab('announcements')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">ကြေညာချက်များ</span>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-3">{announcements.length}</p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">စာတန်းပြေး {tickers.filter(t => t.isActive).length} ခု လွှင့်ထားဆဲ</p>
                  </div>

                  <div onClick={() => setActiveTab('associations')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">အသင်းအဖွဲ့နှင့် အက်ဒမင်</span>
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-5 h-5" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 mt-3">{associations.length}</p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">Admin အကောင့် {admins.length} ခု</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SCHOOLS */}
            {activeTab === 'schools' && (
              <AdminSchoolManager
                role={role}
                canDelete={isSuperOrAdmin || !!adminSession.permissions?.delete_schools}
                schools={schoolsForZone}
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
            )}

            {/* TAB 3: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in">
                <div className="lg:col-span-5">
                  <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
                    <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-sky-600" />
                      {editingAnnouncementId ? 'ကြေညာချက် ပြင်ဆင်ရန်' : 'ကြေညာချက်အသစ် တင်ရန်'}
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ခေါင်းစဉ် *</label>
                      <input {...announcementForm.register('title')} placeholder="ကြေညာချက် ခေါင်းစဉ်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">ကဏ္ဍ *</label>
                        <select {...announcementForm.register('category')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                          {ANNOUNCEMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">ရက်စွဲ *</label>
                        <input type="date" {...announcementForm.register('eventDate')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ဇုန် သတ်မှတ်ချက် (Optional)</label>
                      <select {...announcementForm.register('zone')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                        <option value="">ဇုန်အားလုံးနှင့် သက်ဆိုင်သည်</option>
                        {ZONE_FILTER_OPTIONS.filter(z => z.value !== 'all').map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">အကြောင်းအရာ အပြည့်အစုံ *</label>
                      <textarea rows={5} {...announcementForm.register('body')} placeholder="အကြောင်းအရာ ရေးသားပါ..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ပူးတွဲဖိုင် / ပုံ (Image or Link)</label>
                      <ImageUploadDropzone value={announcementForm.watch('attachmentUrl') || ''} onChange={(url) => announcementForm.setValue('attachmentUrl', url)} />
                      <input {...announcementForm.register('attachmentUrl')} placeholder="သို့မဟုတ် ပုံ/ဖိုင် Link တိုက်ရိုက်ထည့်ရန်..." className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      {editingAnnouncementId && (
                        <button type="button" onClick={cancelEditAnnouncement} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold cursor-pointer">မလုပ်တော့ပါ</button>
                      )}
                      <button type="submit" className="flex-1 bg-sky-900 hover:bg-sky-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer">
                        {editingAnnouncementId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'ကြေညာချက် တင်မည်'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">တင်ထားပြီးသော ကြေညာချက်များ ({sortedAnnouncements.length})</h3>
                  </div>
                  {sortedAnnouncements.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">ကြေညာချက် မရှိသေးပါ</div>
                  ) : (
                    sortedAnnouncements.map((a: any) => (
                      <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-200 transition space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {getCategoryBadge(a.category)}
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : '')}</span>
                              {a.zone && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{a.zone}</span>}
                            </div>
                            <h4 className="font-bold text-slate-900 text-base">{a.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => startEditAnnouncement(a)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-line">{a.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ASSOCIATIONS */}
            {activeTab === 'associations' && (
              <div className="space-y-6 animate-in fade-in">
                <form onSubmit={associationForm.handleSubmit(onAssociationSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-sky-600" />
                      {editingAssociationId ? 'အသင်းအဖွဲ့ ပြင်ဆင်ရန်' : 'အသင်းအဖွဲ့အသစ် ထည့်သွင်းရန်'}
                    </h3>
                    {editingAssociationId && (
                      <button type="button" onClick={cancelEditAssociation} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer">ပြင်ဆင်မှု ပယ်ဖျက်ရန်</button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">အသင်းအဖွဲ့ အမည် *</label>
                      <input {...associationForm.register('name')} placeholder="အသင်းအမည်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">မြို့နယ်</label>
                      <input {...associationForm.register('township')} placeholder="ဥပမာ - တောင်ကြီး" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ဖုန်းနံပါတ်</label>
                      <input {...associationForm.register('phone')} placeholder="09..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">လိပ်စာနှင့် ဖော်ပြချက်</label>
                      <input {...associationForm.register('description')} placeholder="အသင်းအကြောင်း အကျဉ်းချုပ်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL</label>
                      <input {...associationForm.register('logoUrl')} placeholder="https://..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-800">အမှုဆောင် အဖွဲ့ဝင်များ ({memberFields.length})</h4>
                      <button type="button" onClick={() => appendMember({ name: '', role: 'အဖွဲ့ဝင်', school: '', phone: '', viber: '', telegram: '', photoUrl: '' })} className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition cursor-pointer">
                        + အဖွဲ့ဝင် ထပ်ထည့်ရန်
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {memberFields.map((field, index) => (
                        <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid sm:grid-cols-5 gap-2.5 items-center">
                          <input {...associationForm.register(`members.${index}.name` as const)} placeholder="အမည် *" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                          <input {...associationForm.register(`members.${index}.role` as const)} placeholder="ရာထူး *" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                          <input {...associationForm.register(`members.${index}.school` as const)} placeholder="ကိုယ်စားပြုကျောင်း" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                          <input {...associationForm.register(`members.${index}.phone` as const)} placeholder="ဖုန်းနံပါတ်" className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                          <div className="flex items-center gap-1.5">
                            <input {...associationForm.register(`members.${index}.photoUrl` as const)} placeholder="ပုံ Link" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                            {memberFields.length > 1 && (
                              <button type="button" onClick={() => removeMember(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="bg-sky-900 hover:bg-sky-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer">
                    {editingAssociationId ? 'အသင်းအဖွဲ့ ပြင်ဆင်ချက် သိမ်းမည်' : 'အသင်းအဖွဲ့ သိမ်းဆည်းမည်'}
                  </button>
                </form>

                <div className="grid md:grid-cols-2 gap-4">
                  {associations.map(a => (
                    <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{a.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{a.township || 'ရှမ်းပြည်နယ် (တောင်ပိုင်း)'} • အဖွဲ့ဝင် {a.members?.length || 0} ဦး</p>
                          {a.description && <p className="text-xs text-slate-600 mt-2">{a.description}</p>}
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => startEditAssociation(a)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteAssociation(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SCHOOL LEVELS */}
            {activeTab === 'levels' && (
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
                          </h4>
                          {l.description && <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStartEditLevel(l)} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteLevel(l)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: TICKERS */}
            {activeTab === 'tickers' && (
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
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
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
            )}

            {/* TAB 7: ACCOUNTS */}
            {activeTab === 'accounts' && (
              <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-indigo-600" /> Admin / Moderator အကောင့်သစ်ဖွင့်ရန်
                    </h3>
                    <form onSubmit={handleAddAdmin} className="space-y-3">
                      <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} placeholder="အမည် (ဥပမာ - ဦးအောင်)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Email လိပ်စာ *" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      <input type="text" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="Password (အနည်းဆုံး ၆ လုံး) *" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none">
                        <option value="admin">Admin (စီမံခန့်ခွဲသူ)</option>
                        <option value="editor">Moderator (ကန့်သတ်ခွင့်ပြုချက်)</option>
                        <option value="super_admin">Super Admin (အမြင့်ဆုံးခွင့်ပြုချက်)</option>
                      </select>
                      {newAdminRole === 'editor' && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2.5">
                          {Object.entries({
                            manage_schools: 'ကျောင်းများ ပြင်ဆင်ခွင့်',
                            delete_schools: 'ကျောင်းဖျက်ခွင့်',
                            manage_announcements: 'ကြေညာချက် တင်ခွင့်',
                            manage_events: 'ပွဲစဉ်များ စီမံခွင့်',
                            manage_sports: 'အားကစား စီမံခွင့်',
                            manage_documents: 'စာရွက်စာတမ်း စီမံခွင့်',
                            manage_finance: 'ငွေစာရင်း စီမံခွင့်'
                          }).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={adminPerms[key]} onChange={e => setAdminPerms({...adminPerms, [key]: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      )}
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
                        <button onClick={() => setSchoolAccountModal(s)} className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer">
                          {s.authUid ? 'အသစ်ပြန်ဖွင့်မည်' : '+ အကောင့်ဖွင့်မည်'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: AUDIT LOGS */}
            {activeTab === 'audit_logs' && (
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
            )}

            {/* TAB 9: BACKUP & CLOUD */}
            {activeTab === 'backup' && (
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
            )}

            {/* OTHER MODULAR TABS */}
            {activeTab === 'events' && <AdminEventManager />}
            {activeTab === 'sports' && <AdminSportsManager schools={schools} />}
            {activeTab === 'documents' && <AdminDocumentManager />}
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
              <input type="text" required value={newAdminPasswordInput} onChange={e => setNewAdminPasswordInput(e.target.value)} placeholder="စကားဝှက်အသစ် (အနည်းဆုံး ၆ လုံး)" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" />
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
