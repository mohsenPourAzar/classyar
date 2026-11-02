import { createElement as e } from "react";
import { button, iconButton, badge, panel, Empty } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";
import { statuses } from "../navigation.mjs";

export default function Attendance({ app }) {
  const sessions = app.classSessions;
  const active =
    sessions.find((s) => s.id === app.state.sessionId) || sessions[0];
  const db = app.state.db;
  const records = active
    ? db.attendance.filter((r) => r.sessionId === active.id)
    : [];
  const count = (status) => records.filter((r) => r.status === status).length;
  const heading = e(
    "div",
    { className: "section-actions" },
    e(
      "div",
      null,
      e("h2", null, "ثبت حضور و غیاب"),
      e("p", null, "برای هر جلسه، تاریخ و پودمان را مشخص کنید."),
    ),
    button("جلسه جدید", "plus", () => app.open("session"), "primary", {
      disabled: !app.modules.length,
    }),
  );
  if (!sessions.length)
    return e(
      "div",
      { className: "stack" },
      heading,
      e(Empty, {
        title: "هنوز جلسه‌ای ثبت نکرده‌اید",
        description: "جلسه جدید تعریف کنید و آن را به پودمان مربوط وصل کنید.",
        action: button(
          "تعریف جلسه",
          "plus",
          () => app.open("session"),
          "primary",
          { disabled: !app.modules.length },
        ),
      }),
    );
  const tabs = e(
    "div",
    { className: "session-strip" },
    sessions.map((s) =>
      e(
        "button",
        {
          key: s.id,
          className: cn(
            "session-tab",
            active.id === s.id && "session-tab-active",
          ),
          onClick: () => app.setState({ sessionId: s.id }),
        },
        e("strong", null, s.title || "جلسه " + fmt(s.order)),
        e("span", null, s.date || "بدون تاریخ"),
      ),
    ),
  );
  const summary = e(
    "div",
    { className: "attendance-summary" },
    [
      ["present", "حاضر", "success"],
      ["absent", "غایب", "danger"],
      ["late", "تأخیر", "warning"],
      ["excused", "موجه", "muted"],
    ].map((x) =>
      e(
        "div",
        { key: x[0], className: "mini-stat" },
        badge(x[1], x[2]),
        e("strong", null, fmt(count(x[0]))),
      ),
    ),
    e(
      "div",
      { className: "mini-stat" },
      badge("ثبت‌نشده"),
      e("strong", null, fmt(Math.max(0, app.students.length - records.length))),
    ),
  );
  const rows = app.students.map((s, i) => {
    const st = records.find((r) => r.studentId === s.id)?.status || "unset";
    const choices = statuses.map(([value, label]) =>
      e(
        "button",
        {
          key: value,
          className: cn(
            "status-btn",
            "status-" + value,
            st === value && "status-selected",
          ),
          onClick: () =>
            app.setAttendance(active.id, s.id, st === value ? "unset" : value),
        },
        label,
      ),
    );
    return e(
      "tr",
      { key: s.id },
      e("td", { className: "number" }, fmt(i + 1)),
      e("td", null, e("strong", null, s.name)),
      e(
        "td",
        null,
        e(
          "div",
          { className: "status-options" },
          choices,
          st === "unset" ? badge("ثبت نشده", "muted") : null,
        ),
      ),
    );
  });
  const table = e(
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
          e("th", null, "دانش‌آموز"),
          e("th", null, "وضعیت حضور"),
        ),
      ),
      e("tbody", null, rows),
    ),
  );
  const actions = e(
    "div",
    { className: "toolbar-actions" },
    button("ثبت حضور برای موارد خالی", "check", () =>
      app.markAllPresent(active.id),
    ),
    iconButton("edit", () => app.open("session", active), "ویرایش جلسه"),
    iconButton(
      "trash",
      () => app.remove("session", active),
      "حذف جلسه",
      "danger",
    ),
  );
  return e(
    "div",
    { className: "stack" },
    heading,
    tabs,
    panel(
      active.title,
      `${active.date || "تاریخ نامشخص"} · ${db.modules.find((m) => m.id === active.moduleId)?.name || "بدون پودمان"}`,
      actions,
      e("div", null, summary, table),
      "table-panel",
    ),
  );
}
