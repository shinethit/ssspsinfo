import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, School, FileText, Building2, X, Command, CornerDownLeft } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { schools, announcements, associations } = useData();

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) {
    // This is the button that sits in the Header
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors text-sm mr-2"
      >
        <Search className="w-4 h-4" />
        <span className="w-16 text-left">ရှာဖွေရန်...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  // Filtering Logic
  const q = query.toLowerCase();
  const schoolResults = q ? schools.filter(s => s.name?.toLowerCase().includes(q) || s.founderName?.toLowerCase().includes(q)).slice(0, 5) : [];
  const announcementResults = q ? announcements.filter(a => a.title?.toLowerCase().includes(q)).slice(0, 5) : [];
  const associationResults = q ? associations.filter(a => a.name?.toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults = schoolResults.length > 0 || announcementResults.length > 0 || associationResults.length > 0;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-sky-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ကျောင်းအမည်၊ ကြေညာချက် သို့မဟုတ် အသင်းအမည်ဖြင့် ရှာဖွေပါ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-base"
          />
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q ? (
            <div className="py-14 text-center text-slate-500 flex flex-col items-center gap-2">
              <Command className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium">ရှာဖွေလိုသော အကြောင်းအရာကို ရိုက်ထည့်ပါ</p>
              <p className="text-xs text-slate-400">(ဥပမာ - "ပညာရောင်", "အစည်းအဝေး")</p>
            </div>
          ) : !hasResults ? (
            <div className="py-14 text-center text-slate-500">
              <p className="text-sm font-medium">ရှာဖွေမှုနှင့် ကိုက်ညီသော ရလဒ် မတွေ့ရှိပါ</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Schools */}
              {schoolResults.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ကျောင်းများ</h3>
                  {schoolResults.map(school => (
                    <div
                      key={school.id}
                      onClick={() => handleNavigate(`/schools/${school.id}`)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-50 cursor-pointer transition group"
                    >
                      <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-200 shrink-0">
                        <School className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{school.name}</p>
                        <p className="text-xs text-slate-500 truncate">{school.level} • {school.township || 'မြို့နယ်မသတ်မှတ်'}</p>
                      </div>
                      <CornerDownLeft className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}

              {/* Announcements */}
              {announcementResults.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ကြေညာချက်များ</h3>
                  {announcementResults.map(ann => (
                    <div
                      key={ann.id}
                      onClick={() => handleNavigate(`/announcements/${ann.id}`)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition group"
                    >
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-200 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{ann.title}</p>
                        <p className="text-xs text-slate-500 truncate">{ann.eventDate || 'ရက်စွဲမရှိ'}</p>
                      </div>
                      <CornerDownLeft className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}

              {/* Associations */}
              {associationResults.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">အသင်းများ</h3>
                  {associationResults.map(assoc => (
                    <div
                      key={assoc.id}
                      onClick={() => handleNavigate('/associations')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 cursor-pointer transition group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{assoc.name}</p>
                        <p className="text-xs text-slate-500 truncate">{assoc.township || 'မြို့နယ်မသတ်မှတ်'}</p>
                      </div>
                      <CornerDownLeft className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">↑</kbd> <kbd className="bg-white border border-slate-200 rounded px-1">↓</kbd> ရွေးရန်</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">Enter</kbd> ဝင်ရန်</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1">Esc</kbd> ပိတ်ရန်</span>
        </div>

      </div>
    </div>
  );
}
