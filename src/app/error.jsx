"use client";

export default function ErrorPage({ reset }) {
  return (
    <main className="app-loading">
      <h1>بارگذاری کلاس‌یار کامل نشد</h1>
      <p>
        صفحه را دوباره بارگذاری کنید. اطلاعات ذخیره‌شده در پایگاه داده حفظ
        می‌شوند.
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        تلاش دوباره
      </button>
    </main>
  );
}
