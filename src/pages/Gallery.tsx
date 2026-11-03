import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gallery as GalleryItem } from '../types';
import { Images, ArrowLeft, Loader2, X } from 'lucide-react';

export default function Gallery() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        // v24.6: no orderBy — orderBy('createdAt') silently dropped every
        // record missing createdAt. Sort in code, missing dates last.
        const snap = await getDocs(collection(db, 'gallery'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem));
        items.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setPhotos(items);
      } catch (err) {
        console.error(err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  const albums = useMemo(() => {
    const unique = Array.from(new Set(photos.map(p => p.album).filter(Boolean)));
    return unique.sort();
  }, [photos]);

  const filteredPhotos = selectedAlbum === 'all'
    ? photos
    : photos.filter(p => p.album === selectedAlbum);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sky-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs">
          <ArrowLeft className="w-4 h-4 text-sky-800" /> နောက်သို့
        </button>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition">ပင်မစာမျက်နှာ ➔</Link>
      </div>

      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Images className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black">ဓာတ်ပုံများ</h1>
        </div>
        <p className="text-sky-100 text-sm">အသင်း၏ လှုပ်ရှားမှုများနှင့် အခမ်းအနားများမှ ဓာတ်ပုံများ</p>
      </div>

      {albums.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedAlbum('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${selectedAlbum === 'all' ? 'bg-sky-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'}`}
          >
            အားလုံး ({photos.length})
          </button>
          {albums.map(album => (
            <button
              key={album}
              onClick={() => setSelectedAlbum(album)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${selectedAlbum === album ? 'bg-sky-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'}`}
            >
              {album} ({photos.filter(p => p.album === album).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Images className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm">ဓာတ်ပုံများ ဖတ်မရပါ။ အင်တာနက် စစ်ပြီး စာမျက်နှာကို ပြန်ဖွင့်ပါ။</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Images className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm">ဓာတ်ပုံ မရှိသေးပါ</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <p className="font-semibold text-sm">ဤအယ်လ်ဘမ်တွင် ဓာတ်ပုံ မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPhotos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left hover:border-sky-300 transition cursor-pointer"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{photo.title}</h3>
                {photo.album && (
                  <span className="inline-block mt-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-100 text-[11px] font-semibold">
                    {photo.album}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full-size photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{selectedPhoto.title}</h3>
                {selectedPhoto.album && (
                  <span className="text-xs text-sky-700 font-semibold">{selectedPhoto.album}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                title="ပိတ်ရန်"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="w-full max-h-[75vh] object-contain bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
