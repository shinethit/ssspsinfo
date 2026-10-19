import React, { useState, useMemo } from 'react';
import { 
  Search, School as SchoolIcon, Edit2, Trash2, Eye, Download, Upload, 
  ChevronDown, ChevronUp, ListFilter, FileSpreadsheet, Loader2, Layers, GraduationCap, ArrowUpDown, ChevronLeft, ChevronRight, Printer, UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { School, SchoolLevelItem } from '../../types';
import { getUnifiedSchoolLevels } from '../../lib/schoolLevels';

interface AdminSchoolManagerProps {
  schools: School[];
  schoolLevels: SchoolLevelItem[];
  onEdit: (school: School) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFee: (school: School) => void;
  onUpdateStatus: (school: School, status: 'active' | 'under_review' | 'inactive') => void;
  onCreateAccount: (school: School) => void;
  onOpenExcel: () => void;
  onExportExcel: () => void;
  onCleanDuplicates: () => void;
  onExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingExcel: boolean;
  excelUploadState: any;
}

export default function AdminSchoolManager({
  schools, schoolLevels, onEdit, onDelete, onToggleFee, onUpdateStatus, onCreateAccount, onOpenExcel, onExportExcel, onCleanDuplicates, onExcelUpload, isUploadingExcel, excelUploadState
}: AdminSchoolManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'fee_paid' | 'fee_unpaid'>('name_asc');
  const [showExcelPanel, setShowExcelPanel] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 1. Filter
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q));
      
      const matchStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  // 2. Sort
  const sortedSchools = useMemo(() => {
    return [...filteredSchools].sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'my');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'my');
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'fee_paid') return (b.isAnnualFeePaid ? 1 : 0) - (a.isAnnualFeePaid ? 1 : 0);
      if (sortBy === 'fee_unpaid') return (a.isAnnualFeePaid ? 1 : 0) - (b.isAnnualFeePaid ? 1 : 0);
      return 0;
    });
  }, [filteredSchools, sortBy]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedSchools.length / itemsPerPage);
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSchools.slice(start, start + itemsPerPage);
  }, [sortedSchools, currentPage, itemsPerPage]);

  // 4. Group Paginated Data
  const groupedData = useMemo(() => {
    const unifiedLevels = getUnifiedSchoolLevels(schoolLevels, schools);
    
    return unifiedLevels.map(level => {
      const levelSchools = paginatedSchools.filter(s => level.schools.some(ls => ls.id === s.id));
      return {
        config: level,
        schools: levelSchools
      };
    }).filter(group => group.schools.length > 0);
  }, [paginatedSchools, schoolLevels, schools]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Excel Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SchoolIcon className="w-6 h-6 text-sky-600" /> ကျောင်းများ စီမံခန့်ခွဲမှု
          </h2>
          <p className="text-sm text-slate-500 mt-1">စုစုပေါင်း {schools.length} ကျောင်း ရှိပါသည်</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExcelPanel(!showExcelPanel)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 border ${showExcelPanel ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel စနစ်
            <ChevronDown className={`w-4 h-4 transition-transform ${showExcelPanel ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={onOpenExcel}
            className="bg-sky-900 hover:bg-sky-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2"
          >
            + ကျောင်းအသစ်ထည့်ရန်
          </button>
        </div>
      </div>

      {/* 2. Collapsible Excel Panel */}
      {showExcelPanel && (
        <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onExportExcel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
              <Download className="w-4 h-4 text-sky-600" /> စာရင်းအားလုံး Excel ထုတ်မည်
            </button>
            <button onClick={onCleanDuplicates} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
              <ListFilter className="w-4 h-4 text-amber-600" /> ထပ်နေသောကျောင်းများ ရှင်းမည်
            </button>
            <label className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" /> Excel ဖိုင်ဖြင့် အစုလိုက်တင်မည်
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onExcelUpload} />
            </label>
          </div>
          {isUploadingExcel && (
            <div className="mt-4 bg-white p-3 rounded-xl border border-sky-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              <div className="flex-1">
                <p className="text-xs font-bold text-sky-900">{excelUploadState?.stageText}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${excelUploadState?.progressPercent || 0}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Search, Sort & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ကျောင်းအမည်၊ တည်ထောင်သူဖြင့် ရှာဖွေရန်..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-500 outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none">
          <option value="all">အခြေအနေအားလုံး</option>
          <option value="active">🟢 လည်ပတ်ဆဲ</option>
          <option value="under_review">🟡 စိစစ်ဆဲ</option>
          <option value="inactive">⚪ ရပ်နား</option>
        </select>
        <div className="relative">
          <ArrowUpDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }} 
            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm font-medium outline-none appearance-none cursor-pointer hover:bg-slate-100 transition"
          >
            <option value="name_asc">အမည် (က မှ အ ထိ)</option>
            <option value="name_desc">အမည် (အ မှ က ထိ)</option>
            <option value="newest">အသစ်ဆုံး အရင်ပြ</option>
            <option value="fee_paid">ကြေးသွင်းပြီး အရင်ပြ</option>
            <option value="fee_unpaid">ကြေးမသွင်းရသေး အရင်ပြ</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 4. Grouped School List */}
      <div className="space-y-4">
        {groupedData.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မရှိပါ။</div>
        ) : (
          groupedData.map(group => {
            const isCollapsed = collapsedGroups[group.config.id];
            
            return (
              <div key={group.config.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                
                <div 
                  onClick={() => toggleGroup(group.config.id)}
                  className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isCollapsed ? 'bg-slate-50 hover:bg-slate-100' : 'bg-sky-50/50 border-b border-sky-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-sky-700">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {group.config.name}
                        <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                          {group.schools.length} ကျောင်း
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.schools.map(school => (
                      <div key={school.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-4 min-w-0">
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <SchoolIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{school.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {school.status === 'under_review' && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">စိစစ်ဆဲ</span>}
                              {school.status === 'inactive' && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ရပ်နား</span>}
                              <span className="text-[10px] text-slate-500">{school.township || school.city || 'မြို့နယ်မသတ်မှတ်'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-14 md:ml-0">
                          <button 
                            onClick={() => onToggleFee(school)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition ${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                          >
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးပေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>
                          
                          <div className="w-px h-5 bg-slate-200 mx-0.5"></div>

                          <Link to={`/schools/${school.id}`} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition" title="ကြည့်ရန်">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onEdit(school)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition" title="ပြင်ဆင်ရန်">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(school.id, school.name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="ဖျက်ရန်">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl mt-4">
          <span className="text-xs font-semibold text-slate-500">
            စာမျက်နှာ {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> ရှေ့သို့
            </button>
            <button
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-lg hover:bg-sky-200 disabled:opacity-50 transition flex items-center gap-1"
            >
              နောက်သို့ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
