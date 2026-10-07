import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Announcement } from '../types';
import { Tag, Calendar, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

export const ANNOUNCEMENT_CATEGORIES = [
  { id: 'all', label: 'အားလုံး', labelEn: 'All', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'important', label: 'အရေးကြီး', labelEn: 'Important', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'meeting', label: 'အစည်းအဝေး', labelEn: 'Meeting', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'events', label: 'လှုပ်ရှားမှုများ', labelEn: 'Events', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'training', label: 'သင်တန်း / အလုပ်ရုံဆွေးနွေးပွဲ', labelEn: 'Training', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'general', label: 'အထွေထွေ', labelEn: 'General', color: 'bg-sky-50 text-sky-700 border-sky-200' },
];

export function getCategoryBadge(categoryId?: string) {
  const match = ANNOUNCEMENT_CATEGORIES.find(
    c => c.id === categoryId || c.label === categoryId || c.labelEn.toLowerCase() === (categoryId || '').toLowerCase()
  );
  if (match && match.id !== 'all') {
    return {
      label: `${match.label} (${match.labelEn})`,
      className: match.color,
    };
  }
  return {
    label: categoryId || 'အထွေထွေ (General)',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  };
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'announcements'), orderBy('publishedAt', 'desc'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Announcement[];
        setAnnouncements(list);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const matchCategory =
        selectedCategory === 'all' ||
        a.category === selectedCategory ||
        (selectedCategory === 'important' && (a.category === 'အရေးကြီး' || a.category === 'Important')) ||
        (selectedCategory === 'meeting' && (a.category === 'အစည်းအဝေး' || a.category === 'Meeting')) ||
        (selectedCategory === 'events' && (a.category === 'လှုပ်ရှားမှုများ' || a.category === 'Events')) ||
        (selectedCategory === 'training' && (a.category === 'သင်တန်း / အလုပ်ရုံဆွေးနွေးပွဲ' || a.category === 'Training')) ||
        (selectedCategory === 'general' && (!a.category || a.category === 'အထွေထွေ' || a.category === 'General'));

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.body && a.body.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [announcements, selectedCategory, searchQuery]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(start, start + itemsPerPage);
  }, [filteredAnnouncements, currentPage]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-extrabold text-sky-950 flex items-center gap-3">
          <FileText className="w-8 h-8 text-sky-600" />
          ကြေညာချက်များ <span className="text-lg font-normal text-slate-500">(Announcements)</span>
        </h2>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း၏ တရားဝင် ထုတ်ပြန်ချက်များနှင့် သတင်းအချက်အလက်များ
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ကြေညာချက် ခေါင်းစဉ် (သို့) အကြောင်းအရာ ရှာဖွေရန်..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden text-sm sm:text-base"
          />
        </div>

        {/* Categories Tab Buttons */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> ကဏ္ဍအလိုက် ခွဲခြားကြည့်ရှုရန် (Filter by Category)
          </div>
          <div className="flex flex-wrap gap-2">
            {ANNOUNCEMENT_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-800 text-white border-sky-800 shadow-xs ring-2 ring-sky-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {cat.label} <span className="text-xs opacity-75">({cat.labelEn})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Announcement List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-6 bg-slate-200 rounded-md w-2/5"></div>
              <div className="h-4 bg-slate-100 rounded-md w-4/5"></div>
              <div className="h-4 bg-slate-100 rounded-md w-3/5"></div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-semibold text-lg">ဒေတာ မရှိသေးပါ (No announcements found)</p>
          <p className="text-slate-400 text-sm">
            {selectedCategory !== 'all' || searchQuery
              ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော ကြေညာချက် မရှိပါ။ ကဏ္ဍ သို့မဟုတ် စာလုံးပေါင်းကို ပြန်လည်စစ်ဆေးပါ။'
              : 'လက်ရှိအချိန်တွင် ထုတ်ပြန်ထားသော ကြေညာချက်များ မရှိသေးပါ။'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItems.map(a => {
            const badge = getCategoryBadge(a.category);
            const dateStr = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('my-MM', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : '';

            return (
              <article
                key={a.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr || (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '')}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-sky-950">
                  <Link to={`/announcements/${a.id}`} className="hover:text-sky-700 transition">
                    {a.title}
                  </Link>
                </h3>

                <p className="text-slate-600 line-clamp-3 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {a.body}
                </p>

                {a.attachments && a.attachments.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      📎 ပူးတွဲဖိုင် {a.attachments.length} ခု
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to={`/announcements/${a.id}`}
                    className="text-sky-700 hover:text-sky-900 font-semibold text-sm inline-flex items-center gap-1"
                  >
                    အပြည့်အစုံဖတ်ရှုရန် →
                  </Link>
                </div>
              </article>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-5 px-1 w-full">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                စုစုပေါင်း {filteredAnnouncements.length} ခုအနက် မျက်နှာစာ {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer bg-white"
                >
                  <ChevronLeft className="w-4 h-4" /> ရှေ့သို့
                </button>
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 sm:hidden">
                  {currentPage} / {totalPages}
                </span>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-sky-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer bg-white"
                >
                  နောက်သို့ <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
