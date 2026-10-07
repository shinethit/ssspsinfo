import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, writeBatch, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ANNOUNCEMENT_CATEGORIES, getCategoryBadge } from './Announcements';
import { Association, NewsTicker, AuditLog, AdminUser } from '../types';
import { recordAuditLog } from '../lib/audit';
import {
  FileText,
  School as SchoolIcon,
  Plus,
  Trash2,
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
} from 'lucide-react';
import { downloadSchoolTemplate, normalizeSchoolRow } from '../lib/excel';

const announcementSchema = z.object({
  title: z.string().min(1, 'ခေါင်းစဉ် လိုအပ်သည်'),
  body: z.string().min(1, 'အကြောင်းအရာ လိုအပ်သည်'),
  category: z.string().min(1, 'ကဏ္ဍ ရွေးချယ်ပါ'),
  attachmentUrl: z.string().optional(),
});

const schoolSchema = z.object({
  logoUrl: z.string().optional(),
  name: z.string().min(1, 'ကျောင်းအမည် လိုအပ်သည်'),
  level: z.string().min(1, 'ကျောင်းအဆင့် လိုအပ်သည်'),
  founderName: z.string().optional(),
  founderPhone: z.string().optional(),
  founderViber: z.string().optional(),
  founderTelegram: z.string().optional(),
  adminName: z.string().optional(),
  adminPhone: z.string().optional(),
  adminViber: z.string().optional(),
  adminTelegram: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactViber: z.string().optional(),
  contactTelegram: z.string().optional(),
  schoolPhone: z.string().optional(),
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
  const [activeTab, setActiveTab] = useState<'announcements' | 'associations' | 'schools' | 'tickers' | 'audit_logs' | 'admins'>('announcements');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [tickers, setTickers] = useState<NewsTicker[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

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

  // Router search params
  const [searchParams, setSearchParams] = useSearchParams();

  // School editing & search state
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [adminSchoolSearch, setAdminSchoolSearch] = useState('');
  const [adminFeeFilter, setAdminFeeFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');

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
      logoUrl: '',
      schoolPhone: '',
      founderName: '',
      founderPhone: '',
      founderViber: '',
      founderTelegram: '',
      adminName: '',
      adminPhone: '',
      adminViber: '',
      adminTelegram: '',
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactViber: '',
      contactTelegram: '',
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
      setAnnouncements(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
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
      // Use email as doc ID for easy lookup in firestore.rules
      await setDoc(doc(db, 'admins', cleanEmail), {
        email: cleanEmail,
        name: newAdminName.trim() || 'အက်ဒမင်',
        role: newAdminRole,
        phone: newAdminPhone.trim(),
        note: newAdminNote.trim(),
        addedBy: auth.currentUser?.email || 'Super Admin',
        createdAt: new Date().toISOString(),
      });
      await recordAuditLog({
        action: 'create',
        entityType: 'admin',
        entityName: cleanEmail,
        details: `အက်ဒမင်အသစ် "${cleanEmail}" (${newAdminRole}) အား စီမံခွင့် ပေးအပ်ခဲ့သည်`,
      });
      toast.success(`အက်ဒမင်သစ် "${cleanEmail}" ကို အောင်မြင်စွာ ခန့်အပ်ထည့်သွင်းပြီးပါပြီ`);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPhone('');
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

  const onAnnouncementSubmit = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        title: data.title,
        body: data.body,
        category: data.category,
        attachments: data.attachmentUrl ? [data.attachmentUrl] : [],
        publishedAt: new Date().toISOString(),
      });
      await recordAuditLog({
        action: 'create',
        entityType: 'announcement',
        entityId: docRef.id,
        entityName: data.title,
        details: `ကြေညာချက်အသစ် "${data.title}" တင်ခဲ့သည်`,
      });
      toast.success('ကြေညာချက် တင်ပြီးပါပြီ');
      announcementForm.reset({
        title: '',
        body: '',
        category: 'general',
        attachmentUrl: '',
      });
      fetchAnnouncements();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error('ကြေညာချက် တင်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('ဤကြေညာချက်ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      await recordAuditLog({
        action: 'delete',
        entityType: 'announcement',
        entityId: id,
        details: 'ကြေညာချက် ဖျက်ပစ်ခဲ့သည်',
      });
      toast.success('ကြေညာချက် ဖျက်ပြီးပါပြီ');
      fetchAnnouncements();
      fetchAuditLogs();
    } catch (err) {
      toast.error('ဖျက်၍ မရပါ');
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
    schoolForm.reset({
      name: school.name || '',
      level: school.level || 'အထက်တန်း',
      logoUrl: school.logoUrl || '',
      schoolPhone: school.schoolPhone || '',
      founderName: school.founderName || '',
      founderPhone: school.founderPhone || '',
      founderViber: school.founderViber || '',
      founderTelegram: school.founderTelegram || '',
      adminName: school.adminName || '',
      adminPhone: school.adminPhone || '',
      adminViber: school.adminViber || '',
      adminTelegram: school.adminTelegram || '',
      contactName: school.contactName || '',
      contactRole: school.contactRole || '',
      contactPhone: school.contactPhone || '',
      contactViber: school.contactViber || '',
      contactTelegram: school.contactTelegram || '',
      schoolNote: school.schoolNote || '',
      note: school.note || '',
      isAnnualFeePaid: school.isAnnualFeePaid ?? false,
      status: school.status || 'active',
    });
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
      level: 'အထက်တန်း',
      logoUrl: '',
      schoolPhone: '',
      founderName: '',
      founderPhone: '',
      founderViber: '',
      founderTelegram: '',
      adminName: '',
      adminPhone: '',
      adminViber: '',
      adminTelegram: '',
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactViber: '',
      contactTelegram: '',
      schoolNote: '',
      note: '',
      isAnnualFeePaid: false,
      status: 'active',
    });
  };

  const updateSchoolStatus = async (school: any, newStatus: 'active' | 'under_review' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
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
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
      toast.error('အခြေအနေ ပြောင်းလဲ၍ မရပါ');
    }
  };

  const toggleSchoolFeeStatus = async (school: any) => {
    try {
      const nextStatus = !school.isAnnualFeePaid;
      await updateDoc(doc(db, 'schools', school.id), {
        isAnnualFeePaid: nextStatus,
        updatedAt: new Date().toISOString(),
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
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
      toast.error('နှစ်စဉ်ကြေး အခြေအနေ ပြောင်းလဲ၍ မရပါ');
    }
  };

  const onSchoolSubmit = async (data: any) => {
    try {
      if (editingSchoolId) {
        await updateDoc(doc(db, 'schools', editingSchoolId), {
          ...data,
          updatedAt: new Date().toISOString(),
        });
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
        const docRef = await addDoc(collection(db, 'schools'), { ...data, createdAt: new Date().toISOString() });
        await recordAuditLog({
          action: 'create',
          entityType: 'school',
          entityId: docRef.id,
          entityName: data.name,
          details: `ကျောင်းအသစ် "${data.name}" ထည့်သွင်းခဲ့သည်`,
        });
        toast.success(`ကျောင်းအသစ် "${data.name}" ကို ထည့်သွင်းပြီးပါပြီ`);
        cancelEditSchool();
      }
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
      toast.error('ကျောင်းအချက်အလက် သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    }
  };

  const deleteSchool = async (id: string, name?: string) => {
    if (!confirm(`"${name || 'ဤကျောင်း'}" ၏ အချက်အလက်များကို အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`)) return;
    try {
      await deleteDoc(doc(db, 'schools', id));
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
      fetchSchools();
      fetchAuditLogs();
    } catch (err) {
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
          <h2 className="text-3xl font-extrabold text-sky-950">အက်ဒမင် ဧရိယာ (Admin Area)</h2>
          <p className="text-slate-500 text-sm mt-1">အသင်းများ၊ ကြေညာချက်များ၊ အသင်းဝင်ကျောင်းများ၊ အက်ဒမင်များနှင့် လုပ်ဆောင်ချက် မှတ်တမ်းများ</p>
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
        </div>
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
            onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5"
          >
            <h3 className="text-xl font-bold text-sky-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" /> ကြေညာချက် အသစ်တင်ရန် (New Announcement)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ကဏ္ဍ ရွေးချယ်ပါ (Category) *
                </label>
                <select
                  {...announcementForm.register('category')}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:border-sky-500 outline-hidden"
                >
                  {ANNOUNCEMENT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.labelEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ကြေညာချက် ခေါင်းစဉ် (Title) *
                </label>
                <input
                  {...announcementForm.register('title')}
                  placeholder="ဥပမာ - ၂၀၂၆-၂၀၂၇ ပညာသင်နှစ် နှစ်ပတ်လည် အထွေထွေအစည်းအဝေး ဖိတ်ကြားလွှာ"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-hidden"
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
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-hidden"
                />
                {announcementForm.formState.errors.body && (
                  <p className="text-xs text-rose-500 mt-1">{announcementForm.formState.errors.body.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ပူးတွဲဖိုင် / ပုံလိပ်စာ (Attachment URL - စိတ်ကြိုက်)
                </label>
                <input
                  {...announcementForm.register('attachmentUrl')}
                  placeholder="https://..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={announcementForm.formState.isSubmitting}
                className="bg-sky-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-800 transition cursor-pointer disabled:opacity-50"
              >
                ကြေညာချက် တင်မည် (Publish)
              </button>
            </div>
          </form>

          {/* Existing Announcements List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              တင်ထားပြီးသော ကြေညာချက်များ ({announcements.length})
            </h3>
            {loadingAnnouncements ? (
              <p className="text-sm text-slate-400">တင်ထားသော ဒေတာများ ဆွဲယူနေပါသည်...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">ကြေညာချက် မရှိသေးပါ</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map(a => {
                  const badge = getCategoryBadge(a.category);
                  return (
                    <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{a.title}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteAnnouncement(a.id)}
                        type="button"
                        className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="ဖျက်ရန်"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">အသင်း Logo / အမှတ်တံဆိပ် URL</label>
                <input
                  {...associationForm.register('logoUrl')}
                  placeholder="https://..."
                  className="w-full p-2.5 border rounded-lg text-sm"
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

            {/* Import Buttons */}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်း Logo URL</label>
                <input {...schoolForm.register('logoUrl')} placeholder="https://..." className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းအမည် *</label>
                <input {...schoolForm.register('name')} placeholder="ကျောင်းအမည်" className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်းအဆင့် *</label>
                <input {...schoolForm.register('level')} placeholder="ဥပမာ - မူလတန်း / အလယ်တန်း / အထက်တန်း" className="w-full p-2.5 border rounded-lg text-sm" />
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

              {/* Annual Fee Paid Checkbox */}
              <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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
                      အသင်းဝင်နှစ်စဉ်ကြေး ပေးသွင်းထားသော ကျောင်းဖြစ်ပါက အမှန်ခြစ်ပေးပါ
                    </span>
                  </div>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">ကျောင်း ဆက်သွယ်ရန် ဖုန်း</label>
                <input {...schoolForm.register('schoolPhone')} placeholder="ကျောင်းဖုန်း" className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
            </div>

            {/* Founder */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-sm text-sky-900">တည်ထောင်သူ အချက်အလက် (Founder)</h4>
              <input {...schoolForm.register('founderName')} placeholder="တည်ထောင်သူ အမည်" className="w-full p-2 border rounded-lg text-sm bg-white" />
              <div className="grid sm:grid-cols-3 gap-2">
                <input {...schoolForm.register('founderPhone')} placeholder="ဖုန်းနံပါတ်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('founderViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('founderTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            {/* Admin */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-sm text-sky-900">စီမံအုပ်ချုပ်သူ အချက်အလက် (Admin / Principal)</h4>
              <input {...schoolForm.register('adminName')} placeholder="စီမံအုပ်ချုပ်သူ အမည်" className="w-full p-2 border rounded-lg text-sm bg-white" />
              <div className="grid sm:grid-cols-3 gap-2">
                <input {...schoolForm.register('adminPhone')} placeholder="ဖုန်းနံပါတ်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('adminViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('adminTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>

            {/* Coordinator */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-sm text-sky-900">တာဝန်ခံ အချက်အလက် (Coordinator)</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                <input {...schoolForm.register('contactName')} placeholder="တာဝန်ခံ အမည်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contactRole')} placeholder="တာဝန်ခံ ရာထူး" className="p-2 border rounded-lg text-sm bg-white" />
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <input {...schoolForm.register('contactPhone')} placeholder="ဖုန်းနံပါတ်" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contactViber')} placeholder="Viber" className="p-2 border rounded-lg text-sm bg-white" />
                <input {...schoolForm.register('contactTelegram')} placeholder="Telegram" className="p-2 border rounded-lg text-sm bg-white" />
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
                      className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        editingSchoolId === s.id
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
                          : isSelected
                          ? 'bg-rose-50/30 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Left: Selection Checkbox & School Emblem/Logo & Info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        {/* Checkbox for bulk deletion */}
                        <div className="pt-1 sm:pt-0 shrink-0">
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
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white p-1 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center shrink-0">
                            <SchoolIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              {s.name}
                            </span>
                            {s.level && (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                {s.level}
                              </span>
                            )}

                            {/* Status Indicator Badge (Active, Under Review, Inactive) */}
                            {s.status === 'under_review' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>စိစစ်ဆဲ (Under Review)</span>
                              </span>
                            ) : s.status === 'inactive' ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>ယာယီရပ်နား (Inactive)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>လည်ပတ်ဆဲ (Active)</span>
                              </span>
                            )}

                            {/* Annual Fee Badge in Admin List */}
                            {s.isAnnualFeePaid ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> နှစ်စဉ်ကြေး ပေးပြီး
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-slate-400" /> မပေးရသေး
                              </span>
                            )}
                            {editingSchoolId === s.id && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                                လက်ရှိ ပြင်ဆင်နေသည်
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                                ဖျက်ရန် ရွေးထားသည်
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {s.schoolPhone && <span>ကျောင်းဖုန်း: <strong className="text-slate-700">{s.schoolPhone}</strong></span>}
                            {s.founderName && <span>တည်ထောင်သူ: <span className="text-slate-700 font-medium">{s.founderName}</span></span>}
                            {s.adminName && <span>စီမံအုပ်ချုပ်သူ: <span className="text-slate-700 font-medium">{s.adminName}</span></span>}
                            {!s.schoolPhone && !s.founderName && !s.adminName && <span>အသေးစိတ် အချက်အလက် မရှိသေးပါ</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Clear Action Buttons (Edit, Delete, View, Quick Status, Quick Fee Toggle) */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        {/* Quick Status Dropdown Selector */}
                        <select
                          value={s.status || 'active'}
                          onChange={(e) => updateSchoolStatus(s, e.target.value as any)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs outline-hidden ${
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

                        {/* 1-Click Toggle Annual Fee */}
                        <button
                          type="button"
                          onClick={() => toggleSchoolFeeStatus(s)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs flex items-center gap-1 ${
                            s.isAnnualFeePaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="နှစ်စဉ်ကြေး အခြေအနေကို ၁-ချက်နှိပ်ရုံဖြင့် ပြောင်းလဲရန်"
                        >
                          {s.isAnnualFeePaid ? 'ကြေးပေးပြီး ✓' : 'ကြေးမပေးရသေး ✗'}
                        </button>

                        {/* Explicit Edit School Button */}
                        <button
                          type="button"
                          onClick={() => startEditSchool(s)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            editingSchoolId === s.id
                              ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}
                          title="ဤကျောင်းအချက်အလက်ကို ပြင်ဆင်ရန်"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>ပြင်ဆင်ရန် (Edit)</span>
                        </button>

                        {/* View Detail Link */}
                        <Link
                          to={`/schools/${s.id}`}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 shadow-2xs"
                          title="ကျောင်းအသေးစိတ် စာမျက်နှာ ကြည့်ရှုရန်"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">ကြည့်ရန်</span>
                        </Link>

                        {/* Explicit Delete School Button */}
                        <button
                          onClick={() => deleteSchool(s.id, s.name)}
                          type="button"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="ဤကျောင်းကို အပြီးပိုင် ဖျက်ရန်"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>ဖျက်ရန် (Delete)</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ဖုန်းနံပါတ် (Phone Number - စိတ်ကြိုက်)
                </label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="09..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-amber-500 outline-hidden"
                />
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
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-lg self-start sm:self-center">
                  Protected System Admin
                </span>
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

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          {adm.name && <span>အမည်: <strong className="text-slate-700">{adm.name}</strong></span>}
                          {adm.phone && <span>ဖုန်း: <span className="text-slate-700">{adm.phone}</span></span>}
                          {adm.note && <span>မှတ်ချက်: <span className="text-slate-700">{adm.note}</span></span>}
                          {adm.createdAt && (
                            <span className="text-[11px] text-slate-400">
                              ခန့်အပ်သည့်ရက်: {new Date(adm.createdAt).toLocaleDateString('my-MM')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(adm)}
                      className="text-xs px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-center"
                      title="အက်ဒမင် စီမံခွင့် ပယ်ဖျက်ရန်"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ဖယ်ရှားမည်</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
