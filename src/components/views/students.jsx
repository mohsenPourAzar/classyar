import { createElement as e } from "react";
import { Icon, button, iconButton, badge, panel, Empty } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";

export default function Students({ app }) {
  const data = app.students.filter((s) =>
    (s.name + " " + (s.studentCode || "")).includes(app.state.search.trim()),
  );
  return e(
    "div",
    { className: "stack" },
    e(
      "div",
      { className: "section-actions" },
      e(
        "div",
        null,
        e("h2", null, "دانش‌آموزان"),
        e(
          "p",
          null,
          fmt(app.students.length) +
            " دانش‌آموز در " +
            (app.selectedClass?.name || "کلاس"),
        ),
      ),
      e(
        "div",
        { className: "toolbar-actions" },
        button("افزودن گروهی", "upload", () => app.open("bulk")),
        button(
          "افزودن دانش‌آموز",
          "plus",
          () => app.open("student"),
          "primary",
        ),
      ),
    ),
    panel(
      "فهرست دانش‌آموزان",
      null,
      e(
        "div",
        { className: "search-field" },
        e(Icon, { name: "search", size: 18 }),
        e("input", {
          type: "search",
          value: app.state.search,
          placeholder: "جست‌وجوی نام یا کد...",
          onChange: (ev) => app.setState({ search: ev.target.value }),
        }),
      ),
      data.length
        ? e(
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
                  e("th", null, "ردیف"),
                  e("th", null, "نام و نام خانوادگی"),
                  e("th", null, "کد دانش‌آموزی"),
                  e("th", null, "توضیحات"),
                  e("th", null, "عملیات"),
                ),
              ),
              e(
                "tbody",
                null,
                data.map((s, i) =>
                  e(
                    "tr",
                    { key: s.id },
                    e("td", { className: "number" }, fmt(i + 1)),
                    e(
                      "td",
                      null,
                      e(
                        "div",
                        { className: "student-cell" },
                        e(
                          "span",
                          { className: "student-avatar" },
                          s.name.slice(0, 1),
                        ),
                        e("strong", null, s.name),
                      ),
                    ),
                    e("td", null, s.studentCode || "—"),
                    e("td", null, s.note ? badge(s.note, "warning") : "—"),
                    e(
                      "td",
                      null,
                      e(
                        "div",
                        { className: "cell-actions" },
                        iconButton(
                          "edit",
                          () => app.open("student", s),
                          "ویرایش دانش‌آموز",
                        ),
                        iconButton(
                          "trash",
                          () => app.remove("student", s),
                          "حذف دانش‌آموز",
                          "danger",
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          )
        : e(Empty, {
            title: app.state.search
              ? "نتیجه‌ای پیدا نشد"
              : "لیست دانش‌آموزان خالی است",
            action: !app.state.search
              ? button(
                  "افزودن دانش‌آموز",
                  "plus",
                  () => app.open("student"),
                  "primary",
                )
              : null,
          }),
      "table-panel",
    ),
  );
}
