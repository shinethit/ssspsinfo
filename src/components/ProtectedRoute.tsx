import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ProtectedRoute() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        return;
      }

      try {
        let snap = await getDoc(doc(db, 'admins', user.uid));
        if (!snap.exists() && user.email) {
          const emailSnap = await getDoc(doc(db, 'admins', user.email)).catch(() => null);
          if (emailSnap && emailSnap.exists()) {
            snap = emailSnap;
          }
        }
        if (!snap.exists() && user.email) {
          const lowerEmailSnap = await getDoc(doc(db, 'admins', user.email.toLowerCase())).catch(() => null);
          if (lowerEmailSnap && lowerEmailSnap.exists()) {
            snap = lowerEmailSnap;
          }
        }
        if (isMounted) {
          setIsAdmin(snap.exists());
          setCheckingAdmin(false);
        }
      } catch (err) {
        console.error('Failed to verify admin status from admins/{uid}:', err);
        if (isMounted) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
      }
    }

    if (!loading) {
      checkAdminStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  // v24.13 S9: tell a signed-in non-admin why /admin refused them.
  useEffect(() => {
    if (!loading && !checkingAdmin && user && isAdmin === false) {
      toast.error('ဤစာမျက်နှာသည် Admin အတွက်သာ ဖြစ်သည်');
    }
  }, [loading, checkingAdmin, user, isAdmin]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span>Admin Portal သို့ ဝင်ရောက်နေပါသည်...</span>
        </div>
      </div>
    );
  }

  // v24.13 S9: a signed-in school account opening /admin was silently
  // dumped on the admin login page. Explain, and send them to the login
  // page that is actually theirs; nobody signed in still goes to /login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/school-login" replace />;
  }

  return <Outlet />;
}
