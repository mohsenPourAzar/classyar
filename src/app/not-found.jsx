import BrandMark from "@/components/brand-mark.jsx";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-loading">
      <BrandMark size={64} decorative={false} />
      <h1>این صفحه پیدا نشد</h1>
      <Link className="button" href="/">
        بازگشت به کلاس‌یار
      </Link>
    </main>
  );
}
