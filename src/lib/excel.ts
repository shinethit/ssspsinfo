import * as XLSX from 'xlsx';
import { School } from '../types';

export const downloadSchoolTemplate = () => {
  const templateData = [
    {
      'ကျောင်းအမည် *': 'ဥပမာ - ပညာရောင်ခြည် ကိုယ်ပိုင်အထက်တန်းကျောင်း',
      'ကျောင်းအဆင့် *': 'အထက်တန်း',
      'ကျောင်းသားဦးရေ Range': '၁၀၁ - ၃၀၀ ဦး',
      'တိကျသော ကျောင်းသားဦးရေ': '180',
      'နှစ်စဉ်ကြေး ပမာဏ (ကျပ်)': '100000',
      'နှစ်စဉ်ကြေး (ပေးပြီး / မပေးရသေး)': 'ပေးသွင်းပြီး',
      'ပညာသင်နှစ်': '၂၀၂၄-၂၀၂၅',
      'ကျောင်းဖုန်း (၁)': '09123456789',
      'ကျောင်းဖုန်း (၂)': '09123456780',
      'နောက်ထပ် ကျောင်းဖုန်းများ': '08123456',
      'ကျောင်း Logo URL': 'https://example.com/logo.png',
      'တည်ထောင်သူအမည်': 'ဦးစံရှား',
      'တည်ထောင်သူဖုန်း (၁)': '09111111111',
      'တည်ထောင်သူဖုန်း (၂)': '09111111112',
      'နောက်ထပ် တည်ထောင်သူဖုန်းများ': '',
      'တည်ထောင်သူ Viber': '09111111111',
      'တည်ထောင်သူ Telegram': '@founder',
      'စီမံအုပ်ချုပ်သူအမည်': 'ဒေါ်မြမြ',
      'စီမံအုပ်ချုပ်သူဖုန်း (၁)': '09222222221',
      'စီမံအုပ်ချုပ်သူဖုန်း (၂)': '09222222222',
      'နောက်ထပ် စီမံအုပ်ချုပ်သူဖုန်းများ': '',
      'စီမံအုပ်ချုပ်သူ Viber': '09222222222',
      'စီမံအုပ်ချုပ်သူ Telegram': '@admin_principal',
      'တာဝန်ခံ (၁) အမည်': 'ဦးမောင်မောင်',
      'တာဝန်ခံ (၁) ရာထူး': 'တာဝန်ခံ (၁)',
      'တာဝန်ခံ (၁) ဖုန်း (၁)': '09333333331',
      'တာဝန်ခံ (၁) ဖုန်း (၂)': '09333333332',
      'တာဝန်ခံ (၁) Viber': '09333333331',
      'တာဝန်ခံ (၁) Telegram': '@coordinator1',
      'တာဝန်ခံ (၂) အမည်': 'ဒေါ်သီတာ',
      'တာဝန်ခံ (၂) ရာထူး': 'တာဝန်ခံ (၂)',
      'တာဝန်ခံ (၂) ဖုန်း (၁)': '09444444441',
      'တာဝန်ခံ (၂) ဖုန်း (၂)': '09444444442',
      'တာဝန်ခံ (၂) Viber': '09444444441',
      'တာဝန်ခံ (၂) Telegram': '@coordinator2',
      'ကျောင်းဘက်မှ မှတ်ချက်': 'နှစ်စဉ် တက္ကသိုလ်ဝင်တန်း အောင်ချက်ကောင်းမွန်သော ကျောင်း',
      'မှတ်စုတို': 'ဗဟိုအသင်းဝင် အမှတ် - ၀၀၁',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SchoolTemplate');
  XLSX.writeFile(wb, 'School_Import_Template.xlsx');
};

export const normalizeSchoolRow = (row: Record<string, any>) => {
  const cleanStr = (val: any) => (val !== undefined && val !== null ? String(val).trim() : '');

  const parseFeePaid = (val: any): boolean => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    return s === 'ပေးပြီး' || s === 'ပေးသွင်းပြီး' || s === 'ဟုတ်' || s === 'yes' || s === 'true' || s === '1' || s === 'paid' || s === '✓' || s === '✔';
  };

  const parseStudentRange = (val: any): string => {
    if (!val) return '1-100';
    const s = String(val).trim().toLowerCase();
    if (s.includes('1000') || s.includes('၁၀၀၀')) return '1000+';
    if (s.includes('501') || s.includes('၅၀၁')) return '501-1000';
    if (s.includes('301') || s.includes('၃၀၁')) return '301-500';
    if (s.includes('101') || s.includes('၁၀၁')) return '101-300';
    if (s.includes('100') || s.includes('၁၀၀')) return '1-100';
    return cleanStr(val) || '1-100';
  };

  const parseNumber = (val: any): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = Number(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? undefined : num;
  };

  const rawRange = cleanStr(row['studentRange'] ?? row['ကျောင်းသားဦးရေ Range'] ?? row['Range'] ?? row['ကျောင်းသား Range']);
  const stdRange = parseStudentRange(rawRange);
  const explicitFee = parseNumber(row['feeAmount'] ?? row['နှစ်စဉ်ကြေး ပမာဏ (ကျပ်)'] ?? row['ပမာဏ'] ?? row['နှုန်းထား']);

  const schoolPhone1 = cleanStr(row['schoolPhone'] || row['ကျောင်းဖုန်း (၁)'] || row['ကျောင်းဖုန်း'] || row['ဖုန်း'] || '');
  const schoolPhone2 = cleanStr(row['schoolPhone2'] || row['ကျောင်းဖုန်း (၂)'] || '');
  const extraSchoolPhonesRaw = cleanStr(row['extraSchoolPhones'] || row['နောက်ထပ် ကျောင်းဖုန်းများ'] || '');
  const schoolPhones: string[] = extraSchoolPhonesRaw
    ? extraSchoolPhonesRaw.split(/[,;\n]/).map((p: string) => p.trim()).filter(Boolean)
    : [];

  const founderPhone1 = cleanStr(row['founderPhone'] || row['တည်ထောင်သူဖုန်း (၁)'] || row['တည်ထောင်သူဖုန်း'] || '');
  const founderPhone2 = cleanStr(row['founderPhone2'] || row['တည်ထောင်သူဖုန်း (၂)'] || '');
  const extraFounderPhonesRaw = cleanStr(row['extraFounderPhones'] || row['နောက်ထပ် တည်ထောင်သူဖုန်းများ'] || '');
  const founderPhones: string[] = extraFounderPhonesRaw
    ? extraFounderPhonesRaw.split(/[,;\n]/).map((p: string) => p.trim()).filter(Boolean)
    : [];

  const adminPhone1 = cleanStr(row['adminPhone'] || row['စီမံအုပ်ချုပ်သူဖုန်း (၁)'] || row['စီမံအုပ်ချုပ်သူဖုန်း'] || '');
  const adminPhone2 = cleanStr(row['adminPhone2'] || row['စီမံအုပ်ချုပ်သူဖုန်း (၂)'] || '');
  const extraAdminPhonesRaw = cleanStr(row['extraAdminPhones'] || row['နောက်ထပ် စီမံအုပ်ချုပ်သူဖုန်းများ'] || '');
  const adminPhones: string[] = extraAdminPhonesRaw
    ? extraAdminPhonesRaw.split(/[,;\n]/).map((p: string) => p.trim()).filter(Boolean)
    : [];

  return {
    name: cleanStr(row['name'] || row['ကျောင်းအမည် *'] || row['ကျောင်းအမည်'] || ''),
    level: cleanStr(row['level'] || row['ကျောင်းအဆင့် *'] || row['ကျောင်းအဆင့်'] || 'အထက်တန်း'),
    studentRange: stdRange,
    studentCount: parseNumber(row['studentCount'] ?? row['တိကျသော ကျောင်းသားဦးရေ'] ?? row['ကျောင်းသားဦးရေ']),
    feeAmount: explicitFee !== undefined ? explicitFee : (
      stdRange === '1000+' ? 300000 :
      stdRange === '501-1000' ? 200000 :
      stdRange === '301-500' ? 150000 :
      stdRange === '101-300' ? 100000 : 50000
    ),
    feeAcademicYear: cleanStr(row['feeAcademicYear'] ?? row['ပညာသင်နှစ်'] ?? '၂၀၂၄-၂၀၂၅'),
    isAnnualFeePaid: parseFeePaid(row['isAnnualFeePaid'] ?? row['နှစ်စဉ်ကြေး (ပေးပြီး / မပေးရသေး)'] ?? row['နှစ်စဉ်ကြေး'] ?? row['annualFee']),
    status: (row['status'] === 'under_review' || row['အခြေအနေ'] === 'စိစစ်ဆဲ' || row['အခြေအနေ'] === 'စစ်ဆေးဆဲ')
      ? ('under_review' as const)
      : (row['status'] === 'inactive' || row['အခြေအနေ'] === 'ယာယီရပ်နား' || row['အခြေအနေ'] === 'ရပ်နား')
      ? ('inactive' as const)
      : ('active' as const),
    schoolPhone: schoolPhone1,
    schoolPhone2: schoolPhone2,
    schoolPhones: schoolPhones,
    logoUrl: cleanStr(row['logoUrl'] || row['ကျောင်း Logo URL'] || ''),
    founderName: cleanStr(row['founderName'] || row['တည်ထောင်သူအမည်'] || row['တည်ထောင်သူ'] || ''),
    founderPhone: founderPhone1,
    founderPhone2: founderPhone2,
    founderPhones: founderPhones,
    founderViber: cleanStr(row['founderViber'] || row['တည်ထောင်သူ Viber'] || ''),
    founderTelegram: cleanStr(row['founderTelegram'] || row['တည်ထောင်သူ Telegram'] || ''),
    adminName: cleanStr(row['adminName'] || row['စီမံအုပ်ချုပ်သူအမည်'] || row['စီမံအုပ်ချုပ်သူ'] || ''),
    adminPhone: adminPhone1,
    adminPhone2: adminPhone2,
    adminPhones: adminPhones,
    adminViber: cleanStr(row['adminViber'] || row['စီမံအုပ်ချုပ်သူ Viber'] || ''),
    adminTelegram: cleanStr(row['adminTelegram'] || row['စီမံအုပ်ချုပ်သူ Telegram'] || ''),
    
    // Coordinator 1 (တာဝန်ခံ ၁)
    contactName: cleanStr(row['contactName'] || row['တာဝန်ခံ (၁) အမည်'] || row['တာဝန်ခံအမည်'] || row['တာဝန်ခံ'] || ''),
    contactRole: cleanStr(row['contactRole'] || row['တာဝန်ခံ (၁) ရာထူး'] || row['တာဝန်ခံရာထူး'] || ''),
    contactPhone: cleanStr(row['contactPhone'] || row['တာဝန်ခံ (၁) ဖုန်း (၁)'] || row['တာဝန်ခံ (၁) ဖုန်း'] || row['တာဝန်ခံဖုန်း'] || ''),
    contactPhone2: cleanStr(row['contactPhone2'] || row['တာဝန်ခံ (၁) ဖုန်း (၂)'] || ''),
    contactViber: cleanStr(row['contactViber'] || row['တာဝန်ခံ (၁) Viber'] || row['တာဝန်ခံ Viber'] || ''),
    contactTelegram: cleanStr(row['contactTelegram'] || row['တာဝန်ခံ (၁) Telegram'] || row['တာဝန်ခံ Telegram'] || ''),

    // Coordinator 2 (တာဝန်ခံ ၂)
    contact2Name: cleanStr(row['contact2Name'] || row['တာဝန်ခံ (၂) အမည်'] || ''),
    contact2Role: cleanStr(row['contact2Role'] || row['တာဝန်ခံ (၂) ရာထူး'] || ''),
    contact2Phone: cleanStr(row['contact2Phone'] || row['တာဝန်ခံ (၂) ဖုန်း (၁)'] || row['တာဝန်ခံ (၂) ဖုန်း'] || ''),
    contact2Phone2: cleanStr(row['contact2Phone2'] || row['တာဝန်ခံ (၂) ဖုန်း (၂)'] || ''),
    contact2Viber: cleanStr(row['contact2Viber'] || row['တာဝန်ခံ (၂) Viber'] || ''),
    contact2Telegram: cleanStr(row['contact2Telegram'] || row['တာဝန်ခံ (၂) Telegram'] || ''),

    schoolNote: cleanStr(row['schoolNote'] || row['ကျောင်းဘက်မှ မှတ်ချက်'] || ''),
    note: cleanStr(row['note'] || row['မှတ်စုတို'] || row['မှတ်ချက်'] || ''),
  };
};

export const exportSchoolsToExcel = (schools: School[], filename: string = 'Schools_Database.xlsx') => {
  const data = schools.map((s, idx) => ({
    'စဉ်': idx + 1,
    'ကျောင်းအမည်': s.name,
    'ကျောင်းအဆင့်': s.level,
    'ကျောင်းသားဦးရေ Range': s.studentRange ? `${s.studentRange} ဦး` : '',
    'တိကျသော ကျောင်းသားဦးရေ': s.studentCount ?? '',
    'နှစ်စဉ်ကြေး ပမာဏ (ကျပ်)': s.feeAmount ?? '',
    'နှစ်စဉ်ကြေး အခြေအနေ': s.isAnnualFeePaid ? 'ပေးသွင်းပြီး' : 'မပေးရသေး',
    'ပညာသင်နှစ်': s.feeAcademicYear || '',
    'ကြေးပေးသွင်းသည့်ရက်': s.feePaidDate || '',
    'ကျောင်းအခြေအနေ': s.status === 'under_review' ? 'စိစစ်ဆဲ' : s.status === 'inactive' ? 'ယာယီရပ်နား' : 'လည်ပတ်ဆဲ',
    'ကျောင်းဖုန်း (၁)': s.schoolPhone || '',
    'ကျောင်းဖုန်း (၂)': s.schoolPhone2 || '',
    'နောက်ထပ် ကျောင်းဖုန်းများ': Array.isArray(s.schoolPhones) ? s.schoolPhones.join(', ') : '',
    'တည်ထောင်သူအမည်': s.founderName || '',
    'တည်ထောင်သူဖုန်း (၁)': s.founderPhone || '',
    'တည်ထောင်သူဖုန်း (၂)': s.founderPhone2 || '',
    'နောက်ထပ် တည်ထောင်သူဖုန်းများ': Array.isArray(s.founderPhones) ? s.founderPhones.join(', ') : '',
    'တည်ထောင်သူ Viber': s.founderViber || '',
    'တည်ထောင်သူ Telegram': s.founderTelegram || '',
    'စီမံအုပ်ချုပ်သူအမည်': s.adminName || '',
    'စီမံအုပ်ချုပ်သူဖုန်း (၁)': s.adminPhone || '',
    'စီမံအုပ်ချုပ်သူဖုန်း (၂)': s.adminPhone2 || '',
    'နောက်ထပ် စီမံအုပ်ချုပ်သူဖုန်းများ': Array.isArray(s.adminPhones) ? s.adminPhones.join(', ') : '',
    'စီမံအုပ်ချုပ်သူ Viber': s.adminViber || '',
    'စီမံအုပ်ချုပ်သူ Telegram': s.adminTelegram || '',
    'တာဝန်ခံ (၁) အမည်': s.contactName || '',
    'တာဝန်ခံ (၁) ရာထူး': s.contactRole || '',
    'တာဝန်ခံ (၁) ဖုန်း (၁)': s.contactPhone || '',
    'တာဝန်ခံ (၁) ဖုန်း (၂)': s.contactPhone2 || '',
    'တာဝန်ခံ (၁) Viber': s.contactViber || '',
    'တာဝန်ခံ (၁) Telegram': s.contactTelegram || '',
    'တာဝန်ခံ (၂) အမည်': s.contact2Name || '',
    'တာဝန်ခံ (၂) ရာထူး': s.contact2Role || '',
    'တာဝန်ခံ (၂) ဖုန်း (၁)': s.contact2Phone || '',
    'တာဝန်ခံ (၂) ဖုန်း (၂)': s.contact2Phone2 || '',
    'တာဝန်ခံ (၂) Viber': s.contact2Viber || '',
    'တာဝန်ခံ (၂) Telegram': s.contact2Telegram || '',
    'ကျောင်းဘက်မှ မှတ်ချက်': s.schoolNote || '',
    'မှတ်စုတို': s.note || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schools');
  XLSX.writeFile(wb, filename);
};


