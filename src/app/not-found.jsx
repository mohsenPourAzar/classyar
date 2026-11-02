import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-loading">
      <h1>این صفحه پیدا نشد</h1>
      <Link className="btn btn-primary" href="/">
        بازگشت به کلاس‌یار
      </Link>
    </main>
  );
}
