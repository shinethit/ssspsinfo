// Myanmar <-> Latin digit conversion (v24.15 shared helper).
// One place for the conversion so every parser/comparison uses the same one:
// amounts (Excel), phone search, academic years, dates.

const MYANMAR_DIGITS = '၀၁၂၃၄၅၆၇၈၉';

/** '၂၀၂၆' -> '2026'. Leaves Latin digits and everything else untouched. */
export function toLatinDigits(s: string): string {
  return s.replace(/[၀-၉]/g, (d) => String(MYANMAR_DIGITS.indexOf(d)));
}

/** '2026' -> '၂၀၂၆'. Leaves Myanmar digits and everything else untouched. */
export function toMyanmarDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => MYANMAR_DIGITS[Number(d)]);
}
