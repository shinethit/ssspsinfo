import * as XLSX from 'xlsx';
import { School } from '../types';

export const downloadSchoolTemplate = () => {
  const templateData = [
    {
      'ကျောင်းအမည် *': 'ဥပမာ - ပညာရောင်ခြည် ကိုယ်ပိုင်အထက်တန်းကျောင်း',
      'ကျောင်းအဆင့် *': '၁။ အထက်တန်း',
      'ကျောင်းလိပ်စာ': 'အမှတ် (၁၂)၊ ဗိုလ်ချုပ်လမ်း',
      'မြို့နယ်': 'တောင်ကြီး',
      'မြို့': 'တောင်ကြီး',
      'ဇုန်': 'အရှေ့ဇုန်',
      'ကျောင်းသားဦးရေ Range': '၁၀၁ - ၁၅၀ ဦး',
      'တိကျသော ကျောင်းသားဦးရေ': '120',
      'နှစ်စဉ်ကြေး ပမာဏ (ကျပ်)': '250000',
      'နှစ်စဉ်ကြေး (သွင်းပြီး / မသွင်းရသေး)': 'သွင်းပြီး',
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
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) အမည်': 'ဦးမောင်မောင်',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ရာထူး': 'တာဝန်ခံ (၁)',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၁)': '09333333331',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၂)': '09333333332',
      'နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်းများ': '09333333333, 09333333334',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Viber': '09333333331',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Telegram': '@coordinator1',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) အမည်': 'ဒေါ်သီတာ',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ရာထူး': 'တာဝန်ခံ (၂)',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၁)': '09444444441',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၂)': '09444444442',
      'နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်းများ': '09444444443, 09444444444',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Viber': '09444444441',
      'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Telegram': '@coordinator2',
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
    return s === 'သွင်းပြီး' || s === 'ပေးသွင်းပြီး' || s === 'ပေးပြီး' || s === 'ဟုတ်' || s === 'yes' || s === 'true' || s === '1' || s === 'paid' || s === '✓' || s === '✔';
  };

  const parseStudentRange = (val: any): string => {
    if (!val) return '0-100';
    const s = String(val).trim().toLowerCase();
    if (s.includes('601') || s.includes('၆၀၁') || s.includes('1000') || s.includes('၁၀၀၀') || s.includes('600+')) return '601+';
    if (s.includes('401') || s.includes('၄၀၁') || s.includes('600') || s.includes('၆၀၀') || s.includes('501') || s.includes('၅၀၁')) return '401-600';
    if (s.includes('301') || s.includes('၃၀၁') || s.includes('400') || s.includes('၄၀၀') || s.includes('500') || s.includes('၅၀၀')) return '301-400';
    if (s.includes('251') || s.includes('၂၅၁') || s.includes('300') || s.includes('၃၀၀')) return '251-300';
    if (s.includes('201') || s.includes('၂၀၁') || s.includes('250') || s.includes('၂၅၀')) return '201-250';
    if (s.includes('151') || s.includes('၁၅၁') || s.includes('200') || s.includes('၂၀၀')) return '151-200';
    if (s.includes('101') || s.includes('၁၀၁') || s.includes('150') || s.includes('၁၅၀')) return '101-150';
    if (s.includes('100') || s.includes('၁၀၀') || s.includes('0-100') || s.includes('၀-၁၀၀')) return '0-100';
    return cleanStr(val) || '0-100';
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

  // Coordinator 1 / Responsible Person 1 (တာဝန်ခံ ပုဂ္ဂိုလ် ၁)
    const coord1Name = cleanStr(row['responsiblePerson1Name'] || row['contactName'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) အမည်'] || row['တာဝန်ခံ (၁) အမည်'] || row['တာဝန်ခံအမည်'] || row['တာဝန်ခံ'] || '');
    const coord1Role = cleanStr(row['responsiblePerson1Role'] || row['contactRole'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ရာထူး'] || row['တာဝန်ခံ (၁) ရာထူး'] || row['တာဝန်ခံရာထူး'] || '');
    const coord1Phone1 = cleanStr(row['responsiblePerson1Phone'] || row['contactPhone'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၁)'] || row['တာဝန်ခံ (၁) ဖုန်း (၁)'] || row['တာဝန်ခံ (၁) ဖုန်း'] || row['တာဝန်ခံဖုန်း'] || '');
    const coord1Phone2 = cleanStr(row['responsiblePerson1Phone2'] || row['contactPhone2'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၂)'] || row['တာဝန်ခံ (၁) ဖုန်း (၂)'] || '');
    const extraCoord1PhonesRaw = cleanStr(row['extraContactPhones'] || row['extraCoord1Phones'] || row['responsiblePerson1Phones'] || row['နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်းများ'] || row['နောက်ထပ် တာဝန်ခံ (၁) ဖုန်းများ'] || row['နောက်ထပ် တာဝန်ခံဖုန်းများ'] || '');
    const coord1Phones: string[] = extraCoord1PhonesRaw
      ? extraCoord1PhonesRaw.split(/[,;\n]/).map((p: string) => p.trim()).filter(Boolean)
      : [];
    const coord1Viber = cleanStr(row['responsiblePerson1Viber'] || row['contactViber'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Viber'] || row['တာဝန်ခံ (၁) Viber'] || row['တာဝန်ခံ Viber'] || '');
    const coord1Telegram = cleanStr(row['responsiblePerson1Telegram'] || row['contactTelegram'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Telegram'] || row['တာဝန်ခံ (၁) Telegram'] || row['တာဝန်ခံ Telegram'] || '');

    // Coordinator 2 / Responsible Person 2 (တာဝန်ခံ ပုဂ္ဂိုလ် ၂)
    const coord2Name = cleanStr(row['responsiblePerson2Name'] || row['contact2Name'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) အမည်'] || row['တာဝန်ခံ (၂) အမည်'] || '');
    const coord2Role = cleanStr(row['responsiblePerson2Role'] || row['contact2Role'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ရာထူး'] || row['တာဝန်ခံ (၂) ရာထူး'] || '');
    const coord2Phone1 = cleanStr(row['responsiblePerson2Phone'] || row['contact2Phone'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၁)'] || row['တာဝန်ခံ (၂) ဖုန်း (၁)'] || row['တာဝန်ခံ (၂) ဖုန်း'] || '');
    const coord2Phone2 = cleanStr(row['responsiblePerson2Phone2'] || row['contact2Phone2'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၂)'] || row['တာဝန်ခံ (၂) ဖုန်း (၂)'] || '');
    const extraCoord2PhonesRaw = cleanStr(row['extraContact2Phones'] || row['extraCoord2Phones'] || row['responsiblePerson2Phones'] || row['နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်းများ'] || row['နောက်ထပ် တာဝန်ခံ (၂) ဖုန်းများ'] || '');
    const coord2Phones: string[] = extraCoord2PhonesRaw
      ? extraCoord2PhonesRaw.split(/[,;\n]/).map((p: string) => p.trim()).filter(Boolean)
      : [];
    const coord2Viber = cleanStr(row['responsiblePerson2Viber'] || row['contact2Viber'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Viber'] || row['တာဝန်ခံ (၂) Viber'] || '');
    const coord2Telegram = cleanStr(row['responsiblePerson2Telegram'] || row['contact2Telegram'] || row['တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Telegram'] || row['တာဝန်ခံ (၂) Telegram'] || '');

    return {
      name: cleanStr(row['name'] || row['ကျောင်းအမည် *'] || row['ကျောင်းအမည်'] || ''),
      level: cleanStr(row['level'] || row['ကျောင်းအဆင့် *'] || row['ကျောင်းအဆင့်'] || '၁။ အထက်တန်း'),
      address: cleanStr(row['address'] || row['ကျောင်းလိပ်စာ'] || row['လိပ်စာ'] || ''),
      township: cleanStr(row['township'] || row['မြို့နယ်'] || ''),
      city: cleanStr(row['city'] || row['မြို့'] || ''),
      zone: cleanStr(row['zone'] || row['ဇုန်'] || row['ဇုံ'] || ''),
      studentRange: stdRange,
      studentCount: parseNumber(row['studentCount'] ?? row['တိကျသော ကျောင်းသားဦးရေ'] ?? row['ကျောင်းသားဦးရေ']),
      feeAmount: explicitFee !== undefined ? explicitFee : (
        stdRange === '601+' ? 1000000 :
        stdRange === '401-600' ? 700000 :
        stdRange === '301-400' ? 500000 :
        stdRange === '251-300' ? 400000 :
        stdRange === '201-250' ? 350000 :
        stdRange === '151-200' ? 300000 :
        stdRange === '101-150' ? 250000 : 200000
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
      
      // Responsible Person 1
      contactName: coord1Name,
      contactRole: coord1Role,
      contactPhone: coord1Phone1,
      contactPhone2: coord1Phone2,
      contactPhones: coord1Phones,
      responsiblePerson1Name: coord1Name,
      responsiblePerson1Role: coord1Role,
      responsiblePerson1Phone: coord1Phone1,
      responsiblePerson1Phone2: coord1Phone2,
      responsiblePerson1Phones: coord1Phones,
      contactViber: coord1Viber,
      contactTelegram: coord1Telegram,
      responsiblePerson1Viber: coord1Viber,
      responsiblePerson1Telegram: coord1Telegram,

      // Responsible Person 2
      contact2Name: coord2Name,
      contact2Role: coord2Role,
      contact2Phone: coord2Phone1,
      contact2Phone2: coord2Phone2,
      contact2Phones: coord2Phones,
      responsiblePerson2Name: coord2Name,
      responsiblePerson2Role: coord2Role,
      responsiblePerson2Phone: coord2Phone1,
      responsiblePerson2Phone2: coord2Phone2,
      responsiblePerson2Phones: coord2Phones,
      contact2Viber: coord2Viber,
      contact2Telegram: coord2Telegram,
      responsiblePerson2Viber: coord2Viber,
      responsiblePerson2Telegram: coord2Telegram,

      schoolNote: cleanStr(row['schoolNote'] || row['ကျောင်းဘက်မှ မှတ်ချက်'] || ''),
      note: cleanStr(row['note'] || row['မှတ်စုတို'] || row['မှတ်ချက်'] || ''),
    };
  };

export const exportSchoolsToExcel = (schools: School[], filename: string = 'Schools_Database.xlsx') => {
  const data = schools.map((s, idx) => ({
    'စဉ်': idx + 1,
    'ကျောင်းအမည်': s.name,
    'ကျောင်းအဆင့်': s.level,
    'ကျောင်းလိပ်စာ': s.address || '',
    'မြို့နယ်': s.township || '',
    'မြို့': s.city || '',
    'ဇုန်': s.zone || '',
    'ကျောင်းသားဦးရေ Range': s.studentRange ? `${s.studentRange} ဦး` : '',
    'တိကျသော ကျောင်းသားဦးရေ': s.studentCount ?? '',
    'နှစ်စဉ်ကြေး ပမာဏ (ကျပ်)': s.feeAmount ?? '',
    'နှစ်စဉ်ကြေး အခြေအနေ': s.isAnnualFeePaid ? 'သွင်းပြီး' : 'မသွင်းရသေး',
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
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) အမည်': s.responsiblePerson1Name || s.contactName || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ရာထူး': s.responsiblePerson1Role || s.contactRole || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၁)': s.responsiblePerson1Phone || s.contactPhone || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်း (၂)': s.responsiblePerson1Phone2 || s.contactPhone2 || '',
    'နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၁) ဖုန်းများ': Array.isArray(s.responsiblePerson1Phones || s.contactPhones) ? (s.responsiblePerson1Phones || s.contactPhones)!.join(', ') : '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Viber': s.responsiblePerson1Viber || s.contactViber || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၁) Telegram': s.responsiblePerson1Telegram || s.contactTelegram || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) အမည်': s.responsiblePerson2Name || s.contact2Name || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ရာထူး': s.responsiblePerson2Role || s.contact2Role || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၁)': s.responsiblePerson2Phone || s.contact2Phone || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်း (၂)': s.responsiblePerson2Phone2 || s.contact2Phone2 || '',
    'နောက်ထပ် တာဝန်ခံ ပုဂ္ဂိုလ် (၂) ဖုန်းများ': Array.isArray(s.responsiblePerson2Phones || s.contact2Phones) ? (s.responsiblePerson2Phones || s.contact2Phones)!.join(', ') : '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Viber': s.responsiblePerson2Viber || s.contact2Viber || '',
    'တာဝန်ခံ ပုဂ္ဂိုလ် (၂) Telegram': s.responsiblePerson2Telegram || s.contact2Telegram || '',
    'ကျောင်းဘက်မှ မှတ်ချက်': s.schoolNote || '',
    'မှတ်စုတို': s.note || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schools');
  XLSX.writeFile(wb, filename);
};


