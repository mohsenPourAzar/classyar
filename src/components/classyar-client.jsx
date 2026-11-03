"use client";

import dynamic from "next/dynamic";
import BrandMark from "./brand-mark.jsx";

// Browser storage, downloads and the interactive gradebook initialize after hydration.
const ClassyarApp = dynamic(() => import("./classyar-app"), {
  ssr: false,
  loading: () => (
    <main className="app-loading" role="status">
      <BrandMark size={64} />
      در حال آماده‌سازی کلاس‌یار…
    </main>
  ),
});

export default function ClassyarClient() {
  return <ClassyarApp />;
}
