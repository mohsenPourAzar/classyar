const dayMs = 86400000;
export const minYear = 1000;
export const maxYear = 2000;
export const persianMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const partsFormatter = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
export function persianParts(date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((p) => ["year", "month", "day"].includes(p.type))
      .map((p) => [p.type, Number(p.value)]),
  );
  return parts;
}
const dateKey = ({ year, month, day }) => year * 10000 + month * 100 + day;
export function persianToDate(year, month, day) {
  if (
    ![year, month, day].every(Number.isInteger) ||
    year < minYear ||
    year > maxYear ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  // Intl supplies the calendar rules, including leap years. Search UTC days to
  // avoid local daylight-saving transitions and hand-maintained leap cycles.
  const target = dateKey({ year, month, day });
  let low = Date.UTC(year + 621, 0, 1) / dayMs;
  let high = Date.UTC(year + 623, 0, 1) / dayMs;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (dateKey(persianParts(new Date(middle * dayMs))) < target)
      low = middle + 1;
    else high = middle;
  }
  const result = new Date(low * dayMs);
  return dateKey(persianParts(result)) === target ? result : null;
}
export function parsePersianDate(value) {
  const latin = String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[\u200e\u200f]/g, "")
    .trim();
  const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(latin);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  return persianToDate(year, month, day) ? { year, month, day } : null;
}
export function formatPersianDate({ year, month, day }) {
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`.replace(
    /\d/g,
    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)],
  );
}
export function todayPersian(now = new Date()) {
  const local = new Intl.DateTimeFormat("en-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = Object.fromEntries(
    local.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return persianParts(
    new Date(
      Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
    ),
  );
}
export function monthDays(year, month) {
  if (!persianToDate(year, month, 1)) return [];
  const count =
    month <= 6
      ? 31
      : month <= 11
        ? 30
        : persianToDate(year, month, 30)
          ? 30
          : 29;
  return Array.from({ length: count }, (_, i) => ({ year, month, day: i + 1 }));
}
export function shiftPersianDay(date, amount) {
  const utc = persianToDate(date.year, date.month, date.day);
  if (!utc) return null;
  const next = persianParts(new Date(utc.getTime() + amount * dayMs));
  return next.year >= minYear && next.year <= maxYear ? next : null;
}
export function shiftPersianMonth(date, amount) {
  const index = date.year * 12 + date.month - 1 + amount;
  const year = Math.floor(index / 12),
    month = (index % 12) + 1;
  const days = monthDays(year, month);
  return days.length
    ? { year, month, day: Math.min(date.day, days.length) }
    : null;
}
export function monthOffset(year, month) {
  const first = persianToDate(year, month, 1);
  return first ? (first.getUTCDay() + 1) % 7 : 0; // Saturday is the first column.
}
