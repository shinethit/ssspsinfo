import { doc, getDoc } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth } from './firebase';

export interface AdminSession {
  isLoggedIn: boolean;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
  uid?: string;
  name?: string;
}

// In-memory cache for fast synchronous reads via getAdminSession()
let cachedSession: AdminSession = {
  isLoggedIn: false,
  email: '',
  role: 'admin',
};

// Keep in-memory cache synchronized with Firebase Auth & Firestore admins/{uid}
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      cachedSession = { isLoggedIn: false, email: '', role: 'admin' };
      window.dispatchEvent(new Event('sssps_admin_auth_changed'));
      return;
    }

    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      let snap = await getDoc(adminDocRef);
      if (!snap.exists() && user.email) {
        snap = await getDoc(doc(db, 'admins', user.email)).catch(() => snap);
      }
      if (!snap.exists() && user.email) {
        snap = await getDoc(doc(db, 'admins', user.email.toLowerCase())).catch(() => snap);
      }
      if (snap.exists()) {
        const data = snap.data();
        cachedSession = {
          isLoggedIn: true,
          email: user.email || data.email || '',
          role: (data.role as 'super_admin' | 'admin' | 'editor') || 'admin',
          uid: user.uid,
          name: data.name || '',
        };
      } else {
        cachedSession = {
          isLoggedIn: false,
          email: user.email || '',
          role: 'admin',
          uid: user.uid,
        };
      }
    } catch (err) {
      console.error('Error fetching admin profile from admins/{uid}:', err);
      cachedSession = { isLoggedIn: false, email: user.email || '', role: 'admin' };
    }
    window.dispatchEvent(new Event('sssps_admin_auth_changed'));
  });
}

/**
 * Friendly Burmese error mapping for Firebase Auth error codes
 */
export function mapFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'invalid-credential':
    case 'auth/wrong-password':
    case 'wrong-password':
      return 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။';
    case 'auth/user-not-found':
    case 'user-not-found':
      return 'ဤအီးမေးလ်ဖြင့် မှတ်ပုံတင်ထားသော အကောင့်မရှိပါ။';
    case 'auth/invalid-email':
    case 'invalid-email':
      return 'မှန်ကန်သော အီးမေးလ်လိပ်စာကို ရိုက်ထည့်ပေးပါ။';
    case 'auth/user-disabled':
    case 'user-disabled':
      return 'ဤအကောင့်အား အသုံးပြုခွင့် ပိတ်ပင်ထားပါသည်။';
    case 'auth/too-many-requests':
    case 'too-many-requests':
      return 'စကားဝှက် အကြိမ်ကြိမ် မှားယွင်းမှုကြောင့် ခေတ္တပိတ်ထားပါသည်။ ခဏစောင့်ပြီးမှ ပြန်လည်ကြိုးစားပါ။';
    case 'auth/network-request-failed':
    case 'network-request-failed':
      return 'အင်တာနက်လိုင်း ချဆက်မှု မရှိပါ သို့မဟုတ် မတည်ငြိမ်ပါ။';
    case 'auth/weak-password':
    case 'weak-password':
      return 'စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံး ရှိရပါမည်။';
    case 'permission-denied':
    case 'auth/permission-denied':
      return 'အချက်အလက်များ ဖတ်ရှုခွင့် ခွင့်ပြုချက် မရှိပါ (Permission Denied)။ စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။';
    case 'auth/not-an-admin':
      return 'ဤအကောင့်သည် စနစ်တွင် အက်ဒမင် (Admin) အဖြစ် ခွင့်ပြုချက် ရရှိထားခြင်း မရှိသေးပါ';
    default:
      if (typeof errorCode === 'string' && errorCode.includes('permission-denied')) {
        return 'အချက်အလက်များ ဖတ်ရှုခွင့် ခွင့်ပြုချက် မရှိပါ (Permission Denied)။ စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။';
      }
      return 'အကောင့်ဝင်ရောက်ရာတွင် အမှားဖြစ်ပွားပါသည် (' + errorCode + ')';
  }
}

