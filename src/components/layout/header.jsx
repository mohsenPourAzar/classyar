import { createElement as e } from "react";
import { Icon, iconButton } from "../ui.jsx";
import { cn, dateNow } from "../../lib/format.mjs";
import { nav } from "../navigation.mjs";

export default function Header({ app }) {
  const selected = app.selectedClass,
    pageTitle = (nav.find((n) => n[0] === app.state.view) || nav[0])[1];
  return e(
    "header",
    { className: "topbar" },
    e(
      "div",
      { className: "topbar-right" },
      iconButton(
        "menu",
        () => app.setState((s) => ({ mobileMenu: !s.mobileMenu })),
        "بازکردن فهرست",
      ),
      e(
        "div",
        null,
        e(
          "div",
          { className: "crumbs" },
          "فضای کاری دبیر",
          e(Icon, { name: "arrow", size: 13 }),
          selected ? selected.name : "مدیریت کلاس",
        ),
        e("h1", null, pageTitle),
      ),
    ),
    e(
      "div",
      { className: "topbar-left" },
      e(
        "span",
        { className: "today" },
        e(Icon, { name: "calendar", size: 16 }),
        dateNow(),
      ),
      e(
        "span",
        { className: "connection" },
        e("i", {
          className: cn(
            "connection-dot",
            !app.state.saveStatus.includes("MongoDB") && "connection-offline",
          ),
        }),
        app.state.saveStatus,
      ),
      app.renderThemeSelector("header-theme"),
      e("div", { className: "avatar" }, "د"),
    ),
  );
}
