import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link as LinkIcon, Settings } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary';
import { toast } from 'sonner';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  folder?: string;
  onOpenSettings?: () => void;
}

export default function ImageUploadDropzone({
  value,
  onChange,
  label = 'ကျောင်း တံဆိပ် / ဓာတ်ပုံ (Logo / Image)',
  helperText = 'ကွန်ပျူတာ/ဖုန်းထဲမှ ပုံဖိုင်ရွေးချယ်တင်သွင်းနိုင်သည် (သို့မဟုတ်) တိုက်ရိုက် URL ရိုက်ထည့်နိုင်သည်',
  folder,
  onOpenSettings,
}: ImageUploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConfigured = isCloudinaryConfigured();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConfigured) {
      toast.error('Cloudinary မသတ်မှတ်ရသေးပါ။ ဦးစွာ Cloud Name နှင့် Preset ဖြည့်သွင်းပေးပါခင်ဗျာ။');
      if (onOpenSettings) onOpenSettings();
      return;
    }

    try {
      setUploading(true);
      const uploadedUrl = await uploadImageToCloudinary(file, folder);
      onChange(uploadedUrl);
      setManualUrl(uploadedUrl);
      toast.success('ပုံ အောင်မြင်စွာ တင်ပြီးပါပြီ');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualApply = () => {
    onChange(manualUrl.trim());
    setShowUrlInput(false);
  };

  const handleClear = () => {
    onChange('');
    setManualUrl('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            {label}
          </label>
          <div className="flex items-center gap-2">
            {!isConfigured && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
              >
                <Settings className="w-3 h-3" />
                <span>Cloudinary Setup</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showUrlInput ? 'ဖိုင်တင်ရန် ပြောင်းမည်' : 'URL ရိုက်ထည့်မည်'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview & Dropzone */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Preview box */}
        <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 shadow-xs cursor-pointer"
                title="ဖယ်ရှားရန်"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-300" />
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-1.5 w-full">
          {showUrlInput ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleManualApply}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                ထည့်မည်
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isConfigured && onOpenSettings) {
                    onOpenSettings();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={uploading}
                className="bg-white border border-sky-300 hover:bg-sky-50 text-sky-850 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>ပုံတင်နေပါသည်...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                    <span>ပုံဖိုင် ရွေးချယ်တင်မည် (Cloudinary)</span>
                  </>
                )}
              </button>

              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                >
                  ဖယ်ရှားရန်
                </button>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            {helperText}
          </p>
        </div>
      </div>
    </div>
  );
}
