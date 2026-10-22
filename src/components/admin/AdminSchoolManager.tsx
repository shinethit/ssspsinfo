import React, { useState, useMemo } from 'react';
import { 
  Search, School as SchoolIcon, Edit2, Trash2, Eye, Download, Upload, 
  ChevronDown, ChevronUp, ListFilter, FileSpreadsheet, Loader2, GraduationCap, 
  ArrowUpDown, ChevronLeft, ChevronRight, Printer, UserPlus, MapPin, CheckCircle2, XCircle, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { School, SchoolLevelItem } from '../../types';
import { getUnifiedSchoolLevels } from '../../lib/schoolLevels';
import { ZONE_FILTER_OPTIONS, isSchoolInZone } from '../../constants';
import { downloadSchoolTemplate } from '../../lib/excel';
import AnnualFeeReceipt from './AnnualFeeReceipt';

interface AdminSchoolManagerProps {
  role?: string;
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
  canDelete?: boolean;
}

export default function AdminSchoolManager({
  role, schools, schoolLevels, onEdit, onDelete, onToggleFee, onUpdateStatus, 
  onCreateAccount, onOpenExcel, onExportExcel, onCleanDuplicates, onExcelUpload, 
  isUploadingExcel, excelUploadState, canDelete = true
}: AdminSchoolManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_review' | 'inactive'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'fee_paid' | 'fee_unpaid'>('name_asc');
  const [showExcelPanel, setShowExcelPanel] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptSchool, setReceiptSchool] = useState<School | null>(null);
  const itemsPerPage = 20;

  const [feeModalSchool, setFeeModalSchool] = useState<School | null>(null);
  const [feeDate, setFeeDate] = useState(new Date().toISOString().split('T')[0]);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeAcademicYear, setFeeAcademicYear] = useState('၂၀၂၅-၂၀၂၆');
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);

  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.founderName && s.founderName.toLowerCase().includes(q)) ||
        (s.adminName && s.adminName.toLowerCase().includes(q)) ||
        (s.township && s.township.toLowerCase().includes(q));
      
      const matchStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;
      const matchZone = isSchoolInZone(s.zone, zoneFilter);

      return matchSearch && matchStatus && matchZone;
    });
  }, [schools, searchQuery, statusFilter, zoneFilter]);

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

  const totalPages = Math.ceil(sortedSchools.length / itemsPerPage);
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSchools.slice(start, start + itemsPerPage);
  }, [sortedSchools, currentPage, itemsPerPage]);

  const groupedData = useMemo(() => {
    const unifiedLevels = getUnifiedSchoolLevels(schoolLevels, schools);
    return unifiedLevels.map(level => {
      const levelSchools = paginatedSchools.filter(s => level.schools.some(ls => ls.id === s.id));
      return { config: level, schools: levelSchools };
    }).filter(group => group.schools.length > 0);
  }, [paginatedSchools, schoolLevels, schools]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalSchool) return;
    try {
      setIsSubmittingFee(true);
      const numericAmount = Number(String(feeAmount).replace(/[^0-9]/g, '')) || 200000;
      const updates = {
        isAnnualFeePaid: true,
        feePaidDate: feeDate,
        feeAmount: numericAmount,
        feeAcademicYear: feeAcademicYear || '၂၀၂၅-၂၀၂၆',
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'schools', feeModalSchool.id), updates);
      toast.success(`"${feeModalSchool.name}" အတွက် နှစ်စဉ်ကြေး ပေးသွင်းမှု မှတ်တမ်းတင်ပြီးပါပြီ`);
      const updatedSchool = { ...feeModalSchool, ...updates };
      setFeeModalSchool(null);
      setReceiptSchool(updatedSchool);
    } catch (err) {
      toast.error('နှစ်စဉ်ကြေး သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setIsSubmittingFee(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl"><SchoolIcon className="w-6 h-6" /></div>
            ကျောင်းများ စီမံခန့်ခွဲမှု
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            စုစုပေါင်း <span className="font-bold text-slate-800">{schools.length}</span> ကျောင်း (ရှာဖွေတွေ့ရှိမှု: <span className="font-bold text-sky-700">{filteredSchools.length}</span> ကျောင်း)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowExcelPanel(!showExcelPanel)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border ${showExcelPanel ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel စနစ်
            <ChevronDown className={`w-4 h-4 transition-transform ${showExcelPanel ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={onOpenExcel}
            className="bg-sky-900 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ကျောင်းအသစ်ထည့်ရန်
          </button>
        </div>
      </div>

      {/* 2. Collapsible Excel Panel */}
      {showExcelPanel && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50/50 p-5 rounded-2xl border border-sky-200/80 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => downloadSchoolTemplate()} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2 shadow-xs cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> နမူနာပုံစံ (Template) ရယူရန်
            </button>
            <button onClick={onExportExcel} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2 shadow-xs cursor-pointer">
              <Download className="w-4 h-4 text-sky-600" /> စာရင်းအားလုံး Excel ထုတ်မည်
            </button>
            <button onClick={onCleanDuplicates} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2 shadow-xs cursor-pointer">
              <ListFilter className="w-4 h-4 text-amber-600" /> ထပ်နေသောကျောင်းများ ရှင်းမည်
            </button>
            <label className="bg-sky-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sky-800 transition flex items-center gap-2 cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" /> Excel ဖိုင်ဖြင့် အစုလိုက်တင်မည်
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onExcelUpload} />
            </label>
          </div>
          {isUploadingExcel && (
            <div className="mt-4 bg-white p-4 rounded-xl border border-sky-200 flex items-center gap-3 shadow-xs">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-sky-900">{excelUploadState?.stageText || 'တင်သွင်းနေပါသည်...'}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full transition-all duration-300" style={{ width: `${excelUploadState?.progressPercent || 0}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Search, Sort & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ကျောင်းအမည်၊ တည်ထောင်သူ၊ မြို့နယ်ဖြင့် ရှာဖွေရန်..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-500 outline-none transition"
          />
        </div>
        <select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500">
          {ZONE_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500">
          <option value="all">အခြေအနေအားလုံး</option>
          <option value="active">🟢 လည်ပတ်ဆဲ (Active)</option>
          <option value="under_review">🟡 စိစစ်ဆဲ (Review)</option>
          <option value="inactive">⚪ ရပ်နား (Inactive)</option>
        </select>
        <div className="relative">
          <ArrowUpDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-sm font-semibold text-slate-700 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition"
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
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <SchoolIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">ရှာဖွေမှုနှင့် ကိုက်ညီသော ကျောင်း မရှိပါ။</p>
          </div>
        ) : (
          groupedData.map(group => {
            const isCollapsed = collapsedGroups[group.config.id];
            return (
              <div key={group.config.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div 
                  onClick={() => toggleGroup(group.config.id)}
                  className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isCollapsed ? 'bg-slate-50 hover:bg-slate-100' : 'bg-sky-50/60 border-b border-sky-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-sky-700">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2.5">
                        {group.config.name}
                        <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full border border-sky-200">
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
                      <div key={school.id} className="p-4 sm:px-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                              <SchoolIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">{school.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <select
                                value={school.status || 'active'}
                                onChange={(e) => onUpdateStatus(school, e.target.value as any)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border outline-none cursor-pointer ${
                                  school.status === 'under_review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  school.status === 'inactive' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                <option value="active">🟢 Active</option>
                                <option value="under_review">🟡 စိစစ်ဆဲ</option>
                                <option value="inactive">⚪ ရပ်နား</option>
                              </select>
                              {(school.township || school.city) && <span className="text-xs font-medium text-slate-500">• {school.township || school.city}</span>}
                              {school.zone && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                  <MapPin className="w-3 h-3" />{school.zone}
                                </span>
                              )}
                              {school.accountEmail && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                  ✓ {school.accountEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 ml-15 md:ml-0">
                          <button 
                            onClick={() => {
                              if (school.isAnnualFeePaid) {
                                onToggleFee(school);
                              } else {
                                setFeeModalSchool(school);
                                setFeeDate(new Date().toISOString().split('T')[0]);
                                setFeeAmount(school.feeAmount?.toString() || '200000');
                                setFeeAcademicYear(school.feeAcademicYear || '၂၀၂၅-၂၀၂၆');
                              }
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${school.isAnnualFeePaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                          >
                            {school.isAnnualFeePaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {school.isAnnualFeePaid ? 'နှစ်စဉ်ကြေးသွင်းပြီး' : 'နှစ်စဉ်ကြေးမသွင်းရသေး'}
                          </button>

                          {school.isAnnualFeePaid && (
                            <button
                              onClick={() => setReceiptSchool(school)}
                              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                              title="ပြေစာထုတ်ရန်"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          
                          <div className="w-px h-5 bg-slate-200 mx-0.5"></div>

                          <Link to={`/schools/${school.id}`} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition" title="အသေးစိတ်ကြည့်ရန်">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onCreateAccount(school)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="ကျောင်းအကောင့် ဖန်တီးရန်">
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(school)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer" title="ပြင်ဆင်ရန်">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button onClick={() => onDelete(school.id, school.name)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="ဖျက်ရန်">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
        <div className="flex items-center justify-between bg-white px-5 py-3.5 border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-600">
            စာမျက်နှာ {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-3.5 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> ရှေ့သို့
            </button>
            <button
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage >= totalPages}
              className="px-3.5 py-2 text-xs font-bold bg-sky-900 text-white rounded-xl hover:bg-sky-800 disabled:opacity-50 transition flex items-center gap-1 cursor-pointer"
            >
              နောက်သို့ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Fee Payment Modal */}
      {feeModalSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">နှစ်စဉ်ကြေး ပေးသွင်းမှု မှတ်တမ်းတင်ရန်</h3>
            <p className="text-sm font-semibold text-sky-700 mb-4">{feeModalSchool.name}</p>
            <form onSubmit={handleConfirmFeePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ပညာသင်နှစ်</label>
                <input type="text" required value={feeAcademicYear} onChange={e => setFeeAcademicYear(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ပေးသွင်းသည့် ပမာဏ (ကျပ်)</label>
                <input type="number" required value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ပေးသွင်းသည့် ရက်စွဲ</label>
                <input type="date" required value={feeDate} onChange={e => setFeeDate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setFeeModalSchool(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer">မလုပ်တော့ပါ</button>
                <button type="submit" disabled={isSubmittingFee} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold transition cursor-pointer">
                  {isSubmittingFee ? 'သိမ်းနေပါသည်...' : 'အတည်ပြုမည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Annual Fee Receipt Modal */}
      {receiptSchool && (
        <AnnualFeeReceipt school={receiptSchool} onClose={() => setReceiptSchool(null)} />
      )}
    </div>
  );
}
