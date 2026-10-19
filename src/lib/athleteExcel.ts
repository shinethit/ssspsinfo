import * as XLSX from 'xlsx';

export const downloadAthleteTemplate = () => {
  const template = [
    {
      'အမည်': 'ဦးမောင်မောင်',
      'အဖအမည်': 'ဦးဘဘ',
      'မွေးသက္ကရာဇ် (YYYY-MM-DD)': '2010-05-15',
      'အတန်း': 'ဆယ်တန်း',
      'ကျောင်းဝင်အမှတ်': 'ST-001',
      'ကိုယ်စားပြုကျောင်း': 'ရွှေမင်းသားကျောင်း',
      'ကျား/မ (Male/Female)': 'Male',
      'ပါဝင်မည့် အားကစား (ကော်မာခြားပါ)': 'ဘောလုံး (Football), စစ်တုရင် (Chess)',
      'ဓာတ်ပုံ URL (Optional)': 'https://example.com/photo.jpg'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Athletes');
  XLSX.writeFile(wb, 'Athlete_Import_Template.xlsx');
};

export const parseAthleteExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};
