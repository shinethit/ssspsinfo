import { useState } from 'react';
import { Share2, Copy, Check, QrCode, X, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  label?: string;
  className?: string;
}

export default function ShareButton({
  url,
  title = '',
  text = '',
  variant = 'secondary',
  label = 'မျှဝေရန်',
  className = '',
}: ShareButtonProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + encodeURIComponent(shareUrl);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('လင့်ခ်ကို ကော်ပီ ကူးယူပြီးပါပြီ');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('မျှဝေ၍ မရပါ');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('လင့်ခ် ကော်ပီပြီးပါပြီ');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('ကော်ပီ ကူးယူ၍ မရပါ'); }
  };

  const baseClasses = 'inline-flex items-center gap-1.5 rounded-xl font-bold text-xs transition cursor-pointer border';
  const variantClasses = {
    primary: 'px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white border-sky-700 shadow-sm',
    secondary: 'px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
    icon: 'p-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  };

  return (
    <>
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <button type="button" onClick={handleShare} className={`${baseClasses} ${variantClasses[variant]}`} title="မျှဝေရန် (Share)">
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {variant !== 'icon' && <span>{copied ? 'ပြီးပါပြီ' : label}</span>}
        </button>
        <button type="button" onClick={() => setShowQR(true)} className={`${baseClasses} ${variantClasses[variant]}`} title="QR Code ပြရန်">
          <QrCode className="w-4 h-4" />
          {variant !== 'icon' && <span>QR</span>}
        </button>
      </div>
      {showQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-600" /> QR Code
              </h3>
              <button type="button" onClick={() => setShowQR(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl border-2 border-slate-200 flex items-center justify-center">
              <img src={qrUrl} alt="QR Code" className="w-56 h-56" onError={() => toast.error('QR Code ဖန်တီး၍ မရပါ (အင်တာနက် စစ်ဆေးပါ)')} />
            </div>
            <p className="text-xs text-slate-500 text-center break-all bg-slate-50 p-2 rounded-lg border">{shareUrl}</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleCopy} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'ကော်ပီပြီး' : 'လင့်ခ် ကော်ပီ'}
              </button>
              <a href={qrUrl} download="qrcode.png" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <Download className="w-4 h-4" /> သိမ်းမည်
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
