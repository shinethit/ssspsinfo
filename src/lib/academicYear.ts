// Academic-year helpers (v24.7).
// The app used to hard-code '၂၀၂၄-၂၀၂၅' / '၂၀၂၅-၂၀၂၆' in half a dozen
// places, so the same school could end up with different years depending on
// which form recorded the fee. Every default now goes through here.
// Year strings use Myanmar digits, matching the rest of the app.

const MY_DIGITS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

export function toMyanmarDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => MY_DIGITS[Number(d)]);
}

// Myanmar school year starts in June: June 2026 – May 2027 is '၂၀၂၆-၂၀၂၇'.
export function getCurrentAcademicYear(): string {
  const n = new Date();
  const y = n.getFullYear();
  const start = n.getMonth() >= 5 ? y : y - 1;
  return toMyanmarDigits(`${start}-${start + 1}`);
}

// The admin's saved Global Academic Year (Finance tab), or the current year.
// This is what makes the Finance "Global Setting" actually work — submit
// paths used to ignore it entirely.
export function getGlobalAcademicYear(): string {
  try {
    const saved = localStorage.getItem('global_academic_year');
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // localStorage unavailable — fall through to the computed year.
  }
  return getCurrentAcademicYear();
}
