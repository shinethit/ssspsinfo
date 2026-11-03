import { KeyRound, LogOut, ShieldCheck, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

interface AdminNavigationProps {
  navItems: AdminNavItem[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  role: string;
  email: string;
  onChangePassword: () => void;
  onLogout: () => void;
}

export default function AdminNavigation({ navItems, activeTab, onSelectTab, role, email, onChangePassword, onLogout }: AdminNavigationProps) {
  return (
    <>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-20 shadow-xs">
        <div className="p-5 border-b border-slate-200 bg-gradient-to-br from-sky-950 via-sky-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Admin Console</h2>
              <span className="text-sm uppercase tracking-wider font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md">{role}</span>
            </div>
          </div>
          <p className="text-xs text-sky-200/90 mt-3 truncate font-medium">{email || 'admin@ssspsinfo'}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter(i => i.show).map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-3 cursor-pointer ${
                  active ? 'bg-sky-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
          <button onClick={onChangePassword} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/80 transition flex items-center gap-2 cursor-pointer">
            <KeyRound className="w-4 h-4 text-slate-500" /> စကားဝှက် ပြောင်းမည်
          </button>
          <button onClick={onLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/70 transition flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> အကောင့်မှ ထွက်မည်
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-sky-950 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <h2 className="font-extrabold flex items-center gap-2 text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Admin Console
        </h2>
        <select
          value={activeTab}
          onChange={(e) => onSelectTab(e.target.value)}
          className="p-2 rounded-xl text-xs bg-sky-900 text-white border border-sky-700 font-bold outline-none"
        >
          {navItems.filter(i => i.show).map(item => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </header>
    </>
  );
}
