const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Formats a taka amount, e.g. formatTaka(1240, "bn") -> "৳১,২৪০" */
export function formatTaka(amount: number, style: "bn" | "en" = "bn"): string {
  const rounded = Math.round(amount);
  const withCommas = rounded.toLocaleString("en-IN");
  return style === "bn" ? `৳${toBanglaDigits(withCommas)}` : `৳${withCommas}`;
}
