"use client";

import dynamic from "next/dynamic";

// Browser storage, downloads and the interactive gradebook initialize after hydration.
const ClassyarApp = dynamic(() => import("./classyar-app"), {
  ssr: false,
  loading: () => (
    <main className="app-loading" role="status">
      در حال آماده‌سازی کلاس‌یار…
    </main>
  ),
});

export default function ClassyarClient() {
  return <ClassyarApp />;
}
