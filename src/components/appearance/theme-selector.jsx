import { createElement as e } from "react";
import { Icon } from "../ui.jsx";

export default function ThemeSelector({ app, name }) {
  return e(
    "fieldset",
    { className: "theme-selector", "data-selected": app.state.theme },
    e("legend", { className: "sr-only" }, "حالت نمایش"),
    e("span", { className: "theme-thumb", "aria-hidden": "true" }),
    [
      ["light", "روشن", "sun"],
      ["dark", "تیره", "moon"],
    ].map(([value, label, icon]) =>
      e(
        "label",
        { key: value, className: "theme-option", title: "حالت " + label },
        e("input", {
          type: "radio",
          name,
          value,
          checked: app.state.theme === value,
          onChange: () => app.setState({ theme: value }),
        }),
        e(
          "span",
          { className: "theme-option-content" },
          e(Icon, { name: icon, size: 20 }),
          e("span", { className: "sr-only" }, label),
        ),
      ),
    ),
  );
}
