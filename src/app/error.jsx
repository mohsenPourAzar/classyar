"use client";
import BrandMark from "@/components/brand-mark.jsx";

export default function ErrorPage({ reset }) {
  return (
    <main className="app-loading">
      <BrandMark size={64} decorative={false} />
      <h1>بارگذاری کلاس‌یار کامل نشد</h1>
      <p>
        صفحه را دوباره بارگذاری کنید. اطلاعات ذخیره‌شده در پایگاه داده حفظ
        می‌شوند.
      </p>
      <button type="button" className="button" onClick={reset}>
        تلاش دوباره
      </button>
    </main>
  );
}
