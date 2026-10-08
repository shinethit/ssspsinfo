import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAdminSession } from '../lib/adminAuth';

export default function ProtectedRoute() {
  const [user, loading] = useAuthState(auth);
  const [session, setSession] = useState(getAdminSession());

  useEffect(() => {
    const handleAuthChange = () => {
      setSession(getAdminSession());
    };
    window.addEventListener('sssps_admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('sssps_admin_auth_changed', handleAuthChange);
  }, []);

  const isAuthed = session.isLoggedIn || !!user;

  if (loading && !session.isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span>Admin Portal သို့ ဝင်ရောက်နေပါသည်...</span>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
