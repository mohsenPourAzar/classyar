import { createElement as e } from "react";
import { Icon, button, badge, panel, Empty, Stat } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import * as L from "../../lib/classroom/logic.mjs";

export default function Dashboard({ app }) {
  const db = app.state.db,
    cl = app.selectedClass;
  const stats = L.attendanceStats(db, app.state.classId);
  const as = db.assessments.filter(
    (a) => a.moduleId && app.modules.some((m) => m.id === a.moduleId),
  );
  const count = app.students.length;
  return e(
    "div",
    { className: "stack" },
    e(
      "div",
      { className: "hero" },
      e("div", { className: "hero-pattern" }),
      e(
        "div",
        { className: "hero-content" },
        e("div", { className: "hero-label" }, "پنل مدیریت مدرسه"),
        e(
          "h2",
          null,
          "مدیریت کلاس‌ها،",
          e("br"),
          e("span", null, "دقیق‌تر از همیشه."),
        ),
        e(
          "p",
          null,
          "حضور و غیاب، تمرین‌ها، آزمون‌ها و نمرات پودمانی را در یک محیط یکپارچه ثبت کنید.",
        ),
        e(
          "div",
          { className: "hero-actions" },
          button("ثبت جلسه جدید", "plus", () => app.open("session"), "white"),
          button(
            "مشاهده کارنامه",
            "chart",
            () => app.go("grades"),
            "outline-white",
          ),
        ),
      ),
      e(
        "div",
        { className: "hero-symbol" },
        e(Icon, { name: "school", size: 130 }),
      ),
    ),
    e(
      "div",
      { className: "stats-grid" },
      e(Stat, {
        title: "کلاس‌های تعریف‌شده",
        value: db.classes.length,
        icon: "layers",
        tint: "indigo",
        suffix: "قابل مدیریت",
      }),
      e(Stat, {
        title: "دانش‌آموزان این کلاس",
        value: count,
        icon: "users",
        tint: "violet",
        suffix: cl ? cl.name : "بدون کلاس",
      }),
      e(Stat, {
        title: "جلسات ثبت‌شده",
        value: stats.sessions,
        icon: "calendar",
        tint: "teal",
        suffix: "در کلاس فعال",
      }),
      e(Stat, {
        title: "آیتم‌های ارزشیابی",
        value: as.length,
        icon: "clipboard",
        tint: "orange",
        suffix: "آزمون، تمرین و سایر موارد",
      }),
    ),
    e(
      "div",
      { className: "dashboard-grid" },
      panel(
        "پودمان‌های کلاس",
        "پیشرفت و تنظیمات ارزشیابی",
        button("مدیریت پودمان", "arrow", () => app.go("modules"), "ghost"),
        app.modules.length
          ? e(
              "div",
              { className: "module-quick-list" },
              app.modules.map((m) => {
                const comps = db.components.filter((c) => c.moduleId === m.id);
                const val = L.moduleWeight(db, m.id);
                return e(
                  "button",
                  {
                    key: m.id,
                    className: "module-quick",
                    onClick: () => {
                      app.setState({ moduleId: m.id });
                      app.go("grades");
                    },
                  },
                  e(
                    "div",
                    { className: "module-quick-symbol" },
                    e(Icon, { name: "boxes", size: 20 }),
                  ),
                  e(
                    "div",
                    { className: "grow" },
                    e("strong", null, m.name),
                    e("span", null, comps.length + " بخش نمره‌دهی"),
                  ),
                  badge(
                    "سقف " + fmt(val) + " از ۲۰",
                    Math.abs(val - 20) < 0.001 ? "success" : "warning",
                  ),
                  e(Icon, { name: "arrow", size: 17 }),
                );
              }),
            )
          : e(Empty, {
              title: "هنوز پودمانی تعریف نشده",
              action: button(
                "ساخت پودمان",
                "plus",
                () => app.open("module"),
                "primary",
              ),
            }),
      ),
      panel(
        "دسترسی سریع",
        "کارهای روزمره را از اینجا انجام دهید",
        null,
        e(
          "div",
          { className: "quick-actions" },
          [
            [
              "users",
              "افزودن دانش‌آموز",
              "ثبت نام جدید",
              () => app.open("student"),
            ],
            [
              "calendar",
              "ثبت حضور و غیاب",
              "جلسه و وضعیت حضور",
              () => app.go("attendance"),
            ],
            [
              "clipboard",
              "ثبت نمره",
              "آزمون یا تمرین",
              () => app.go("assessments"),
            ],
            [
              "download",
              "تهیه پشتیبان",
              "دریافت فایل اطلاعات",
              () => app.exportBackup(),
            ],
          ].map((x, i) =>
            e(
              "button",
              { key: i, className: "quick-action", onClick: x[3] },
              e(
                "div",
                { className: "quick-icon" },
                e(Icon, { name: x[0], size: 21 }),
              ),
              e("div", null, e("strong", null, x[1]), e("span", null, x[2])),
              e(Icon, { name: "arrow", size: 16 }),
            ),
          ),
        ),
      ),
    ),
  );
}
