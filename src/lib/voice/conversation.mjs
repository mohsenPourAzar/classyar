const normalize = (value) =>
  String(value || "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ")
    .trim();
export function confirmationIntent(text) {
  const value = normalize(text);
  if (
    /(?:^|\s)(?:نه|خیر|لغو|نکن|نمی|اشتباه|منصرف)(?:\s|$)|تأیید نمی|تایید نمی|ثبت نکن|انجام نده/.test(
      value,
    )
  )
    return "decline";
  if (
    /^(?:(?:بله|آره|باشه|اوکی)[،,.!؟\s]*)?(?:(?:تأیید|تایید)(?: می کنم| میکنم| کن| شود)?|ثبت کن|ثبتش کن|انجام بده|انجامش بده|بله|آره|باشه|اوکی)[.!؟\s]*$/.test(
      value,
    )
  )
    return "confirm";
  return null;
}
export function planText(plan) {
  return [
    plan.message,
    ...plan.answers.flatMap((answer) => [
      answer.title,
      ...answer.rows.map((row) => row.join("، ")),
      answer.text,
    ]),
  ]
    .filter(Boolean)
    .join("\n");
}
export function isSynchronized(app) {
  return (
    app.state.ready &&
    !app.pendingChanges &&
    !app.saving &&
    !app.syncBlocked &&
    Number.isSafeInteger(app.serverRevision) &&
    JSON.stringify(app.state.db) === app.lastSavedData
  );
}
export function isFarewell(text) {
  const value = normalize(text)
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[.!؟?،,؛:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    /وقتی|زمانی|اگر|گفتم|خدا ?حافظی نکن|(?:خدا ?حافظ|خدا نگهدار|بای بای) نگو|قطع نکن|تمام نکن|ادامه بده|معنی|معنا|ترجمه|واژه|کلمه|چطور.*بگو/.test(
      value,
    )
  )
    return false;
  return (
    /(?:^|\s)(?:خدا ?حافظ|خدا نگهدار|بای بای|goodbye|bye)(?:\s|$)/i.test(
      value,
    ) ||
    /^(?:(?:لطفا|خب|خوب|دیگه|دیگر)\s+)?(?:(?:مکالمه|تماس|گفتگو|گفت و گو)(?: رو| را)? (?:قطع کن|تموم کن|تمام کن|ببند|پایان بده)|قطع مکالمه|پایان مکالمه|فعلا|بدرود|end (?:the )?(?:call|conversation)|stop (?:the )?(?:call|conversation))$/i.test(
      value,
    )
  );
}
