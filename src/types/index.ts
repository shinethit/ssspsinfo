export type SchoolStatus = 'active' | 'under_review' | 'inactive';

export type StudentRangeKey =
  | '0-100'
  | '101-150'
  | '151-200'
  | '201-250'
  | '251-300'
  | '301-400'
  | '401-600'
  | '601+'
  | 'unspecified';

export interface StudentRangeTier {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  min: number;
  max: number;
  defaultFee: number;
  color: string;
  badgeClass: string;
}

export const STUDENT_RANGE_TIERS: StudentRangeTier[] = [
  {
    key: '0-100',
    label: '၀ - ၁၀၀ ဦး',
    shortLabel: '၀-၁၀၀',
    description: 'ကျောင်းသားဦးရေ ၀ မှ ၁၀၀ ဦး အထိ',
    min: 0,
    max: 100,
    defaultFee: 200000,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    key: '101-150',
    label: '၁၀၁ - ၁၅၀ ဦး',
    shortLabel: '၁၀၁-၁၅၀',
    description: 'ကျောင်းသားဦးရေ ၁၀၁ မှ ၁၅၀ ဦး အထိ',
    min: 101,
    max: 150,
    defaultFee: 250000,
    color: 'teal',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    key: '151-200',
    label: '၁၅၁ - ၂၀၀ ဦး',
    shortLabel: '၁၅၁-၂၀၀',
    description: 'ကျောင်းသားဦးရေ ၁၅၁ မှ ၂၀၀ ဦး အထိ',
    min: 151,
    max: 200,
    defaultFee: 300000,
    color: 'cyan',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    key: '201-250',
    label: '၂၀၁ - ၂၅၀ ဦး',
    shortLabel: '၂၀၁-၂၅၀',
    description: 'ကျောင်းသားဦးရေ ၂၀၁ မှ ၂၅၀ ဦး အထိ',
    min: 201,
    max: 250,
    defaultFee: 350000,
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    key: '251-300',
    label: '၂၅၁ - ၃၀၀ ဦး',
    shortLabel: '၂၅၁-၃၀၀',
    description: 'ကျောင်းသားဦးရေ ၂၅၁ မှ ၃၀၀ ဦး အထိ',
    min: 251,
    max: 300,
    defaultFee: 400000,
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    key: '301-400',
    label: '၃၀၁ - ၄၀၀ ဦး',
    shortLabel: '၃၀၁-၄၀၀',
    description: 'ကျောင်းသားဦးရေ ၃၀၁ မှ ၄၀၀ ဦး အထိ',
    min: 301,
    max: 400,
    defaultFee: 500000,
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    key: '401-600',
    label: '၄၀၁ - ၆၀၀ ဦး',
    shortLabel: '၄၀၁-၆၀၀',
    description: 'ကျောင်းသားဦးရေ ၄၀၁ မှ ၆၀၀ ဦး အထိ',
    min: 401,
    max: 600,
    defaultFee: 700000,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    key: '601+',
    label: '၆၀၁ ဦး နှင့် အထက်',
    shortLabel: '၆၀၁+',
    description: 'ကျောင်းသားဦးရေ ၆၀၁ ဦး နှင့် အထက်',
    min: 601,
    max: Infinity,
    defaultFee: 1000000,
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
];

export const getStudentRangeTier = (rangeKey?: string): StudentRangeTier | undefined => {
  if (!rangeKey) return undefined;
  const raw = String(rangeKey).trim();
  const match = STUDENT_RANGE_TIERS.find(t => t.key === raw || t.label === raw || t.shortLabel === raw);
  if (match) return match;

  // Specific Burmese text matching
  if (raw.includes('၆၀၁') || raw.includes('601') || raw.includes('1000') || raw.includes('၁၀၀၀') || raw.includes('600+')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '601+');
  }
  if (raw.includes('၄၀၁') || raw.includes('401') || raw.includes('600') || raw.includes('၆၀၀') || raw.includes('501') || raw.includes('၅၀၁')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '401-600');
  }
  if (raw.includes('၃၀၁') || raw.includes('301') || raw.includes('400') || raw.includes('၄၀၀') || raw.includes('500') || raw.includes('၅၀၀')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '301-400');
  }
  if (raw.includes('၂၅၁') || raw.includes('251') || raw.includes('300') || raw.includes('၃၀၀')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '251-300');
  }
  if (raw.includes('၂၀၁') || raw.includes('201') || raw.includes('250') || raw.includes('၂၅၀')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '201-250');
  }
  if (raw.includes('၁၅၁') || raw.includes('151') || raw.includes('200') || raw.includes('၂၀၀')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '151-200');
  }
  if (raw.includes('၁၀၁') || raw.includes('101') || raw.includes('150') || raw.includes('၁၅၀')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '101-150');
  }
  if (raw.includes('၀-၁၀၀') || raw.includes('0-100') || raw.includes('၁၀၀') || raw.includes('100') || raw.includes('1-100')) {
    return STUDENT_RANGE_TIERS.find(t => t.key === '0-100');
  }

  // Backward-compatibility aliases
  if (raw === '1-100' || raw === '0-100') return STUDENT_RANGE_TIERS.find(t => t.key === '0-100');
  if (raw === '101-300') return STUDENT_RANGE_TIERS.find(t => t.key === '251-300');
  if (raw === '301-500') return STUDENT_RANGE_TIERS.find(t => t.key === '301-400');
  if (raw === '501-1000') return STUDENT_RANGE_TIERS.find(t => t.key === '401-600');
  if (raw === '1000+') return STUDENT_RANGE_TIERS.find(t => t.key === '601+');
  return undefined;
};

