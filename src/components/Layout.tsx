import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  BookOpen,
  Users,
  MessageSquare,
  ShieldCheck,
  Newspaper,
  Building2,
  Menu,
  X,
  Home,
  History,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import NewsTickerBar from './NewsTickerBar';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { VersionUpdateModal } from './VersionUpdateModal';
import { AuditNotificationBell } from './AuditNotificationBell';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'ပင်မစာမျက်နှာ', labelEn: 'Home', icon: Home, exact: true },
    { to: '/dashboard', label: 'ဒက်ရှ်ဘုတ် (စာရင်းအင်း)', labelEn: 'Dashboard', icon: BarChart3 },
    { to: '/announcements', label: 'ကြေညာချက်များ', labelEn: 'Announcements', icon: BookOpen },
    { to: '/associations', label: 'အသင်းများ', labelEn: 'Associations', icon: Building2 },
    { to: '/contacts', label: 'အသင်းဝင်ကျောင်းများ', labelEn: 'Member Schools', icon: Users },
    { to: '/chat', label: 'Chat ဆွေးနွေးခန်း', labelEn: 'Chat Room', icon: MessageSquare },
  ];

  const utilityLinks = [
    { to: '/admin', label: 'အက်ဒမင် ဧရိယာ', labelEn: 'Admin Portal', icon: ShieldCheck, badge: 'Admin' },
    { to: '/versions', label: 'ဗားရှင်းမှတ်တမ်း', labelEn: 'Version History', icon: History, badge: 'v1.9' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col w-full max-w-full overflow-x-hidden font-sans">
      {/* 
        1. FIXED TOP HEADER (Scroll လုပ်ရင် လိုက်မတက်သွားစေရန် fixed အဖြစ် ထားရှိထားပါသည်)
      */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs z-40 w-full flex items-center">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Hamburger Button (for Sidebar toggle) + Brand Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle Sidebar Navigation"
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-sky-900 transition focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer shrink-0"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition"
            >
              <div className="bg-sky-600 p-2 rounded-xl text-white shadow-xs shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-sm sm:text-base text-sky-950 truncate leading-normal">
                  သတင်းနှင့် ပြန်ကြားရေးဌာန
                </span>
                <span className="hidden sm:block text-[11px] text-slate-500 truncate leading-normal">
                  ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Notification Bell, PWA Install, Quick Version Tag & Admin Shortcut */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Audit Logs Notification Bell Icon */}
            <AuditNotificationBell />

            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="header" />

            <Link
              to="/versions"
              onClick={closeSidebar}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> v1.9
            </Link>

            <Link
              to="/admin"
              onClick={closeSidebar}
              className="bg-sky-900 text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-sky-800 transition shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 
        2. SIDEBAR NAVIGATION
        - Desktop: Fixed on the left (w-64)
        - Mobile/Tablet: Slide-out drawer with backdrop overlay
      */}
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Main Navigation Section */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              ပင်မကဏ္ဍများ (Menu)
            </p>
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeSidebar}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition group ${
                    isActive
                      ? 'bg-sky-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-sky-50 hover:text-sky-950'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-sky-600 group-hover:text-sky-900'
                      }`}
                    />
                    <span className="truncate">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Tools & Management Section */}
          <div className="space-y-1 pt-4 border-t border-slate-100">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              စီမံခန့်ခွဲမှုနှင့် မှတ်တမ်း (System)
            </p>
            {utilityLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeSidebar}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition group ${
                    isActive
                      ? 'bg-sky-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-sky-50 hover:text-sky-950'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-sky-600 group-hover:text-sky-900'
                      }`}
                    />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-sky-800 text-sky-100'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-800'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
          {/* PWA Install Button inside Sidebar */}
          <PWAInstallButton variant="sidebar" />

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-950">System Version</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                v1.9 (PWA)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း
            </p>
            <div className="pt-1">
              <Link
                to="/versions"
                onClick={closeSidebar}
                className="text-[11px] text-sky-700 hover:underline font-semibold flex items-center gap-1"
              >
                ဗားရှင်းမှတ်တမ်း ကြည့်ရန် →
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* 
        3. MAIN CONTENT AREA
        - Offset by pt-16 (for fixed top header) and lg:pl-64 (for fixed left sidebar)
        - Content scrolls independently without the header moving away
      */}
      <div className="pt-16 lg:pl-64 flex flex-col flex-1 w-full max-w-full overflow-x-hidden min-h-screen">
        {/* Real-time Admin News Ticker (စာတန်းပြေး ကြေညာချက်) */}
        <NewsTickerBar />

        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-slate-500 text-xs sm:text-sm mt-auto w-full">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600">
            <p className="font-medium text-slate-700">
              ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း — သတင်းနှင့် ပြန်ကြားရေးဌာန
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Link to="/versions" className="hover:text-sky-800 transition underline">
                Version v1.9
              </Link>
              <span>•</span>
              <p>© 2026 All rights reserved</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Offline Connectivity State Indicator */}
      <OfflineIndicator />

      {/* What's New Version Update Modal Popup */}
      <VersionUpdateModal />

      <Toaster position="top-right" />
    </div>
  );
}
