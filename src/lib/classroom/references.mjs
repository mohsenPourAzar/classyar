export const normalizeReference = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹٠-٩]/g, (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".includes(digit)
          ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
          : "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
      ),
    )
    .replace(/[\u200c\s]+/g, " ")
    .trim();
export function resolveReference(records, reference, label) {
  if (typeof reference !== "string" || !reference.trim())
    throw Error(`${label} مشخص نشده است؛ نام دقیق آن را بگویید.`);
  const direct = records.find((item) => item.id === reference);
  if (direct) return direct;
  const key = normalizeReference(reference),
    matches = records.filter(
      (item) => normalizeReference(item.name || item.title) === key,
    );
  if (matches.length === 1) return matches[0];
  throw Error(
    matches.length
      ? `${label} با این نام چند مورد دارد؛ تاریخ، پودمان یا کد آن را مشخص کنید.`
      : `${label} با این نام در محدودهٔ فعلی وجود ندارد؛ نام درست را مشخص کنید یا ابتدا آن را تعریف کنید.`,
  );
}
