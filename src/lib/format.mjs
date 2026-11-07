import { formatPersianDate, todayPersian } from "./persian-date.mjs";
export const cn = (...a) => a.filter(Boolean).join(" ");
export const fmt = (n) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(n);
export const dateNow = () => formatPersianDate(todayPersian());
export const makeId = () =>
  globalThis.crypto && globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
