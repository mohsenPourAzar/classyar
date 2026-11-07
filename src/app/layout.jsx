import { appearanceScript } from "@/lib/appearance.mjs";
import Script from "next/script";
import "@/styles/fonts.css";
import "@/styles/base.css";
import "@/styles/design.css";
import "@/styles/assistant.css";
import "@/styles/workspace.css";
import "@/styles/select.css";
import "@/styles/persian-date.css";
import "@/styles/responsive.css";
import "@/styles/brand.css";

export const metadata = {
  title: "کلاس‌یار | مدیریت کلاس و نمره",
  applicationName: "Classyar",
  description:
    "مدیریت کلاس، حضور و غیاب و ارزشیابی پودمانی با ذخیره‌سازی در MongoDB",
};

export const viewport = { themeColor: "#f6f8fc" };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Parastoo.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Script
          id="classyar-appearance"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: appearanceScript }}
        />
        {children}
      </body>
    </html>
  );
}
