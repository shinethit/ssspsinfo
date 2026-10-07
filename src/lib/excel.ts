import * as XLSX from 'xlsx';

export const downloadSchoolTemplate = () => {
  const templateData = [
    {
      'ကျောင်းအမည် *': 'ဥပမာ - ပညာရောင်ခြည် ကိုယ်ပိုင်အထက်တန်းကျောင်း',
      'ကျောင်းအဆင့် *': 'အထက်တန်း',
      'နှစ်စဉ်ကြေး (ပေးပြီး / မပေးရသေး)': 'ပေးသွင်းပြီး',
      'ကျောင်းဖုန်း': '09123456789',
      'ကျောင်း Logo URL': 'https://example.com/logo.png',
      'တည်ထောင်သူအမည်': 'ဦးစံရှား',
      'တည်ထောင်သူဖုန်း': '09111111111',
      'တည်ထောင်သူ Viber': '09111111111',
      'တည်ထောင်သူ Telegram': '@founder',
      'စီမံအုပ်ချုပ်သူအမည်': 'ဒေါ်မြမြ',
      'စီမံအုပ်ချုပ်သူဖုန်း': '09222222222',
      'စီမံအုပ်ချုပ်သူ Viber': '09222222222',
      'စီမံအုပ်ချုပ်သူ Telegram': '@admin_principal',
      'တာဝန်ခံအမည်': 'ကိုကျော်',
      'တာဝန်ခံရာထူး': 'ရုံးတာဝန်ခံ',
      'တာဝန်ခံဖုန်း': '09333333333',
      'တာဝန်ခံ Viber': '09333333333',
      'တာဝန်ခံ Telegram': '@coordinator',
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

  return {
    name: cleanStr(row['name'] || row['ကျောင်းအမည် *'] || row['ကျောင်းအမည်'] || ''),
    level: cleanStr(row['level'] || row['ကျောင်းအဆင့် *'] || row['ကျောင်းအဆင့်'] || 'အထက်တန်း'),
    isAnnualFeePaid: parseFeePaid(row['isAnnualFeePaid'] ?? row['နှစ်စဉ်ကြေး (ပေးပြီး / မပေးရသေး)'] ?? row['နှစ်စဉ်ကြေး'] ?? row['annualFee']),
    status: (row['status'] === 'under_review' || row['အခြေအနေ'] === 'စိစစ်ဆဲ' || row['အခြေအနေ'] === 'စစ်ဆေးဆဲ')
      ? ('under_review' as const)
      : (row['status'] === 'inactive' || row['အခြေအနေ'] === 'ယာယီရပ်နား' || row['အခြေအနေ'] === 'ရပ်နား')
      ? ('inactive' as const)
      : ('active' as const),
    schoolPhone: cleanStr(row['schoolPhone'] || row['ကျောင်းဖုန်း'] || row['ဖုန်း'] || ''),
    logoUrl: cleanStr(row['logoUrl'] || row['ကျောင်း Logo URL'] || ''),
    founderName: cleanStr(row['founderName'] || row['တည်ထောင်သူအမည်'] || row['တည်ထောင်သူ'] || ''),
    founderPhone: cleanStr(row['founderPhone'] || row['တည်ထောင်သူဖုန်း'] || ''),
    founderViber: cleanStr(row['founderViber'] || row['တည်ထောင်သူ Viber'] || ''),
    founderTelegram: cleanStr(row['founderTelegram'] || row['တည်ထောင်သူ Telegram'] || ''),
    adminName: cleanStr(row['adminName'] || row['စီမံအုပ်ချုပ်သူအမည်'] || row['စီမံအုပ်ချုပ်သူ'] || ''),
    adminPhone: cleanStr(row['adminPhone'] || row['စီမံအုပ်ချုပ်သူဖုန်း'] || ''),
    adminViber: cleanStr(row['adminViber'] || row['စီမံအုပ်ချုပ်သူ Viber'] || ''),
    adminTelegram: cleanStr(row['adminTelegram'] || row['စီမံအုပ်ချုပ်သူ Telegram'] || ''),
    contactName: cleanStr(row['contactName'] || row['တာဝန်ခံအမည်'] || row['တာဝန်ခံ'] || ''),
    contactRole: cleanStr(row['contactRole'] || row['တာဝန်ခံရာထူး'] || ''),
    contactPhone: cleanStr(row['contactPhone'] || row['တာဝန်ခံဖုန်း'] || ''),
    contactViber: cleanStr(row['contactViber'] || row['တာဝန်ခံ Viber'] || ''),
    contactTelegram: cleanStr(row['contactTelegram'] || row['တာဝန်ခံ Telegram'] || ''),
    schoolNote: cleanStr(row['schoolNote'] || row['ကျောင်းဘက်မှ မှတ်ချက်'] || ''),
    note: cleanStr(row['note'] || row['မှတ်စုတို'] || row['မှတ်ချက်'] || ''),
  };
};

