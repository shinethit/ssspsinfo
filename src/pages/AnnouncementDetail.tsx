import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Announcement } from '../types';
import { getCategoryBadge } from './Announcements';
import { Calendar, ArrowLeft, Paperclip, FileText } from 'lucide-react';

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const docRef = doc(db, 'announcements', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnnouncement({ id: docSnap.id, ...docSnap.data() } as Announcement);
        } else {
          setAnnouncement(null);
        }
      } catch (err) {
        console.error('Error fetching announcement detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-md w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-100 rounded-md w-1/2 mx-auto"></div>
          <div className="h-32 bg-slate-100 rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold text-slate-700">ကြေညာချက် ရှာမတွေ့ပါ</h3>
        <p className="text-slate-500 text-sm">ရှာဖွေနေသော ကြေညာချက် မရှိတော့ပါ သို့မဟုတ် ဖျက်လိုက်ပြီး ဖြစ်နိုင်ပါသည်။</p>
        <Link
          to="/announcements"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="w-4 h-4" /> ကြေညာချက်များသို့ ပြန်သွားရန်
        </Link>
      </div>
    );
  }

  const badge = getCategoryBadge(announcement.category);
  const dateFormatted = announcement.publishedAt
    ? new Date(announcement.publishedAt).toLocaleDateString('my-MM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/announcements"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-800 hover:text-sky-950 transition"
      >
        <ArrowLeft className="w-4 h-4" /> ကြေညာချက်များသို့ ပြန်သွားရန်
      </Link>

      <article className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
            {badge.label}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{dateFormatted || announcement.publishedAt}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-950 leading-[1.75]">
          {announcement.title}
        </h1>

        <div className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line border-t border-slate-100 pt-6">
          {announcement.body}
        </div>

        {/* Attachments if any */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-sky-600" /> ပူးတွဲဖိုင်များ (Attachments)
            </h4>
            <div className="space-y-2">
              {announcement.attachments.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-sky-700 hover:bg-sky-50 transition"
                >
                  <Paperclip className="w-3.5 h-3.5" /> ပူးတွဲဖိုင် #{idx + 1} ကြည့်ရှုရန်
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
