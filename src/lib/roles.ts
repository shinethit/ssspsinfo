// Role model for the Private School App (v24.3: exactly 4 roles).
// Guest = not signed in (public read only, handled by Firestore rules).
// User = school account (authUid on a school doc, not in the admins collection).
// Moderator / Admin = admins doc role; normalized here so legacy roles keep working:
//   super_admin -> admin, editor / sports_moderator / news_editor -> moderator.
//
// v24.15 (P34): normalizeRole returns null for any role the Firestore rules
// do NOT admit (including 'user', 'guest', a missing role, or any other
// value). The rules' isModerator() admits exactly admin / super_admin /
// moderator / editor / sports_moderator / news_editor; a null role is
// treated as non-admin everywhere (ProtectedRoute, getAdminSession).

export type AdminRole = 'admin' | 'moderator';

/**
 * Normalize any stored role value to one of the two admin roles, or null
 * when the value is not a role the Firestore rules admit.
 */
export function normalizeRole(role: unknown): AdminRole | null {
  if (role === 'admin' || role === 'super_admin') return 'admin';
  if (role === 'moderator' || role === 'editor' || role === 'sports_moderator' || role === 'news_editor') return 'moderator';
  return null;
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
