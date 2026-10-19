import { School } from '../types';

export const toBurmeseNumber = (num: number): string => {
  const digits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return String(num).replace(/\d/g, (d) => digits[parseInt(d, 10)]);
};

export interface CategorizedSchoolPhone {
  key: string;
  category: 'founder' | 'admin' | 'contact1' | 'contact2' | 'school';
  fullLabel: string;
  personName?: string;
  personRole?: string;
  number: string;
  cleanDial: string;
}

export const getCategorizedSchoolPhones = (school: School): CategorizedSchoolPhone[] => {
  const results: CategorizedSchoolPhone[] = [];

  const parseNumbers = (rawInputs: (string | undefined | null | string[])[]): string[] => {
    const list: string[] = [];
    const seen = new Set<string>();

    for (const input of rawInputs) {
      if (!input) continue;
      if (Array.isArray(input)) {
        for (const item of input) {
          if (!item || typeof item !== 'string') continue;
          const parts = item.split(/[/,\n;]+/).map((p) => p.trim()).filter(Boolean);
          for (const p of parts) {
            const clean = p.replace(/[^0-9+]/g, '');
            if (clean && clean.length >= 5 && !seen.has(clean)) {
              seen.add(clean);
              list.push(p);
            }
          }
        }
      } else if (typeof input === 'string') {
        const parts = input.split(/[/,\n;]+/).map((p) => p.trim()).filter(Boolean);
        for (const p of parts) {
          const clean = p.replace(/[^0-9+]/g, '');
          if (clean && clean.length >= 5 && !seen.has(clean)) {
            seen.add(clean);
            list.push(p);
          }
        }
      }
    }
    return list;
  };

  const getPhoneLabel = (categoryPrefix: string, index: number): string => {
    if (index === 0) return `${categoryPrefix} ဖုန်း (၁)`;
    if (index === 1) return `${categoryPrefix} ဖုန်း (၂)`;
    return `${categoryPrefix} ဖုန်း (${toBurmeseNumber(index + 1)})`;
  };

  // 1. တည်ထောင်သူ ဖုန်း
  const founderNums = parseNumbers([school.founderPhone, school.founderPhone2, school.founderPhones]);
  founderNums.forEach((num, idx) => {
    results.push({
      key: `founder-${idx}-${num}`, category: 'founder', fullLabel: getPhoneLabel('တည်ထောင်သူ', idx),
      personName: school.founderName?.trim() || undefined, personRole: 'တည်ထောင်သူ (Founder)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 2. စီမံအုပ်ချုပ်သူ ဖုန်း
  const adminNums = parseNumbers([school.adminPhone, school.adminPhone2, school.adminPhones]);
  adminNums.forEach((num, idx) => {
    results.push({
      key: `admin-${idx}-${num}`, category: 'admin', fullLabel: getPhoneLabel('စီမံအုပ်ချုပ်သူ', idx),
      personName: school.adminName?.trim() || undefined, personRole: 'စီမံအုပ်ချုပ်သူ (Admin/Principal)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 3. တာဝန်ခံ (၁) ဖုန်း
  const contact1Nums = parseNumbers([school.responsiblePerson1Phone, school.contactPhone, school.responsiblePerson1Phone2, school.contactPhone2, school.responsiblePerson1Phones, school.contactPhones]);
  const contact1Name = (school.responsiblePerson1Name || school.contactName)?.trim();
  const contact1Role = (school.responsiblePerson1Role || school.contactRole)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၁)';
  contact1Nums.forEach((num, idx) => {
    results.push({
      key: `contact1-${idx}-${num}`, category: 'contact1', fullLabel: getPhoneLabel('တာဝန်ခံ (၁)', idx),
      personName: contact1Name || undefined, personRole: contact1Role,
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 4. တာဝန်ခံ (၂) ဖုန်း
  const contact2Nums = parseNumbers([school.responsiblePerson2Phone, school.contact2Phone, school.responsiblePerson2Phone2, school.contact2Phone2, school.responsiblePerson2Phones, school.contact2Phones]);
  const contact2Name = (school.responsiblePerson2Name || school.contact2Name)?.trim();
  const contact2Role = (school.responsiblePerson2Role || school.contact2Role)?.trim() || 'တာဝန်ခံ ပုဂ္ဂိုလ် (၂)';
  contact2Nums.forEach((num, idx) => {
    results.push({
      key: `contact2-${idx}-${num}`, category: 'contact2', fullLabel: getPhoneLabel('တာဝန်ခံ (၂)', idx),
      personName: contact2Name || undefined, personRole: contact2Role,
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  // 5. ကျောင်း ဖုန်း
  const schoolNums = parseNumbers([school.schoolPhone, school.schoolPhone2, school.schoolPhones]);
  schoolNums.forEach((num, idx) => {
    results.push({
      key: `school-${idx}-${num}`, category: 'school', fullLabel: getPhoneLabel('ကျောင်း', idx),
      personRole: 'ကျောင်း ရုံးခန်း (School Office)',
      number: num, cleanDial: num.replace(/[^0-9+]/g, ''),
    });
  });

  return results;
};