// Default standard school levels matching user's database / reference
export const DEFAULT_SCHOOL_LEVELS = [
  '၁။ အထက်တန်း',
  '၂။ အထက်တန်း(မူဆင့်မပါ)',
  '၂။ ထက်ဆင့်',
  '၃။ အထက်တန်းဆင့်',
  '၃။ အလယ်တန်း',
  '၄။ အလယ်တန်းဆင့်',
  '၄။ လယ်ဆင့်',
  'လယ်/ ထက် ဆင့်',
  '၅။ မူလတန်းဆင့်',
  '၅။ မူဆင့်',
  'မူလတန်းဆင့်',
  'အလယ်တန်းဆင့်',
];

export interface SchoolLevelItem {
  id: string;
  name: string;
  order?: number;
  description?: string;
  createdAt?: string;
}

export interface School {
  id: string;
  logoUrl: string;
  name: string;
  level: string;
  category?: string;
  status?: SchoolStatus;
  // Location & Address Information (ကျောင်းလိပ်စာ၊ မြို့နယ်၊ မြို့၊ ဇုန်)
  address?: string;
  township?: string;
  city?: string;
  zone?: string;
  studentRange?: string; // e.g. '1-100', '101-300', '301-500', '501-1000', '1000+'
  studentCount?: number; // optional exact student count
  feeAmount?: number; // annual fee amount in MMK (e.g. 50000, 100000, 150000, 200000, 300000)
  feeAcademicYear?: string; // e.g. '၂၀၂၄-၂၀၂၅'
  feePaidDate?: string; // e.g. '2024-06-15'
  // School Phone numbers (1 or more)
  schoolPhone: string;
  schoolPhone2?: string;
  schoolPhones?: string[];

  // Founder Contact Information
  founderName: string;
  founderPhone: string;
  founderPhone2?: string;
  founderPhones?: string[];
  founderViber: string;
  founderTelegram: string;

  // Administrator / Principal Contact Information
  adminName: string;
  adminPhone: string;
  adminPhone2?: string;
  adminPhones?: string[];
  adminViber: string;
  adminTelegram: string;

  // Responsible Person 1 (တာဝန်ခံ ပုဂ္ဂိုလ် ၁)
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactPhone2?: string;
  contactPhones?: string[];
  contactViber: string;
  contactTelegram: string;
  responsiblePerson1Name?: string;
  responsiblePerson1Role?: string;
  responsiblePerson1Phone?: string;
  responsiblePerson1Phone2?: string;
  responsiblePerson1Phones?: string[];
  responsiblePerson1Viber?: string;
  responsiblePerson1Telegram?: string;

