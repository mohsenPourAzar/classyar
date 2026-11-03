export default function BrandMark({
  size = 40,
  className = "",
  decorative = true,
}) {
  return (
    <img
      src="/brand/classyar-mark.svg"
      width={size}
      height={size}
      className={`brand-mark ${className}`}
      alt={decorative ? "" : "نشان کلاس‌یار"}
      aria-hidden={decorative || undefined}
      draggable={false}
    />
  );
}
