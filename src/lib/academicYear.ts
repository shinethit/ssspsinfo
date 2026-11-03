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

// v24.15 re-audit (V29/G1/G2): ONE definition of "paid this year", shared by
// every surface that shows a paid badge, count, filter, sort or export
// (Dashboard, Admin Dashboard, Contacts, SchoolDetail, Admin managers,
// Home level bars, Excel export, School Portal). It compares against the
// COMPUTED June-start year, NOT the saved global year — the saved year
// lives in per-browser localStorage (the admin's browser only), so
// comparing against it made two devices disagree on who paid. The saved
// year keeps its roles (default for new payment forms, batch-roll target);
// the paid definition must be identical everywhere. A flag with no recorded
// year (legacy flag-only payment) still counts — no year to contradict.
export function isCurrentYearPaid(school: { isAnnualFeePaid?: boolean | null; feeAcademicYear?: string | null }): boolean {
  return !!school.isAnnualFeePaid &&
    (!school.feeAcademicYear || normalizeAcademicYear(school.feeAcademicYear) === getCurrentAcademicYear());
}

// v24.15 (V14): ONE canonical academic-year form for the whole app — Myanmar
// digits ('၂၀၂၆-၂၀၂၇'), matching every stored year and every display in the app.
// Latin-digit or spaced input ('2026-2027', '၂၀၂၆ - ၂၀၂၇') normalizes to the
// same string, so a Latin-digit year can never defeat the duplicate guard
// again. Every comparison AND every write path must go through this function.
// (The auditor sketched Latin-digit canonical; Myanmar-digit canonical was
// chosen instead because all stored years and all displays already use
// Myanmar digits — the behavioural requirement is identical either way.)
export function normalizeAcademicYear(raw: string | undefined | null): string {
  if (!raw) return '';
  const latin = raw.replace(/[၀-၉]/g, (d) => String(MY_DIGITS.indexOf(d)));
  const m = latin.trim().match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (!m) return raw.trim();
  return toMyanmarDigits(`${m[1]}-${m[2]}`);
}

/** True only for a YYYY–YYYY year (Latin or Myanmar digits, spacing tolerated). */
export function isValidAcademicYear(raw: string | undefined | null): boolean {
  if (!raw) return false;
  return /^[၀-၉]{4}-[၀-၉]{4}$/.test(normalizeAcademicYear(raw));
}

// The admin's saved Global Academic Year (Finance tab), or the current year.
// This is what makes the Finance "Global Setting" actually work — submit
// paths used to ignore it entirely.
export function getGlobalAcademicYear(): string {
  try {
    const saved = localStorage.getItem('global_academic_year');
    // v24.15: normalize on read too, so a Latin-digit value saved before the
    // V28 validation can never poison a default year again.
    if (saved && saved.trim()) {
      const n = normalizeAcademicYear(saved);
      if (isValidAcademicYear(n)) return n;
    }
  } catch {
    // localStorage unavailable — fall through to the computed year.
  }
  return getCurrentAcademicYear();
}
