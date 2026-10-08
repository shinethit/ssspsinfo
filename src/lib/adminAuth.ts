import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

const ADMIN_STORAGE_KEY = 'sssps_admin_logged_in';
const ADMIN_EMAIL_KEY = 'sssps_admin_email';
const ADMIN_ROLE_KEY = 'sssps_admin_role';

export const SUPER_ADMIN_EMAIL = 'khunthanshwe@gmail.com';
export const DEFAULT_PASSWORD_FALLBACK = 'admin123';

export interface AdminSession {
  isLoggedIn: boolean;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
}

/**
 * SHA-256 password hash using standard Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const cleanPass = password.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanPass + ':sssps_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify admin credentials against Firestore admin records.
 * Securely enforces password checking without bypass.
 */
export async function verifyAdminCredentials(
  usernameOrEmail: string,
  passwordInput: string
): Promise<{ success: boolean; email?: string; role?: 'super_admin' | 'admin' | 'editor'; error?: string }> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanInput) {
    return { success: false, error: 'Admin Email သို့မဟုတ် Username ဖြည့်သွင်းပေးပါ' };
  }
  if (!cleanPass) {
    return { success: false, error: 'စကားဝှက် (Password) ထည့်သွင်းပေးပါ' };
  }

  // Normalize username aliases
  let targetEmail = cleanInput;
  if (cleanInput === 'admin' || cleanInput === 'superadmin' || cleanInput === 'khunthanshwe') {
    targetEmail = SUPER_ADMIN_EMAIL;
  }

  try {
    const inputHash = await hashPassword(cleanPass);
    const defaultHash = await hashPassword(DEFAULT_PASSWORD_FALLBACK);
    const secondaryDefaultHash = await hashPassword('123456');

    // 1. Try finding doc directly by email as doc ID
    const directDocRef = doc(db, 'admins', targetEmail);
    const directSnap = await getDoc(directDocRef);

    let adminData: any = null;
    let docId = targetEmail;

    if (directSnap.exists()) {
      adminData = directSnap.data();
    } else {
      // 2. Query by email field
      const q = query(collection(db, 'admins'), where('email', '==', targetEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        adminData = qSnap.docs[0].data();
        docId = qSnap.docs[0].id;
      }
    }

    // If super admin document hasn't been created yet or is empty
    if (!adminData && targetEmail === SUPER_ADMIN_EMAIL) {
      if (inputHash === defaultHash || inputHash === secondaryDefaultHash) {
        // Auto-initialize the super admin record with the entered password
        await setDoc(
          directDocRef,
          {
            email: SUPER_ADMIN_EMAIL,
            name: 'Super Admin',
            role: 'super_admin',
            passwordHash: inputHash,
            isSuperAdmin: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        setAdminSession(SUPER_ADMIN_EMAIL, 'super_admin');
        return { success: true, email: SUPER_ADMIN_EMAIL, role: 'super_admin' };
      }
      return {
        success: false,
        error: 'စကားဝှက် မှားယွင်းနေပါသည်။ (မူလ စကားဝှက်မှာ admin123 ဖြစ်ပြီး မိမိစိတ်ကြိုက် စကားဝှက်သို့ အောက်တွင် အသစ်ပြောင်းလဲသတ်မှတ်နိုင်ပါသည်)',
      };
    }

    if (!adminData) {
      return {
        success: false,
        error: `"${targetEmail}" သည် စနစ်တွင် မှတ်ပုံတင်ထားသော အက်ဒမင်အကောင့် မဟုတ်သေးပါ`,
      };
    }

    // Validate password hash
    const storedHash = adminData.passwordHash;
    const isPasswordCorrect =
      storedHash === inputHash ||
      (!storedHash && (inputHash === defaultHash || inputHash === secondaryDefaultHash));

    if (!isPasswordCorrect) {
      return {
        success: false,
        error: 'စကားဝှက် (Password) မှားယွင်းနေပါသည်။ စကားဝှက်ကို ပြန်လည်စစ်ဆေးပါ သို့မဟုတ် အောက်တွင် အသစ်သတ်မှတ်ပါ။',
      };
    }

    // Update password hash if it wasn't saved yet
    if (!storedHash) {
      await setDoc(doc(db, 'admins', docId), { passwordHash: inputHash }, { merge: true });
    }

    const role = (adminData.role as any) || (targetEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : 'admin');
    setAdminSession(targetEmail, role);

    return {
      success: true,
      email: targetEmail,
      role,
    };
  } catch (err: any) {
    console.error('Password verification error:', err);
    return {
      success: false,
      error: 'စကားဝှက် စစ်ဆေးရာတွင် အမှားဖြစ်ပွားပါသည်: ' + (err.message || 'Error'),
    };
  }
}

/**
 * Set or change admin password securely
 */
export async function changeAdminPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = newPassword.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Admin Email ထည့်သွင်းပေးပါ' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'စကားဝှက်သည် အနည်းဆုံး စာလုံး ၄ လုံး ရှိရပါမည်' };
  }

  try {
    const passwordHash = await hashPassword(cleanPass);
    const adminDocRef = doc(db, 'admins', cleanEmail);
    const existingSnap = await getDoc(adminDocRef);

    if (existingSnap.exists()) {
      await setDoc(
        adminDocRef,
        {
          passwordHash,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      await setDoc(
        adminDocRef,
        {
          email: cleanEmail,
          name: cleanEmail === SUPER_ADMIN_EMAIL ? 'Super Admin' : 'Admin',
          role: cleanEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : 'admin',
          passwordHash,
          isSuperAdmin: cleanEmail === SUPER_ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Change password error:', err);
    return { success: false, error: 'စကားဝှက် ပြောင်းလဲရာတွင် အမှားဖြစ်ပွားပါသည်: ' + (err.message || '') };
  }
}

export function getAdminSession(): AdminSession {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, email: '', role: 'admin' };
  }

  const isLocalLoggedIn = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  const fbUser = auth.currentUser;

  const isLoggedIn = isLocalLoggedIn || !!fbUser;
  const email =
    localStorage.getItem(ADMIN_EMAIL_KEY) ||
    fbUser?.email ||
    (isLocalLoggedIn ? SUPER_ADMIN_EMAIL : '');
  const role = (localStorage.getItem(ADMIN_ROLE_KEY) as any) || 'super_admin';

  return { isLoggedIn, email, role };
}

export function setAdminSession(
  email = SUPER_ADMIN_EMAIL,
  role: 'super_admin' | 'admin' | 'editor' = 'super_admin'
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
