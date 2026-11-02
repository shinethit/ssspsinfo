// Role model for the Private School App (v24.3: exactly 4 roles).
// Guest = not signed in (public read only, handled by Firestore rules).
// User = school account (authUid on a school doc, not in the admins collection).
// Moderator / Admin = admins doc role; normalized here so legacy roles keep working:
//   super_admin -> admin, editor / sports_moderator / news_editor -> moderator.

export type AdminRole = 'admin' | 'moderator';

/** Normalize any stored role value to one of the two admin roles. */
export function normalizeRole(role: unknown): AdminRole {
  if (role === 'admin' || role === 'super_admin') return 'admin';
  return 'moderator';
}

const CONTENT_TABS = new Set([
  'announcements',
  'tickers',
  'events',
  'sports',
  'documents',
  'gallery',
  'schools',
  'associations',
  'levels',
  'finance',
]);

const ADMIN_ONLY_TABS = new Set(['accounts', 'audit_logs', 'backup']);

/**
 * Whether an admin role may open a given Admin tab (v24.3 matrix).
 * dashboard + requests: both roles. Content tabs: both roles.
 * accounts, audit_logs, backup: admin only. Unknown tabs: false.
 */
export function canAccessTab(role: AdminRole, tab: string): boolean {
  if (tab === 'dashboard' || tab === 'requests') return true;
  if (ADMIN_ONLY_TABS.has(tab)) return role === 'admin';
  if (CONTENT_TABS.has(tab)) return true;
  return false;
}
