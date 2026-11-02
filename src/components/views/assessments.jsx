import { createElement as e } from "react";
import { Icon, button, iconButton, badge, panel, Empty } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";

export default function Assessments({ app }) {
  const m = app.currentModule,
    db = app.state.db;
  if (!m)
    return e(Empty, {
      title: "ابتدا یک پودمان تعریف کنید",
      action: button(
        "ایجاد پودمان",
        "plus",
        () => app.open("module"),
        "primary",
      ),
    });
  const items = db.assessments.filter((a) => a.moduleId === m.id),
    selected = items.find((a) => a.id === app.state.assessmentId) || items[0];
  const componentOf = (a) => db.components.find((c) => c.id === a.componentId);
  const allComponents = db.components.filter(
    (c) => c.moduleId === m.id && c.kind === "assessment",
  );
  const markCount = (a) =>
    db.marks.filter((x) => x.assessmentId === a.id).length;
  return e(
    "div",
    { className: "stack" },
    e(
      "div",
      { className: "section-actions" },
      e(
        "div",
        null,
        e("h2", null, "آزمون‌ها و تمرین‌ها"),
        e(
          "p",
          null,
          "هر بخش می‌تواند هر تعداد آزمون، تمرین یا آیتم سفارشی داشته باشد.",
        ),
      ),
      button(
        "آیتم ارزشیابی جدید",
        "plus",
        () => app.open("assessment"),
        "primary",
        { disabled: !allComponents.length },
      ),
    ),
    e(
      "div",
      { className: "subnav-row" },
      e("label", null, "پودمان موردنظر"),
      e(
        "select",
        {
          value: m.id,
          onChange: (ev) =>
            app.setState({ moduleId: ev.target.value, assessmentId: null }),
        },
        app.modules.map((x) => e("option", { key: x.id, value: x.id }, x.name)),
      ),
      badge(fmt(items.length) + " آیتم"),
    ),
    allComponents.length === 0
      ? e(
          "div",
          { className: "notice" },
          e(Icon, { name: "alert" }),
          "در این پودمان هنوز بخش نمره‌دهی از نوع آزمون/تمرین ندارید. از صفحه پودمان‌ها یک بخش ایجاد کنید.",
        )
      : null,
    items.length
      ? e(
          "div",
          { className: "assessment-layout" },
          e(
            "div",
            { className: "assessment-list panel" },
            e("h3", null, "آیتم‌های ارزشیابی"),
            items.map((a) =>
              e(
                "button",
                {
                  key: a.id,
                  className: cn(
                    "assessment-item",
                    selected?.id === a.id && "assessment-selected",
                  ),
                  onClick: () => app.setState({ assessmentId: a.id }),
                },
                e(
                  "div",
                  { className: "assessment-icon" },
                  e(Icon, { name: "clipboard", size: 19 }),
                ),
                e(
                  "div",
                  { className: "grow" },
                  e("strong", null, a.title),
                  e(
                    "span",
                    null,
                    (componentOf(a)?.name || "بخش حذف‌شده") +
                      " · از " +
                      fmt(a.maxScore),
                  ),
                ),
                e(
                  "span",
                  { className: "assess-count" },
                  fmt(markCount(a)) + "/" + fmt(app.students.length),
                ),
              ),
            ),
          ),
          selected
            ? panel(
                selected.title,
                `${componentOf(selected)?.name || "بخش نامشخص"} · ${selected.date || "بدون تاریخ"} · سقف ${fmt(selected.maxScore)} نمره`,
                e(
                  "div",
                  { className: "toolbar-actions" },
                  iconButton(
                    "edit",
                    () => app.open("assessment", selected),
                    "ویرایش آیتم",
                  ),
                  iconButton(
                    "trash",
                    () => app.remove("assessment", selected),
                    "حذف آیتم",
                    "danger",
                  ),
                ),
                e(
                  "div",
                  { className: "table-scroll" },
                  e(
                    "table",
                    { className: "data-table" },
                    e(
                      "thead",
                      null,
                      e(
                        "tr",
                        null,
                        e("th", null, "#"),
                        e("th", null, "نام دانش‌آموز"),
                        e("th", null, `نمره (از ${fmt(selected.maxScore)})`),
                        e("th", null, "وضعیت"),
                      ),
                    ),
                    e(
                      "tbody",
                      null,
                      app.students.map((s, i) => {
                        const mark = db.marks.find(
                          (x) =>
                            x.assessmentId === selected.id &&
                            x.studentId === s.id,
                        );
                        return e(
                          "tr",
                          { key: s.id },
                          e("td", { className: "number" }, fmt(i + 1)),
                          e("td", null, e("strong", null, s.name)),
                          e(
                            "td",
                            null,
                            e("input", {
                              className: "score-input",
                              type: "number",
                              min: 0,
                              max: selected.maxScore,
                              step: "0.25",
                              value: mark ? mark.score : "",
                              placeholder: "—",
                              onChange: (ev) =>
                                app.setMark(
                                  selected.id,
                                  s.id,
                                  ev.target.value,
                                  selected.maxScore,
                                ),
                              "aria-label": "نمره " + s.name,
                            }),
                          ),
                          e(
                            "td",
                            null,
                            mark
                              ? badge("ثبت شده", "success")
                              : badge("ثبت نشده", "muted"),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
                "assessment-mark-panel",
              )
            : null,
        )
      : e(Empty, {
          title: "هنوز آزمون یا تمرینی ثبت نشده",
          description: "اولین آیتم را با بارم دلخواه تعریف کنید.",
          action: allComponents.length
            ? button(
                "تعریف ارزشیابی",
                "plus",
                () => app.open("assessment"),
                "primary",
              )
            : null,
        }),
  );
}
