import { createElement as e } from "react";
import { Icon, button, panel } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";

export default function Settings({ app }) {
  const db = app.state.db;
  return e(
    "div",
    { className: "stack" },
    e(
      "div",
      { className: "section-actions" },
      e(
        "div",
        null,
        e("h2", null, "تنظیمات و پشتیبان"),
        e("p", null, "حفاظت از داده‌های آموزشی و انتقال اطلاعات."),
      ),
    ),
    e(
      "div",
      { className: "settings-grid" },
      panel(
        "نمایش و رنگ‌بندی",
        "تغییر سریع تم با ذخیره انتخاب شما در مرورگر",
        null,
        e(
          "div",
          { className: "setting-action" },
          e(
            "div",
            { className: "setting-art" },
            e(Icon, {
              name: app.state.theme === "dark" ? "sun" : "moon",
              size: 30,
            }),
          ),
          app.renderThemeSelector("settings-theme"),
        ),
      ),
      app.renderFontSettings(),
      panel(
        "پشتیبان‌گیری از تمام اطلاعات",
        "کلاس‌ها، دانش‌آموزان، پودمان‌ها، جلسات و همه نمرات در یک فایل JSON",
        null,
        e(
          "div",
          { className: "setting-action" },
          e(
            "div",
            { className: "setting-art" },
            e(Icon, { name: "download", size: 30 }),
          ),
          button(
            "دریافت نسخه پشتیبان",
            "download",
            () => app.exportBackup(),
            "primary",
          ),
        ),
      ),
      panel(
        "بازیابی نسخه پشتیبان",
        "تمام اطلاعات فعلی جایگزین فایل انتخاب‌شده خواهد شد.",
        null,
        e(
          "div",
          { className: "setting-action" },
          e(
            "div",
            { className: "setting-art" },
            e(Icon, { name: "upload", size: 30 }),
          ),
          e(
            "label",
            { className: "btn btn-soft file-upload" },
            e(Icon, { name: "upload", size: 17 }),
            "انتخاب فایل JSON",
            e("input", {
              type: "file",
              accept: ".json,application/json",
              onChange: (ev) => app.importBackup(ev),
            }),
          ),
        ),
      ),
      panel(
        "اطلاعات سامانه",
        "ساختار داده‌ها و وضعیت کنونی",
        null,
        e(
          "div",
          { className: "setting-details" },
          [
            ["تعداد کلاس‌ها", db.classes.length],
            ["دانش‌آموزان", db.students.length],
            ["پودمان‌ها", db.modules.length],
            ["جلسات", db.sessions.length],
            ["آیتم‌های ارزشیابی", db.assessments.length],
          ].map((x) =>
            e(
              "div",
              { key: x[0] },
              e("span", null, x[0]),
              e("strong", null, fmt(x[1])),
            ),
          ),
        ),
      ),
      panel(
        "نکات مهم درباره نگهداری داده",
        "برای کاربرد روزمره و بدون نیاز به اینترنت",
        null,
        e(
          "div",
          { className: "tips" },
          e(
            "p",
            null,
            "اگر سامانه را از طریق سرور محلی اجرا کنید، تمام اطلاعات کلاس و نمرات در MongoDB ذخیره می‌شود و یک نسخه در مرورگر می‌ماند.",
          ),
          e(
            "p",
            null,
            "برای اجرای روزمره از npm run dev استفاده کنید؛ هنگام قطع اتصال، تغییرات در مرورگر حفظ می‌شوند و پس از اتصال دوباره همگام می‌شوند.",
          ),
          e(
            "p",
            null,
            "این نسخه برای یک دبیر طراحی شده و ورود کاربران، دسترسی چنددبیری و ذخیره‌سازی ابری ندارد؛ از اطلاعات به‌طور منظم پشتیبان تهیه کنید.",
          ),
        ),
      ),
    ),
  );
}
