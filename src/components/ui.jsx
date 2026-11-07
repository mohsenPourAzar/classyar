import Select from "./select.jsx";
import PersianDatePicker from "./persian-date-picker.jsx";
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

Object.assign(paths, {
  move: [
    'path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"',
  ],
  history: ['path d="M3 12a9 9 0 1 0 2.6-6.4M3 3v6h6M12 7v5l3 2"'],
  "mic-off": [
    'path d="m3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 4a3 3 0 0 1 6 0v5M5 10v2a7 7 0 0 0 12 5M19 10v2M12 19v3M8 22h8"',
  ],
  "chevron-down": ['path d="m6 9 6 6 6-6"'],
  minus: ['path d="M5 12h14"'],
  user: ['circle cx="12" cy="7" r="4"', 'path d="M4 21v-2a8 8 0 0 1 16 0v2"'],
  mic: [
    'rect x="9" y="2" width="6" height="12" rx="3"',
    'path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"',
  ],
  stop: ['rect x="5" y="5" width="14" height="14" rx="2"'],
  send: ['path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"'],
  home: ['path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z"'],
  shield: [
    'path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z"',
    'path d="m9 12 2 2 4-4"',
  ],
  sparkle: [
    'path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"',
  ],
});
export { Icon };
export function Button({
  children,
  icon,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn("button", variant !== "primary" && variant, className)}
      {...props}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}
export const button = (label, icon, onClick, variant = "soft", extras = {}) => (
  <Button
    icon={icon}
    onClick={onClick}
    variant={
      { soft: "secondary", "outline-white": "outline" }[variant] || variant
    }
    {...extras}
  >
    {label}
  </Button>
);
export function IconButton({
  icon,
  onClick,
  label,
  danger = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={cn("subaction", danger && "danger-text", className)}
      onClick={onClick}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
export function Badge({ children, kind = "", className = "" }) {
  return <span className={cn("pill", kind, className)}>{children}</span>;
}
export function PageHeading({ title, description, children }) {
  return (
    <div className="toolbar">
      <div>
        <h2 className="section-name">{title}</h2>
        {description && <p className="section-sub">{description}</p>}
      </div>
      {children && <div className="toolbar-actions">{children}</div>}
    </div>
  );
}
export function CardHeading({ title, description, children }) {
  return (
    <div className="table-top">
      <div>
        <h3 className="table-title">{title}</h3>
        {description && <p className="table-info">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Person({ student }) {
  return (
    <span className="person">
      <span className="person-initial" aria-hidden="true">
        {student.name.slice(0, 1)}
      </span>
      <span>{student.name}</span>
    </span>
  );
}
export function Stat({ title, value, icon, tint = "", suffix }) {
  return (
    <div className="card stat">
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value">
          {typeof value === "number" ? fmt(value) : (value ?? "—")}
        </div>
        {suffix && <div className="stat-detail">{suffix}</div>}
      </div>
      <span className={cn("stat-icon", tint)}>
        <Icon name={icon} size={22} />
      </span>
    </div>
  );
}
export function Empty({
  title,
  description = "هنوز اطلاعاتی برای نمایش ثبت نشده است.",
  action,
  icon = "boxes",
}) {
  return (
    <div className="card empty">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function FormInput({
  label,
  name,
  kind = "text",
  value,
  required = false,
  hint,
  options = [],
  ...props
}) {
  const id = "field-" + name;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {kind === "textarea" ? (
        <textarea
          id={id}
          name={name}
          defaultValue={value ?? ""}
          required={required}
          {...props}
        />
      ) : kind === "select" ? (
        <Select
          id={id}
          name={name}
          defaultValue={value ?? ""}
          required={required}
          {...props}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : kind === "persian-date" ? (
        <PersianDatePicker
          id={id}
          name={name}
          defaultValue={value ?? ""}
          required={required}
          {...props}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={kind}
          defaultValue={value ?? ""}
          required={required}
          {...props}
        />
      )}{" "}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
export const componentColor = (component, index = 0) =>
  component.kind === "attendance"
    ? "#f0b557"
    : component.tag === "exercise"
      ? "#36b5b0"
      : ["#7277f3", "#36b5b0", "#c084dc"][index % 3];
export function WeightBar({ components }) {
  const total = components.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  return (
    <div
      className="progress-rail"
      role="img"
      aria-label={
        "توزیع بارم: " +
        components.map((c) => c.name + " " + fmt(c.weight)).join("، ")
      }
    >
      {components.map((component, index) => (
        <span
          key={component.id}
          title={component.name + ": " + fmt(component.weight)}
          style={{
            width:
              (total > 0
                ? Math.max(0, Math.min(100, (component.weight / total) * 100))
                : 0) + "%",
            background: componentColor(component, index),
          }}
        />
      ))}
    </div>
  );
}
export function syncInfo(app) {
  if (app.syncBlocked) return { label: "نیاز به بررسی", kind: "danger" };
  if (!app.state.ready) return { label: "در حال اتصال", kind: "pending" };
  if (
    app.state.saveStatus.includes("آفلاین") ||
    app.state.saveStatus.includes("فقط")
  )
    return { label: "ذخیره روی دستگاه", kind: "warning" };
  if (app.pendingChanges || app.saving)
    return { label: "در حال ذخیره", kind: "pending" };
  return { label: "همگام‌سازی شد", kind: "success" };
}
