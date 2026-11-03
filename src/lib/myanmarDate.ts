// Hardcoded Myanmar weekday / month names (v24.15).
// NEVER use Intl 'my-MM' for user-visible dates: the user's phone lacks that
// locale and dates fell back to English (NgweSarYin lesson, 2026-11-03).
// These names are the only source of truth for rendered dates in this app.

import { toMyanmarDigits } from './myanmarDigits';

export const MYANMAR_WEEKDAYS = [
  'တနင်္ဂနွေ',
  'တနင်္လာ',
  'အင်္ဂါ',
  'ဗုဒ္ဓဟူး',
  'ကြာသပတေး',
  'သောကြာ',
  'စနေ',
] as const;

export const MYANMAR_MONTHS = [
  'ဇန်နဝါရီ',
  'ဖေဖော်ဝါရီ',
  'မတ်',
  'ဧပြီ',
  'မေ',
  'ဇွန်',
  'ဇူလိုင်',
  'ဩဂုတ်',
  'စက်တင်ဘာ',
  'အောက်တိုဘာ',
  'နိုဝင်ဘာ',
  'ဒီဇင်ဘာ',
] as const;

export const MYANMAR_MONTHS_SHORT = [
  'ဇန်',
  'ဖေ',
  'မတ်',
  'ဧပြီ',
  'မေ',
  'ဇွန်',
  'ဇူလိုင်',
  'ဩ',
  'စက်',
  'အောက်',
  'နိုဝင်',
  'ဒီဇင်ဘာ',
] as const;

/** 'အင်္ဂါ၊ နိုဝင်ဘာ ၃ ရက်၊ ၂၀၂၆ ခုနှစ်'. Never throws; invalid date -> guarded label. */
export function formatMyanmarDate(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return 'ရက်စွဲ မဖော်ပြထားပါ';
  return `${MYANMAR_WEEKDAYS[d.getDay()]}၊ ${MYANMAR_MONTHS[d.getMonth()]} ${toMyanmarDigits(
    String(d.getDate())
  )} ရက်၊ ${toMyanmarDigits(String(d.getFullYear()))} ခုနှစ်`;
}

/** formatMyanmarDate + time: 'အင်္ဂါ၊ နိုဝင်ဘာ ၃ ရက်၊ ၂၀၂၆ ခုနှစ်၊ ၁၀:၃၀'. */
export function formatMyanmarDateTime(d: Date): string {
  if (!d || isNaN(d.getTime())) return 'ရက်စွဲ မဖော်ပြထားပါ';
  const hh = toMyanmarDigits(String(d.getHours()).padStart(2, '0'));
  const mm = toMyanmarDigits(String(d.getMinutes()).padStart(2, '0'));
  return `${formatMyanmarDate(d)}၊ ${hh}:${mm}`;
}

/** Parse a 'YYYY-MM-DD' (or ISO datetime) string into a Date, or null if malformed. */
export function parseStoredDate(raw: string | undefined | null): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const datePart = raw.trim().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const [y, m, d] = datePart.split('-').map(Number);
  // v24.15 re-audit (G3): the regex validates shape but not calendar
  // validity — '2026-02-30' used to roll over to Mar 2 instead of guarding.
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > new Date(y, m, 0).getDate()) return null;
  const date = new Date(`${datePart}T12:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * One shared announcement-date formatter (P31).
 * Valid date -> formatMyanmarDate. Missing or malformed -> 'ရက်စွဲ မဖော်ပြထားပါ'.
 * Never echoes the raw stored string, never 'Invalid Date', never 'မကြာသေးမီက'.
 */
export function formatAnnouncementDate(raw: string | undefined | null): string {
  const d = parseStoredDate(raw);
  return d ? formatMyanmarDate(d) : 'ရက်စွဲ မဖော်ပြထားပါ';
}
