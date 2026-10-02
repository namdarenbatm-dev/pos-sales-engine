const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFarsiDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Parses a Persian or English numeric string typed by the user into a plain number string. */
export function parseUserNumber(input: string): string {
  if (!input) return "";
  const en = toEnglishDigits(input);
  return en.replace(/[^0-9.-]/g, "");
}

/** ۱۱,۵۰۰,۰۰۰ — integer, thousands separated, Persian digits. Rounds only at display time. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const withCommas = Math.abs(rounded).toLocaleString("en-US");
  return sign + toFarsiDigits(withCommas);
}

/** ۱۱,۵۰۰,۰۰۰ تومان */
export function formatToman(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value)} تومان`;
}

/** ۱,۵۰۰ دستگاه */
export function formatUnits(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value)} دستگاه`;
}

/** ۲۶٫۵٪ — max two decimal places. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  const [intPart, decPart] = String(rounded).split(".");
  const formattedInt = toFarsiDigits(intPart);
  const formattedDec = decPart ? "٫" + toFarsiDigits(decPart) : "";
  return `${formattedInt}${formattedDec}٪`;
}

/**
 * فرمت کوتاه برای محور نمودارها روی موبایل — چون formatNumber/formatToman
 * عدد کامل با جداکننده هزارگان می‌دهند که روی محور باریک جا نمی‌شود.
 * ۱۱,۵۰۰,۰۰۰ → «۱۱.۵M»   |   ۲,۰۰۰,۰۰۰,۰۰۰ → «۲B»   |   ۸۵۰ → «۸۵۰»
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  let out: string;
  if (abs >= 1_000_000_000) out = trimZero(abs / 1_000_000_000) + "B";
  else if (abs >= 1_000_000) out = trimZero(abs / 1_000_000) + "M";
  else if (abs >= 1_000) out = trimZero(abs / 1_000) + "K";
  else out = String(Math.round(abs));
  return sign + toFarsiDigits(out);
}

function trimZero(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}


export function formatDateFa(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}