/**
 * Sign in admin using Firebase Authentication (Email/Password)
 * and enforce verification against admins/{uid} document.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; email?: string; role?: 'super_admin' | 'admin' | 'editor'; uid?: string; error?: string; errorCode?: string }> {
  const cleanEmail = emailInput.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Admin Email ဖြည့်သွင်းပေးပါ' };
  }
  if (!cleanPass) {
    return { success: false, error: 'စကားဝှက် (Password) ထည့်သွင်းပေးပါ' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const user = userCredential.user;

    // Admin status = a document exists at admins/{uid} (the user's UID, NOT the email)
    const adminDocRef = doc(db, 'admins', user.uid);
    let adminSnap;
    try {
      adminSnap = await getDoc(adminDocRef);
      if (!adminSnap.exists() && user.email) {
        const emailSnap = await getDoc(doc(db, 'admins', user.email)).catch(() => null);
        if (emailSnap && emailSnap.exists()) {
          adminSnap = emailSnap;
        }
      }
      if (!adminSnap.exists() && user.email) {
        const lowerEmailSnap = await getDoc(doc(db, 'admins', user.email.toLowerCase())).catch(() => null);
        if (lowerEmailSnap && lowerEmailSnap.exists()) {
          adminSnap = lowerEmailSnap;
        }
      }
    } catch (docErr: any) {
      const code = docErr?.code || 'permission-denied';
      console.error('Firestore admins/{uid} verification error code (err.code):', code, docErr);
      try {
        await firebaseSignOut(auth);
      } catch {}
      cachedSession = { isLoggedIn: false, email: '', role: 'admin' };
      window.dispatchEvent(new Event('sssps_admin_auth_changed'));
      return {
        success: false,
        errorCode: code,
        error: mapFirebaseAuthError(code),
      };
    }

    if (!adminSnap || !adminSnap.exists()) {
      // User is authenticated in Firebase Auth but NOT authorized as an admin
      console.error('Firebase Auth error code (err.code): auth/not-an-admin', {
        uid: user.uid,
        email: user.email,
        expectedFirestorePath: `admins/${user.uid}`,
      });
      try {
        await firebaseSignOut(auth);
      } catch {}
      cachedSession = { isLoggedIn: false, email: '', role: 'admin' };
      window.dispatchEvent(new Event('sssps_admin_auth_changed'));
      return {
        success: false,
        errorCode: 'auth/not-an-admin',
        uid: user.uid,
        email: user.email || cleanEmail,
        error: `ဤအကောင့် (${user.email || cleanEmail}) သည် စနစ်တွင် အက်ဒမင် (Admin) အဖြစ် ခွင့်ပြုချက် ရရှိထားခြင်း မရှိသေးပါ`,
      };
    }

    const adminData = adminSnap.data();
    const role = (adminData.role as 'super_admin' | 'admin' | 'editor') || 'admin';

    cachedSession = {
      isLoggedIn: true,
      email: user.email || cleanEmail,
      role,
      uid: user.uid,
      name: adminData.name || '',
    };
    window.dispatchEvent(new Event('sssps_admin_auth_changed'));

    return {
      success: true,
      email: user.email || cleanEmail,
      role,
      uid: user.uid,
    };
  } catch (err: any) {
    const code = err?.code || err?.message || '';
    console.error('Firebase Auth sign in error code (err.code):', err?.code || code, err);
    return {
      success: false,
      errorCode: err?.code || code,
      error: mapFirebaseAuthError(code),
    };
  }
}

/**
 * Send password reset email via Firebase Auth for "forgot / change password"
 */
export async function sendAdminPasswordReset(email: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return { success: false, error: 'Admin Email ထည့်သွင်းပေးပါ' };
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true };
  } catch (err: any) {
    const code = err?.code || err?.message || '';
    console.error('Password reset error code (err.code):', err?.code || code, err);
    return { success: false, errorCode: err?.code || code, error: mapFirebaseAuthError(code) };
  }
}

/**
 * Change admin password via Firebase Auth.
 * If currently logged in as that user, updates password directly.
 * Otherwise, sends a password reset email to the address.
 */
export async function changeAdminPassword(
  email: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return { success: false, error: 'Admin Email ထည့်သွင်းပေးပါ' };
  }

  if (newPassword && auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail.toLowerCase()) {
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        // Send reset email if session requires recent re-authentication
        await sendPasswordResetEmail(auth, cleanEmail);
        return {
          success: true,
          error: 'လုံခြုံရေးအရ စကားဝှက် ပြောင်းလဲရန် လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့ထားပါသည်။ အီးမေးလ်မှတစ်ဆင့် စကားဝှက် ပြောင်းလဲပေးပါ။',
        };
      }
      return { success: false, error: mapFirebaseAuthError(err.code || err.message) };
    }
  }

  return sendAdminPasswordReset(cleanEmail);
}

/**
 * Retrieve current synchronous admin session state
 */
export function getAdminSession(): AdminSession {
  if (auth.currentUser && (!cachedSession.isLoggedIn || cachedSession.uid !== auth.currentUser.uid)) {
    return {
      isLoggedIn: true,
      email: auth.currentUser.email || cachedSession.email,
      role: cachedSession.role || 'admin',
      uid: auth.currentUser.uid,
    };
  }
  return { ...cachedSession };
}

/**
 * Clear admin session & sign out from Firebase Auth
 */
export async function clearAdminSession(): Promise<void> {
  cachedSession = { isLoggedIn: false, email: '', role: 'admin' };
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sssps_admin_auth_changed'));
  }
}

/**
 * Compatibility stub for callers that dispatch an update
 */
export function setAdminSession(
  _email = '',
  _role: 'super_admin' | 'admin' | 'editor' = 'admin'
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sssps_admin_auth_changed'));
  }
}
