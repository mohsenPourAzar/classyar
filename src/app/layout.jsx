import { appearanceScript } from "@/lib/appearance.mjs";
import "@/styles/fonts.css";
import "@/styles/base.css";
import "@/styles/theme.css";

export const metadata = {
  title: "کلاس‌یار | مدیریت کلاس و نمره",
  description:
    "مدیریت کلاس، حضور و غیاب و ارزشیابی پودمانی با ذخیره‌سازی در MongoDB",
};

export const viewport = { themeColor: "#f5f7fc" };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
        <link
          rel="preload"
          href="/fonts/Vazirmatn-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
