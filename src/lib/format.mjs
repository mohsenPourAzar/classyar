export const cn = (...a) => a.filter(Boolean).join(" ");
export const fmt = (n) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(n);
export const dateNow = () =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const makeId = () =>
  globalThis.crypto && globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
