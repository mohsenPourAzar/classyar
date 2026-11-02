import { createElement as e } from "react";
import { Icon, button } from "../ui.jsx";
import { cn } from "../../lib/format.mjs";
import { nav } from "../navigation.mjs";

export default function Sidebar({ app }) {
  const groups = [
    ["نمای کلی", ["dashboard", "classes"]],
    ["مدیریت کلاس", ["students", "attendance"]],
    ["ارزشیابی و گزارش", ["modules", "assessments", "grades"]],
    ["سامانه", ["settings"]],
  ];
  return e(
    "div",
    null,
    app.state.mobileMenu
      ? e("div", {
          className: "overlay-nav",
          onClick: () => app.setState({ mobileMenu: false }),
        })
      : null,
    e(
      "aside",
      { className: cn("sidebar", app.state.mobileMenu && "sidebar-open") },
      e(
        "div",
        { className: "brand" },
        e(
          "div",
          { className: "brand-mark" },
          e(Icon, { name: "school", size: 26 }),
        ),
        e(
          "div",
          null,
          e("strong", null, "کلاس‌یار"),
          e("span", null, "فضای مدیریت آموزشی"),
        ),
      ),
      e(
        "nav",
        { className: "nav", "aria-label": "منوی اصلی" },
        groups.map(([label, keys]) =>
          e(
            "div",
            { className: "nav-group", key: label },
            e("div", { className: "side-title" }, label),
            keys.map((key) => {
              const [, , ico] = nav.find((n) => n[0] === key),
                text = nav.find((n) => n[0] === key)[1];
              return e(
                "button",
                {
                  key,
                  type: "button",
                  onClick: () => app.go(key),
                  className: cn(
                    "nav-item",
                    app.state.view === key && "nav-active",
                  ),
                  "aria-current": app.state.view === key ? "page" : undefined,
                },
                e(Icon, { name: ico, size: 19 }),
                e("span", null, text),
                app.state.view === key
                  ? e("i", { className: "nav-indicator" })
                  : null,
              );
            }),
          ),
        ),
      ),
      e(
        "div",
        { className: "side-footer" },
        e(
          "div",
          { className: "side-footer-icon" },
          e(Icon, { name: "info", size: 18 }),
        ),
        e(
          "div",
          null,
          e("strong", null, "نسخه ۳ · آفلاین و محلی"),
          e("span", null, "کلاس‌ها، گزارش‌ها و نمرات"),
        ),
      ),
    ),
  );
}
