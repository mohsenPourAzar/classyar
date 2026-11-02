import { createElement as e } from "react";
import { cn, fmt } from "../lib/format.mjs";
const paths = {
  grid: [
    'rect x="3" y="3" width="7" height="7" rx="1"',
    'rect x="14" y="3" width="7" height="7" rx="1"',
    'rect x="3" y="14" width="7" height="7" rx="1"',
    'rect x="14" y="14" width="7" height="7" rx="1"',
  ],
  layers: [
    'path d="m12 2 9 5-9 5-9-5 9-5Z"',
    'path d="m3 12 9 5 9-5"',
    'path d="m3 17 9 5 9-5"',
  ],
  users: [
    'path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"',
    'circle cx="9" cy="7" r="4"',
    'path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"',
  ],
  calendar: [
    'rect x="3" y="4" width="18" height="17" rx="2"',
    'path d="M16 2v4M8 2v4M3 10h18"',
  ],
  boxes: [
    'rect x="2" y="2" width="9" height="9" rx="2"',
    'rect x="13" y="2" width="9" height="9" rx="2"',
    'rect x="2" y="13" width="9" height="9" rx="2"',
    'rect x="13" y="13" width="9" height="9" rx="2"',
  ],
  clipboard: [
    'rect x="5" y="4" width="14" height="18" rx="2"',
    'path d="M9 4.5h6M8 11h8M8 15h8"',
  ],
  chart: ['path d="M3 3v18h18M7 15l4-4 3 2 6-7"'],
  settings: [
    'circle cx="12" cy="12" r="3"',
    'path d="M19.4 15a1.8 1.8 0 0 0 .36 1.99l.05.05-2 2-.05-.05a1.8 1.8 0 0 0-1.99-.36 1.8 1.8 0 0 0-1.1 1.66V21h-2.9v-.72A1.8 1.8 0 0 0 10.67 18.6a1.8 1.8 0 0 0-1.99.36l-.05.05-2-2 .05-.05A1.8 1.8 0 0 0 7.04 15a1.8 1.8 0 0 0-1.66-1.1H4.7v-2.9h.68a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-1.99l-.05-.05 2-2 .05.05a1.8 1.8 0 0 0 1.99.36 1.8 1.8 0 0 0 1.1-1.66V4h2.9v.68a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.99-.36l.05-.05 2 2-.05.05a1.8 1.8 0 0 0-.36 1.99 1.8 1.8 0 0 0 1.66 1.1h.68v2.9h-.68a1.8 1.8 0 0 0-1.66 1.1Z"',
  ],
  plus: ['path d="M12 5v14M5 12h14"'],
  search: ['circle cx="11" cy="11" r="7"', 'path d="m16 16 5 5"'],
  trash: ['path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"'],
  edit: ['path d="M12 20h9M16.5 3.5l4 4L9 19l-5 1 1-5 11.5-11.5Z"'],
  download: ['path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"'],
  upload: ['path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"'],
  close: ['path d="M5 5l14 14M19 5 5 19"'],
  check: ['path d="m4 12 5 5L20 6"'],
  alert: ['path d="M12 3 2 21h20L12 3Z"', 'path d="M12 9v5M12 18h.01"'],
  more: [
    'circle cx="5" cy="12" r="1"',
    'circle cx="12" cy="12" r="1"',
    'circle cx="19" cy="12" r="1"',
  ],
  sun: [
    'circle cx="12" cy="12" r="4"',
    'path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"',
  ],
  moon: ['path d="M20.9 13.35A9 9 0 0 1 10.65 3.1 9 9 0 1 0 20.9 13.35Z"'],
  print: [
    'path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"',
  ],
  menu: ['path d="M4 6h16M4 12h16M4 18h16"'],
  arrow: ['path d="m15 18-6-6 6-6"'],
  school: ['path d="M3 21V6l9-4 9 4v15M8 21v-7h8v7M7 9h.01M12 9h.01M17 9h.01"'],
  target: [
    'circle cx="12" cy="12" r="9"',
    'circle cx="12" cy="12" r="5"',
    'circle cx="12" cy="12" r="1"',
  ],
  clock: ['circle cx="12" cy="12" r="9"', 'path d="M12 7v5l4 2"'],
  info: ['circle cx="12" cy="12" r="10"', 'path d="M12 11v6M12 7h.01"'],
  save: ['path d="M5 3h13l3 3v15H3V3h2M7 3v6h10V3M7 21v-8h10v8"'],
};
function Icon(props) {
  const p = paths[props.name] || paths.grid;
  return e(
    "svg",
    {
      width: props.size || 20,
      height: props.size || 20,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.85,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: props.className || "",
      "aria-hidden": "true",
    },
    p.map((line, i) => {
      const tag = line.startsWith("circle")
        ? "circle"
        : line.startsWith("rect")
          ? "rect"
          : "path";
      const attrs = { key: i };
      (line.match(/([\w-]+)="([^"]*)"/g) || []).forEach((a) => {
        const m = a.match(/([\w-]+)="([^"]*)"/);
        attrs[m[1] === "class" ? "className" : m[1]] = m[2];
      });
      return e(tag, attrs);
    }),
  );
}
const button = (label, icon, fn, variant = "soft", extras = {}) =>
  e(
    "button",
    {
      type: "button",
      onClick: fn,
      className: cn(
        "btn",
        variant === "primary"
          ? "btn-primary"
          : variant === "ghost"
            ? "btn-ghost"
            : variant === "danger"
              ? "btn-danger"
              : variant === "white"
                ? "btn-white"
                : variant === "outline-white"
                  ? "btn-outline-white"
                  : "btn-soft",
        extras.className,
      ),
      title: extras.title,
      disabled: extras.disabled,
    },
    icon ? e(Icon, { name: icon, size: 17 }) : null,
    label,
  );
