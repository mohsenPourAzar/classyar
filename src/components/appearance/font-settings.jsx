import { createElement as e } from "react";
import { panel } from "../ui.jsx";

export default function FontSettings({ app }) {
  return panel(
    "قلم نوشته‌ها",
    "قلم دلخواه را برای تمام صفحه‌ها انتخاب کنید.",
    null,
    e(
      "div",
      { className: "font-settings" },
      e(
        "fieldset",
        { className: "font-options" },
        e("legend", { className: "sr-only" }, "قلم نوشته‌ها"),
        [
          ["vazirmatn", "وزیرمتن", "Vazirmatn (Vazir)"],
          ["iran-sans", "ایران‌سنس", "Iran Sans"],
          ["parastoo", "پرستو", "Parastoo"],
        ].map(([value, label, english]) =>
          e(
            "label",
            {
              key: value,
              className: "font-option",
              style: { fontFamily: "var(--font-" + value + ")" },
            },
            e("input", {
              type: "radio",
              name: "app-font",
              value,
              checked: app.state.font === value,
              onChange: () => app.setState({ font: value }),
            }),
            e(
              "span",
              null,
              e("strong", null, label),
              e("small", { lang: "en", dir: "ltr" }, english),
            ),
          ),
        ),
      ),
      e(
        "p",
        { className: "font-note" },
        "وزیرمتن و پرستو آفلاین در دسترس‌اند. ایران‌سنس به نسخه نصب‌شده روی دستگاه یا فایل قلم نیاز دارد.",
      ),
    ),
  );
}
