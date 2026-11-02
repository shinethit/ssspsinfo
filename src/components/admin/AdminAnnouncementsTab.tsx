import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { confirmDialog } from '../../components/ConfirmModal';
import { ANNOUNCEMENT_CATEGORIES, getCategoryBadge } from '../../pages/Announcements';
import { ZONE_FILTER_OPTIONS } from '../../constants';
import { sortAnnouncementsByEventDate, useData } from '../../context/DataContext';
import ImageUploadDropzone from '../../components/ImageUploadDropzone';
import { Calendar, Edit2, FileText, Trash2 } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(1, 'ခေါင်းစဉ် လိုအပ်သည်'),
  body: z.string().min(1, 'အကြောင်းအရာ လိုအပ်သည်'),
  category: z.string().min(1, 'ကဏ္ဍ ရွေးချယ်ပါ'),
  eventDate: z.string().min(1, 'ကြေညာချက်ရက်စွဲ ထည့်သွင်းပေးပါ'),
  attachmentUrl: z.string().optional(),
  zone: z.string().optional(),
});

interface AdminAnnouncementsTabProps {
  announcements: any[];
  onRefresh: () => void;
}

export default function AdminAnnouncementsTab({ announcements, onRefresh }: AdminAnnouncementsTabProps) {
  const { addAnnouncement, updateAnnouncement, deleteAnnouncement: removeAnnouncement } = useData();

  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const announcementForm = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', body: '', category: 'general', eventDate: new Date().toISOString().split('T')[0], attachmentUrl: '', zone: '' },
  });

  const sortedAnnouncements = useMemo(() => sortAnnouncementsByEventDate(announcements as any), [announcements]);

  const startEditAnnouncement = (a: any) => {
    setEditingAnnouncementId(a.id);
    announcementForm.reset({ title: a.title || '', body: a.body || '', category: a.category || 'general', eventDate: a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : ''), attachmentUrl: a.attachments?.[0] || '', zone: a.zone || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditAnnouncement = () => {
    setEditingAnnouncementId(null);
    announcementForm.reset({ title: '', body: '', category: 'general', eventDate: new Date().toISOString().split('T')[0], attachmentUrl: '', zone: '' });
  };
  const onAnnouncementSubmit = async (data: any) => {
    try {
      const sd = data.eventDate;
      const ipa = new Date(sd + 'T12:00:00Z').toISOString();
      const pl = { ...data, eventDate: sd, publishedAt: ipa, attachments: data.attachmentUrl ? [data.attachmentUrl] : [] };
      if (editingAnnouncementId) { await updateAnnouncement(editingAnnouncementId, pl); toast.success('ကြေညာချက် ပြင်ဆင်ပြီးပါပြီ'); }
      else { await addAnnouncement({ ...pl, createdAt: new Date().toISOString() }); toast.success('ကြေညာချက်အသစ် တင်ပြီးပါပြီ'); }
      cancelEditAnnouncement(); onRefresh();
    } catch (e) { toast.error('အမှားဖြစ်ပွားပါသည်'); }
  };
  const deleteAnnouncement = async (id: string) => {
    if (!(await confirmDialog('ဤကြေညာချက်ကို ဖျက်ရန် သေချာပါသလား?'))) return;
    try { await removeAnnouncement(id); toast.success('ဖျက်ပြီးပါပြီ'); onRefresh(); } catch (e) { toast.error('ဖျက်၍မရပါ'); }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in">
      <div className="lg:col-span-5">
        <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            {editingAnnouncementId ? 'ကြေညာချက် ပြင်ဆင်ရန်' : 'ကြေညာချက်အသစ် တင်ရန်'}
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ခေါင်းစဉ် *</label>
            <input {...announcementForm.register('title')} placeholder="ကြေညာချက် ခေါင်းစဉ်..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ကဏ္ဍ *</label>
              <select {...announcementForm.register('category')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                {ANNOUNCEMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ရက်စွဲ *</label>
              <input type="date" {...announcementForm.register('eventDate')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ဇုန် သတ်မှတ်ချက် (Optional)</label>
            <select {...announcementForm.register('zone')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
              <option value="">ဇုန်အားလုံးနှင့် သက်ဆိုင်သည်</option>
              {ZONE_FILTER_OPTIONS.filter(z => z.value !== 'all').map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">အကြောင်းအရာ အပြည့်အစုံ *</label>
            <textarea rows={5} {...announcementForm.register('body')} placeholder="အကြောင်းအရာ ရေးသားပါ..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ပူးတွဲဖိုင် / ပုံ (Image or Link)</label>
            <ImageUploadDropzone value={announcementForm.watch('attachmentUrl') || ''} onChange={(url) => announcementForm.setValue('attachmentUrl', url)} />
            <input {...announcementForm.register('attachmentUrl')} placeholder="သို့မဟုတ် ပုံ/ဖိုင် Link တိုက်ရိုက်ထည့်ရန်..." className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            {editingAnnouncementId && (
              <button type="button" onClick={cancelEditAnnouncement} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold cursor-pointer">မလုပ်တော့ပါ</button>
            )}
            <button type="submit" className="flex-1 bg-sky-900 hover:bg-sky-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer">
              {editingAnnouncementId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'ကြေညာချက် တင်မည်'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">တင်ထားပြီးသော ကြေညာချက်များ ({sortedAnnouncements.length})</h3>
        </div>
        {sortedAnnouncements.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">ကြေညာချက် မရှိသေးပါ</div>
        ) : (
          sortedAnnouncements.map((a: any) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-200 transition space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {getCategoryBadge(a.category)}
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {a.eventDate || (a.publishedAt ? a.publishedAt.split('T')[0] : '')}</span>
                    {a.zone && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{a.zone}</span>}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{a.title}</h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => startEditAnnouncement(a)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-line">{a.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
