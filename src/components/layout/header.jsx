import { Icon, syncInfo } from "../ui.jsx";
import { dateNow } from "../../lib/format.mjs";
import { nav } from "../navigation.mjs";
export default function Header({ app }) {
  const title = (nav.find((item) => item[0] === app.state.view) || nav[0])[1],
    status = syncInfo(app);
  return (
    <header className="topbar">
      <div className="heading-group">
        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-label="بازکردن فهرست"
          aria-expanded={app.state.mobileMenu}
          aria-controls="main-sidebar"
          onClick={() => app.setState((s) => ({ mobileMenu: !s.mobileMenu }))}
        >
          <Icon name="menu" size={19} />
        </button>
        <div>
          <div className="heading-eyebrow">
            فضای کاری دبیر <span className="breadcrumb-separator">/</span>{" "}
            {app.selectedClass?.name || "کلاس‌های من"}
          </div>
          <h1 className="heading-title">{title}</h1>
        </div>
      </div>
      <div className="top-actions">
        <div
          className={"status-chip " + status.kind}
          title={app.state.saveStatus}
          role="status"
        >
          <span className="dot" />
          {status.label}
        </div>
        <div className="date-chip">
          <Icon name="calendar" size={14} />
          <time>{dateNow()}</time>
        </div>
        {app.renderThemeSelector("header-theme")}
      </div>
    </header>
  );
}
