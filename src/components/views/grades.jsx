import { createElement as e } from "react";
import { Icon, button, badge, panel, Empty, Stat } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";
import * as L from "../../lib/classroom/logic.mjs";
import * as EX from "../../lib/classroom/reports.mjs";

export default function Grades({ app }) {
  const db = app.state.db,
    scope = app.reportScope,
    all = scope === "all",
    m = app.currentModule;
  if (!app.modules.length)
    return e(Empty, {
      title: "برای دریافت لیست نمرات، ابتدا یک پودمان ایجاد کنید.",
    });
  const report = EX.listRows(db, app.state.classId, scope);
  const grades = app.students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: all ? null : L.calculateModule(db, s.id, m.id),
  }));
  const finished = report.rows.filter((r) =>
    all ? r[r.length - 1] === "نهایی" : r[r.length - 2] === "نهایی",
  ).length;
  const scores = all
    ? report.rows
        .map((r) => r[r.length - 3])
        .filter((v) => typeof v === "number")
    : grades.filter((g) => g.grade.complete).map((g) => g.grade.total);
  const average = scores.length
    ? L.round(scores.reduce((a, x) => a + x, 0) / scores.length)
    : null;
  const comps = !all ? db.components.filter((c) => c.moduleId === m.id) : [];
  const weight = !all ? L.moduleWeight(db, m.id) : null;
  const selectedValue = app.state.gradeScope === "all" ? "all" : m.id;
  return e(
    "div",
    { className: "stack grade-report-page" },
    e(
      "div",
      { className: "section-actions no-print" },
      e(
        "div",
        null,
        e("h2", null, "لیست نمرات و کارنامه"),
        e(
          "p",
          null,
          "فیلتر پودمان، مشاهده ریزنمرات، چاپ و دریافت فایل اکسل استاندارد.",
        ),
      ),
      e(
        "div",
        { className: "toolbar-actions report-actions" },
        button(
          "دانلود Excel",
          "download",
          () => app.exportGradeList("xlsx"),
          "primary",
        ),
        button("CSV", "download", () => app.exportGradeList("csv")),
        button("چاپ لیست", "print", () => app.printGradeList()),
      ),
    ),
    e(
      "div",
      { className: "report-filter no-print" },
      e(
        "div",
        { className: "filter-label" },
        e(Icon, { name: "layers", size: 18 }),
        e(
          "div",
          null,
          e("strong", null, "محدوده گزارش"),
          e(
            "small",
            null,
            "پودمان را تغییر دهید یا تمام پودمان‌ها را یکجا ببینید.",
          ),
        ),
      ),
      e(
        "select",
        {
          className: "report-select",
          value: selectedValue,
          onChange: (ev) =>
            app.setState(
              ev.target.value === "all"
                ? { gradeScope: "all" }
                : { gradeScope: "module", moduleId: ev.target.value },
            ),
        },
        e("option", { value: "all" }, "تمام پودمان‌ها — خلاصه و خروجی یکجا"),
        app.modules.map((x) => e("option", { key: x.id, value: x.id }, x.name)),
      ),
      all
        ? badge(fmt(app.modules.length) + " پودمان", "muted")
        : badge(
            "مجموع وزن " + fmt(weight) + " از ۲۰",
            Math.abs(weight - 20) < 0.001 ? "success" : "warning",
          ),
    ),
    e(
      "div",
      { className: "print-report-title" },
      e("h2", null, "لیست نمرات " + report.title),
      e(
        "p",
        null,
        `${report.klass.name} | ${report.klass.subject || "درس"} | سال تحصیلی ${report.klass.year || "—"}`,
      ),
    ),
    e(
      "div",
      { className: "stats-grid stats-three no-print" },
      e(Stat, {
        title: "دانش‌آموزان با نمره نهایی",
        value: finished,
        icon: "check",
        tint: "teal",
        suffix: "نفر",
      }),
      e(Stat, {
        title: "نیازمند تکمیل",
        value: Math.max(0, report.rows.length - finished),
        icon: "clock",
        tint: "orange",
        suffix: "نفر",
      }),
      e(Stat, {
        title: "میانگین نمرات نهایی",
        value: average ?? 0,
        icon: "chart",
        tint: "indigo",
        suffix: average === null ? "هنوز نمره نهایی ثبت نشده" : "از ۲۰",
      }),
    ),
    !all && Math.abs(weight - 20) > 0.001
      ? e(
          "div",
          { className: "notice notice-warn no-print" },
          e(Icon, { name: "alert", size: 20 }),
          `مجموع سهم بخش‌های ${m.name} برابر ${fmt(weight)} است. برای نهایی‌شدن نمرات باید دقیقاً ۲۰ باشد.`,
          button("تنظیم وزن‌ها", "arrow", () => app.go("modules")),
        )
      : null,
    panel(
      all ? "خلاصه نمرات تمام پودمان‌ها" : `ریز نمرات ${m.name}`,
      all
        ? "در خروجی Excel، برای هر پودمان یک شیت مجزا و یک شیت خلاصه ساخته می‌شود."
        : "مقادیر خالی به معنی نمره صفر نیستند و تا ثبت اطلاعات، نمره نهایی خالی می‌ماند.",
      e(
        "span",
        { className: "report-count" },
        fmt(report.rows.length) + " دانش‌آموز",
      ),
      e(
        "div",
        { className: "table-scroll" },
        e(
          "table",
          { className: "data-table grade-table" },
          e(
            "thead",
            null,
            e(
              "tr",
              null,
              report.headers.map((h, i) => e("th", { key: i }, h)),
            ),
          ),
          e(
            "tbody",
            null,
            report.rows.map((row, i) =>
              e(
                "tr",
                { key: app.students[i]?.id || i },
                row.map((v, j) => {
                  const isStatus =
                    (j === row.length - 2 && !all) ||
                    (j === row.length - 1 && all);
                  const isFinal =
                    (j === row.length - 3 && !all) ||
                    (j === row.length - 3 && all);
                  return e(
                    "td",
                    {
                      key: j,
                      className: cn(
                        j === 0 && "number",
                        typeof v === "number" && "score-cell",
                        isFinal && "final-grade-cell",
                      ),
                    },
                    isStatus
                      ? badge(v, v === "نهایی" ? "success" : "warning")
                      : v === "" || v == null
                        ? e("span", { className: "pending-dash" }, "—")
                        : typeof v === "number"
                          ? e(
                              "strong",
                              { className: isFinal ? "final-grade" : "" },
                              fmt(v),
                            )
                          : j === 1
                            ? e("strong", null, v)
                            : v,
                  );
                }),
              ),
            ),
          ),
        ),
      ),
      "table-panel",
    ),
    e(
      "div",
      { className: "explain-note no-print" },
      e(Icon, { name: "info", size: 17 }),
      "خروجی Excel شامل نمره هر بخش، نمره نهایی و وضعیت تکمیل است. اعداد صفر ثبت‌شده حفظ می‌شوند؛ نمره‌های ثبت‌نشده خالی صادر می‌شوند.",
    ),
  );
}
