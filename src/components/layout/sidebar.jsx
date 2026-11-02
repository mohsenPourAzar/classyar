import { Icon, syncInfo } from "../ui.jsx";
import { cn, fmt } from "../../lib/format.mjs";
import { nav } from "../navigation.mjs";
export default function Sidebar({ app }) {
  const groups = [
    ["نمای کلی", ["dashboard", "classes"]],
    ["مدیریت کلاس", ["students", "attendance"]],
    ["ارزیابی و گزارش", ["modules", "assessments", "grades"]],
    ["دستیار", ["assistant"]],
  ];
  const status = syncInfo(app);
  return (
    <>
      <button
        type="button"
        className={cn("sidebar-backdrop", app.state.mobileMenu && "visible")}
        aria-label="بستن فهرست"
        onClick={() => app.setState({ mobileMenu: false })}
      />
      <aside
        id="main-sidebar"
        className={cn("sidebar", app.state.mobileMenu && "open")}
      >
        <div className="brand">
          <span className="brand-symbol">
            <Icon name="home" size={25} />
          </span>
          <div>
            <div className="brand-name">کلاس‌یار</div>
            <div className="brand-caption">فضای مدیریت آموزشی</div>
          </div>
        </div>
        <nav className="nav" aria-label="منوی اصلی">
          {groups.map(([label, keys]) => (
            <div key={label}>
              <div className="nav-label">{label}</div>
              {keys.map((key) => {
                const [, text, icon] = nav.find((item) => item[0] === key);
                return (
                  <button
                    type="button"
                    key={key}
                    data-view={key}
                    className={cn(
                      "nav-btn",
                      app.state.view === key && "active",
                    )}
                    aria-current={app.state.view === key ? "page" : undefined}
                    onClick={() => app.go(key)}
                  >
                    <Icon name={icon} size={18} />
                    <span>{text}</span>
                    {key === "classes" && (
                      <span className="nav-count">
                        {fmt(app.state.db.classes.length)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">د</span>
            <div>
              <strong>فضای کاری دبیر</strong>
              <small>مدیریت کلاس و ارزشیابی</small>
            </div>
            <span
              className={"online-dot " + status.kind}
              title={status.label}
              aria-label={status.label}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
