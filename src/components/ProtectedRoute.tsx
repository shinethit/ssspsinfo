import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

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

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
