import { createElement as e } from "react";
import { Icon, iconButton } from "../ui.jsx";

export default function ClassSwitcher({ app }) {
  return e(
    "div",
    { className: "class-switch" },
    e(
      "div",
      { className: "class-switch-label" },
      e(Icon, { name: "school", size: 17 }),
      "کلاس فعال",
    ),
    e(
      "div",
      { className: "class-switch-actions" },
      e(
        "select",
        {
          value: app.state.classId || "",
          onChange: (ev) => app.changeClass(ev.target.value),
        },
        app.state.db.classes.map((c) =>
          e("option", { key: c.id, value: c.id }, c.name),
        ),
        app.state.db.classes.length === 0
          ? e("option", { value: "" }, "ابتدا کلاس بسازید")
          : null,
      ),
      iconButton("plus", () => app.open("class"), "تعریف کلاس جدید"),
    ),
  );
}
