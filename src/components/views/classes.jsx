import { createElement as e } from "react";
import { Icon, button, iconButton, badge, Empty } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";

export default function Classes({ app }) {
  return e(
    "div",
    { className: "stack" },
    e(
      "div",
      { className: "section-actions" },
      e(
        "div",
        null,
        e("h2", null, "کلاس‌های من"),
        e("p", null, "برای هر پایه یا درس، کلاس مستقلی تعریف کنید."),
      ),
      button("کلاس جدید", "plus", () => app.open("class"), "primary"),
    ),
    app.state.db.classes.length
      ? e(
          "div",
          { className: "class-grid" },
          app.state.db.classes.map((c) =>
            e(
              "article",
              {
                className: cn(
                  "class-card",
                  c.id === app.state.classId && "class-current",
                ),
                key: c.id,
              },
              e(
                "div",
                { className: "class-card-top" },
                e(
                  "div",
                  {
                    className: "class-card-icon",
                    style: { background: c.color + "1a", color: c.color },
                  },
                  e(Icon, { name: "school", size: 27 }),
                ),
                badge("پایه " + c.grade, "muted"),
              ),
              e("h3", null, c.name),
              e("p", null, c.subject || "درس تعریف نشده"),
              e(
                "div",
                { className: "class-stat-line" },
                e(
                  "span",
                  null,
                  e(Icon, { name: "users", size: 15 }),
                  fmt(
                    app.state.db.students.filter((s) => s.classId === c.id)
                      .length,
                  ) + " دانش‌آموز",
                ),
                e(
                  "span",
                  null,
                  e(Icon, { name: "boxes", size: 15 }),
                  fmt(
                    app.state.db.modules.filter((m) => m.classId === c.id)
                      .length,
                  ) + " پودمان",
                ),
              ),
              e(
                "div",
                { className: "class-card-footer" },
                button(
                  c.id === app.state.classId ? "کلاس فعال" : "ورود به کلاس",
                  "arrow",
                  () => app.changeClass(c.id),
                  c.id === app.state.classId ? "soft" : "primary",
                ),
                iconButton("edit", () => app.open("class", c), "ویرایش کلاس"),
                iconButton(
                  "trash",
                  () => app.remove("class", c),
                  "حذف کلاس",
                  "danger",
                ),
              ),
            ),
          ),
        )
      : e(Empty, {
          title: "هنوز کلاسی ندارید",
          description: "اولین کلاس را برای شروع تعریف کنید.",
          action: button(
            "ساخت اولین کلاس",
            "plus",
            () => app.open("class"),
            "primary",
          ),
        }),
  );
}
