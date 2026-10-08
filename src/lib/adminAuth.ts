import { auth } from './firebase';

const ADMIN_STORAGE_KEY = 'sssps_admin_logged_in';
const ADMIN_EMAIL_KEY = 'sssps_admin_email';
const ADMIN_ROLE_KEY = 'sssps_admin_role';

export interface AdminSession {
  isLoggedIn: boolean;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
}

export function getAdminSession(): AdminSession {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, email: '', role: 'admin' };
  }

  const isLocalLoggedIn = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  const fbUser = auth.currentUser;

  const isLoggedIn = isLocalLoggedIn || !!fbUser;
  const email =
    fbUser?.email ||
    localStorage.getItem(ADMIN_EMAIL_KEY) ||
    (isLocalLoggedIn ? 'khunthanshwe@gmail.com' : '');
  const role = (localStorage.getItem(ADMIN_ROLE_KEY) as any) || 'super_admin';

  return { isLoggedIn, email, role };
}

export function setAdminSession(
  email = 'khunthanshwe@gmail.com',
  role: 'super_admin' | 'admin' = 'super_admin'
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
  localStorage.setItem(ADMIN_EMAIL_KEY, email);
  localStorage.setItem(ADMIN_ROLE_KEY, role);
  window.dispatchEvent(new Event('sssps_admin_auth_changed'));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_EMAIL_KEY);
  localStorage.removeItem(ADMIN_ROLE_KEY);
  try {
    auth.signOut().catch(() => {});
  } catch {}
  window.dispatchEvent(new Event('sssps_admin_auth_changed'));
}