const iconButton = (icon, fn, title, variant = "ghost") =>
  e(
    "button",
    {
      type: "button",
      className: cn("icon-btn", variant === "danger" ? "icon-danger" : ""),
      onClick: fn,
      title,
      "aria-label": title,
    },
    e(Icon, { name: icon, size: 17 }),
  );
const badge = (text, kind = "muted") =>
  e("span", { className: "badge badge-" + kind }, text);
const panel = (title, subtitle, actions, content, cls = "") =>
  e(
    "section",
    { className: cn("panel", cls) },
    e(
      "div",
      { className: "panel-head" },
      e(
        "div",
        null,
        e("h3", null, title),
        subtitle ? e("p", null, subtitle) : null,
      ),
      actions,
    ),
    content,
  );
function Empty(props) {
  return e(
    "div",
    { className: "empty" },
    e(
      "div",
      { className: "empty-illustration" },
      e(Icon, { name: props.icon || "boxes", size: 32 }),
    ),
    e("h3", null, props.title),
    e("p", null, props.description || "هنوز اطلاعاتی برای نمایش ثبت نشده است."),
    props.action || null,
  );
}
function FormInput(p) {
  return e(
    "label",
    { className: "field" },
    e(
      "span",
      { className: "field-label" },
      p.label,
      p.required ? e("em", null, " *") : null,
    ),
    p.kind === "textarea"
      ? e("textarea", {
          name: p.name,
          defaultValue: p.value || "",
          placeholder: p.placeholder || "",
          rows: p.rows || 3,
          required: p.required || false,
        })
      : p.kind === "select"
        ? e(
            "select",
            {
              name: p.name,
              defaultValue: p.value || "",
              required: p.required || false,
            },
            (p.options || []).map((x) =>
              e("option", { key: x.value, value: x.value }, x.label),
            ),
          )
        : e("input", {
            name: p.name,
            type: p.kind || "text",
            defaultValue: p.value == null ? "" : p.value,
            required: p.required || false,
            min: p.min,
            max: p.max,
            step: p.step,
            placeholder: p.placeholder || "",
          }),
    p.hint ? e("small", null, p.hint) : null,
  );
}
function Stat(props) {
  return e(
    "div",
    { className: "stat-card" },
    e(
      "div",
      { className: cn("stat-icon", "stat-" + props.tint) },
      e(Icon, { name: props.icon, size: 23 }),
    ),
    e(
      "div",
      null,
      e("div", { className: "stat-label" }, props.title),
      e("div", { className: "stat-value" }, fmt(props.value)),
      props.suffix
        ? e("div", { className: "stat-suffix" }, props.suffix)
        : null,
    ),
  );
}
export { Icon, button, iconButton, badge, panel, Empty, FormInput, Stat };
