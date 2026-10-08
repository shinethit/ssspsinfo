import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { AuditLog } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  History,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

import { getAdminSession } from '../lib/adminAuth';

const STORAGE_READ_KEY = 'pss_last_read_audit_timestamp';

export const AuditNotificationBell: React.FC = () => {
  const [user] = useAuthState(auth);
  const [session, setSession] = useState(getAdminSession());
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => {
      setSession(getAdminSession());
    };
    window.addEventListener('sssps_admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('sssps_admin_auth_changed', handleAuthChange);
  }, []);

  const isAuthed = session.isLoggedIn || !!user;
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_READ_KEY) || '';
    } catch {
      return '';
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Real-time listener for recent 10 audit logs (only active for authenticated users)
  useEffect(() => {
    if (!isAuthed) {
      setLogs([]);
      setUnreadCount(0);
      return;
    }

    const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AuditLog[];

        setLogs(fetchedLogs);

        // Calculate unread items based on last read timestamp
        if (fetchedLogs.length > 0) {
          if (!lastReadTimestamp) {
            setUnreadCount(fetchedLogs.length);
          } else {
            const unread = fetchedLogs.filter((l) => new Date(l.createdAt) > new Date(lastReadTimestamp)).length;
            setUnreadCount(unread);
          }
        } else {
          setUnreadCount(0);
        }
      },
      (error) => {
        // Silently handle if permission is not yet granted or during signout transition
        if (error.code === 'permission-denied') {
          setLogs([]);
          setUnreadCount(0);
          return;
        }
        console.warn('Audit logs subscription notice:', error.message || error);
      }
    );

    return () => unsubscribe();
  }, [user, lastReadTimestamp]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If visitor is not signed in, do not render administrative notification bell
  if (!isAuthed) {
    return null;
  }

  const handleToggle = () => {
    if (!isOpen) {
      // Mark as read when opening
      markAllAsRead();
    }
    setIsOpen((prev) => !prev);
  };

  const markAllAsRead = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_READ_KEY, now);
    } catch {}
    setLastReadTimestamp(now);
    setUnreadCount(0);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/admin?tab=audit_logs');
  };

  // Helper for human-friendly time elapsed
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'မကြာသေးမီက';
    try {
      const past = new Date(dateString).getTime();
      const now = new Date().getTime();
      const diffMinutes = Math.floor((now - past) / 60000);

      if (diffMinutes < 1) return 'ယခုလေးတင်';
      if (diffMinutes < 60) return `လွန်ခဲ့သော ${diffMinutes} မိနစ်က`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `လွန်ခဲ့သော ${diffHours} နာရီက`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'မနေ့က';
      if (diffDays < 7) return `လွန်ခဲ့သော ${diffDays} ရက်က`;
      return new Date(dateString).toLocaleDateString('my-MM');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Audit Log Notifications"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl text-slate-700 hover:text-sky-950 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
          isOpen ? 'bg-slate-100 text-sky-900 ring-2 ring-sky-300' : ''
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge or pulsing dot */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          logs.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-sky-950 to-indigo-950 text-white flex items-center justify-between gap-2 border-b border-sky-900">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-xs">
                <History className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold leading-tight">စနစ်လုပ်ဆောင်ချက် မှတ်တမ်းများ</h4>
                <p className="text-[10px] text-sky-200">Recent Admin Activities</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>ဖတ်ပြီးမှတ်မည်</span>
              </button>
            )}
          </div>

          {/* List of Recent Audit Logs */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <History className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">လုပ်ဆောင်ချက် မှတ်တမ်း မရှိသေးပါ</p>
                <p className="text-[11px] text-slate-400">စနစ်ထဲတွင် အချက်အလက်များ ပြင်ဆင်/ဖျက်ပါက ဤနေရာတွင် ဖော်ပြပါမည်</p>
              </div>
            ) : (
              logs.map((log) => {
                const isUnread = !lastReadTimestamp || new Date(log.createdAt) > new Date(lastReadTimestamp);

                return (
                  <div
                    key={log.id}
                    className={`p-3 transition hover:bg-slate-50 space-y-1.5 ${
                      isUnread ? 'bg-sky-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Action Badge */}
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            log.action === 'create'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'update'
                              ? 'bg-sky-100 text-sky-800'
                              : log.action === 'delete'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {log.action === 'create'
                            ? '+ အသစ်ထည့်'
                            : log.action === 'update'
                            ? '✎ ပြင်ဆင်'
                            : log.action === 'delete'
                            ? '✕ ဖျက်ပစ်'
                            : '⚡ ရှင်းလင်း'}
                        </span>

                        {/* Entity Badge */}
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {log.entityType === 'school'
                            ? 'ကျောင်း'
                            : log.entityType === 'announcement'
                            ? 'ကြေညာချက်'
                            : log.entityType === 'association'
                            ? 'အသင်း'
                            : log.entityType === 'ticker'
                            ? 'စာတန်းပြေး'
                            : 'အက်ဒမင်'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>

                    {/* Details or Entity Name */}
                    <p className="text-xs text-slate-800 font-semibold leading-snug">
                      {log.entityName ? (
                        <span>
                          <strong className="text-sky-950">{log.entityName}</strong>
                          {log.details && <span className="text-slate-600 font-normal"> — {log.details}</span>}
                        </span>
                      ) : (
                        <span>{log.details || 'အချက်အလက် ပြောင်းလဲမှု ပြုလုပ်ခဲ့သည်'}</span>
                      )}
                    </p>

                    {/* Admin Email Footnote */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[200px]">
                        အက်ဒမင်: <span className="font-medium text-slate-700">{log.adminEmail || 'Admin'}</span>
                      </span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleViewAll}
              className="text-sky-800 font-bold hover:underline flex items-center gap-1 cursor-pointer w-full justify-center py-1"
            >
              <span>မှတ်တမ်း အပြည့်အစုံ ကြည့်ရှုရန် (View All)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
