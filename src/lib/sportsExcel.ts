import * as XLSX from 'xlsx';
import { SportsMatchResult } from '../types';

export const downloadSportsTemplate = () => {
  const template = [
    {
      'အားကစား': 'ဘောလုံး (Football)',
      'ပွဲစဉ်ခေါင်းစဉ်': 'ဗိုလ်လုပွဲ',
      'ကျောင်း/အသင်း (A)': 'ရွှေမင်းသား',
      'အားကစားသမား (A)': '',
      'ရမှတ် (A)': '2',
      'ကျောင်း/အသင်း (B)': 'ပညာရောင်ခြည်',
      'အားကစားသမား (B)': '',
      'ရမှတ် (B)': '1',
      'အနိုင်ရသူ': 'ရွှေမင်းသား',
      'ဆုတံဆိပ် (Gold/Silver/Bronze)': 'Gold',
    },
    {
      'အားကစား': 'စစ်တုရင် (Chess)',
      'ပွဲစဉ်ခေါင်းစဉ်': 'ဗိုလ်လုပွဲ',
      'ကျောင်း/အသင်း (A)': 'အောင်ပန်း',
      'အားကစားသမား (A)': 'ဦးမောင်မောင်',
      'ရမှတ် (A)': '1',
      'ကျောင်း/အသင်း (B)': 'ကလော',
      'အားကစားသမား (B)': 'ဦးရွှေရင်',
      'ရမှတ် (B)': '0',
      'အနိုင်ရသူ': 'အောင်ပန်း',
      'ဆုတံဆိပ် (Gold/Silver/Bronze)': 'Gold',
    }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SportsResults');
  XLSX.writeFile(wb, 'Sports_Results_Template.xlsx');
};

export const parseSportsExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};
