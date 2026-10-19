import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { AuditLog } from '../types';

export const recordAuditLog = async ({
  action,
  entityType,
  entityId,
  entityName,
  details,
  adminEmail,
}: {
  action: AuditLog['action'];
  entityType: AuditLog['entityType'];
  entityId?: string;
  entityName?: string;
  details?: string;
  adminEmail?: string;
}) => {
  try {
    const email = adminEmail || auth.currentUser?.email || 'admin';
    await addDoc(collection(db, 'audit_logs'), {
      adminEmail: email,
      action,
      entityType,
      entityId: entityId || '',
      entityName: entityName || '',
      details: details || '',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
