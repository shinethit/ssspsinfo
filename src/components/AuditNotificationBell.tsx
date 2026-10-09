import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { AuditLog } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  History,
  Clock,
  Sparkles,
  Check,
  X,
  ExternalLink,
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

  // Allow opening notifications from custom events (e.g. mobile sidebar)
  useEffect(() => {
    const handleOpenNoti = () => {
      setIsOpen(true);
      markAllAsRead();
    };
    window.addEventListener('sssps_open_notifications', handleOpenNoti);
    return () => window.removeEventListener('sssps_open_notifications', handleOpenNoti);
  }, []);

  // Real-time listener for recent 10 audit logs (available for all users in Firestore)
  useEffect(() => {
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
          // If no logs yet, indicate 1 for initial version update if not read
          setUnreadCount(lastReadTimestamp ? 0 : 1);
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
  }, [lastReadTimestamp]);

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
    if (isAuthed) {
      navigate('/admin?tab=audit_logs');
    } else {
      navigate('/versions');
    }
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
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Icon Trigger Button - High Visibility on all viewports */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="စနစ်အသိပေးချက်များ (Notifications)"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
          isOpen
            ? 'bg-sky-100 text-sky-950 ring-2 ring-sky-500 border-sky-400'
            : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs'
        }`}
        title="စနစ်အသိပေးချက်များ (Notification Bell)"
      >
        <Bell className="w-4.5 h-4.5 text-slate-800 shrink-0" />

        {/* Unread badge or green dot */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-2xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed left-2 right-2 top-16 sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[32rem] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-white/10">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">စနစ်အသိပေးချက်များ</h4>
                  <p className="text-[10px] text-slate-300">
                    {unreadCount > 0 ? `မဖတ်ရသေးသော အသိပေးချက် (${unreadCount}) ခု` : 'အသိပေးချက်အားလုံး ဖတ်ပြီးပါပြီ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-white transition flex items-center gap-1 font-semibold cursor-pointer"
                    title="အားလုံးဖတ်ပြီးအဖြစ် သတ်မှတ်ရန်"
                  >
                    <Check className="w-3 h-3" />
                    <span>ဖတ်ပြီးမှတ်မည်</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="ပိတ်မည်"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Compact Black Version Update Strip */}
            <div className="px-3 py-1.5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 text-[10px] font-mono font-bold border border-neutral-700 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" /> v2.5
                </span>
                <span className="text-neutral-200 font-medium truncate text-[11px]">
                  Version Update (အမဲ) စနစ်သစ်
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('sssps_open_version_modal'));
                }}
                className="text-[11px] text-amber-300 hover:text-white font-bold ml-2 shrink-0 cursor-pointer flex items-center gap-0.5 hover:underline"
              >
                <span>ကြည့်ရန်</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Notification items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
              {logs.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <Bell className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">အသိပေးချက် အသစ် မရှိသေးပါ</p>
                  <p className="text-[11px] text-slate-400">
                    ကျောင်းစာရင်း အသစ်ထည့်/ပြင်/ဖျက်ပါက ဤနေရာတွင် အလိုအလျောက် ပေါ်မည်ဖြစ်ပါသည်
                  </p>
                </div>
              ) : (
                logs.map((log) => {
                  const isUnread = !lastReadTimestamp || new Date(log.createdAt) > new Date(lastReadTimestamp);

                  const actionConfigMap: Record<string, { label: string; bg: string }> = {
                    create: { label: '+ အသစ်', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    update: { label: '✎ ပြင်', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
                    delete: { label: '✕ ဖျက်', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
                    bulk_delete: { label: '⚡ အများဖျက်', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
                  };
                  const actionBadge = actionConfigMap[log.action] || { label: '⚙ လုပ်ဆောင်ချက်', bg: 'bg-slate-50 text-slate-700 border-slate-200' };

                  const entityMap: Record<string, string> = {
                    school: 'ကျောင်း',
                    announcement: 'ကြေညာချက်',
                    association: 'အသင်း',
                    ticker: 'စာတန်းပြေး',
                    admin: 'အက်ဒမင်',
                    school_level: 'ကျောင်းအဆင့်',
                  };
                  const entityText = entityMap[log.entityType] || 'စနစ်';

                  return (
                    <div
                      key={log.id}
                      className={`px-3 py-2 sm:py-2.5 transition hover:bg-slate-50 space-y-1 ${
                        isUnread ? 'bg-sky-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Top row: Badges + Timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${actionBadge.bg}`}>
                            {actionBadge.label}
                          </span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {entityText}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </div>

                      {/* Main message */}
                      <p className="text-xs text-slate-800 font-semibold leading-snug truncate">
                        {log.entityName ? (
                          <span>
                            <strong className="text-sky-950 font-bold">{log.entityName}</strong>
                            {log.details && <span className="text-slate-500 font-normal"> — {log.details}</span>}
                          </span>
                        ) : (
                          <span>{log.details || 'အချက်အလက် ပြောင်းလဲမှု ပြုလုပ်ခဲ့သည်'}</span>
                        )}
                      </p>

                      {/* Bottom line: Admin & unread marker */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[200px]">
                          အက်ဒမင်: <span className="text-slate-600">{log.adminEmail || 'Admin'}</span>
                        </span>
                        {isUnread && (
                          <span className="flex items-center gap-1 text-[10px] text-sky-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" /> အသစ်
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs px-3 shrink-0">
              <Link
                to="/versions"
                onClick={() => setIsOpen(false)}
                className="text-sky-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <History className="w-3.5 h-3.5" />
                <span>ဗားရှင်းမှတ်တမ်း &rarr;</span>
              </Link>

              {isAuthed && (
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="text-slate-600 hover:text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <span>Admin Logs &rarr;</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
