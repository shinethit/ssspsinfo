/**
 * Cloudinary Upload Helper
 * Supports environment variables or Admin UI configured credentials stored in localStorage.
 */

const LOCAL_STORAGE_KEY_CLOUD_NAME = 'shan_ps_cloudinary_cloud_name';
const LOCAL_STORAGE_KEY_PRESET = 'shan_ps_cloudinary_upload_preset';
const LOCAL_STORAGE_KEY_FOLDER = 'shan_ps_cloudinary_folder';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const envPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
  const envFolder = import.meta.env.VITE_CLOUDINARY_FOLDER || '';

  const storedCloudName = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_CLOUD_NAME) || '' : '';
  const storedPreset = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_PRESET) || '' : '';
  const storedFolder = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_FOLDER) || '' : '';

  return {
    cloudName: (storedCloudName || envCloudName || 'dhmc9ikzl').trim(),
    uploadPreset: (storedPreset || envPreset).trim(),
    folder: (storedFolder || envFolder || 'ssspsinfo').trim(),
  };
}

export function saveCloudinaryConfig(cloudName: string, uploadPreset: string, folder: string = 'ssspsinfo') {
  if (typeof window !== 'undefined') {
    if (cloudName) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CLOUD_NAME, cloudName.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CLOUD_NAME);
    }

    if (uploadPreset) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRESET, uploadPreset.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_PRESET);
    }

    if (folder) {
      localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER, folder.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_FOLDER);
    }
  }
}

export function isCloudinaryConfigured(): boolean {
  const config = getCloudinaryConfig();
  return Boolean(config.cloudName && config.uploadPreset);
}

/**
 * Upload an image file directly to Cloudinary using unsigned upload preset
 */
export async function uploadImageToCloudinary(
  file: File,
  folder?: string
): Promise<string> {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error(
      'Cloudinary မသတ်မှတ်ရသေးပါ။ Admin Panel > "အရန်သိမ်း & စနစ်ဆက်တင်" တွင် Cloud Name နှင့် Upload Preset ကို ဦးစွာထည့်သွင်းပေးပါ။'
    );
  }

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    throw new Error('ကျေးဇူးပြု၍ ဓာတ်ပုံဖိုင် (JPG, PNG, WebP) သာ ရွေးချယ်ပေးပါ');
  }

  // Limit file size to 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('ဓာတ်ပုံဖိုင် အရွယ်အစားမှာ 10MB ထက် မကျော်လွန်ရပါ');
  }

  const targetFolder = folder || config.folder || 'ssspsinfo';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  if (targetFolder) {
    formData.append('folder', targetFolder);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Upload failed with status ${response.status}`;
    throw new Error(`Cloudinary သို့ ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်: ${message}`);
  }

  const data = await response.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary မှ ပုံလိပ်စာ (URL) မရရှိပါ');
  }

  return data.secure_url;
}
