import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, writeBatch, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ANNOUNCEMENT_CATEGORIES, getCategoryBadge } from './Announcements';
import { Association, NewsTicker, AuditLog, AdminUser, STUDENT_RANGE_TIERS, getStudentRangeTier, SchoolLevelItem } from '../types';
import { recordAuditLog } from '../lib/audit';
import { useData, sortAnnouncementsByEventDate } from '../context/DataContext';
import {
  FileText,
  School as SchoolIcon,
  Plus,
  Trash2,
  Calendar,
  Download,
  Upload,
  Building2,
  UserPlus,
  Users,
  Megaphone,
  Clock,
  AlertCircle,
  Flame,
  Edit2,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  CheckCircle,
  Eye,
  CheckCircle2,
  XCircle,
  CopyCheck,
  ShieldAlert,
  Layers,
  CheckSquare,
  Square,
  Search,
  Shield,
  Activity,
  UserCheck,
  History,
  Crown,
  Mail,
  ShieldCheck,
  HardDriveDownload,
  Database,
  Save,
  FileJson,
  Check,
  ArrowDownToLine,
  Settings as SettingsIcon,
  Cloud,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { getAdminSession, clearAdminSession, changeAdminPassword } from '../lib/adminAuth';
import { downloadSchoolTemplate, normalizeSchoolRow, exportSchoolsToExcel } from '../lib/excel';
import ImageUploadDropzone from '../components/ImageUploadDropzone';
import { getCloudinaryConfig, saveCloudinaryConfig, isCloudinaryConfigured } from '../lib/cloudinary';

const announcementSchema = z.object({
  title: z.string().min(1, 'ခေါင်းစဉ် လိုအပ်သည်'),
  body: z.string().min(1, 'အကြောင်းအရာ လိုအပ်သည်'),
  category: z.string().min(1, 'ကဏ္ဍ ရွေးချယ်ပါ'),
  eventDate: z.string().min(1, 'ကြေညာချက်ရက်စွဲ (Admin Set Date) ထည့်သွင်းပေးပါ'),
  attachmentUrl: z.string().optional(),
});

const schoolSchema = z.object({
  logoUrl: z.string().optional(),
  name: z.string().min(1, 'ကျောင်းအမည် လိုအပ်သည်'),
  level: z.string().min(1, 'ကျောင်းအဆင့် လိုအပ်သည်'),
  studentRange: z.string().default('0-100').optional(),
  studentCount: z.union([z.number(), z.string()]).optional(),
  feeAmount: z.union([z.number(), z.string()]).optional(),
  feeAcademicYear: z.string().default('၂၀၂၄-၂၀၂၅').optional(),
  feePaidDate: z.string().optional(),
  // School phones (1 or more)
  schoolPhone: z.string().optional(),
  schoolPhone2: z.string().optional(),
  schoolPhones: z.array(z.string()).optional(),
  founderName: z.string().optional(),
  founderPhone: z.string().optional(),
  founderPhone2: z.string().optional(),
  founderPhones: z.array(z.string()).optional(),
  founderViber: z.string().optional(),
  founderTelegram: z.string().optional(),
  adminName: z.string().optional(),
  adminPhone: z.string().optional(),
  adminPhone2: z.string().optional(),
  adminPhones: z.array(z.string()).optional(),
  adminViber: z.string().optional(),
  adminTelegram: z.string().optional(),
  // Responsible Person 1 (တာဝန်ခံ ပုဂ္ဂိုလ် ၁)
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactPhone2: z.string().optional(),
  contactPhones: z.array(z.string()).optional(),
  contactViber: z.string().optional(),
  contactTelegram: z.string().optional(),
  responsiblePerson1Name: z.string().optional(),
  responsiblePerson1Role: z.string().optional(),
  responsiblePerson1Phone: z.string().optional(),
  responsiblePerson1Phone2: z.string().optional(),
  responsiblePerson1Phones: z.array(z.string()).optional(),
  responsiblePerson1Viber: z.string().optional(),
  responsiblePerson1Telegram: z.string().optional(),
  // Responsible Person 2 (တာဝန်ခံ ပုဂ္ဂိုလ် ၂)
  contact2Name: z.string().optional(),
  contact2Role: z.string().optional(),
  contact2Phone: z.string().optional(),
  contact2Phone2: z.string().optional(),
  contact2Phones: z.array(z.string()).optional(),
  contact2Viber: z.string().optional(),
  contact2Telegram: z.string().optional(),
  responsiblePerson2Name: z.string().optional(),
  responsiblePerson2Role: z.string().optional(),
  responsiblePerson2Phone: z.string().optional(),
  responsiblePerson2Phone2: z.string().optional(),
  responsiblePerson2Phones: z.array(z.string()).optional(),
  responsiblePerson2Viber: z.string().optional(),
  responsiblePerson2Telegram: z.string().optional(),
  schoolNote: z.string().optional(),
  note: z.string().optional(),
  isAnnualFeePaid: z.boolean().optional(),
  status: z.enum(['active', 'under_review', 'inactive']).default('active').optional(),
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
  const {
    schools: globalSchools,
    announcements: globalAnnouncements,
    schoolLevels,
    syncData,
    addSchool,
    updateSchool,
    deleteSchool: deleteSchoolFromContext,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement: removeAnnouncement,
    addSchoolLevel,
    updateSchoolLevel,
    deleteSchoolLevel,
    resetSchoolLevelsToDefault,
  } = useData();
  const [activeTab, setActiveTab] = useState<'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins' | 'levels' | 'backup'>('announcements');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Backup & Restore state
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupRestoreData, setBackupRestoreData] = useState<any | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'skip'>('merge');
  const [backupFileName, setBackupFileName] = useState('');

  // Cloudinary settings state
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => getCloudinaryConfig().cloudName);
  const [cloudinaryPreset, setCloudinaryPreset] = useState(() => getCloudinaryConfig().uploadPreset);
  const [cloudinaryFolder, setCloudinaryFolder] = useState(() => getCloudinaryConfig().folder || 'ssspsinfo');
  const [isCloudinarySaved, setIsCloudinarySaved] = useState(false);

  // School Level Management form state
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelNameInput, setLevelNameInput] = useState('');
  const [levelOrderInput, setLevelOrderInput] = useState<number | ''>('');
  const [levelDescInput, setLevelDescInput] = useState('');
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [tickers, setTickers] = useState<NewsTicker[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Synchronize schools and announcements state with DataContext
  useEffect(() => {
    if (globalSchools) {
      setSchools(globalSchools);
    }
  }, [globalSchools]);

  useEffect(() => {
    if (globalAnnouncements) {
      setAnnouncements(globalAnnouncements);
    }
  }, [globalAnnouncements]);

  const sortedAnnouncements = useMemo(() => {
    return sortAnnouncementsByEventDate(announcements as any);
  }, [announcements]);

  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingTickers, setLoadingTickers] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Admin Management form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'super_admin'>('admin');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [extraAdminUserPhones, setExtraAdminUserPhones] = useState<string[]>([]);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Audit Log search & filter state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'bulk_delete'>('all');

  // Ticker form state
  const [tickerText, setTickerText] = useState('');
  const [tickerPriority, setTickerPriority] = useState<'info' | 'urgent' | 'warning'>('info');
  const [tickerLink, setTickerLink] = useState('');
  const [tickerIsActive, setTickerIsActive] = useState(true);
  const [autoAssignDateTime, setAutoAssignDateTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState('');
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [submittingTicker, setSubmittingTicker] = useState(false);

  // Router search params & navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [adminSession, setAdminSessionState] = useState(getAdminSession());

  const handleLogout = () => {
    clearAdminSession();
    toast.info('Admin အကောင့်မှ အောင်မြင်စွာ ထွက်ခွာပြီးပါပြီ');
    navigate('/login');
  };

  // Admin Password Management Modal State
  const [isChangingPassModal, setIsChangingPassModal] = useState(false);
  const [targetChangePassEmail, setTargetChangePassEmail] = useState('khunthanshwe@gmail.com');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [savingNewPassword, setSavingNewPassword] = useState(false);

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPasswordInput.trim() || newAdminPasswordInput.trim().length < 4) {
      toast.error('စကားဝှက်သည် အနည်းဆုံး စာလုံး ၄ လုံး ရှိရပါမည်');
      return;
    }
    setSavingNewPassword(true);
    try {
      const res = await changeAdminPassword(targetChangePassEmail, newAdminPasswordInput);
      if (!res.success) {
        toast.error(res.error || 'စကားဝှက် ပြောင်း၍ မရပါ');
        return;
      }
      await recordAuditLog({
        action: 'update',
        entityType: 'admin',
        entityName: targetChangePassEmail,
        details: `"${targetChangePassEmail}" ၏ စကားဝှက် (Password) အား အသစ်ပြောင်းလဲခဲ့သည်`,
      });
      toast.success(`"${targetChangePassEmail}" ၏ စကားဝှက်ကို အောင်မြင်စွာ ပြောင်းလဲလိုက်ပါပြီ`);
      setIsChangingPassModal(false);
      setNewAdminPasswordInput('');
    } catch (err: any) {
      toast.error('စကားဝှက် ပြောင်းလဲရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setSavingNewPassword(false);
    }
  };

  // School editing & search state
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [adminSchoolSearch, setAdminSchoolSearch] = useState('');
  const [adminFeeFilter, setAdminFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');

  // Dynamic extra phone numbers state for school form
  const [extraSchoolPhones, setExtraSchoolPhones] = useState<string[]>([]);
  const [extraFounderPhones, setExtraFounderPhones] = useState<string[]>([]);
  const [extraAdminPhones, setExtraAdminPhones] = useState<string[]>([]);
  const [extraCoord1Phones, setExtraCoord1Phones] = useState<string[]>([]);
  const [extraCoord2Phones, setExtraCoord2Phones] = useState<string[]>([]);

  // Bulk deletion state
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Excel Duplicate & Deduplication state
  const [duplicateMode, setDuplicateMode] = useState<'update' | 'skip' | 'add'>('update');
  const [importStats, setImportStats] = useState<{
    totalInFile: number;
    newCount: number;
    updatedCount: number;
    skippedCount: number;
    mode: string;
  } | null>(null);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  const getFormattedDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year}, ${hoursStr}:${minutes} ${ampm}`;
  };

  const announcementForm = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      body: '',
      category: 'general',
      eventDate: new Date().toISOString().split('T')[0],
      attachmentUrl: '',
    },
  });

  const associationForm = useForm({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      name: '',
      township: '',
      address: '',
      phone: '',
      email: '',
      logoUrl: '',
      description: '',
      members: [
        { name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' },
      ],
    },
  });

  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
    control: associationForm.control,
    name: 'members',
  });

  const schoolForm = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      level: 'အထက်တန်း',
      studentRange: '1-100',
      studentCount: '',
      feeAmount: 50000,
      feeAcademicYear: '၂၀၂၄-၂၀၂၅',
      feePaidDate: '',
      logoUrl: '',
      schoolPhone: '',
      schoolPhone2: '',
      founderName: '',
      founderPhone: '',
      founderPhone2: '',
      founderViber: '',
      founderTelegram: '',
      adminName: '',
      adminPhone: '',
      adminPhone2: '',
      adminViber: '',
      adminTelegram: '',
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactPhone2: '',
      contactViber: '',
      contactTelegram: '',
      contact2Name: '',
      contact2Role: '',
      contact2Phone: '',
      contact2Phone2: '',
      contact2Viber: '',
      contact2Telegram: '',
      schoolNote: '',
      note: '',
      isAnnualFeePaid: false,
      status: 'active' as const,
    },
  });

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const snapshot = await getDocs(collection(db, 'announcements'));
      const fetched = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAnnouncements(sortAnnouncementsByEventDate(fetched as any));
      syncData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchAssociations = async () => {
    try {
      setLoadingAssociations(true);
      const snapshot = await getDocs(collection(db, 'associations'));
      setAssociations(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Association[]);
      syncData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssociations(false);
    }
  };

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const snapshot = await getDocs(collection(db, 'schools'));
      setSchools(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
      syncData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const fetchTickers = async () => {
    try {
      setLoadingTickers(true);
      const q = query(collection(db, 'tickers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setTickers(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as NewsTicker[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickers(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setAuditLogs(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as AuditLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const snapshot = await getDocs(collection(db, 'admins'));
      setAdmins(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as AdminUser[]);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('မှန်ကန်သော အီးမေးလ်လိပ်စာ (Email Address) ထည့်သွင်းပေးပါ');
      return;
    }

    try {
      setAddingAdmin(true);
      const cleanPhones = [
        newAdminPhone.trim(),
        ...extraAdminUserPhones.map((p) => p.trim()),
      ].filter(Boolean);

      // Use email as doc ID for easy lookup in firestore.rules
      await setDoc(doc(db, 'admins', cleanEmail), {
        email: cleanEmail,
        name: newAdminName.trim() || 'အက်ဒမင်',
        role: newAdminRole,
        phone: newAdminPhone.trim(),
        phone2: extraAdminUserPhones[0]?.trim() || '',
        phones: cleanPhones,
        contactNumbers: cleanPhones,
        adminPhones: cleanPhones,
        note: newAdminNote.trim(),
        addedBy: auth.currentUser?.email || adminSession.email || 'Super Admin',
        createdAt: new Date().toISOString(),
      });
      await recordAuditLog({
        action: 'create',
        entityType: 'admin',
        entityName: cleanEmail,
        details: `အက်ဒမင်အသစ် "${cleanEmail}" (${newAdminRole}) အား ဖုန်းနံပါတ် (${cleanPhones.length} ခု) ဖြင့် စီမံခွင့် ပေးအပ်ခဲ့သည်`,
      });
      toast.success(`အက်ဒမင်သစ် "${cleanEmail}" ကို အောင်မြင်စွာ ခန့်အပ်ထည့်သွင်းပြီးပါပြီ`);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPhone('');
      setExtraAdminUserPhones([]);
      setNewAdminNote('');
      setNewAdminRole('admin');
      fetchAdmins();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('အက်ဒမင် ထည့်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.email === 'khunthanshwe@gmail.com') {
      toast.error('ပင်မ Super Admin အကောင့်ကို ဖယ်ရှား၍ မရပါ');
      return;
    }
    if (!confirm(`"${admin.email}" ၏ အက်ဒမင်စီမံခွင့်ကို ပယ်ဖျက်ရန် သေချာပါသလား?`)) return;

    try {
      await deleteDoc(doc(db, 'admins', admin.id || admin.email));
      await recordAuditLog({
        action: 'delete',
        entityType: 'admin',
        entityName: admin.email,
        details: `"${admin.email}" ၏ အက်ဒမင် စီမံခွင့်ကို ပယ်ဖျက်ခဲ့သည်`,
      });
      toast.success(`"${admin.email}" ၏ အက်ဒမင်အခွင့်အရေးကို ဖယ်ရှားလိုက်ပါပြီ`);
      fetchAdmins();
      fetchAuditLogs();
    } catch (err) {
      toast.error('အက်ဒမင် ဖယ်ရှား၍ မရပါ');
    }
  };

  // School Level Management Handlers
  const handleStartEditLevel = (lvl: SchoolLevelItem) => {
    setEditingLevelId(lvl.id);
    setLevelNameInput(lvl.name);
    setLevelOrderInput(lvl.order ?? '');
    setLevelDescInput(lvl.description ?? '');
    const elem = document.getElementById('level-form-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditLevel = () => {
    setEditingLevelId(null);
    setLevelNameInput('');
    setLevelOrderInput('');
    setLevelDescInput('');
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelNameInput.trim()) {
      toast.error('ကျောင်းအဆင့် အမည် ထည့်သွင်းပေးပါ');
      return;
    }
    setIsSavingLevel(true);
    try {
      if (editingLevelId) {
        await updateSchoolLevel(editingLevelId, {
          name: levelNameInput.trim(),
          order: levelOrderInput !== '' ? Number(levelOrderInput) : undefined,
          description: levelDescInput.trim(),
        });
        await recordAuditLog({
          action: 'update',
          entityType: 'school_level',
          entityId: editingLevelId,
          entityName: levelNameInput.trim(),
          details: `ကျောင်းအဆင့် "${levelNameInput.trim()}" ကို ပြင်ဆင်ခဲ့သည်`,
        });
        toast.success(`ကျောင်းအဆင့် "${levelNameInput.trim()}" ကို ပြင်ဆင်ပြီးပါပြီ`);
      } else {
        const newId = await addSchoolLevel(
          levelNameInput.trim(),
          levelDescInput.trim(),
          levelOrderInput !== '' ? Number(levelOrderInput) : undefined
        );
        await recordAuditLog({
          action: 'create',
          entityType: 'school_level',
          entityId: newId,
          entityName: levelNameInput.trim(),
          details: `ကျောင်းအဆင့်သစ် "${levelNameInput.trim()}" ကို ထည့်သွင်းခဲ့သည်`,
        });
        toast.success(`ကျောင်းအဆင့်သစ် "${levelNameInput.trim()}" ကို ထည့်သွင်းပြီးပါပြီ`);
      }
      handleCancelEditLevel();
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message || 'ကျောင်းအဆင့် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSavingLevel(false);
    }
  };

  const handleDeleteLevel = async (lvl: SchoolLevelItem) => {
    const schoolsInLevel = schools.filter(s => (s.level || '').trim().toLowerCase() === lvl.name.trim().toLowerCase());
    const confirmMsg = schoolsInLevel.length > 0
      ? `ဤကျောင်းအဆင့် "${lvl.name}" တွင် လက်ရှိ ကျောင်း (${schoolsInLevel.length}) ကျောင်း သတ်မှတ်ထားဆဲ ဖြစ်ပါသည်။ အမှန်တကယ် ဖျက်ပစ်ပါမည်လား?`
      : `ကျောင်းအဆင့် "${lvl.name}" ကို အပြီးပိုင် ဖျက်ပစ်ပါမည်လား?`;

    if (!confirm(confirmMsg)) return;

    try {
      await deleteSchoolLevel(lvl.id);
      await recordAuditLog({
        action: 'delete',
        entityType: 'school_level',
        entityId: lvl.id,
        entityName: lvl.name,
        details: `ကျောင်းအဆင့် "${lvl.name}" ကို ဖျက်ပစ်ခဲ့သည်`,
      });
      toast.success(`ကျောင်းအဆင့် "${lvl.name}" ကို ဖျက်ပစ်ပြီးပါပြီ`);
      fetchAuditLogs();
    } catch (err) {
      toast.error('ကျောင်းအဆင့် ဖျက်၍ မရပါ');
    }
  };

  const handleResetLevels = async () => {
    if (!confirm('ကျောင်းအဆင့်များကို မူလ သတ်မှတ်ချက်အတိုင်း ပြန်လည်ထားရှိပါမည်လား?')) return;
    try {
      await resetSchoolLevelsToDefault();
      await recordAuditLog({
        action: 'update',
        entityType: 'school_level',
        entityName: 'Reset Default Levels',
        details: 'ကျောင်းအဆင့်အားလုံးကို မူလ သတ်မှတ်ချက်အတိုင်း Reset ပြုလုပ်ခဲ့သည်',
      });
      fetchAuditLogs();
    } catch (err) {
      toast.error('Reset ပြုလုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  // Backup & Restore Handlers
  const handleExportFullBackup = async () => {
    try {
      setIsExportingBackup(true);
      toast.info('ဒေတာဘေ့စ် အချက်အလက်များ စုစည်းနေပါသည်...');

      const [schoolsSnap, assocSnap, annSnap, tickSnap, levelsSnap, adminsSnap] = await Promise.all([
        getDocs(collection(db, 'schools')),
        getDocs(collection(db, 'associations')),
        getDocs(collection(db, 'announcements')),
        getDocs(collection(db, 'tickers')),
        getDocs(collection(db, 'school_levels')),
        getDocs(collection(db, 'admins')),
      ]);

      const backupPayload = {
        meta: {
          appName: 'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — သတင်းနှင့် ပြန်ကြားရေးဌာန',
          version: '2.1',
          exportedAt: new Date().toISOString(),
          exportedBy: auth.currentUser?.email || adminSession.email || 'Admin',
        },
        counts: {
          schools: schoolsSnap.docs.length,
          associations: assocSnap.docs.length,
          announcements: annSnap.docs.length,
          tickers: tickSnap.docs.length,
          schoolLevels: levelsSnap.docs.length,
          admins: adminsSnap.docs.length,
        },
        collections: {
          schools: schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          associations: assocSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          announcements: annSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          tickers: tickSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          school_levels: levelsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          admins: adminsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        },
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `shan-south-ps-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await recordAuditLog({
        action: 'create',
        entityType: 'school',
        details: `ဒေတာဘေ့စ် တစ်ခုလုံး Full Backup (JSON) အဖြစ် အရန်သိမ်းဆည်း ဒေါင်းလုဒ် ရယူခဲ့သည် (ကျောင်း: ${backupPayload.counts.schools}၊ ကြေညာချက်: ${backupPayload.counts.announcements})`,
      });

      toast.success('Full Database Backup (JSON) အောင်မြင်စွာ ဒေါင်းလုဒ် ဆွဲပြီးပါပြီ');
      fetchAuditLogs();
    } catch (err: any) {
      console.error(err);
      toast.error('Backup ပြုလုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleSelectBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('ကျေးဇူးပြု၍ .json Backup ဖိုင်ကိုသာ ရွေးချယ်ပေးပါ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const collections = parsed.collections || {
          schools: parsed.schools || [],
          associations: parsed.associations || [],
          announcements: parsed.announcements || [],
          tickers: parsed.tickers || [],
          school_levels: parsed.schoolLevels || parsed.school_levels || [],
          admins: parsed.admins || [],
        };

        if (!collections.schools && !collections.announcements && !collections.associations) {
          toast.error('မှားယွင်းသော Backup ဖိုင် ပုံစံ ဖြစ်နေပါသည်');
          return;
        }

        setBackupRestoreData({
          meta: parsed.meta || {
            exportedAt: parsed.exportedAt || 'မသိရှိပါ',
            exportedBy: parsed.exportedBy || 'Admin',
          },
          counts: {
            schools: collections.schools?.length || 0,
            associations: collections.associations?.length || 0,
            announcements: collections.announcements?.length || 0,
            tickers: collections.tickers?.length || 0,
            schoolLevels: collections.school_levels?.length || 0,
            admins: collections.admins?.length || 0,
          },
          collections,
        });
        setBackupFileName(file.name);
        toast.success(`Backup ဖိုင် "${file.name}" ကို ဖတ်ရှုစစ်ဆေးပြီးပါပြီ`);
      } catch (err) {
        toast.error('JSON ဖိုင် ဖတ်ရှုရာတွင် အမှားဖြစ်ပွားပါသည်');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!backupRestoreData) return;
    const confirmMsg = `သတိပေးချက်: Backup ဖိုင်မှ ကျောင်း (${backupRestoreData.counts.schools}) ခု၊ ကြေညာချက် (${backupRestoreData.counts.announcements}) ခု၊ အသင်း (${backupRestoreData.counts.associations}) ခုကို Firestore ဒေတာဘေ့စ်သို့ ပြန်လည်သွင်းယူပါမည်။ သေချာပါသလား?`;
    if (!confirm(confirmMsg)) return;

    try {
      setIsRestoringBackup(true);
      toast.info('ဒေတာများ ပြန်လည် ရေးသွင်းနေပါသည်...');

      const collections = backupRestoreData.collections;

      const restoreCollection = async (collName: string, items: any[]) => {
        if (!items || items.length === 0) return;
        const chunkSize = 350;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          for (const item of chunk) {
            const { id, ...data } = item;
            const docRef = id ? doc(db, collName, id) : doc(collection(db, collName));
            if (restoreMode === 'merge') {
              batch.set(docRef, data, { merge: true });
            } else {
              batch.set(docRef, data);
            }
          }
          await batch.commit();
        }
      };

      if (collections.schools) await restoreCollection('schools', collections.schools);
      if (collections.associations) await restoreCollection('associations', collections.associations);
      if (collections.announcements) await restoreCollection('announcements', collections.announcements);
      if (collections.tickers) await restoreCollection('tickers', collections.tickers);
      if (collections.school_levels) await restoreCollection('school_levels', collections.school_levels);
      if (collections.admins && collections.admins.length > 0) {
        await restoreCollection('admins', collections.admins);
      }

      await recordAuditLog({
        action: 'create',
        entityType: 'school',
        details: `Backup ဖိုင် "${backupFileName}" မှ ဒေတာဘေ့စ် အချက်အလက်များအား Restore ပြန်လည်သွင်းယူခဲ့သည် (ကျောင်း: ${backupRestoreData.counts.schools}၊ ကြေညာချက်: ${backupRestoreData.counts.announcements})`,
      });

      toast.success('ဒေတာဘေ့စ် Restore အောင်မြင်စွာ ပြီးဆုံးပါပြီ');
      setBackupRestoreData(null);
      setBackupFileName('');
      fetchSchools();
      fetchAnnouncements();
      fetchAssociations();
      fetchTickers();
      fetchAdmins();
      fetchAuditLogs();
    } catch (err: any) {
      console.error(err);
      toast.error('Restore ပြုလုပ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(cloudinaryCloudName, cloudinaryPreset, cloudinaryFolder);
    setIsCloudinarySaved(true);
    toast.success('Cloudinary Settings အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ');
    setTimeout(() => setIsCloudinarySaved(false), 3000);
  };


  // Dashboard & School Summary Calculations
  const totalSchoolsCount = schools.length;
  const activeSchoolsCount = useMemo(() => schools.filter(s => (s.status || 'active') === 'active').length, [schools]);
  const underReviewSchoolsCount = useMemo(() => schools.filter(s => s.status === 'under_review').length, [schools]);
  const inactiveSchoolsCount = useMemo(() => schools.filter(s => s.status === 'inactive').length, [schools]);
  const feePaidCount = useMemo(() => schools.filter(s => s.isAnnualFeePaid === true).length, [schools]);
  const feeUnpaidCount = totalSchoolsCount - feePaidCount;

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(log => {
      const matchesSearch =
        !q ||
        (log.adminEmail && log.adminEmail.toLowerCase().includes(q)) ||
        (log.entityName && log.entityName.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.entityType && log.entityType.toLowerCase().includes(q));

      const matchesAction =
        auditActionFilter === 'all' ? true : log.action === auditActionFilter;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, auditSearch, auditActionFilter]);

  useEffect(() => {
    fetchAnnouncements();
    fetchAssociations();
    fetchSchools();
    fetchTickers();
    fetchAuditLogs();
    fetchAdmins();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'schools' ||
      tabParam === 'announcements' ||
      tabParam === 'associations' ||
      tabParam === 'tickers' ||
      tabParam === 'audit_logs' ||
      tabParam === 'admins'
    ) {
      setActiveTab(tabParam as any);
    }
    const editSchoolIdParam = searchParams.get('editSchoolId');
    if (editSchoolIdParam && schools.length > 0) {
      const targetSchool = schools.find(s => s.id === editSchoolIdParam);
      if (targetSchool) {
        startEditSchool(targetSchool);
      }
    }
  }, [searchParams, schools]);

  const onTickerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText.trim()) {
      toast.error('စာတန်းပြေးတွင် ပြသမည့် စာသား ရေးသားပေးပါ');
      return;
    }

    try {
      setSubmittingTicker(true);
      const displayDateTime = autoAssignDateTime
        ? getFormattedDateTime()
        : (customDateTime.trim() || getFormattedDateTime());

      if (editingTickerId) {
        await updateDoc(doc(db, 'tickers', editingTickerId), {
          text: tickerText.trim(),
          priority: tickerPriority,
          link: tickerLink.trim(),
          isActive: tickerIsActive,
          autoTimestamp: autoAssignDateTime,
          displayDateTime,
          updatedAt: new Date().toISOString(),
        });
        await recordAuditLog({
          action: 'update',
          entityType: 'ticker',
          entityId: editingTickerId,
          details: `စာတန်းပြေး "${tickerText.trim().substring(0, 30)}..." ပြင်ဆင်ခဲ့သည်`,
        });
        toast.success('စာတန်းပြေး အချက်အလက် ပြင်ဆင်ပြီးပါပြီ');
        setEditingTickerId(null);
      } else {
        const docRef = await addDoc(collection(db, 'tickers'), {
          text: tickerText.trim(),
          priority: tickerPriority,
          link: tickerLink.trim(),
          isActive: tickerIsActive,
          autoTimestamp: autoAssignDateTime,
          displayDateTime,
          createdAt: new Date().toISOString(),
        });
        await recordAuditLog({
          action: 'create',
          entityType: 'ticker',
          entityId: docRef.id,
          details: `စာတန်းပြေးအသစ် "${tickerText.trim().substring(0, 30)}..." တင်ခဲ့သည်`,
        });
        toast.success('စာတန်းပြေး အသစ်တင်ပြီးပါပြီ');
      }

      setTickerText('');
      setTickerLink('');
      setTickerPriority('info');
      setTickerIsActive(true);
      setAutoAssignDateTime(true);
      setCustomDateTime('');
      fetchTickers();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('စာတန်းပြေး သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setSubmittingTicker(false);
    }
  };

  const toggleTickerStatus = async (ticker: NewsTicker) => {
    try {
      await updateDoc(doc(db, 'tickers', ticker.id), {
        isActive: !ticker.isActive,
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog({
        action: 'update',
        entityType: 'ticker',
        entityId: ticker.id,
        details: `စာတန်းပြေး "${ticker.text.substring(0, 25)}..." အား ${ticker.isActive ? 'ပိတ်ခဲ့သည် (Inactive)' : 'Live ဖွင့်ခဲ့သည် (Active)'}`,
      });
      toast.success(
        ticker.isActive
          ? 'စာတန်းပြေးကို ပိတ်လိုက်ပါပြီ (Inactive)'
          : 'စာတန်းပြေးကို ဖွင့်လိုက်ပါပြီ (Live Active)'
      );
      fetchTickers();
      fetchAuditLogs();
    } catch (err) {
      toast.error('အခြေအနေ ပြောင်းလဲ၍ မရပါ');
    }
  };

  const deleteTicker = async (id: string) => {
    if (!confirm('ဤစာတန်းပြေးကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await deleteDoc(doc(db, 'tickers', id));
      await recordAuditLog({
        action: 'delete',
        entityType: 'ticker',
        entityId: id,
        details: 'စာတန်းပြေး ဖျက်ပစ်ခဲ့သည်',
      });
      toast.success('စာတန်းပြေး ဖျက်ပြီးပါပြီ');
      fetchTickers();
      fetchAuditLogs();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const startEditTicker = (ticker: NewsTicker) => {
    setEditingTickerId(ticker.id);
    setTickerText(ticker.text);
    setTickerPriority(ticker.priority || 'info');
    setTickerLink(ticker.link || '');
    setTickerIsActive(ticker.isActive);
    setAutoAssignDateTime(ticker.autoTimestamp ?? true);
    setCustomDateTime(ticker.displayDateTime || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditTicker = () => {
    setEditingTickerId(null);
    setTickerText('');
    setTickerLink('');
    setTickerPriority('info');
    setTickerIsActive(true);
    setAutoAssignDateTime(true);
    setCustomDateTime('');
  };

  const startEditAnnouncement = (a: any) => {
    setActiveTab('announcements');
    setEditingAnnouncementId(a.id);
    const dateVal = a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    announcementForm.reset({
      title: a.title || '',
      body: a.body || '',
      category: a.category || 'general',
      eventDate: dateVal,
      attachmentUrl: a.attachments && a.attachments.length > 0 ? a.attachments[0] : '',
    });
    setTimeout(() => {
      const elem = document.getElementById('announcement-form-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const cancelEditAnnouncement = () => {
    setEditingAnnouncementId(null);
    announcementForm.reset({
      title: '',
      body: '',
      category: 'general',
      eventDate: new Date().toISOString().split('T')[0],
      attachmentUrl: '',
    });
  };

  const onAnnouncementSubmit = async (data: any) => {
    try {
      const selectedDate = data.eventDate || new Date().toISOString().split('T')[0];
      const isoPublishedAt = new Date(`${selectedDate}T12:00:00Z`).toISOString();
      const payload = {
        title: data.title,
        body: data.body,
        category: data.category,
        eventDate: selectedDate, // Admin Set Date (Event Date)
        publishedAt: isoPublishedAt, // Synchronized with Admin Set Date
        attachments: data.attachmentUrl ? [data.attachmentUrl] : [],
      };

      if (editingAnnouncementId) {
        await updateAnnouncement(editingAnnouncementId, payload);
        await recordAuditLog({
          action: 'update',
          entityType: 'announcement',
          entityId: editingAnnouncementId,
          entityName: data.title,
          details: `ကြေညာချက် "${data.title}" ၏ အချက်အလက်နှင့် ရက်စွဲ (${selectedDate}) ပြင်ဆင်ခဲ့သည်`,
        });
        toast.success(`ကြေညာချက် "${data.title}" ကို ပြင်ဆင်ပြီးပါပြီ`);
        cancelEditAnnouncement();
      } else {
        const newId = await addAnnouncement({
          ...payload,
          createdAt: new Date().toISOString(), // System creation date, never used for sorting
        });
        await recordAuditLog({
          action: 'create',
          entityType: 'announcement',
          entityId: newId,
          entityName: data.title,
          details: `ကြေညာချက်အသစ် "${data.title}" (ရက်စွဲ: ${selectedDate}) တင်ခဲ့သည်`,
        });
        toast.success(`ကြေညာချက် "${data.title}" ကို တင်ပြီးပါပြီ`);
        cancelEditAnnouncement();
      }
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('ကြေညာချက် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('ဤကြေညာချက်ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await removeAnnouncement(id);
      await recordAuditLog({
        action: 'delete',
        entityType: 'announcement',
        entityId: id,
        details: `ကြေညာချက် (ID: ${id}) ကို ဖျက်ပစ်ခဲ့သည်`,
      });
      toast.success('ကြေညာချက် ဖျက်ပြီးပါပြီ');
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('ကြေညာချက် ဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const onAssociationSubmit = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'associations'), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      await recordAuditLog({
        action: 'create',
        entityType: 'association',
        entityId: docRef.id,
        entityName: data.name,
        details: `အသင်းနှင့် အမှုဆောင်အချက်အလက် "${data.name}" ထည့်သွင်းခဲ့သည်`,
      });
      toast.success('အသင်းနှင့် အမှုဆောင်အဖွဲ့ဝင်များ ထည့်သွင်းပြီးပါပြီ');
      associationForm.reset({
        name: '',
        township: '',
        address: '',
        phone: '',
        email: '',
        logoUrl: '',
        description: '',
        members: [{ name: '', role: 'ဥက္ကဋ္ဌ', school: '', phone: '', viber: '', telegram: '', photoUrl: '' }],
      });
      fetchAssociations();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('အသင်း ထည့်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const deleteAssociation = async (id: string) => {
    if (!confirm('ဤအသင်းနှင့် အမှုဆောင်အချက်အလက်ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await deleteDoc(doc(db, 'associations', id));
      await recordAuditLog({
        action: 'delete',
        entityType: 'association',
        entityId: id,
        details: 'အသင်းနှင့် အမှုဆောင်အချက်အလက် ဖျက်ပစ်ခဲ့သည်',
      });
      toast.success('အသင်း ဖျက်ပြီးပါပြီ');
      fetchAssociations();
      fetchAuditLogs();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const startEditSchool = (school: any) => {
    setActiveTab('schools');
    setEditingSchoolId(school.id);
    const rangeTier = getStudentRangeTier(school.studentRange);
    schoolForm.reset({
      name: school.name || '',
      level: school.level || '၁။ အထက်တန်း',
      studentRange: school.studentRange || '0-100',
      studentCount: school.studentCount !== undefined && school.studentCount !== null ? school.studentCount : '',
      feeAmount: school.feeAmount !== undefined && school.feeAmount !== null ? school.feeAmount : (rangeTier?.defaultFee ?? 200000),
      feeAcademicYear: school.feeAcademicYear || '၂၀၂၄-၂၀၂၅',
      feePaidDate: school.feePaidDate || '',
      logoUrl: school.logoUrl || '',
      schoolPhone: school.schoolPhone || '',
      schoolPhone2: school.schoolPhone2 || '',
      founderName: school.founderName || '',
      founderPhone: school.founderPhone || '',
      founderPhone2: school.founderPhone2 || '',
      founderViber: school.founderViber || '',
      founderTelegram: school.founderTelegram || '',
      adminName: school.adminName || '',
      adminPhone: school.adminPhone || '',
      adminPhone2: school.adminPhone2 || '',
      adminViber: school.adminViber || '',
      adminTelegram: school.adminTelegram || '',
      contactName: school.responsiblePerson1Name || school.contactName || '',
      contactRole: school.responsiblePerson1Role || school.contactRole || '',
      contactPhone: school.responsiblePerson1Phone || school.contactPhone || '',
      contactPhone2: school.responsiblePerson1Phone2 || school.contactPhone2 || '',
      contactViber: school.responsiblePerson1Viber || school.contactViber || '',
      contactTelegram: school.responsiblePerson1Telegram || school.contactTelegram || '',
      contact2Name: school.responsiblePerson2Name || school.contact2Name || '',
      contact2Role: school.responsiblePerson2Role || school.contact2Role || '',
      contact2Phone: school.responsiblePerson2Phone || school.contact2Phone || '',
      contact2Phone2: school.responsiblePerson2Phone2 || school.contact2Phone2 || '',
      contact2Viber: school.responsiblePerson2Viber || school.contact2Viber || '',
      contact2Telegram: school.responsiblePerson2Telegram || school.contact2Telegram || '',
      schoolNote: school.schoolNote || '',
      note: school.note || '',
      isAnnualFeePaid: school.isAnnualFeePaid ?? false,
      status: school.status || 'active',
    });
    setExtraSchoolPhones(Array.isArray(school.schoolPhones) ? [...school.schoolPhones] : []);
    setExtraFounderPhones(Array.isArray(school.founderPhones) ? [...school.founderPhones] : []);
    setExtraAdminPhones(Array.isArray(school.adminPhones) ? [...school.adminPhones] : []);
    setExtraCoord1Phones(
      Array.isArray(school.responsiblePerson1Phones) && school.responsiblePerson1Phones.length > 0
        ? [...school.responsiblePerson1Phones]
        : (Array.isArray(school.contactPhones) ? [...school.contactPhones] : [])
    );
    setExtraCoord2Phones(
      Array.isArray(school.responsiblePerson2Phones) && school.responsiblePerson2Phones.length > 0
        ? [...school.responsiblePerson2Phones]
        : (Array.isArray(school.contact2Phones) ? [...school.contact2Phones] : [])
    );
    setTimeout(() => {
      const formElem = document.getElementById('school-form-section');
      if (formElem) {
        formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const cancelEditSchool = () => {
    setEditingSchoolId(null);
    schoolForm.reset({
      name: '',
      level: '၁။ အထက်တန်း',
      studentRange: '0-100',
      studentCount: '',
      feeAmount: 200000,
      feeAcademicYear: '၂၀၂၄-၂၀၂၅',
      feePaidDate: '',
      logoUrl: '',
      schoolPhone: '',
      schoolPhone2: '',
      founderName: '',
      founderPhone: '',
      founderPhone2: '',
      founderViber: '',
      founderTelegram: '',
      adminName: '',
      adminPhone: '',
      adminPhone2: '',
      adminViber: '',
      adminTelegram: '',
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactPhone2: '',
      contactViber: '',
      contactTelegram: '',
      contact2Name: '',
      contact2Role: '',
      contact2Phone: '',
      contact2Phone2: '',
      contact2Viber: '',
      contact2Telegram: '',
      schoolNote: '',
      note: '',
      isAnnualFeePaid: false,
      status: 'active',
    });
    setExtraSchoolPhones([]);
    setExtraFounderPhones([]);
    setExtraAdminPhones([]);
    setExtraCoord1Phones([]);
    setExtraCoord2Phones([]);
  };

  const updateSchoolStatus = async (school: any, newStatus: 'active' | 'under_review' | 'inactive') => {
    try {
      await updateSchool(school.id, {
        status: newStatus,
      });
      const statusLabel =
        newStatus === 'active'
          ? 'လည်ပတ်ဆဲ (Active)'
          : newStatus === 'under_review'
          ? 'စိစစ်ဆဲ (Under Review)'
          : 'ယာယီရပ်နား (Inactive)';
      await recordAuditLog({
        action: 'update',
        entityType: 'school',
        entityId: school.id,
        entityName: school.name,
        details: `ကျောင်းအခြေအနေကို "${statusLabel}" အဖြစ် ပြောင်းလဲခဲ့သည်`,
      });
      toast.success(`"${school.name}" ၏ အခြေအနေကို "${statusLabel}" အဖြစ် ပြောင်းလဲလိုက်ပါပြီ`);
      fetchAuditLogs();
    } catch (err) {
      toast.error('အခြေအနေ ပြောင်းလဲ၍ မရပါ');
    }
  };

  const toggleSchoolFeeStatus = async (school: any) => {
    try {
      const nextStatus = !school.isAnnualFeePaid;
      await updateSchool(school.id, {
        isAnnualFeePaid: nextStatus,
        feePaidDate: nextStatus ? (school.feePaidDate || new Date().toISOString().split('T')[0]) : '',
      });
      await recordAuditLog({
        action: 'update',
        entityType: 'school',
        entityId: school.id,
        entityName: school.name,
        details: `နှစ်စဉ်ကြေးကို "${nextStatus ? 'ပေးသွင်းပြီး (Paid)' : 'မပေးရသေး (Unpaid)'}" အဖြစ် ပြောင်းလဲခဲ့သည်`,
      });
      toast.success(
        nextStatus
          ? `"${school.name}" ၏ နှစ်စဉ်ကြေးကို ပေးသွင်းပြီးအဖြစ် ပြောင်းလဲလိုက်ပါပြီ`
          : `"${school.name}" ၏ နှစ်စဉ်ကြေးကို မပေးသွင်းရသေးအဖြစ် ပြောင်းလဲလိုက်ပါပြီ`
      );
      fetchAuditLogs();
    } catch (err) {
      toast.error('နှစ်စဉ်ကြေး အခြေအနေ ပြောင်းလဲ၍ မရပါ');
    }
  };

  const onSchoolSubmit = async (data: any) => {
    try {
      const rawCount = (data.studentCount !== undefined && data.studentCount !== '' && data.studentCount !== null)
        ? Number(String(data.studentCount).replace(/[^0-9]/g, ''))
        : null;
      const cleanStudentCount = (rawCount !== null && !isNaN(rawCount)) ? rawCount : null;

      const rawFee = (data.feeAmount !== undefined && data.feeAmount !== '' && data.feeAmount !== null)
        ? Number(String(data.feeAmount).replace(/[^0-9]/g, ''))
        : null;
      const cleanFeeAmount = (rawFee !== null && !isNaN(rawFee))
        ? rawFee
        : (getStudentRangeTier(data.studentRange)?.defaultFee ?? 200000);

      const cleanSchoolPhones = extraSchoolPhones.map(p => p.trim()).filter(Boolean);
      const cleanFounderPhones = extraFounderPhones.map(p => p.trim()).filter(Boolean);
      const cleanAdminPhones = extraAdminPhones.map(p => p.trim()).filter(Boolean);
      const cleanCoord1Phones = extraCoord1Phones.map(p => p.trim()).filter(Boolean);
      const cleanCoord2Phones = extraCoord2Phones.map(p => p.trim()).filter(Boolean);

      const payload = {
        ...data,
        schoolPhone: data.schoolPhone ? data.schoolPhone.trim() : '',
        schoolPhone2: data.schoolPhone2 ? data.schoolPhone2.trim() : '',
        schoolPhones: cleanSchoolPhones,
        founderName: data.founderName ? data.founderName.trim() : '',
        founderPhone: data.founderPhone ? data.founderPhone.trim() : '',
        founderPhone2: data.founderPhone2 ? data.founderPhone2.trim() : '',
        founderPhones: cleanFounderPhones,
        founderViber: data.founderViber ? data.founderViber.trim() : '',
        founderTelegram: data.founderTelegram ? data.founderTelegram.trim() : '',
        adminName: data.adminName ? data.adminName.trim() : '',
        adminPhone: data.adminPhone ? data.adminPhone.trim() : '',
        adminPhone2: data.adminPhone2 ? data.adminPhone2.trim() : '',
        adminPhones: cleanAdminPhones,
        adminViber: data.adminViber ? data.adminViber.trim() : '',
        adminTelegram: data.adminTelegram ? data.adminTelegram.trim() : '',
        contactName: data.contactName ? data.contactName.trim() : (data.responsiblePerson1Name ? data.responsiblePerson1Name.trim() : ''),
        contactRole: data.contactRole ? data.contactRole.trim() : (data.responsiblePerson1Role ? data.responsiblePerson1Role.trim() : ''),
        contactPhone: data.contactPhone ? data.contactPhone.trim() : (data.responsiblePerson1Phone ? data.responsiblePerson1Phone.trim() : ''),
        contactPhone2: data.contactPhone2 ? data.contactPhone2.trim() : (data.responsiblePerson1Phone2 ? data.responsiblePerson1Phone2.trim() : ''),
        contactPhones: cleanCoord1Phones,
        responsiblePerson1Name: data.contactName ? data.contactName.trim() : (data.responsiblePerson1Name ? data.responsiblePerson1Name.trim() : ''),
        responsiblePerson1Role: data.contactRole ? data.contactRole.trim() : (data.responsiblePerson1Role ? data.responsiblePerson1Role.trim() : ''),
        responsiblePerson1Phone: data.contactPhone ? data.contactPhone.trim() : (data.responsiblePerson1Phone ? data.responsiblePerson1Phone.trim() : ''),
        responsiblePerson1Phone2: data.contactPhone2 ? data.contactPhone2.trim() : (data.responsiblePerson1Phone2 ? data.responsiblePerson1Phone2.trim() : ''),
        responsiblePerson1Phones: cleanCoord1Phones,
        contactViber: data.contactViber ? data.contactViber.trim() : (data.responsiblePerson1Viber ? data.responsiblePerson1Viber.trim() : ''),
        contactTelegram: data.contactTelegram ? data.contactTelegram.trim() : (data.responsiblePerson1Telegram ? data.responsiblePerson1Telegram.trim() : ''),
        responsiblePerson1Viber: data.contactViber ? data.contactViber.trim() : (data.responsiblePerson1Viber ? data.responsiblePerson1Viber.trim() : ''),
        responsiblePerson1Telegram: data.contactTelegram ? data.contactTelegram.trim() : (data.responsiblePerson1Telegram ? data.responsiblePerson1Telegram.trim() : ''),

        contact2Name: data.contact2Name ? data.contact2Name.trim() : (data.responsiblePerson2Name ? data.responsiblePerson2Name.trim() : ''),
        contact2Role: data.contact2Role ? data.contact2Role.trim() : (data.responsiblePerson2Role ? data.responsiblePerson2Role.trim() : ''),
        contact2Phone: data.contact2Phone ? data.contact2Phone.trim() : (data.responsiblePerson2Phone ? data.responsiblePerson2Phone.trim() : ''),
        contact2Phone2: data.contact2Phone2 ? data.contact2Phone2.trim() : (data.responsiblePerson2Phone2 ? data.responsiblePerson2Phone2.trim() : ''),
        contact2Phones: cleanCoord2Phones,
        responsiblePerson2Name: data.contact2Name ? data.contact2Name.trim() : (data.responsiblePerson2Name ? data.responsiblePerson2Name.trim() : ''),
        responsiblePerson2Role: data.contact2Role ? data.contact2Role.trim() : (data.responsiblePerson2Role ? data.responsiblePerson2Role.trim() : ''),
        responsiblePerson2Phone: data.contact2Phone ? data.contact2Phone.trim() : (data.responsiblePerson2Phone ? data.responsiblePerson2Phone.trim() : ''),
        responsiblePerson2Phone2: data.contact2Phone2 ? data.contact2Phone2.trim() : (data.responsiblePerson2Phone2 ? data.responsiblePerson2Phone2.trim() : ''),
        responsiblePerson2Phones: cleanCoord2Phones,
        contact2Viber: data.contact2Viber ? data.contact2Viber.trim() : (data.responsiblePerson2Viber ? data.responsiblePerson2Viber.trim() : ''),
        contact2Telegram: data.contact2Telegram ? data.contact2Telegram.trim() : (data.responsiblePerson2Telegram ? data.responsiblePerson2Telegram.trim() : ''),
        responsiblePerson2Viber: data.contact2Viber ? data.contact2Viber.trim() : (data.responsiblePerson2Viber ? data.responsiblePerson2Viber.trim() : ''),
        responsiblePerson2Telegram: data.contact2Telegram ? data.contact2Telegram.trim() : (data.responsiblePerson2Telegram ? data.responsiblePerson2Telegram.trim() : ''),
        studentRange: data.studentRange || '0-100',
        studentCount: cleanStudentCount,
        feeAmount: cleanFeeAmount,
        feeAcademicYear: data.feeAcademicYear || '၂၀၂၄-၂၀၂၅',
        feePaidDate: data.feePaidDate || '',
      };

      if (editingSchoolId) {
        await updateSchool(editingSchoolId, payload);
        await recordAuditLog({
          action: 'update',
          entityType: 'school',
          entityId: editingSchoolId,
          entityName: data.name,
          details: `ကျောင်း "${data.name}" ၏ အချက်အလက်များ ပြင်ဆင်ခဲ့သည်`,
        });
        toast.success(`ကျောင်းအချက်အလက် "${data.name}" ကို ပြင်ဆင်ပြီးပါပြီ`);
        cancelEditSchool();
      } else {
        const newId = await addSchool(payload);
        await recordAuditLog({
          action: 'create',
          entityType: 'school',
          entityId: newId,
          entityName: data.name,
          details: `ကျောင်းအသစ် "${data.name}" ထည့်သွင်းခဲ့သည်`,
        });
        toast.success(`ကျောင်းအသစ် "${data.name}" ကို ထည့်သွင်းပြီးပါပြီ`);
        cancelEditSchool();
      }
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('ကျောင်းအချက်အလက် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const deleteSchool = async (id: string, name?: string) => {
    if (!confirm(`"${name || 'ဤကျောင်း'}" ၏ အချက်အလက်များကို အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`)) return;
    try {
      await deleteSchoolFromContext(id);
      await recordAuditLog({
        action: 'delete',
        entityType: 'school',
        entityId: id,
        entityName: name || id,
        details: `ကျောင်း "${name || id}" အား အပြီးပိုင် ဖျက်ပစ်ခဲ့သည်`,
      });
      toast.success('ကျောင်းအချက်အလက် ဖျက်ပြီးပါပြီ');
      if (editingSchoolId === id) {
        cancelEditSchool();
      }
      setSelectedSchoolIds(prev => prev.filter(x => x !== id));
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('ဖျက်၍ မရပါ');
    }
  };

  const filteredAdminSchools = useMemo(() => {
    const q = adminSchoolSearch.trim().toLowerCase();
    return schools.filter(s => {
      const matchesSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.level && s.level.toLowerCase().includes(q)) ||
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q));

      const matchesFee =
        adminFeeFilter === 'all'
          ? true
          : adminFeeFilter === 'paid'
          ? s.isAnnualFeePaid === true
          : !s.isAnnualFeePaid;

      const schoolStatus = s.status || 'active';
      const matchesStatus =
        adminStatusFilter === 'all'
          ? true
          : schoolStatus === adminStatusFilter;

      return matchesSearch && matchesFee && matchesStatus;
    });
  }, [schools, adminSchoolSearch, adminFeeFilter, adminStatusFilter]);

  const toggleSelectSchool = (id: string) => {
    setSelectedSchoolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredSchools = () => {
    const filteredIds = filteredAdminSchools.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedSchoolIds.includes(id));
    if (allSelected) {
      // Deselect those filtered ids
      setSelectedSchoolIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add all filtered ids to selection
      setSelectedSchoolIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkDeleteSchools = async () => {
    if (selectedSchoolIds.length === 0) {
      toast.info('ဖျက်ရန် ကျောင်းတစ်ခုမျှ ရွေးချယ်ထားခြင်း မရှိပါ');
      return;
    }

    const count = selectedSchoolIds.length;
    if (!confirm(`ရွေးချယ်ထားသော ကျောင်း (${count}) ခုကို အပြီးပိုင် ဖျက်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍ မရပါ။`)) {
      return;
    }

    try {
      setIsDeletingBulk(true);
      const batch = writeBatch(db);
      selectedSchoolIds.forEach(id => {
        batch.delete(doc(db, 'schools', id));
      });
      await batch.commit();
      await recordAuditLog({
        action: 'bulk_delete',
        entityType: 'school',
        details: `ကျောင်း (${count}) ခုကို တစ်ပြိုင်နက် ဖျက်ပစ်ခဲ့သည်`,
      });
      toast.success(`ရွေးချယ်ထားသော ကျောင်း (${count}) ခုကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ`);
      if (editingSchoolId && selectedSchoolIds.includes(editingSchoolId)) {
        cancelEditSchool();
      }
      setSelectedSchoolIds([]);
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('အများအပြား ဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const cleanExistingDuplicates = async () => {
    if (schools.length === 0) {
      toast.info('စစ်ဆေးရန် ကျောင်းစာရင်း မရှိသေးပါ');
      return;
    }

    // Group schools by normalized name
    const grouped = new Map<string, any[]>();
    schools.forEach(s => {
      const key = s.name ? s.name.trim().toLowerCase().replace(/\s+/g, ' ') : '';
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(s);
    });

    const duplicatesToDelete: any[] = [];
    grouped.forEach((list) => {
      if (list.length > 1) {
        // Sort: best record kept at index 0
        list.sort((a, b) => {
          const scoreA = (a.isAnnualFeePaid ? 3 : 0) + (a.schoolPhone ? 1 : 0) + (a.founderName ? 1 : 0) + (a.adminName ? 1 : 0);
          const scoreB = (b.isAnnualFeePaid ? 3 : 0) + (b.schoolPhone ? 1 : 0) + (b.founderName ? 1 : 0) + (b.adminName ? 1 : 0);
          return scoreB - scoreA;
        });
        duplicatesToDelete.push(...list.slice(1));
      }
    });

    if (duplicatesToDelete.length === 0) {
      toast.success('ထပ်နေသော (Duplicate) ကျောင်း မတွေ့ရှိပါ။ ကျောင်းစာရင်းများ သန့်ရှင်းပြီးဖြစ်ပါသည်');
      return;
    }

    if (!confirm(`ထပ်နေသော Duplicate ကျောင်း (${duplicatesToDelete.length}) ခု တွေ့ရှိပါသည်။ ၎င်းတို့ကို ဖယ်ရှားရှင်းလင်းရန် သေချာပါသလား? (မူရင်း ၁ ကျောင်းစီကို အပြည့်အစုံ ဆက်လက်ထိန်းသိမ်းထားပါမည်)`)) {
      return;
    }

    try {
      setCleaningDuplicates(true);
      const batch = writeBatch(db);
      duplicatesToDelete.forEach(d => {
        batch.delete(doc(db, 'schools', d.id));
      });
      await batch.commit();
      await recordAuditLog({
        action: 'bulk_delete',
        entityType: 'school',
        details: `ထပ်နေသော Duplicate ကျောင်း (${duplicatesToDelete.length}) ခုကို ရှင်းလင်းဖျက်ပစ်ခဲ့သည်`,
      });
      toast.success(`ထပ်နေသော ကျောင်း (${duplicatesToDelete.length}) ခုကို အောင်မြင်စွာ ဖယ်ရှားရှင်းလင်းပြီးပါပြီ`);
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('Duplicate ဖယ်ရှားရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (!data || data.length === 0) {
          toast.error('Excel ဖိုင်ထဲတွင် ဒေတာ မရှိပါ');
          return;
        }

        const validSchools = data
          .map(normalizeSchoolRow)
          .filter(s => s.name.length > 0);

        if (validSchools.length === 0) {
          toast.error('ထည့်သွင်းရန် အကျုံးဝင်သော ကျောင်းအမည် မတွေ့ရှိပါ');
          return;
        }

        // 1. Deduplicate rows within the uploaded Excel file itself first
        const uniqueFileSchoolsMap = new Map<string, typeof validSchools[0]>();
        validSchools.forEach(s => {
          const key = s.name.trim().toLowerCase().replace(/\s+/g, ' ');
          if (uniqueFileSchoolsMap.has(key)) {
            const existing = uniqueFileSchoolsMap.get(key)!;
            // Merge so newly filled fields take precedence
            uniqueFileSchoolsMap.set(key, { ...existing, ...s });
          } else {
            uniqueFileSchoolsMap.set(key, s);
          }
        });
        const fileUniqueSchools = Array.from(uniqueFileSchoolsMap.values());

        // 2. Build existing database schools lookup map
        const existingDbSchoolsMap = new Map<string, any>();
        schools.forEach(s => {
          if (s.name) {
            const key = s.name.trim().toLowerCase().replace(/\s+/g, ' ');
            existingDbSchoolsMap.set(key, s);
          }
        });

        let newCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        const batch = writeBatch(db);

        fileUniqueSchools.forEach(schoolItem => {
          const key = schoolItem.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const existingSchool = existingDbSchoolsMap.get(key);

          if (existingSchool) {
            if (duplicateMode === 'update') {
              // Merge/update into existing school document - NO duplicate created!
              const docRef = doc(db, 'schools', existingSchool.id);
              batch.set(
                docRef,
                {
                  ...schoolItem,
                  createdAt: existingSchool.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
              updatedCount++;
            } else if (duplicateMode === 'skip') {
              // Skip existing school - leave untouched
              skippedCount++;
            } else {
              // 'add' - add as new document anyway
              const docRef = doc(collection(db, 'schools'));
              batch.set(docRef, { ...schoolItem, createdAt: new Date().toISOString() });
              newCount++;
            }
          } else {
            // Brand new school not currently in database
            const docRef = doc(collection(db, 'schools'));
            batch.set(docRef, { ...schoolItem, createdAt: new Date().toISOString() });
            newCount++;
          }
        });

        await batch.commit();

        await recordAuditLog({
          action: 'create',
          entityType: 'school',
          details: `Excel ဖိုင်မှ ကျောင်းစာရင်း တင်သွင်းခဲ့သည် (အသစ်: ${newCount}၊ ပြင်ဆင်: ${updatedCount}၊ ကျော်ခဲ့: ${skippedCount})`,
        });

        setImportStats({
          totalInFile: validSchools.length,
          newCount,
          updatedCount,
          skippedCount,
          mode: duplicateMode,
        });

        toast.success(
          `Excel တင်သွင်းမှု အောင်မြင်ပါသည်: အသစ် (${newCount}) ခု၊ Update (${updatedCount}) ခု၊ ကျော်ခဲ့ (${skippedCount}) ခု`
        );
        fetchSchools();
        fetchAuditLogs();
      } catch (err) {
        console.error(err);
        toast.error('Excel ဖတ်ရာတွင် အမှားဖြစ်ပွားပါသည်');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    downloadSchoolTemplate();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950">အက်ဒမင် ဧရိယာ (Admin Area)</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">အသင်းများ၊ ကြေညာချက်များ၊ အသင်းဝင်ကျောင်းများ၊ အက်ဒမင်များနှင့် လုပ်ဆောင်ချက် မှတ်တမ်းများ</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-sky-900">{adminSession.email || 'khunthanshwe@gmail.com'}</span>
            <span>•</span>
            <span className="text-slate-400">စနစ်ထိန်းချုပ်ခွင့် အပြည့်အစုံ ရရှိထားပါသည်</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Admin အကောင့်မှ ထွက်ခွာမည်"
          >
            <LogOut className="w-4 h-4" />
            <span>အကောင့်ထွက်မည် (Logout)</span>
          </button>
        </div>
      </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('announcements')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" /> ကြေညာချက်များ
          </button>
          <button
            onClick={() => setActiveTab('associations')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'associations'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" /> အသင်းများနှင့် အမှုဆောင်
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'schools'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SchoolIcon className="w-4 h-4 shrink-0" /> အသင်းဝင်ကျောင်းများ
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>ကျောင်းအဆင့်များ</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full">
              {schoolLevels.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tickers')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tickers'
                ? 'bg-white text-rose-900 shadow-xs ring-1 ring-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4 shrink-0 text-rose-600" /> စာတန်းပြေး (Ticker)
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'audit_logs'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>မှတ်တမ်း</span>
            {auditLogs.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full">
                {auditLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'admins'
                ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
            <span>အက်ဒမင်များ</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full">
              {admins.length + 1}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            type="button"
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
              activeTab === 'backup'
                ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-400 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDriveDownload className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>အရန်သိမ်း/ပြန်ယူ (Backup)</span>
          </button>
        </div>

      {/* Summary Stat Cards for Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Schools */}
        <div
          onClick={() => {
            setActiveTab('schools');
            setAdminStatusFilter('all');
            setAdminFeeFilter('all');
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-sky-300 transition cursor-pointer group space-y-2 select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">စုစုပေါင်း ကျောင်းများ</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition">
              <SchoolIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-950">{totalSchoolsCount}</span>
            <span className="text-xs text-slate-500 font-medium">ကျောင်း</span>
          </div>
          <p className="text-[11px] text-sky-700 font-semibold flex items-center gap-1 group-hover:underline">
            အကုန်ကြည့်ရှုရန် &rarr;
          </p>
        </div>

        {/* Card 2: Active Schools */}
        <div
          onClick={() => {
            setActiveTab('schools');
            setAdminStatusFilter('active');
          }}
          className={`p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition cursor-pointer group space-y-2 select-none ${
            adminStatusFilter === 'active' && activeTab === 'schools'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active (လည်ပတ်ဆဲ)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{activeSchoolsCount}</span>
            <span className="text-xs text-emerald-700 font-medium">ကျောင်း</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 group-hover:underline">
            စစ်ထုတ်ကြည့်မည် &rarr;
          </p>
        </div>

        {/* Card 3: Under Review Schools */}
        <div
          onClick={() => {
            setActiveTab('schools');
            setAdminStatusFilter('under_review');
          }}
          className={`p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition cursor-pointer group space-y-2 select-none ${
            adminStatusFilter === 'under_review' && activeTab === 'schools'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Under Review (စိစစ်ဆဲ)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950">{underReviewSchoolsCount}</span>
            <span className="text-xs text-amber-700 font-medium">ကျောင်း</span>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 group-hover:underline">
            စိစစ်ရန် ကျောင်းများ &rarr;
          </p>
        </div>

        {/* Card 4: Fee & Inactive Status Summary */}
        <div
          onClick={() => {
            setActiveTab('schools');
            setAdminFeeFilter('paid');
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-sky-300 transition cursor-pointer group space-y-2 select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">နှစ်စဉ်ကြေး ပေးသွင်းမှု</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xl sm:text-2xl font-black text-emerald-700">{feePaidCount}</span>
              <span className="text-[10px] text-slate-500 ml-1 font-semibold">ပေးပြီး</span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-rose-600">{feeUnpaidCount}</span>
              <span className="text-[10px] text-slate-500 ml-1 font-semibold">ကျန်</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${totalSchoolsCount > 0 ? (feePaidCount / totalSchoolsCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-8">
          <form
            id="announcement-form-section"
            onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)}
            className={`p-6 sm:p-8 rounded-2xl border shadow-xs space-y-5 ${
              editingAnnouncementId
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-bold text-sky-950 flex items-center gap-2">
                {editingAnnouncementId ? (
                  <>
                    <Edit2 className="w-5 h-5 text-amber-600" /> ကြေညာချက် ပြင်ဆင်ရန် (Edit Announcement)
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-sky-600" /> ကြေညာချက် အသစ်တင်ရန် (New Announcement)
                  </>
                )}
              </h3>
              {editingAnnouncementId && (
                <button
                  type="button"
                  onClick={cancelEditAnnouncement}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer shadow-2xs"
                >
                  မပြင်တော့ပါ (Cancel)
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ကဏ္ဍ ရွေးချယ်ပါ (Category) *
                  </label>
                  <select
                    {...announcementForm.register('category')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:border-sky-500 outline-hidden"
                  >
                    {ANNOUNCEMENT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({cat.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>ကြေညာချက်ရက်စွဲ (Admin Set Date / Event Date) *</span>
                  </label>
                  <input
                    type="date"
                    {...announcementForm.register('eventDate')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:border-sky-500 outline-hidden font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    (စာရင်းသွင်းသည့်ရက် မဟုတ်ဘဲ ကြေညာချက် ထုတ်ပြန်သည့်ရက် သို့မဟုတ် အခမ်းအနားရက်စွဲ)
                  </p>
                  {announcementForm.formState.errors.eventDate && (
                    <p className="text-xs text-rose-500 mt-1">{announcementForm.formState.errors.eventDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ကြေညာချက် ခေါင်းစဉ် (Title) *
                </label>
                <input
                  {...announcementForm.register('title')}
                  placeholder="ဥပမာ - ၂၀၂၆-၂၀၂၇ ပညာသင်နှစ် နှစ်ပတ်လည် အထွေထွေအစည်းအဝေး ဖိတ်ကြားလွှာ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-hidden"
                />
                {announcementForm.formState.errors.title && (
                  <p className="text-xs text-rose-500 mt-1">{announcementForm.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  အကြောင်းအရာ အပြည့်အစုံ (Body Content) *
                </label>
                <textarea
                  {...announcementForm.register('body')}
                  rows={5}
                  placeholder="ကြေညာချက် အကြောင်းအရာ အသေးစိတ် ရေးသားပါ..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-hidden"
                />
                {announcementForm.formState.errors.body && (
                  <p className="text-xs text-rose-500 mt-1">{announcementForm.formState.errors.body.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <ImageUploadDropzone
                  value={announcementForm.watch('attachmentUrl') || ''}
                  onChange={(url) => announcementForm.setValue('attachmentUrl', url)}
                  label="ပူးတွဲဖိုင် / ဓာတ်ပုံ (Attachment Image - စိတ်ကြိုက်)"
                  helperText="ကြေညာချက်နှင့် သက်ဆိုင်သော ဓာတ်ပုံ (JPG, PNG) တင်နိုင်ပါသည်"
                  folder="shan-state-announcements"
                  onOpenSettings={() => setActiveTab('backup')}
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={announcementForm.formState.isSubmitting}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition cursor-pointer disabled:opacity-50 ${
                    editingAnnouncementId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-sky-900 hover:bg-sky-800'
                  }`}
                >
                  {editingAnnouncementId
                    ? 'ကြေညာချက် ပြင်ဆင်ချက် သိမ်းဆည်းမည် (Update Announcement)'
                    : 'ကြေညာချက် တင်မည် (Publish)'}
                </button>
                {editingAnnouncementId && (
                  <button
                    type="button"
                    onClick={cancelEditAnnouncement}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    မပြင်တော့ပါ (Cancel)
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Existing Announcements List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                တင်ထားပြီးသော ကြေညာချက်များ ({announcements.length})
              </h3>
              <span className="text-xs text-sky-800 font-semibold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                ✓ Event Date ရက်စွဲအလိုက် အလိုအလျောက် စီစဉ်ထားသည်
              </span>
            </div>
            {loadingAnnouncements ? (
              <p className="text-sm text-slate-400">တင်ထားသော ဒေတာများ ဆွဲယူနေပါသည်...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">ကြေညာချက် မရှိသေးပါ</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedAnnouncements.map(a => {
                  const badge = getCategoryBadge(a.category);
                  const displayDate = a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : '');
                  return (
                    <div key={a.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{a.title}</span>
                          {editingAnnouncementId === a.id && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                              ပြင်ဆင်နေသည်
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            ရက်စွဲ (Admin Set Date): <strong>{displayDate || 'မသတ်မှတ်ထားပါ'}</strong>
                          </span>
                          {a.createdAt && (
                            <span className="text-[11px] text-slate-400">
                              (စာရင်းသွင်း: {new Date(a.createdAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => startEditAnnouncement(a)}
                          type="button"
                          className="text-amber-700 hover:text-amber-900 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 border border-amber-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs"
                          title="ပြင်ဆင်ရန်"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> ပြင်ဆင်မည်
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          type="button"
                          className="text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs"
                          title="ဖျက်ရန်"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ဖျက်မည်
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Associations Tab */}
      {activeTab === 'associations' && (
        <div className="space-y-8">
          <form
            onSubmit={associationForm.handleSubmit(onAssociationSubmit)}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
          >
            <h3 className="font-bold text-xl text-sky-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" /> အသင်းအသစ်နှင့် အမှုဆောင်များ ထည့်သွင်းရန် (Add Association & Committee)
            </h3>

            {/* Association Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">အသင်းအမည် (Association Name) *</label>
                <input
                  {...associationForm.register('name')}
                  placeholder="ဥပမာ - ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း (ဗဟို)"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
                {associationForm.formState.errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{associationForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">မြို့နယ် / ဒေသ (Township)</label>
                <input
                  {...associationForm.register('township')}
                  placeholder="ဥပမာ - တောင်ကြီး / အောင်ပန်း / ကလော"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">အသင်း ဆက်သွယ်ရန် ဖုန်း (Phone)</label>
                <input
                  {...associationForm.register('phone')}
                  placeholder="09..."
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">အီးမေးလ် (Email)</label>
                <input
                  {...associationForm.register('email')}
                  placeholder="info@..."
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">ရုံးစိုက်ရာ လိပ်စာ (Address)</label>
                <input
                  {...associationForm.register('address')}
                  placeholder="ရုံးခန်းလိပ်စာ..."
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageUploadDropzone
                  value={associationForm.watch('logoUrl') || ''}
                  onChange={(url) => associationForm.setValue('logoUrl', url)}
                  label="အသင်း Logo / အမှတ်တံဆိပ် (Association Logo)"
                  helperText="အသင်း၏ တံဆိပ်တုံး သို့မဟုတ် Logo ပုံဖိုင် တင်နိုင်ပါသည်"
                  folder="shan-state-associations"
                  onOpenSettings={() => setActiveTab('backup')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">အသင်းအကြောင်း မိတ်ဆက် (Description)</label>
                <textarea
                  {...associationForm.register('description')}
                  rows={2}
                  placeholder="အသင်း၏ ရည်ရွယ်ချက်နှင့် အကြောင်းအရာ အကျဉ်းချုပ်..."
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Dynamic Committee Members Section */}
            <div className="border border-slate-200 p-5 rounded-xl space-y-4 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" /> အမှုဆောင်အဖွဲ့ဝင်များ ထည့်သွင်းခြင်း (Executive Committee Members)
                  </h4>
                  <p className="text-xs text-slate-500">ဥက္ကဋ္ဌ၊ ဒုတိယဥက္ကဋ္ဌ၊ အတွင်းရေးမှူး စသည့် အဖွဲ့ဝင်များ စာရင်း</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendMember({
                      name: '',
                      role: 'အလုပ်အမှုဆောင်',
                      school: '',
                      phone: '',
                      viber: '',
                      telegram: '',
                      photoUrl: '',
                    })
                  }
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> အဖွဲ့ဝင် ထပ်ထည့်ရန်
                </button>
              </div>

              <div className="space-y-3">
                {memberFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-700">
                        အဖွဲ့ဝင် #{index + 1}
                      </span>
                      {memberFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ဖယ်ထုတ်ရန်
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">အမည် (Name) *</label>
                        <input
                          {...associationForm.register(`members.${index}.name` as const)}
                          placeholder="ဦး/ဒေါ်..."
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">တာဝန် / ရာထူး (Role) *</label>
                        <input
                          {...associationForm.register(`members.${index}.role` as const)}
                          placeholder="ဥပမာ - ဥက္ကဋ္ဌ / အတွင်းရေးမှူး"
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">ကျောင်းအမည် (School)</label>
                        <input
                          {...associationForm.register(`members.${index}.school` as const)}
                          placeholder="ကိုယ်ပိုင်ကျောင်း အမည်"
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">ဖုန်းနံပါတ် (Phone)</label>
                        <input
                          {...associationForm.register(`members.${index}.phone` as const)}
                          placeholder="09..."
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Viber</label>
                        <input
                          {...associationForm.register(`members.${index}.viber` as const)}
                          placeholder="Viber ဖုန်းနံပါတ်"
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Telegram / ဓာတ်ပုံ URL</label>
                        <input
                          {...associationForm.register(`members.${index}.telegram` as const)}
                          placeholder="@username"
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={associationForm.formState.isSubmitting}
              className="w-full bg-sky-900 text-white p-3.5 rounded-xl font-bold text-sm hover:bg-sky-800 transition cursor-pointer disabled:opacity-50"
            >
              အသင်းနှင့် အမှုဆောင်အဖွဲ့ဝင်များ သိမ်းဆည်းမည် (Save Association)
            </button>
          </form>

          {/* Existing Associations List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              လက်ရှိ အသင်းများ စာရင်း ({associations.length})
            </h3>
            {loadingAssociations ? (
              <p className="text-sm text-slate-400">အသင်းစာရင်းများ ဆွဲယူနေပါသည်...</p>
            ) : associations.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">အသင်း ထည့်သွင်းထားခြင်း မရှိသေးပါ</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {associations.map(assoc => (
                  <div key={assoc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{assoc.name}</span>
                        {assoc.township && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                            {assoc.township}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        အမှုဆောင်အဖွဲ့ဝင်: {assoc.members ? assoc.members.length : 0} ဦး | ဖုန်း: {assoc.phone || 'မရှိပါ'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAssociation(assoc.id)}
                      type="button"
                      className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition cursor-pointer self-end sm:self-center"
                      title="ဖျက်ရန်"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schools Tab */}
      {activeTab === 'schools' && (
        <div className="space-y-8">
          {/* Excel Import & Template with Duplicate Strategy */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-sky-100 bg-sky-50/20 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-lg text-sky-950 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-600" /> Excel စနစ်ဖြင့် အများအပြား ထည့်သွင်းခြင်း (Batch Import)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Excel ဖိုင် (.xlsx, .xls) မှတစ်ဆင့် ကျောင်းအချက်အလက်များစွာကို တစ်ပြိုင်နက် တင်သွင်းနိုင်ပါသည်။
              </p>
            </div>

            {/* Duplicate Handling Strategy Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CopyCheck className="w-4 h-4 text-sky-600" />
                <span>နာမည်တူ ထပ်နေသော ကျောင်းများ (Duplicates) ရှိပါက ကိုင်တွယ်မည့်နည်းလမ်း:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Mode 1: Update / Merge (Default & Recommended) */}
                <div
                  onClick={() => setDuplicateMode('update')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    duplicateMode === 'update'
                      ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-200 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${duplicateMode === 'update' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'}`}>
                      {duplicateMode === 'update' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-bold">Update ပြုလုပ်မည် (အကြံပြု)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal pl-5">
                    နာမည်တူကျောင်းများ ထပ်မဖြစ်စေဘဲ ရှိပြီးသားကို အချက်အလက်အသစ်များဖြင့် ပေါင်းစပ်ပြင်ဆင်ပေးမည်။
                  </p>
                </div>

                {/* Mode 2: Skip Duplicates */}
                <div
                  onClick={() => setDuplicateMode('skip')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    duplicateMode === 'skip'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-200 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${duplicateMode === 'skip' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`}>
                      {duplicateMode === 'skip' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-bold">ကျော်သွားမည် (Skip)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal pl-5">
                    ရှိပြီးသားကျောင်းများကို မထိခိုက်စေဘဲ ကျောင်းအသစ်များကိုသာ ရွေးထုတ်ထည့်သွင်းမည်။
                  </p>
                </div>

                {/* Mode 3: Add all */}
                <div
                  onClick={() => setDuplicateMode('add')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    duplicateMode === 'add'
                      ? 'bg-slate-100 border-slate-500 text-slate-900 ring-2 ring-slate-200 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${duplicateMode === 'add' ? 'border-slate-600 bg-slate-600' : 'border-slate-300'}`}>
                      {duplicateMode === 'add' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-bold">အသစ်ထပ်သွင်းမည် (Add All)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal pl-5">
                    နာမည်တူသော်လည်း သီးခြားကျောင်းအသစ်အဖြစ် အကုန်လုံး တင်သွင်းမည်။
                  </p>
                </div>
              </div>
            </div>

            {/* Import & Export Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={downloadTemplate}
                type="button"
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-sky-600" /> Excel Template ဒေါင်းလုဒ်လုပ်ရန်
              </button>
              <label className="bg-sky-900 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-sky-800 transition flex items-center gap-2 cursor-pointer shadow-xs">
                <Upload className="w-4 h-4" /> Excel ဖိုင် ရွေးချယ်တင်သွင်းရန်
                <input
                  type="file"
                  onChange={handleExcelImport}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  exportSchoolsToExcel(schools);
                  toast.success(`ကျောင်း (${schools.length}) ကျောင်း၏ အချက်အလက်အားလုံးကို Excel ထုတ်ယူလိုက်ပါပြီ`);
                }}
                type="button"
                className="bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" /> ကျောင်းစာရင်းအားလုံး Excel ထုတ်ယူမည် ({schools.length})
              </button>
            </div>

            {/* Import Report Banner if just imported */}
            {importStats && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-1.5 text-emerald-950 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    နောက်ဆုံး တင်သွင်းမှု မှတ်တမ်းအကျဉ်း:
                  </span>
                  <button
                    onClick={() => setImportStats(null)}
                    type="button"
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    ပိတ်ရန်
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold">
                  <div>ဖိုင်ထဲရှိ စုစုပေါင်း: <span className="font-bold text-slate-800">{importStats.totalInFile}</span></div>
                  <div>ကျောင်းအသစ်: <span className="font-bold text-emerald-700">{importStats.newCount}</span></div>
                  <div>Update ပြင်ဆင်ပြီး: <span className="font-bold text-sky-700">{importStats.updatedCount}</span></div>
                  <div>ကျော်ခဲ့သော Duplicate: <span className="font-bold text-amber-700">{importStats.skippedCount}</span></div>
                </div>
              </div>
            )}
          </section>

          {/* School Form (Add & Edit) */}
          <form
            id="school-form-section"
            onSubmit={schoolForm.handleSubmit(onSchoolSubmit)}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
          >
            {/* Active Edit Alert Banner */}
            {editingSchoolId && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold">
                    လက်ရှိတွင် ကျောင်းအချက်အလက်ကို ပြင်ဆင်နေပါသည် (Editing School)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelEditSchool}
                  className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer shrink-0"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xl text-sky-950 flex items-center gap-2">
                {editingSchoolId ? (
                  <>
                    <Edit2 className="w-5 h-5 text-amber-600" />
                    <span>ကျောင်းအချက်အလက် ပြင်ဆင်ရန် (Edit School)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-sky-600" />
                    <span>ကျောင်းအသစ် ထည့်သွင်းရန် (Add New School)</span>
                  </>
                )}
              </h3>

              {editingSchoolId && (
                <span className="text-xs text-amber-700 font-semibold bg-amber-100/70 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  ပြင်ဆင်ချက် သိမ်းဆည်းရန် အောက်ပါခလုတ်ကို နှိပ်ပါ
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <ImageUploadDropzone
                  value={schoolForm.watch('logoUrl') || ''}
                  onChange={(url) => schoolForm.setValue('logoUrl', url)}
                  label="ကျောင်း Logo / အမှတ်တံဆိပ် (School Logo)"
                  helperText="ကျောင်း၏ တံဆိပ်တုံး သို့မဟုတ် Logo ပုံဖိုင် တင်နိုင်ပါသည်"
                  folder="shan-state-schools"
                  onOpenSettings={() => setActiveTab('backup')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းအမည် *</label>
                <input {...schoolForm.register('name')} placeholder="ကျောင်းအမည်" className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ကျောင်းအဆင့် * (ဥပမာ - ၁။ အထက်တန်း၊ ၂။ အထက်တန်း(မူဆင့်မပါ)၊ ၂။ ထက်ဆင့်...)
                </label>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      {...schoolForm.register('level')}
                      list="school-levels-datalist"
                      placeholder="ကျောင်းအဆင့် ရွေးချယ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ"
                      className="flex-1 p-2.5 border rounded-lg text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveTab('levels')}
                      className="px-2.5 py-1 text-xs text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 font-semibold cursor-pointer whitespace-nowrap"
                      title="ကျောင်းအဆင့်များ စီမံပြင်ဆင်ရန်"
                    >
                      အဆင့်များ စီမံရန် ⚙️
                    </button>
                  </div>
                  <datalist id="school-levels-datalist">
                    {schoolLevels.map(l => (
                      <option key={l.id} value={l.name} />
                    ))}
                  </datalist>
                  {/* Quick Pill Buttons */}
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium self-center mr-1">အမြန်ရွေး:</span>
                    {schoolLevels.map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => schoolForm.setValue('level', l.name)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          schoolForm.watch('level') === l.name
                            ? 'bg-sky-600 text-white border-sky-600 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်း အခြေအနေ (Status) *</label>
                <select
                  {...schoolForm.register('status')}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white font-medium"
                >
                  <option value="active">🟢 လက်ရှိ လည်ပတ်ဆဲ (Active)</option>
                  <option value="under_review">🟡 စိစစ်ဆဲ / စစ်ဆေးဆဲ (Under Review)</option>
                  <option value="inactive">⚪ ယာယီရပ်နား / ရပ်ဆိုင်း (Inactive)</option>
                </select>
              </div>

              {/* Annual Fee & Student Count Range Settings Block */}
              <div className="sm:col-span-2 bg-gradient-to-br from-sky-50/60 via-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-sky-100 space-y-4">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <h4 className="font-bold text-xs sm:text-sm text-sky-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    <span>ကျောင်းသားဦးရေ Range နှင့် နှစ်စဉ်ကြေး သတ်မှတ်ချက် (Reference အတိုင်း)</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    အသင်းဝင် စည်းမျဉ်းသတ်မှတ်ချက်
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Student Range Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ကျောင်းသားဦးရေ Range *
                    </label>
                    <select
                      {...schoolForm.register('studentRange')}
                      onChange={(e) => {
                        const val = e.target.value;
                        schoolForm.setValue('studentRange', val);
                        const tier = getStudentRangeTier(val);
                        if (tier) {
                          schoolForm.setValue('feeAmount', tier.defaultFee);
                        }
                      }}
                      className="w-full p-2.5 border rounded-lg text-xs sm:text-sm bg-white font-medium"
                    >
                      {STUDENT_RANGE_TIERS.map(t => (
                        <option key={t.key} value={t.key}>
                          {t.label} (သတ်မှတ်နှုန်း: {t.defaultFee.toLocaleString('my-MM')} ကျပ်)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      အသင်းဝင် နှစ်စဉ်ကြေး ကောက်ခံရန် ကျောင်းသားဦးရေ အဆင့်အတန်း
                    </p>
                  </div>

                  {/* Fee Amount (MMK) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      နှစ်စဉ်ကြေး ပမာဏ (ကျပ်) *
                    </label>
                    <input
                      type="number"
                      {...schoolForm.register('feeAmount')}
                      placeholder="ဥပမာ - 200000"
                      className="w-full p-2.5 border rounded-lg text-xs sm:text-sm bg-white font-bold text-sky-950"
                    />
                    <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                      <span className="text-slate-400">အမြန်ရွေး:</span>
                      {STUDENT_RANGE_TIERS.map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => schoolForm.setValue('feeAmount', t.defaultFee)}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-sky-800 hover:bg-sky-50 font-semibold"
                        >
                          {t.shortLabel}: {(t.defaultFee / 100000).toFixed(t.defaultFee % 100000 === 0 ? 0 : 1)} သိန်း
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exact Student Count (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      တိကျသော ကျောင်းသားဦးရေ (ဦး)
                    </label>
                    <input
                      type="number"
                      {...schoolForm.register('studentCount')}
                      placeholder="ဥပမာ - 180"
                      className="w-full p-2.5 border rounded-lg text-xs sm:text-sm bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">ရှိပါက တိကျစွာ ရေးသွင်းနိုင်ပါသည်</p>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ပညာသင်နှစ် (Academic Year)
                    </label>
                    <input
                      {...schoolForm.register('feeAcademicYear')}
                      placeholder="ဥပမာ - ၂၀၂၄-၂၀၂၅"
                      className="w-full p-2.5 border rounded-lg text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Annual Fee Paid Status & Date */}
                <div className="pt-2 border-t border-sky-100/80 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...schoolForm.register('isAnnualFeePaid')}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        နှစ်စဉ်ကြေး ပေးသွင်းပြီး (Annual Fee Paid)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        အသင်းဝင်နှစ်စဉ်ကြေး ပေးသွင်းပြီးပါက အမှန်ခြစ်ပေးပါ
                      </span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      ပေးသွင်းသည့်ရက်:
                    </label>
                    <input
                      type="date"
                      {...schoolForm.register('feePaidDate')}
                      className="p-1.5 border rounded-lg text-xs bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* School Phone numbers (1 or more) */}
              <div className="sm:col-span-2 border border-slate-200 p-3.5 rounded-xl space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    ကျောင်း ဆက်သွယ်ရန် ဖုန်း (School Phone Numbers - ၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်)
                  </label>
                  <button
                    type="button"
                    onClick={() => setExtraSchoolPhones(prev => [...prev, ''])}
                    className="text-xs text-sky-700 hover:text-sky-900 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs"
                  >
                    + နောက်ထပ် ကျောင်းဖုန်းထည့်ရန်
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    {...schoolForm.register('schoolPhone')}
                    placeholder="ကျောင်းဖုန်း (၁) - အဓိက"
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                  <input
                    {...schoolForm.register('schoolPhone2')}
                    placeholder="ကျောင်းဖုန်း (၂) - အရန် (ရှိပါက)"
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
                {extraSchoolPhones.map((ph, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      value={ph}
                      onChange={(e) => {
                        const updated = [...extraSchoolPhones];
                        updated[idx] = e.target.value;
                        setExtraSchoolPhones(updated);
                      }}
                      placeholder={`နောက်ထပ် ကျောင်းဖုန်း (${idx + 3})`}
                      className="flex-1 p-2.5 border rounded-lg text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraSchoolPhones(extraSchoolPhones.filter((_, i) => i !== idx))}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                    >
                      ဖယ်ရှားရန်
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Founder */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-sm text-sky-900">တည်ထောင်သူ အချက်အလက် (Founder)</h4>
                <button
                  type="button"
                  onClick={() => setExtraFounderPhones(prev => [...prev, ''])}
                  className="text-xs text-sky-800 hover:text-sky-950 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-sky-300 shadow-2xs"
                >
                  + နောက်ထပ် ဖုန်းထည့်ရန်
                </button>
              </div>
              <input {...schoolForm.register('founderName')} placeholder="တည်ထောင်သူ အမည်" className="w-full p-2 border rounded-lg text-sm bg-white" />
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">ဖုန်းနံပါတ်များ (၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်):</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input {...schoolForm.register('founderPhone')} placeholder="တည်ထောင်သူ ဖုန်းနံပါတ် (၁) - အဓိက" className="p-2 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('founderPhone2')} placeholder="တည်ထောင်သူ ဖုန်းနံပါတ် (၂) - အရန် (ရှိပါက)" className="p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              {extraFounderPhones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={ph}
                    onChange={(e) => {
                      const updated = [...extraFounderPhones];
                      updated[idx] = e.target.value;
                      setExtraFounderPhones(updated);
                    }}
                    placeholder={`နောက်ထပ် တည်ထောင်သူ ဖုန်းနံပါတ် (${idx + 3})`}
                    className="flex-1 p-2 border rounded-lg text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraFounderPhones(extraFounderPhones.filter((_, i) => i !== idx))}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                  >
                    ဖယ်ရှားရန်
                  </button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('founderViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('founderTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            {/* Admin */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-sm text-sky-900">စီမံအုပ်ချုပ်သူ အချက်အလက် (Admin / Principal)</h4>
                <button
                  type="button"
                  onClick={() => setExtraAdminPhones(prev => [...prev, ''])}
                  className="text-xs text-sky-800 hover:text-sky-950 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-sky-300 shadow-2xs"
                >
                  + နောက်ထပ် ဖုန်းထည့်ရန်
                </button>
              </div>
              <input {...schoolForm.register('adminName')} placeholder="စီမံအုပ်ချုပ်သူ အမည်" className="w-full p-2 border rounded-lg text-sm bg-white" />
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">ဖုန်းနံပါတ်များ (၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်):</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input {...schoolForm.register('adminPhone')} placeholder="စီမံအုပ်ချုပ်သူ ဖုန်းနံပါတ် (၁) - အဓိက" className="p-2 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('adminPhone2')} placeholder="စီမံအုပ်ချုပ်သူ ဖုန်းနံပါတ် (၂) - အရန် (ရှိပါက)" className="p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              {extraAdminPhones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={ph}
                    onChange={(e) => {
                      const updated = [...extraAdminPhones];
                      updated[idx] = e.target.value;
                      setExtraAdminPhones(updated);
                    }}
                    placeholder={`နောက်ထပ် စီမံအုပ်ချုပ်သူ ဖုန်းနံပါတ် (${idx + 3})`}
                    className="flex-1 p-2 border rounded-lg text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraAdminPhones(extraAdminPhones.filter((_, i) => i !== idx))}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                  >
                    ဖယ်ရှားရန်
                  </button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('adminViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('adminTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            {/* Responsible Person 1 */}
            <div className="border border-sky-200 p-4 rounded-xl space-y-3 bg-sky-50/40">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <h4 className="font-bold text-sm text-sky-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-800 text-white text-xs flex items-center justify-center font-bold">၁</span>
                  တာဝန်ခံ ပုဂ္ဂိုလ် (၁) အချက်အလက် (Responsible Person 1)
                </h4>
                <button
                  type="button"
                  onClick={() => setExtraCoord1Phones(prev => [...prev, ''])}
                  className="text-xs text-sky-800 hover:text-sky-950 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-sky-300 shadow-2xs"
                >
                  + နောက်ထပ် ဖုန်းထည့်ရန်
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('contactName')} placeholder="တာဝန်ခံ ပုဂ္ဂိုလ် (၁) အမည်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contactRole')} placeholder="တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ရာထူး (ဥပမာ - ရုံးတာဝန်ခံ)" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">ဖုန်းနံပါတ်များ (၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်):</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input {...schoolForm.register('contactPhone')} placeholder="တာဝန်ခံ (၁) ဖုန်းနံပါတ် (၁) - အဓိက" className="p-2 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('contactPhone2')} placeholder="တာဝန်ခံ (၁) ဖုန်းနံပါတ် (၂) - အရန် (ရှိပါက)" className="p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              {extraCoord1Phones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={ph}
                    onChange={(e) => {
                      const updated = [...extraCoord1Phones];
                      updated[idx] = e.target.value;
                      setExtraCoord1Phones(updated);
                    }}
                    placeholder={`တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်းနံပါတ် (${idx + 3})`}
                    className="flex-1 p-2 border rounded-lg text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraCoord1Phones(extraCoord1Phones.filter((_, i) => i !== idx))}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                  >
                    ဖယ်ရှားရန်
                  </button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('contactViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contactTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            {/* Responsible Person 2 */}
            <div className="border border-indigo-200 p-4 rounded-xl space-y-3 bg-indigo-50/40">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="font-bold text-sm text-indigo-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-800 text-white text-xs flex items-center justify-center font-bold">၂</span>
                  တာဝန်ခံ ပုဂ္ဂိုလ် (၂) အချက်အလက် (Responsible Person 2)
                </h4>
                <button
                  type="button"
                  onClick={() => setExtraCoord2Phones(prev => [...prev, ''])}
                  className="text-xs text-indigo-800 hover:text-indigo-950 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-300 shadow-2xs"
                >
                  + နောက်ထပ် ဖုန်းထည့်ရန်
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('contact2Name')} placeholder="တာဝန်ခံ ပုဂ္ဂိုလ် (၂) အမည်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contact2Role')} placeholder="တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ရာထူး" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">ဖုန်းနံပါတ်များ (၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်):</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input {...schoolForm.register('contact2Phone')} placeholder="တာဝန်ခံ (၂) ဖုန်းနံပါတ် (၁) - အဓိက" className="p-2 border rounded-lg text-sm bg-white" />
                  <input {...schoolForm.register('contact2Phone2')} placeholder="တာဝန်ခံ (၂) ဖုန်းနံပါတ် (၂) - အရန် (ရှိပါက)" className="p-2 border rounded-lg text-sm bg-white" />
                </div>
              </div>
              {extraCoord2Phones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={ph}
                    onChange={(e) => {
                      const updated = [...extraCoord2Phones];
                      updated[idx] = e.target.value;
                      setExtraCoord2Phones(updated);
                    }}
                    placeholder={`တာဝန်ခံ (၂) ဖုန်းနံပါတ် (${idx + 3})`}
                    className="flex-1 p-2 border rounded-lg text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraCoord2Phones(extraCoord2Phones.filter((_, i) => i !== idx))}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                  >
                    ဖယ်ရှားရန်
                  </button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('contact2Viber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contact2Telegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းဘက်မှ မှတ်ချက်</label>
              <textarea {...schoolForm.register('schoolNote')} rows={2} placeholder="ကျောင်းဘက်မှ မှတ်ချက်..." className="w-full p-2.5 border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">မှတ်စုတို</label>
              <textarea {...schoolForm.register('note')} rows={2} placeholder="မှတ်စုတို..." className="w-full p-2.5 border rounded-lg text-sm" />
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition cursor-pointer shadow-xs ${
                  editingSchoolId
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-sky-900 hover:bg-sky-800'
                }`}
              >
                {editingSchoolId
                  ? 'ကျောင်းအချက်အလက် ပြင်ဆင်ချက် သိမ်းဆည်းမည် (Update School)'
                  : 'ကျောင်းအသစ် သိမ်းဆည်းမည် (Save School)'}
              </button>

              {editingSchoolId && (
                <button
                  type="button"
                  onClick={cancelEditSchool}
                  className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
              )}
            </div>
          </form>

          {/* Existing Schools List & Deduplicate Utility */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                  <SchoolIcon className="w-5 h-5 text-sky-600" />
                  <span>လက်ရှိ ကျောင်းစာရင်းများ ({schools.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ကျောင်းတစ်ခုချင်းစီကို အလွယ်တကူ ရှာဖွေ၊ ပြင်ဆင် (Edit) သို့မဟုတ် ဖျက်ပစ် (Delete) နိုင်ပါသည်။
                </p>
              </div>

              {/* Deduplicate Existing Schools Utility */}
              <button
                onClick={cleanExistingDuplicates}
                disabled={cleaningDuplicates || schools.length === 0}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition cursor-pointer self-start sm:self-auto disabled:opacity-50 shadow-2xs"
                title="ရှိနှင့်ပြီးသားကျောင်းများထဲမှ နာမည်တူ Duplicate များကို စစ်ဆေးဖယ်ရှားရန်"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{cleaningDuplicates ? 'စစ်ဆေးနေပါသည်...' : '🔍 Duplicate စစ်ဆေးပြီး ဖယ်ရှားရန်'}</span>
              </button>
            </div>

            {/* Search and Annual Fee Filters in Admin */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quick School Search in Admin */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ကျောင်းအမည်၊ အဆင့် (သို့) တည်ထောင်သူဖြင့် ရှာဖွေပြီး ဖျက်/ပြင်ရန်..."
                    value={adminSchoolSearch}
                    onChange={(e) => setAdminSchoolSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden transition"
                  />
                  {adminSchoolSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminSchoolSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Fee filter chips */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdminFeeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      adminFeeFilter === 'all'
                        ? 'bg-white text-sky-950 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    နှစ်စဉ်ကြေး အားလုံး
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminFeeFilter('paid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      adminFeeFilter === 'paid'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    ပေးပြီး ({schools.filter(s => s.isAnnualFeePaid).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminFeeFilter('unpaid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      adminFeeFilter === 'unpaid'
                        ? 'bg-slate-800 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    မပေးသေး ({schools.filter(s => !s.isAnnualFeePaid).length})
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs (Active, Under Review, Inactive) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600">ကျောင်းအခြေအနေ:</span>
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      adminStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    အားလုံး ({schools.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      adminStatusFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                    <span>Active / လည်ပတ်ဆဲ ({schools.filter(s => (s.status || 'active') === 'active').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('under_review')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      adminStatusFilter === 'under_review'
                        ? 'bg-amber-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-amber-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
                    <span>Under Review / စိစစ်ဆဲ ({schools.filter(s => s.status === 'under_review').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      adminStatusFilter === 'inactive'
                        ? 'bg-slate-700 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Inactive / ယာယီရပ်နား ({schools.filter(s => s.status === 'inactive').length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Selection and Action Toolbar */}
            {filteredAdminSchools.length > 0 && (
              <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        filteredAdminSchools.length > 0 &&
                        filteredAdminSchools.every(s => selectedSchoolIds.includes(s.id))
                      }
                      onChange={handleSelectAllFilteredSchools}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>
                      {filteredAdminSchools.every(s => selectedSchoolIds.includes(s.id))
                        ? 'အားလုံး ရွေးထားသည် (All Selected)'
                        : 'အားလုံး ရွေးမည် (Select All)'}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({filteredAdminSchools.length} ကျောင်း)
                    </span>
                  </label>

                  {selectedSchoolIds.length > 0 && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      ရွေးချယ်ထားသော ကျောင်း: {selectedSchoolIds.length} ခု
                    </span>
                  )}
                </div>

                {selectedSchoolIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSchoolIds([])}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                    >
                      ရွေးချယ်မှု ပယ်ဖျက်ရန်
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteSchools}
                      disabled={isDeletingBulk}
                      className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
                      title="ရွေးချယ်ထားသော ကျောင်းများကို တစ်ပြိုင်နက် ဖျက်ပစ်ရန်"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {isDeletingBulk
                          ? 'ဖျက်နေပါသည်...'
                          : `ရွေးချယ်ထားသည်များ ဖျက်မည် (${selectedSchoolIds.length}) ခု`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {loadingSchools ? (
              <p className="text-sm text-slate-400 py-8 text-center">ကျောင်းစာရင်းများ ဆွဲယူနေပါသည်...</p>
            ) : schools.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">ကျောင်းစာရင်း မရှိသေးပါ</p>
            ) : filteredAdminSchools.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2">
                <p className="text-sm font-bold text-slate-700">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မရှိပါ</p>
                <p className="text-xs text-slate-500">ရှာဖွေမှုစာသား သို့မဟုတ် Filter များကို ပြန်လည်စစ်ဆေးပါ</p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSchoolSearch('');
                    setAdminFeeFilter('all');
                  }}
                  className="mt-2 text-xs text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  ရှာဖွေမှု အကုန် ပြန်စရန် (Reset Filters)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAdminSchools.map(s => {
                  const isSelected = selectedSchoolIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition space-y-3.5 ${
                        editingSchoolId === s.id
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200 shadow-xs'
                          : isSelected
                          ? 'bg-rose-50/30 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Row: Checkbox + Logo + School Info (Gets full horizontal width) */}
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox for bulk deletion */}
                        <div className="pt-1 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSchool(s.id)}
                            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                            title="အများအပြား ဖျက်ရန် ဤကျောင်းကို ရွေးချယ်ပါ"
                          />
                        </div>

                        {s.logoUrl ? (
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white p-0.5 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <SchoolIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base sm:text-lg text-slate-900 leading-snug break-words">
                              {s.name}
                            </span>
                            {s.level && (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold shrink-0">
                                {s.level}
                              </span>
                            )}

                            {/* Status Indicator Badge (Active, Under Review, Inactive) */}
                            {s.status === 'under_review' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs shrink-0 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>စိစစ်ဆဲ (Under Review)</span>
                              </span>
                            ) : s.status === 'inactive' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>ယာယီရပ်နား (Inactive)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs shrink-0 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>လည်ပတ်ဆဲ (Active)</span>
                              </span>
                            )}

                            {/* Annual Fee Badge in Admin List */}
                            {s.isAnnualFeePaid ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> နှစ်စဉ်ကြေး ပေးပြီး
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                <XCircle className="w-3 h-3 text-slate-400" /> မပေးရသေး
                              </span>
                            )}

                            {/* Student Count Range & Fee Badges */}
                            {s.studentRange && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shrink-0 whitespace-nowrap">
                                ကျောင်းသား: {s.studentRange} ဦး
                              </span>
                            )}
                            {s.feeAmount !== undefined && s.feeAmount !== null && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0 whitespace-nowrap">
                                {Number(s.feeAmount).toLocaleString('my-MM')} ကျပ်
                              </span>
                            )}

                            {editingSchoolId === s.id && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse shrink-0 whitespace-nowrap">
                                လက်ရှိ ပြင်ဆင်နေသည်
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shrink-0 whitespace-nowrap">
                                ဖျက်ရန် ရွေးထားသည်
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                            {(s.schoolPhone || s.schoolPhone2) && (
                              <span>ကျောင်းဖုန်း: <strong className="text-slate-800">{[s.schoolPhone, s.schoolPhone2].filter(Boolean).join(', ')}</strong></span>
                            )}
                            {s.founderName && <span>တည်ထောင်သူ: <span className="text-slate-800 font-medium">{s.founderName} {[s.founderPhone, s.founderPhone2].filter(Boolean).length > 0 ? `(${[s.founderPhone, s.founderPhone2].filter(Boolean).join(', ')})` : ''}</span></span>}
                            {s.adminName && <span>စီမံအုပ်ချုပ်သူ: <span className="text-slate-800 font-medium">{s.adminName} {[s.adminPhone, s.adminPhone2].filter(Boolean).length > 0 ? `(${[s.adminPhone, s.adminPhone2].filter(Boolean).join(', ')})` : ''}</span></span>}
                            {s.contactName && <span>တာဝန်ခံ (၁): <span className="text-slate-800 font-medium">{s.contactName} {[s.contactPhone, s.contactPhone2].filter(Boolean).length > 0 ? `(${[s.contactPhone, s.contactPhone2].filter(Boolean).join(', ')})` : ''}</span></span>}
                            {s.contact2Name && <span>တာဝန်ခံ (၂): <span className="text-slate-800 font-medium">{s.contact2Name} {[s.contact2Phone, s.contact2Phone2].filter(Boolean).length > 0 ? `(${[s.contact2Phone, s.contact2Phone2].filter(Boolean).join(', ')})` : ''}</span></span>}
                            {!s.schoolPhone && !s.schoolPhone2 && !s.founderName && !s.adminName && !s.contactName && !s.contact2Name && <span className="text-slate-400 italic">အသေးစိတ် အချက်အလက် မရှိသေးပါ</span>}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Action Toolbar (Separated cleanly, never squishing the school title) */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                        {/* Left Controls: Status Dropdown & Fee Toggle */}
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={s.status || 'active'}
                            onChange={(e) => updateSchoolStatus(s, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs outline-hidden ${
                              s.status === 'under_review'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : s.status === 'inactive'
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            }`}
                            title="ကျောင်း၏ လက်ရှိအခြေအနေ ပြောင်းလဲရန်"
                          >
                            <option value="active">🟢 Active (လည်ပတ်ဆဲ)</option>
                            <option value="under_review">🟡 Under Review (စိစစ်ဆဲ)</option>
                            <option value="inactive">⚪ Inactive (ယာယီရပ်နား)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleSchoolFeeStatus(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs flex items-center gap-1 ${
                              s.isAnnualFeePaid
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="နှစ်စဉ်ကြေး အခြေအနေကို ၁-ချက်နှိပ်ရုံဖြင့် ပြောင်းလဲရန်"
                          >
                            {s.isAnnualFeePaid ? 'ကြေးပေးပြီး ✓' : 'ကြေးမပေးရသေး ✗'}
                          </button>
                        </div>

                        {/* Right Controls: Edit, View Detail, Delete */}
                        <div className="flex items-center gap-2 ml-auto">
                          <Link
                            to={`/schools/${s.id}`}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 shadow-2xs"
                            title="ကျောင်းအသေးစိတ် စာမျက်နှာ ကြည့်ရှုရန်"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>ကြည့်ရန်</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEditSchool(s)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              editingSchoolId === s.id
                                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                            }`}
                            title="ဤကျောင်းအချက်အလက်ကို ပြင်ဆင်ရန်"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                            <span>ပြင်ဆင်ရန် (Edit)</span>
                          </button>

                          <button
                            onClick={() => deleteSchool(s.id, s.name)}
                            type="button"
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="ဤကျောင်းကို အပြီးပိုင် ဖျက်ရန်"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>ဖျက်ရန် (Delete)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickers Tab (စာတန်းပြေး Announcement) */}
      {activeTab === 'tickers' && (
        <div className="space-y-8">
          {/* Header & Explanation */}
          <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 p-6 sm:p-8 rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  စာတန်းပြေး အရေးကြီးကြေညာချက်များ (News Ticker Bar)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  ဝဘ်ဆိုက်၏ ထိပ်ဆုံးတွင် အမြဲပြေးနေမည့် စာတန်းပြေးများကို အချိန်မရွေး လွတ်လပ်စွာ ရေးသား၊ ဖွင့်/ပိတ်၊ ပြင်ဆင်နိုင်ပါသည်။
                </p>
              </div>
            </div>

            {/* Quick Live Preview */}
            <div className="mt-4 p-4 bg-white rounded-xl border border-rose-100 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-rose-500" /> တိုက်ရိုက် နမူနာကြည့်ရှုမှု (Live Preview)
                </span>
                <span className="text-[11px] text-slate-400">
                  {tickerIsActive ? '🟢 Live ပြသမည်' : '⚪ စမ်းသပ်မှုသာဖြစ်သည်'}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-3 text-xs sm:text-sm overflow-hidden ${
                  tickerPriority === 'urgent'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : tickerPriority === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-sky-50 border-sky-200 text-sky-950'
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] text-white shrink-0 ${
                    tickerPriority === 'urgent'
                      ? 'bg-rose-600'
                      : tickerPriority === 'warning'
                      ? 'bg-amber-600'
                      : 'bg-sky-800'
                  }`}
                >
                  {tickerPriority === 'urgent'
                    ? 'အထူးကြေညာချက်'
                    : tickerPriority === 'warning'
                    ? 'သတိပေးချက်'
                    : 'စာတန်းပြေး သတင်း'}
                </span>

                <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60 text-slate-500 shrink-0 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {autoAssignDateTime ? getFormattedDateTime() : customDateTime || getFormattedDateTime()}
                </span>

                <span className="font-semibold truncate">
                  {tickerText || 'ဤနေရာတွင် ရေးသားထားသော စာတန်းပြေး စာသား ပေါ်လာပါမည်...'}
                </span>
              </div>
            </div>
          </div>

          {/* Create / Edit Form */}
          <form
            onSubmit={onTickerSubmit}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {editingTickerId ? (
                  <>
                    <Edit2 className="w-5 h-5 text-amber-600" />
                    <span>စာတန်းပြေး ပြင်ဆင်ရန် (Edit Ticker)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-rose-600" />
                    <span>စာတန်းပြေး အသစ်ရေးသားရန် (New Ticker Announcement)</span>
                  </>
                )}
              </h3>
              {editingTickerId && (
                <button
                  type="button"
                  onClick={cancelEditTicker}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  မပြင်ဆင်တော့ပါ (Cancel)
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                အမြန်ရွေးချယ်နိုင်သော စာတန်းပြေး နမူနာများ (Quick Presets)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း နှစ်ပတ်လည် အထွေထွေအစည်းအဝေး ကျင်းပမည်။',
                  'မိုးရာသီ ကျောင်းဖွင့်ချိန်နှင့် ပတ်သက်၍ အသင်းဝင်ကျောင်းများ သတိပြုလိုက်နာရန် အသိပေးချက်။',
                  'ကိုယ်ပိုင်ကျောင်းများ မှတ်ပုံတင်ခြင်းဆိုင်ရာ စာရွက်စာတမ်းများ အချိန်မီ တင်ပြပေးကြပါရန် နှိုးဆော်အပ်ပါသည်။',
                  'ဆရာ/ဆရာမများ အရည်အသွေးမြှင့် မွမ်းမံသင်တန်းအတွက် စာရင်းပေးသွင်းနိုင်ပါပြီ။',
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setTickerText(preset)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer text-left"
                  >
                    + {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Main Text Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  စာတန်းပြေးတွင် ပြသမည့် စာသား (Announcement Text) *
                </label>
                <span className="text-[11px] text-slate-400">{tickerText.length} စာလုံး</span>
              </div>
              <textarea
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                rows={3}
                required
                placeholder="ဥပမာ - ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း၏ အရေးကြီး အစည်းအဝေးကို လာမည့် တနင်္ဂနွေနေ့ နံနက် ၁၀:၀၀ နာရီတွင် ကျင်းပမည်ဖြစ်ပါ၍ တက်ရောက်ပေးကြပါရန်..."
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden"
              />
            </div>

            {/* Priority & Status Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  ဦးစားပေး အဆင့် (Priority Level)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTickerPriority('urgent')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      tickerPriority === 'urgent'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>အထူးကြေညာ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTickerPriority('warning')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      tickerPriority === 'warning'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>သတိပေးချက်</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTickerPriority('info')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      tickerPriority === 'info'
                        ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-sky-700" />
                    <span>အထွေထွေ</span>
                  </button>
                </div>
              </div>

              {/* Live Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  ထုတ်လွှင့်မှု အခြေအနေ (Live Status)
                </label>
                <div
                  onClick={() => setTickerIsActive(prev => !prev)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    tickerIsActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        tickerIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold">
                      {tickerIsActive ? 'ချက်ချင်း Live လွှင့်တင်မည် (Active)' : 'ခေတ္တပိတ်ထားမည် (Inactive)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold underline">
                    {tickerIsActive ? 'ပိတ်ရန်နှိပ်ပါ' : 'ဖွင့်ရန်နှိပ်ပါ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Date & Time Auto Assign Section */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-700" />
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    ရက်နှင့် အချိန် သတ်မှတ်မှု (Date & Time Auto Assign)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nowStr = getFormattedDateTime();
                    setCustomDateTime(nowStr);
                    setAutoAssignDateTime(true);
                    toast.success(`လက်ရှိအချိန်ကို Auto Assign ပြုလုပ်လိုက်ပါပြီ: ${nowStr}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-sky-900 border border-slate-300 hover:bg-slate-100 transition shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>🔄 ယခုအချိန် Auto Assign ထည့်သွင်းမည်</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="autoAssignCheckbox"
                    checked={autoAssignDateTime}
                    onChange={(e) => setAutoAssignDateTime(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="autoAssignCheckbox" className="text-xs text-slate-700 cursor-pointer font-medium">
                    တင်သည့်အချိန်တွင် လက်ရှိရက်စွဲနှင့် အချိန်ကို Auto Assign သတ်မှတ်မည်
                  </label>
                </div>

                <div>
                  <input
                    type="text"
                    value={autoAssignDateTime ? getFormattedDateTime() : customDateTime}
                    onChange={(e) => {
                      setCustomDateTime(e.target.value);
                      setAutoAssignDateTime(false);
                    }}
                    placeholder="ဥပမာ - 06/10/2026, 01:56 PM"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-sky-500 outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {autoAssignDateTime ? 'အလိုအလျောက် သတ်မှတ်ထားသော အချိန်' : 'စိတ်ကြိုက် ပြင်ဆင်ထားသော အချိန်'}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ချိတ်ဆက်မည့် လင့်ခ် (Optional Link / Route)
              </label>
              <input
                type="text"
                value={tickerLink}
                onChange={(e) => setTickerLink(e.target.value)}
                placeholder="ဥပမာ - /announcements သို့မဟုတ် https://..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-rose-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                အသုံးပြုသူများ စာတန်းပြေးကို နှိပ်လိုက်ပါက သွားရောက်ဖတ်ရှုစေလိုသော လင့်ခ် (မထည့်လည်း ရပါသည်)
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submittingTicker}
                className="bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-800 transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                <Megaphone className="w-4 h-4" />
                <span>
                  {editingTickerId ? 'စာတန်းပြေး ပြင်ဆင်ချက် သိမ်းဆည်းမည် (Update)' : 'စာတန်းပြေး အသစ်လွှင့်တင်မည် (Publish)'}
                </span>
              </button>
              {editingTickerId && (
                <button
                  type="button"
                  onClick={cancelEditTicker}
                  className="bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-slate-200 transition cursor-pointer"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
              )}
            </div>
          </form>

          {/* Existing Tickers List */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  ရေးသားထားသော စာတန်းပြေးများ စာရင်း ({tickers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  လွှင့်တင်ထားဆဲ (Active):{' '}
                  <span className="font-bold text-emerald-600">
                    {tickers.filter(t => t.isActive).length} ခု
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={fetchTickers}
                className="text-xs text-sky-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> စာရင်းပြန်ဆွဲရန် (Refresh)
              </button>
            </div>

            {loadingTickers ? (
              <p className="text-sm text-slate-400 py-6 text-center">ဒေတာများ ဆွဲယူနေပါသည်...</p>
            ) : tickers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">စာတန်းပြေး ကြေညာချက် မရှိသေးပါ</p>
                <p className="text-xs text-slate-400">
                  အပေါ်ရှိ Form တွင် ရေးသားလိုသော စာတန်းပြေးကို စတင်ထည့်သွင်းနိုင်ပါသည်။
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickers.map(t => (
                  <div
                    key={t.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Live Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            t.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {t.isActive ? 'Live လွှင့်တင်ထားဆဲ' : 'ပိတ်ထားသည်'}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : t.priority === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {t.priority === 'urgent'
                            ? 'အထူးကြေညာ'
                            : t.priority === 'warning'
                            ? 'သတိပေးချက်'
                            : 'သတင်း/အချက်အလက်'}
                        </span>

                        {/* Timestamp badge */}
                        {t.displayDateTime && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> {t.displayDateTime}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-sm text-slate-900 break-words pt-1">{t.text}</p>

                      {t.link && (
                        <p className="text-xs text-sky-700 font-medium truncate flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> {t.link}
                        </p>
                      )}
                    </div>

                    {/* Actions: Quick Toggle Active, Edit, Delete */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => toggleTickerStatus(t)}
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer shadow-2xs ${
                          t.isActive
                            ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                        }`}
                        title={t.isActive ? 'စာတန်းပြေးကို ခေတ္တပိတ်မည်' : 'စာတန်းပြေးကို ချက်ချင်း Live လွှင့်မည်'}
                      >
                        {t.isActive ? 'ခေတ္တပိတ်မည်' : 'Live ဖွင့်မည်'}
                      </button>

                      <button
                        onClick={() => startEditTicker(t)}
                        type="button"
                        className="p-2 rounded-xl text-slate-600 hover:text-sky-900 hover:bg-sky-50 transition cursor-pointer"
                        title="ပြင်ဆင်ရန်"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteTicker(t.id)}
                        type="button"
                        className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                        title="ဖျက်ရန်"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      လုပ်ဆောင်ချက် မှတ်တမ်းများ (Admin Audit Logs)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      အက်ဒမင်များမှ ဒေတာဘေ့စ်အတွင်း ပြုလုပ်ခဲ့သော အချက်အလက် ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်းနှင့် ဖျက်ပစ်ခြင်း မှတ်တမ်းများ
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                  မှတ်တမ်း စုစုပေါင်း: {auditLogs.length} ခု
                </span>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-900 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="မှတ်တမ်းများ ပြန်လည်ဆွဲယူရန်"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Search and Action Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="အီးမေးလ်၊ ကျောင်းအမည်၊ လုပ်ဆောင်ချက် အသေးစိတ်ဖြင့် ရှာဖွေပါ..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden transition"
                />
              </div>

              {/* Action Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuditActionFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    auditActionFilter === 'all'
                      ? 'bg-white text-indigo-950 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  အားလုံး ({auditLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditActionFilter('create')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    auditActionFilter === 'create'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>အသစ်ထည့် ({auditLogs.filter(l => l.action === 'create').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditActionFilter('update')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    auditActionFilter === 'update'
                      ? 'bg-sky-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-sky-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>ပြင်ဆင် ({auditLogs.filter(l => l.action === 'update').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditActionFilter('delete')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    auditActionFilter === 'delete'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-rose-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>ဖျက်ပစ် ({auditLogs.filter(l => l.action === 'delete').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditActionFilter('bulk_delete')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    auditActionFilter === 'bulk_delete'
                      ? 'bg-purple-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-purple-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>အများအပြားဖျက် ({auditLogs.filter(l => l.action === 'bulk_delete').length})</span>
                </button>
              </div>
            </div>

            {/* Audit Logs List */}
            {loadingAuditLogs ? (
              <p className="text-sm text-slate-400 py-10 text-center">လုပ်ဆောင်ချက် မှတ်တမ်းများ ဆွဲယူနေပါသည်...</p>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">လုပ်ဆောင်ချက် မှတ်တမ်း မရှိသေးပါ</p>
                <p className="text-xs text-slate-400">
                  ကျောင်းများ၊ ကြေညာချက်များ သို့မဟုတ် စာတန်းပြေးများကို အက်ဒမင်မှ ပြင်ဆင်/ဖျက်ပစ်သည့်အခါ ဤနေရာတွင် အလိုအလျောက် မှတ်တမ်းတင်ပေးမည်ဖြစ်ပါသည်။
                </p>
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-bold text-sm text-slate-700">ရှာဖွေမှုနှင့် ကိုက်ညီသော မှတ်တမ်း မတွေ့ရှိပါ</p>
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditActionFilter('all');
                  }}
                  className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                >
                  ရှာဖွေမှု အကုန် ပြန်စရန် (Reset Filters)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAuditLogs.map((log) => {
                  const isCreate = log.action === 'create';
                  const isUpdate = log.action === 'update';
                  const isDelete = log.action === 'delete';
                  const isBulkDelete = log.action === 'bulk_delete';

                  const entityLabel =
                    log.entityType === 'school'
                      ? 'ကျောင်းစာရင်း'
                      : log.entityType === 'announcement'
                      ? 'ကြေညာချက်'
                      : log.entityType === 'association'
                      ? 'အသင်းအချက်အလက်'
                      : 'စာတန်းပြေး';

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Action Badge */}
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                              isCreate
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isUpdate
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : isDelete
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCreate
                                  ? 'bg-emerald-600'
                                  : isUpdate
                                  ? 'bg-sky-600'
                                  : isDelete
                                  ? 'bg-rose-600'
                                  : 'bg-purple-600'
                              }`}
                            />
                            {isCreate
                              ? 'အသစ်ထည့် (Create)'
                              : isUpdate
                              ? 'ပြင်ဆင် (Update)'
                              : isDelete
                              ? 'ဖျက်ပစ် (Delete)'
                              : 'အများအပြားဖျက် (Bulk Delete)'}
                          </span>

                          {/* Entity Type Badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {entityLabel}
                          </span>

                          {log.entityName && (
                            <span className="text-xs font-bold text-slate-900 truncate">
                              "{log.entityName}"
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <p className="text-xs text-slate-700 font-medium break-words">
                          {log.details || 'အသေးစိတ် မှတ်တမ်း မရှိပါ'}
                        </p>
                      </div>

                      {/* Right Meta: Admin user and Timestamp */}
                      <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between md:justify-center gap-1.5 text-xs text-slate-500 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                          <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[180px]">
                            {log.adminEmail || 'Admin'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('my-MM', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Management Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* How to add Admins Explanatory Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-amber-950">
                  အက်ဒမင် အသစ်များ ထည့်သွင်းနည်း (How to Add Admins)
                </h3>
                <p className="text-xs text-amber-800/80">
                  အသင်း၏ စာမျက်နှာတွင် ကျောင်းများ၊ ကြေညာချက်များနှင့် စာတန်းပြေးများကို စီမံခွင့်ပေးလိုသော အကောင့်များ
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-2">
              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-100 space-y-1">
                <span className="font-bold text-amber-900 block">၁။ Email ရိုက်ထည့်ပါ</span>
                <p className="text-slate-600 leading-normal">
                  ခန့်အပ်လိုသော တာဝန်ခံ၏ Google/Firebase Email လိပ်စာကို အောက်ပါ Form တွင် ဖြည့်စွက်ပါ။
                </p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-100 space-y-1">
                <span className="font-bold text-amber-900 block">၂။ ရာထူးနှင့် ခွင့်ပြုချက် သတ်မှတ်ပါ</span>
                <p className="text-slate-600 leading-normal">
                  Admin (အပြည့်အဝ စီမံခွင့်) သို့မဟုတ် Editor (တည်းဖြတ်ခွင့်) ရာထူး ရွေးချယ်ပေးပါ။
                </p>
              </div>
              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-100 space-y-1">
                <span className="font-bold text-amber-900 block">၃။ Login ဝင်ရောက် စီမံပါ</span>
                <p className="text-slate-600 leading-normal">
                  ထိုသူသည် /login စာမျက်နှာတွင် ၎င်း၏ Email ဖြင့် ဝင်ရောက်ပါက အက်ဒမင် အခွင့်အရေး ချက်ချင်း ရရှိပါမည်။
                </p>
              </div>
            </div>
          </div>

          {/* Add New Admin Form */}
          <form
            onSubmit={handleAddAdmin}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-lg text-slate-900">
                အက်ဒမင် အသစ် ထည့်သွင်းရန် (Add New Admin)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  အက်ဒမင် အီးမေးလ် (Admin Email Address) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="ဥပမာ - teacher.u.mg@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  အသုံးပြုသူ အကောင့်ဝင်မည့် Google / Firebase အီးမေးလ်လိပ်စာ
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  အမည် / ကျောင်းအမည် (Name / School - စိတ်ကြိုက်)
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="ဥပမာ - ဆရာဦးမင်းမင်း (ရွှေမင်းသားကျောင်း)"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ရာထူးနှင့် စီမံခွင့် (Role Permission)
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden cursor-pointer"
                >
                  <option value="admin">🛡️ Admin (ကျောင်း၊ ကြေညာချက်၊ စာတန်းပြေး အပြည့်အဝ စီမံခွင့်)</option>
                  <option value="editor">✏️ Editor (ကြေညာချက်နှင့် အချက်အလက် တည်းဖြတ်ခွင့်)</option>
                  <option value="super_admin">👑 Super Admin (အက်ဒမင်များ ခန့်အပ်ခြင်း အပါအဝင် အဆင့်မြင့် စီမံခွင့်)</option>
                </select>
              </div>

              <div className="sm:col-span-2 border border-slate-200 p-3.5 rounded-xl space-y-2 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    ဖုန်းနံပါတ်များ (Phone Numbers - ၁ လုံးနှင့်အထက် ထည့်သွင်းနိုင်သည်)
                  </label>
                  <button
                    type="button"
                    onClick={() => setExtraAdminUserPhones(prev => [...prev, ''])}
                    className="text-xs text-amber-800 hover:text-amber-950 font-bold cursor-pointer inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs"
                  >
                    + နောက်ထပ် ဖုန်းထည့်ရန်
                  </button>
                </div>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="အဓိက ဆက်သွယ်ရန် ဖုန်း (၁) - 09..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                />
                {extraAdminUserPhones.map((ph, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in fade-in">
                    <input
                      type="tel"
                      value={ph}
                      onChange={(e) => {
                        const updated = [...extraAdminUserPhones];
                        updated[idx] = e.target.value;
                        setExtraAdminUserPhones(updated);
                      }}
                      placeholder={`နောက်ထပ် အက်ဒမင် ဖုန်းနံပါတ် (${idx + 2}) - 09...`}
                      className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraAdminUserPhones(extraAdminUserPhones.filter((_, i) => i !== idx))}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                    >
                      ဖယ်ရှားရန်
                    </button>
                  </div>
                ))}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  မှတ်ချက် (Remarks / Note - စိတ်ကြိုက်)
                </label>
                <input
                  type="text"
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="ဥပမာ - တောင်ကြီးမြို့နယ် တာဝန်ခံ"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingAdmin}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{addingAdmin ? 'ခန့်အပ်နေပါသည်...' : 'အက်ဒမင် အသစ် ခန့်အပ်မည် (Authorize Admin)'}</span>
            </button>
          </form>

          {/* Existing Admins List */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  လက်ရှိ ခန့်အပ်ထားသော အက်ဒမင်များ စာရင်း ({admins.length + 1})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  အသင်း၏ ဒေတာဘေ့စ်ကို ဝင်ရောက် စီမံခန့်ခွဲခွင့် ရရှိထားသော အကောင့်များ
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAdmins}
                className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> ပြန်လည်ဆွဲယူရန် (Refresh)
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Primary Super Admin Card (Permanent) */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/40 -mx-2 px-3 rounded-2xl border border-amber-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        khunthanshwe@gmail.com
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3 h-3" /> ပင်မ Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      မူလ စနစ် တည်ထောင်သူ (Master Administrative Authority) &bull; အမြဲတမ်း စီမံခွင့်
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetChangePassEmail('khunthanshwe@gmail.com');
                      setNewAdminPasswordInput('');
                      setIsChangingPassModal(true);
                    }}
                    className="text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-xl border border-sky-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>စကားဝှက် ပြောင်းမည်</span>
                  </button>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-lg">
                    Protected Super Admin
                  </span>
                </div>
              </div>

              {/* Dynamic Added Admins List */}
              {loadingAdmins ? (
                <p className="text-sm text-slate-400 py-6 text-center">အက်ဒမင်စာရင်းများ ဆွဲယူနေပါသည်...</p>
              ) : admins.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-1">
                  <p className="text-sm font-semibold">ထပ်ဆောင်း ခန့်အပ်ထားသော အက်ဒမင် မရှိသေးပါ</p>
                  <p className="text-xs text-slate-400">
                    အထက်ပါ Form တွင် နောက်ထပ် တာဝန်ခံများ၏ Email များကို စတင်ထည့်သွင်းနိုင်ပါသည်။
                  </p>
                </div>
              ) : (
                admins.map((adm) => (
                  <div
                    key={adm.id || adm.email}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:bg-slate-50/70 -mx-2 px-3 rounded-2xl"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-sky-900 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                        {adm.name ? adm.name.charAt(0) : <Shield className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {adm.email}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              adm.role === 'super_admin'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : adm.role === 'editor'
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                : 'bg-sky-100 text-sky-900 border-sky-300'
                            }`}
                          >
                            {adm.role === 'super_admin'
                              ? 'Super Admin'
                              : adm.role === 'editor'
                              ? 'Editor (တည်းဖြတ်)'
                              : 'Admin (စီမံခန့်ခွဲသူ)'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {adm.name && <span>အမည်: <strong className="text-slate-700">{adm.name}</strong></span>}
                          {(() => {
                            const allPhones = [
                              adm.phone,
                              adm.phone2,
                              ...(Array.isArray(adm.phones) ? adm.phones : []),
                              ...(Array.isArray(adm.contactNumbers) ? adm.contactNumbers : []),
                              ...(Array.isArray(adm.adminPhones) ? adm.adminPhones : []),
                            ].filter((p, i, self) => Boolean(p) && self.indexOf(p) === i);
                            if (allPhones.length === 0) return null;
                            return (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-600 font-medium">ဖုန်း:</span>
                                {allPhones.map((ph, pIdx) => (
                                  <a
                                    key={pIdx}
                                    href={`tel:${ph}`}
                                    className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 hover:underline hover:bg-sky-100 transition"
                                  >
                                    {ph} {allPhones.length > 1 ? (pIdx === 0 ? '(အဓိက)' : `(အရန် ${pIdx})`) : ''}
                                  </a>
                                ))}
                              </div>
                            );
                          })()}
                          {adm.note && <span>မှတ်ချက်: <span className="text-slate-700">{adm.note}</span></span>}
                          {adm.createdAt && (
                            <span className="text-[11px] text-slate-400">
                              ခန့်အပ်သည့်ရက်: {new Date(adm.createdAt).toLocaleDateString('my-MM')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetChangePassEmail(adm.email);
                          setNewAdminPasswordInput('');
                          setIsChangingPassModal(true);
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="စကားဝှက် ပြောင်းလဲရန်"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>စကားဝှက်</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(adm)}
                        className="text-xs px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="အက်ဒမင် စီမံခွင့် ပယ်ဖျက်ရန်"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ဖယ်ရှားမည်</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. SCHOOL LEVELS MANAGEMENT TAB */}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-950 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Layers className="w-3.5 h-3.5" />
                <span>ကျောင်းအဆင့်များ စီမံခန့်ခွဲမှု (School Levels)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">ကျောင်းအဆင့်များ သတ်မှတ်စီမံခြင်း</h3>
              <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
                ဒေတာဘေ့စ်ရှိ ကျောင်းအဆင့်များကို စိတ်ကြိုက် ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း၊ ဖျက်ပစ်ခြင်း နှင့် အစဉ်လိုက်စီခြင်းများ ပြုလုပ်နိုင်ပါသည်။ Dashboard နှင့် အသင်းဝင်ကျောင်းစာရင်းများတွင် ဤအဆင့်များအတိုင်း အလိုအလျောက် ခွဲခြမ်းပြသပေးပါသည်။
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetLevels}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <span>မူလ အဆင့်များသို့ ပြန်ထားရန်</span>
            </button>
          </div>

          {/* Add / Edit Form */}
          <div id="level-form-section" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>{editingLevelId ? 'ကျောင်းအဆင့် ပြင်ဆင်ရန်' : 'ကျောင်းအဆင့် အသစ် ထည့်သွင်းရန်'}</span>
              </h4>
              {editingLevelId && (
                <button
                  type="button"
                  onClick={handleCancelEditLevel}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
              )}
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ကျောင်းအဆင့် အမည် * (ဥပမာ - ၁။ အထက်တန်း၊ ၂။ အထက်တန်း(မူဆင့်မပါ)၊ ၂။ ထက်ဆင့်...)
                  </label>
                  <input
                    type="text"
                    value={levelNameInput}
                    onChange={(e) => setLevelNameInput(e.target.value)}
                    placeholder="ကျောင်းအဆင့် အမည် ထည့်သွင်းပါ"
                    className="w-full p-2.5 border rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    အစဉ်နံပါတ် (Order #)
                  </label>
                  <input
                    type="number"
                    value={levelOrderInput}
                    onChange={(e) => setLevelOrderInput(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ဥပမာ - 1, 2, 3..."
                    className="w-full p-2.5 border rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ဖော်ပြချက် / မှတ်ချက် (Description - ရှိပါက)
                </label>
                <input
                  type="text"
                  value={levelDescInput}
                  onChange={(e) => setLevelDescInput(e.target.value)}
                  placeholder="ဥပမာ - အထက်တန်းအဆင့် ကျောင်းများအတွက် သတ်မှတ်ချက်"
                  className="w-full p-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingLevel}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSavingLevel ? 'သိမ်းဆည်းနေပါသည်...' : (editingLevelId ? 'ပြင်ဆင်ချက် သိမ်းဆည်းမည်' : 'အဆင့်သစ် ထည့်သွင်းမည်')}</span>
                </button>
                {editingLevelId && (
                  <button
                    type="button"
                    onClick={handleCancelEditLevel}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    မလုပ်တော့ပါ
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* School Levels Table & List */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  လက်ရှိ သတ်မှတ်ထားသော ကျောင်းအဆင့်များ စာရင်း
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  စုစုပေါင်း {schoolLevels.length} အဆင့် ရှိပါသည်
                </p>
              </div>

              <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
                ✓ ဒေတာဘေ့စ်နှင့် တိုက်ရိုက် Sync လုပ်ထားသည်
              </div>
            </div>

            {schoolLevels.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold">ကျောင်းအဆင့်များ မရှိသေးပါ</p>
                <button
                  type="button"
                  onClick={handleResetLevels}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  မူလ အဆင့်များ ထည့်သွင်းမည်
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mobile View: Cards */}
                <div className="sm:hidden space-y-3">
                  {schoolLevels.map((lvl, idx) => {
                    const count = schools.filter(
                      (s) => (s.level || '').trim().toLowerCase() === lvl.name.trim().toLowerCase()
                    ).length;

                    return (
                      <div key={lvl.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                              {lvl.order ?? idx + 1}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">{lvl.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditLevel(lvl)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                              title="ပြင်ဆင်ရန်"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLevel(lvl)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="ဖျက်ပစ်ရန်"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {lvl.description && (
                          <p className="text-xs text-slate-500 break-words">{lvl.description}</p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">လက်ရှိကျောင်း အရေအတွက်:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('schools');
                              setAdminSchoolSearch(lvl.name);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                          >
                            <SchoolIcon className="w-3.5 h-3.5 text-sky-600" />
                            <span>{count} ကျောင်း</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet / Desktop View: Responsive Table */}
                <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-3 w-16 text-center">စဉ်</th>
                        <th className="p-3">ကျောင်းအဆင့် အမည်</th>
                        <th className="p-3 text-center">လက်ရှိကျောင်း အရေအတွက်</th>
                        <th className="p-3">မှတ်ချက် / ဖော်ပြချက်</th>
                        <th className="p-3 text-right">လုပ်ဆောင်ချက်</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schoolLevels.map((lvl, idx) => {
                        const count = schools.filter(
                          (s) => (s.level || '').trim().toLowerCase() === lvl.name.trim().toLowerCase()
                        ).length;

                        return (
                          <tr key={lvl.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center font-bold text-slate-500">
                              <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center text-xs">
                                {lvl.order ?? idx + 1}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{lvl.name}</span>
                                {editingLevelId === lvl.id && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                    ပြင်ဆင်နေသည်
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('schools');
                                  setAdminSchoolSearch(lvl.name);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                                title="ဤအဆင့်ရှိ ကျောင်းများကို ကြည့်ရန်"
                              >
                                <SchoolIcon className="w-3.5 h-3.5 text-sky-600" />
                                <span>{count} ကျောင်း</span>
                              </button>
                            </td>
                            <td className="p-3 text-slate-600 text-xs break-words max-w-xs">
                              {lvl.description || '-'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditLevel(lvl)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                                  title="ပြင်ဆင်ရန်"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLevel(lvl)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="ဖျက်ပစ်ရန်"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACKUP & RESTORE / CLOUDINARY TAB */}
      {activeTab === 'backup' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header Description */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-sky-950 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-emerald-800 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/30">
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>ဒေတာလုံခြုံရေးနှင့် Backup စီမံခန့်ခွဲမှု</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              ဒေတာ အရန်သိမ်းဆည်းခြင်းနှင့် Cloudinary ချိန်ညှိမှု (Backup & Media Storage)
            </h3>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-2xl">
              မတော်တဆ အချက်အလက် ပျောက်ဆုံးမှုများမှ ကာကွယ်ရန် ကျောင်းများ၊ အသင်းဝင်များ၊ ကြေညာချက်များအားလုံးကို ကလစ်တစ်ချက်ဖြင့် Full Backup (.json) ရယူထားနိုင်ပြီး လိုအပ်ပါက ပြန်လည် Restore သွင်းယူနိုင်ပါသည်။
            </p>
          </div>

          {/* Current Database Status Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">ကျောင်းများ</span>
              <strong className="text-xl font-black text-sky-950">{schools.length}</strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">ကြေညာချက်များ</span>
              <strong className="text-xl font-black text-sky-950">{announcements.length}</strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">အသင်းများ</span>
              <strong className="text-xl font-black text-sky-950">{associations.length}</strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">ကျောင်းအဆင့်များ</span>
              <strong className="text-xl font-black text-sky-950">{schoolLevels.length}</strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">စာတန်းပြေး</span>
              <strong className="text-xl font-black text-sky-950">{tickers.length}</strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">အက်ဒမင်များ</span>
              <strong className="text-xl font-black text-sky-950">{admins.length + 1}</strong>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* SECTION 1: Full System Backup (Download) */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <HardDriveDownload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    ၁။ ဒေတာဘေ့စ် အရန်သိမ်းဆည်းခြင်း (Export Backup)
                  </h4>
                  <p className="text-xs text-slate-500">
                    လက်ရှိ ဒေတာဘေ့စ်တစ်ခုလုံးရှိ ဒေတာအားလုံးကို တစ်ပြိုင်နက် Download ဆွဲယူခြင်း
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  အသင်းဝင်ကျောင်းများ၊ တာဝန်ခံ (၁)၊ (၂) ဖုန်းနံပါတ်များ၊ တည်ထောင်သူ/စီမံအုပ်ချုပ်သူ အချက်အလက်များ၊ ကြေညာချက်များနှင့် အသင်းဖွဲ့စည်းပုံများကို လုံခြုံသော JSON format ဖြင့် ကွန်ပျူတာ/ဖုန်းထဲသို့ သိမ်းဆည်းပေးမည် ဖြစ်ပါသည်။
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-700">
                    <span>အရန်သိမ်းမည့် အကြောင်းအရာ:</span>
                    <strong className="text-slate-900">Collections (၆) ခု စလုံး</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>ဖိုင်အမျိုးအစား:</span>
                    <strong className="text-slate-900">.json (Universal Format)</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  disabled={isExportingBackup}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>{isExportingBackup ? 'အရန်သိမ်းနေပါသည်...' : 'Full Backup ဒေါင်းလုဒ်ဆွဲမည် (.json)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportSchoolsToExcel(schools)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  title="ကျောင်းစာရင်းများကို Excel ဖိုင်အဖြစ် ဒေါင်းလုဒ်ဆွဲရန်"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Excel စာရင်း (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: Restore from Backup */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    ၂။ Backup ဖိုင်မှ ပြန်လည်သွင်းယူခြင်း (Restore Database)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ယခင် သိမ်းဆည်းထားသော .json Backup ဖိုင်မှ ဒေတာများ ပြန်ယူခြင်း
                  </p>
                </div>
              </div>

              {backupRestoreData ? (
                /* Restore File Preview & Confirmation */
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-sky-700 block">ရွေးချယ်ထားသော ဖိုင်</span>
                      <strong className="text-xs sm:text-sm text-slate-900 block truncate max-w-xs">{backupFileName}</strong>
                      <span className="text-[10px] text-slate-500">
                        ထုတ်ယူခဲ့သည့်ရက်: {new Date(backupRestoreData.meta.exportedAt).toLocaleString('my-MM')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBackupRestoreData(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ဖယ်ရှားမည်
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded-lg border border-sky-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ကျောင်းများ</span>
                      <strong className="text-sky-900 font-bold">{backupRestoreData.counts.schools}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ကြေညာချက်</span>
                      <strong className="text-sky-900 font-bold">{backupRestoreData.counts.announcements}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">အသင်းများ</span>
                      <strong className="text-sky-900 font-bold">{backupRestoreData.counts.associations}</strong>
                    </div>
                  </div>

                  {/* Restore Mode selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Restore ပြုလုပ်မည့် ပုံစံ:</label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-sky-600 cursor-pointer"
                        />
                        <span>Merge (ရှိပြီးသားကို မဖျက်ဘဲ ပေါင်းထည့်မည်)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'skip'}
                          onChange={() => setRestoreMode('skip')}
                          className="text-sky-600 cursor-pointer"
                        />
                        <span>Replace (အသစ်ဖြင့် အစားထိုးမည်)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoringBackup}
                    className="w-full bg-sky-900 hover:bg-sky-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{isRestoringBackup ? 'ဒေတာများ ပြန်သွင်းနေပါသည်...' : 'Restore အတည်ပြု စတင်မည်'}</span>
                  </button>
                </div>
              ) : (
                /* Select JSON file */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ယခင်ရယူထားသော <code>.json</code> Backup ဖိုင်ကို ရွေးချယ်ပေးပါက ဖိုင်အတွင်းပါရှိသော ဒေတာအရေအတွက်ကို ဦးစွာ စစ်ဆေးပြသပေးမည် ဖြစ်ပါသည်။
                  </p>

                  <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/50 hover:bg-sky-50/30">
                    <FileJson className="w-8 h-8 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">
                      .json Backup ဖိုင် ရွေးချယ်ပါ
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (ကွန်ပျူတာ သို့မဟုတ် ဖုန်းထဲမှ ဖိုင်အား နှိပ်၍ ရွေးချယ်ပါ)
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleSelectBackupFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Cloudinary Setup Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <span>၃။ Cloudinary Media Storage ချိန်ညှိမှု (Image Upload Setup)</span>
                    {isCloudinaryConfigured() ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ချိတ်ဆက်ထားပြီး ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        မသတ်မှတ်ရသေး
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ကျောင်း Logo၊ အသင်းတံဆိပ်နှင့် ကြေညာချက် ဓာတ်ပုံများကို ကွန်ပျူတာ/ဖုန်းထဲမှ တိုက်ရိုက် Upload တင်နိုင်စေရန် Cloudinary နှင့် ချိတ်ဆက်ခြင်း
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCloudinary} className="space-y-4 max-w-2xl">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cloud Name *
                  </label>
                  <input
                    type="text"
                    value={cloudinaryCloudName}
                    onChange={(e) => setCloudinaryCloudName(e.target.value)}
                    placeholder="ဥပမာ - dhmc9ikzl"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Cloudinary ရှိ Cloud Name (သင့်အကောင့်: dhmc9ikzl)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Upload Preset (Unsigned) *
                  </label>
                  <input
                    type="text"
                    value={cloudinaryPreset}
                    onChange={(e) => setCloudinaryPreset(e.target.value)}
                    placeholder="ဥပမာ - ssspsinfo_preset"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Settings &gt; Upload &gt; Upload presets (Unsigned)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={cloudinaryFolder}
                    onChange={(e) => setCloudinaryFolder(e.target.value)}
                    placeholder="ssspsinfo"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    ပုံများ စုစည်းသိမ်းမည့် Folder (ဥပမာ - ssspsinfo)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-950 space-y-2">
                <span className="font-bold text-sky-900 block flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Cloudinary ထဲရှိ "{cloudinaryFolder || 'ssspsinfo'}" Folder နှင့် ချိတ်ဆက်ရန် လမ်းညွှန်:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-sky-900/90 leading-relaxed">
                  <li>Cloudinary မျက်နှာပြင် ဘယ်ဘက်အောက်ထောင့်ရှိ <strong>⚙️ Settings (စက်သွားပုံ)</strong> ကို နှိပ်ပါ။</li>
                  <li>ဘယ်ဘက် Menu ရှိ <strong>Upload</strong> (သို့မဟုတ် <strong>Upload Presets</strong>) သို့ သွားပါ။</li>
                  <li><strong>Add upload preset</strong> ခလုတ်ကို နှိပ်ပါ။</li>
                  <li>
                    <strong>Signing Mode</strong> ကို မဖြစ်မနေ <span className="font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Unsigned</span> သို့ ရွေးချယ်ပြောင်းလဲပါ (Signed မထားရပါ)။
                  </li>
                  <li><strong>Folder</strong> အကွက်တွင် <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-300">{cloudinaryFolder || 'ssspsinfo'}</span> ဟု ရိုက်ထည့်ပါ။</li>
                  <li>ညာဘက်အပေါ်ရှိ <strong>Save</strong> ကို နှိပ်ပြီး ထွက်လာသော Preset အမည် (ဥပမာ - ssspsinfo_preset) ကို အထက်ပါ Upload Preset အကွက်တွင် ထည့်သွင်းသိမ်းဆည်းပါ။</li>
                </ol>
              </div>

              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isCloudinarySaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isCloudinarySaved ? 'သိမ်းဆည်းပြီးပါပြီ!' : 'Cloudinary ချိန်ညှိချက် သိမ်းမည်'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Management Modal */}
      {isChangingPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    စကားဝှက် ပြောင်းလဲရန် (Change Password)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {targetChangePassEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassModal(false);
                  setNewAdminPasswordInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  စကားဝှက် အသစ် (New Password)
                </label>
                <input
                  type="text"
                  required
                  placeholder="စကားဝှက်အသစ် ရိုက်ထည့်ပါ (အနည်းဆုံး ၄ လုံး)"
                  value={newAdminPasswordInput}
                  onChange={(e) => setNewAdminPasswordInput(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:border-sky-500 outline-hidden font-mono"
                  autoFocus
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  အနည်းဆုံး စာလုံး ၄ လုံး သတ်မှတ်ပေးပါ။ သိမ်းဆည်းပြီးပါက ဤစကားဝှက်ဖြင့် ဝင်ရောက်နိုင်ပါမည်။
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassModal(false);
                    setNewAdminPasswordInput('');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  မလုပ်တော့ပါ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={savingNewPassword}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-900 hover:bg-sky-950 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingNewPassword ? 'သိမ်းဆည်းနေပါသည်...' : 'စကားဝှက် သိမ်းမည်'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
