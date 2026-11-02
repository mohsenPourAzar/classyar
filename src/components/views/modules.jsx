import { createElement as e } from "react";
import { Icon, button, iconButton, badge, panel, Empty } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";
import * as L from "../../lib/classroom/logic.mjs";

export default function Modules({ app }) {
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
        e("h2", null, "ساختار پودمان‌ها"),
        e("p", null, "تعداد پودمان‌ها، بخش‌ها و وزن‌ها کاملاً قابل تغییر است."),
      ),
      button("پودمان جدید", "plus", () => app.open("module"), "primary"),
    ),
    app.modules.length
      ? e(
          "div",
          { className: "module-grid" },
          app.modules.map((m) => {
            const comps = db.components.filter((c) => c.moduleId === m.id),
              weight = L.moduleWeight(db, m.id);
            return e(
              "article",
              { className: "panel module-card", key: m.id },
              e(
                "div",
                { className: "module-card-header" },
                e("div", { className: "module-number" }, fmt(m.order)),
                e(
                  "div",
                  { className: "grow" },
                  e("h3", null, m.name),
                  e("p", null, m.description || "ساختار قابل تنظیم"),
                ),
                e(
                  "div",
                  { className: "cell-actions" },
                  iconButton(
                    "edit",
                    () => app.open("module", m),
                    "ویرایش پودمان",
                  ),
                  iconButton(
                    "trash",
                    () => app.remove("module", m),
                    "حذف پودمان",
                    "danger",
                  ),
                ),
              ),
              e(
                "div",
                { className: "weight-section" },
                e(
                  "div",
                  { className: "weight-top" },
                  e("strong", null, "توزیع بارم"),
                  badge(
                    fmt(weight) + " از ۲۰",
                    Math.abs(weight - 20) < 0.001 ? "success" : "warning",
                  ),
                ),
                e(
                  "div",
                  { className: "weight-track" },
                  comps.map((c) =>
                    e("span", {
                      key: c.id,
                      style: {
                        width: Math.min(100, (c.weight / 20) * 100) + "%",
                        background:
                          c.kind === "attendance"
                            ? "#f5ad55"
                            : c.tag === "exam"
                              ? "#6474ef"
                              : c.tag === "exercise"
                                ? "#24a99e"
                                : "#b48aef",
                      },
                    }),
                  ),
                ),
                Math.abs(weight - 20) > 0.001
                  ? e(
                      "p",
                      { className: "weight-warning" },
                      e(Icon, { name: "alert", size: 15 }),
                      "برای محاسبه نهایی، مجموع وزن بخش‌ها باید ۲۰ باشد.",
                    )
                  : null,
              ),
              e(
                "div",
                { className: "component-list" },
                comps.map((c) =>
                  e(
                    "div",
                    { key: c.id, className: "component-row" },
                    e("div", {
                      className: cn(
                        "component-dot",
                        c.kind === "attendance" && "component-dot-orange",
                      ),
                    }),
                    e(
                      "div",
                      { className: "grow" },
                      e("strong", null, c.name),
                      e(
                        "span",
                        null,
                        c.kind === "attendance"
                          ? "بر اساس جلسات ثبت‌شده"
                          : fmt(
                              db.assessments.filter(
                                (a) => a.componentId === c.id,
                              ).length,
                            ) + " آیتم قابل نمره‌دهی",
                      ),
                    ),
                    badge(fmt(c.weight) + " نمره"),
                    iconButton(
                      "edit",
                      () => {
                        app.setState({ moduleId: m.id }, () =>
                          app.open("component", c),
                        );
                      },
                      "ویرایش بخش",
                    ),
                    iconButton(
                      "trash",
                      () => app.remove("component", c),
                      "حذف بخش",
                      "danger",
                    ),
                  ),
                ),
              ),
              button(
                "افزودن بخش نمره‌دهی",
                "plus",
                () =>
                  app.setState({ moduleId: m.id }, () => app.open("component")),
                "soft",
                { className: "wide" },
              ),
            );
          }),
        )
      : e(Empty, {
          title: "هیچ پودمانی تعریف نشده",
          action: button(
            "ایجاد پودمان",
            "plus",
            () => app.open("module"),
            "primary",
          ),
        }),
  );
}
