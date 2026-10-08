export type SchoolStatus = 'active' | 'under_review' | 'inactive';

export type StudentRangeKey = '1-100' | '101-300' | '301-500' | '501-1000' | '1000+' | 'unspecified';

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
    key: '1-100',
    label: '၁ - ၁၀၀ ဦး',
    shortLabel: '၁-၁၀၀',
    description: 'ကျောင်းသားဦးရေ ၁၀၀ နှင့် အောက်',
    min: 1,
    max: 100,
    defaultFee: 50000,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    key: '101-300',
    label: '၁၀၁ - ၃၀၀ ဦး',
    shortLabel: '၁၀၁-၃၀၀',
    description: 'ကျောင်းသားဦးရေ ၁၀၁ မှ ၃၀၀ အထိ',
    min: 101,
    max: 300,
    defaultFee: 100000,
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    key: '301-500',
    label: '၃၀၁ - ၅၀၀ ဦး',
    shortLabel: '၃၀၁-၅၀၀',
    description: 'ကျောင်းသားဦးရေ ၃၀၁ မှ ၅၀၀ အထိ',
    min: 301,
    max: 500,
    defaultFee: 150000,
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    key: '501-1000',
    label: '၅၀၁ - ၁,၀၀၀ ဦး',
    shortLabel: '၅၀၁-၁၀၀၀',
    description: 'ကျောင်းသားဦးရေ ၅၀၁ မှ ၁,၀၀၀ အထိ',
    min: 501,
    max: 1000,
    defaultFee: 200000,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    key: '1000+',
    label: '၁,၀၀၀ ဦး နှင့်အထက်',
    shortLabel: '၁၀၀၀+',
    description: 'ကျောင်းသားဦးရေ ၁,၀၀၁ နှင့် အထက်',
    min: 1001,
    max: Infinity,
    defaultFee: 300000,
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
];

export const getStudentRangeTier = (rangeKey?: string): StudentRangeTier | undefined => {
  if (!rangeKey) return undefined;
  return STUDENT_RANGE_TIERS.find(t => t.key === rangeKey);
};

export interface School {
  id: string;
  logoUrl: string;
  name: string;
  level: string;
  category?: string;
  status?: SchoolStatus;
  studentRange?: string; // e.g. '1-100', '101-300', '301-500', '501-1000', '1000+'
  studentCount?: number; // optional exact student count
  feeAmount?: number; // annual fee amount in MMK (e.g. 50000, 100000, 150000, 200000, 300000)
  feeAcademicYear?: string; // e.g. '၂၀၂၄-၂၀၂၅'
  feePaidDate?: string; // e.g. '2024-06-15'
  // School Phone numbers (1 or more)
  schoolPhone: string;
  schoolPhone2?: string;
  schoolPhones?: string[];

  founderName: string;
  founderPhone: string;
  founderPhone2?: string;
  founderPhones?: string[];
  founderViber: string;
  founderTelegram: string;

  adminName: string;
  adminPhone: string;
  adminPhone2?: string;
  adminPhones?: string[];
  adminViber: string;
  adminTelegram: string;

  // Coordinator 1 (တာဝန်ခံ ၁)
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactPhone2?: string;
  contactPhones?: string[];
  contactViber: string;
  contactTelegram: string;

  // Coordinator 2 (တာဝန်ခံ ၂)
  contact2Name?: string;
  contact2Role?: string;
  contact2Phone?: string;
  contact2Phone2?: string;
  contact2Phones?: string[];
  contact2Viber?: string;
  contact2Telegram?: string;

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
  entityType: 'school' | 'announcement' | 'association' | 'ticker' | 'admin';
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
  note?: string;
  addedBy?: string;
  createdAt: string;
}


