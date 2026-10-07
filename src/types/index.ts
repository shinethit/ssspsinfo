export type SchoolStatus = 'active' | 'under_review' | 'inactive';

export interface School {
  id: string;
  logoUrl: string;
  name: string;
  level: string;
  status?: SchoolStatus;
  founderName: string;
  founderPhone: string;
  founderViber: string;
  founderTelegram: string;
  adminName: string;
  adminPhone: string;
  adminViber: string;
  adminTelegram: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactViber: string;
  contactTelegram: string;
  schoolPhone: string;
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
  attachments: string[];
  authorUid: string;
  publishedAt: string;
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