  // Responsible Person 2 (တာဝန်ခံ ပုဂ္ဂိုလ် ၂)
  contact2Name?: string;
  contact2Role?: string;
  contact2Phone?: string;
  contact2Phone2?: string;
  contact2Phones?: string[];
  contact2Viber?: string;
  contact2Telegram?: string;
  responsiblePerson2Name?: string;
  responsiblePerson2Role?: string;
  responsiblePerson2Phone?: string;
  responsiblePerson2Phone2?: string;
  responsiblePerson2Phones?: string[];
  responsiblePerson2Viber?: string;
  responsiblePerson2Telegram?: string;

  otherContacts: { name: string; role: string; phone: string; viber: string; telegram: string; }[];
  schoolNote: string;
  note: string;
  isAnnualFeePaid?: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  org: string;
  phone: string;
  email: string;
  township: string;
  note: string;

  // Responsible Person 1 (တာဝန်ခံ ပုဂ္ဂိုလ် ၁)
  responsiblePerson1Name?: string;
  responsiblePerson1Role?: string;
  responsiblePerson1Phone?: string;
  responsiblePerson1Phone2?: string;
  responsiblePerson1Phones?: string[];
  responsiblePerson1Viber?: string;
  responsiblePerson1Telegram?: string;

  // Responsible Person 2 (တာဝန်ခံ ပုဂ္ဂိုလ် ၂)
  responsiblePerson2Name?: string;
  responsiblePerson2Role?: string;
  responsiblePerson2Phone?: string;
  responsiblePerson2Phone2?: string;
  responsiblePerson2Phones?: string[];
  responsiblePerson2Viber?: string;
  responsiblePerson2Telegram?: string;

  // Founder Multiple Contact Numbers
  founderName?: string;
  founderPhone?: string;
  founderPhone2?: string;
  founderPhones?: string[];
  founderViber?: string;
  founderTelegram?: string;

  // Administrator Multiple Contact Numbers
  adminName?: string;
  adminPhone?: string;
  adminPhone2?: string;
  adminPhones?: string[];
  adminViber?: string;
  adminTelegram?: string;

  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  eventDate?: string; // Admin Set Date / Event Date (e.g. '2026-10-15')
  attachments: string[];
  authorUid?: string;
  publishedAt: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  roomId: string;
  text: string;
  senderUid: string;
  senderName: string;
  senderPhoto: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Gallery {
  id: string;
  title: string;
  album: string;
  imageUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface CommitteeMember {
  name: string;
  role: string; // ဥက္ကဋ္ဌ, ဒုတိယဥက္ကဋ္ဌ, အတွင်းရေးမှူး, etc.
  school?: string;
  phone?: string;
  viber?: string;
  telegram?: string;
  photoUrl?: string;
}

export interface Association {
  id: string;
  name: string;
  township?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  description?: string;
  members: CommitteeMember[];
  createdAt: string;
}

export interface NewsTicker {
  id: string;
  text: string;
  link?: string;
  priority?: 'urgent' | 'warning' | 'info';
  isActive: boolean;
  autoTimestamp: boolean;
  displayDateTime?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: 'create' | 'update' | 'delete' | 'bulk_delete';
  entityType: 'school' | 'announcement' | 'association' | 'ticker' | 'admin' | 'school_level';
  entityId?: string;
  entityName?: string;
  details?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'editor';
  phone?: string;
  phone2?: string;
  phones?: string[]; // Multiple contact numbers for administrator
  contactNumbers?: string[];
  founderPhones?: string[];
  adminPhones?: string[];

  // Two separate Responsible Person fields
  responsiblePerson1Name?: string;
  responsiblePerson1Role?: string;
  responsiblePerson1Phones?: string[];

  responsiblePerson2Name?: string;
  responsiblePerson2Role?: string;
  responsiblePerson2Phones?: string[];

  note?: string;
  addedBy?: string;
  createdAt: string;
}


