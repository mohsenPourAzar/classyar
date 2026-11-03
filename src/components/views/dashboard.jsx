import { useLayoutEffect, useRef, useState } from "react";
import { Icon, Button, Stat, Badge, WeightBar } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import { attendanceStats, moduleWeight } from "../../lib/classroom/logic.mjs";
export default function Dashboard({ app }) {
  const db = app.state.db,
    selected = app.selectedClass,
    stats = attendanceStats(db, app.state.classId),
    assessments = db.assessments.filter((item) =>
      app.modules.some((module) => module.id === item.moduleId),
    );
  const counts = db.classes.slice(0, 7).map((item) => ({
      name: item.name,
      count: db.students.filter((student) => student.classId === item.id)
        .length,
    })),
    max = Math.max(1, ...counts.map((item) => item.count));
  const moduleList = useRef(null);
  const [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(3);
  useLayoutEffect(() => {
    const node = moduleList.current;
    if (!node) return;
    const resize = () => {
      const rowHeight =
        Number.parseFloat(
          getComputedStyle(node).getPropertyValue("--module-row-height"),
        ) || 64;
      setPageSize(Math.max(1, Math.floor(node.clientHeight / rowHeight)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => setPage(0), [app.state.classId]);
  const pages = Math.max(1, Math.ceil(app.modules.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visibleModules = app.modules.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  const shortcuts = [
    ["users", "افزودن دانش‌آموز", () => app.open("student")],
    ["calendar", "ثبت حضور و غیاب", () => app.go("attendance")],
    ["clipboard", "ثبت ارزیابی", () => app.go("assessments")],
    ["chart", "کارنامه و خروجی", () => app.go("grades")],
  ];
  return (
    <div className="dashboard-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            پنل مدیریت کلاس <span className="breadcrumb-separator">/</span>{" "}
            {selected?.name}
          </div>
          <h2 className="hero-title">
            مدیریت کلاس‌ها،
            <br />
            دقیق‌تر از همیشه.
          </h2>
          <p className="hero-desc">
            حضور و غیاب، تکالیف، ارزیابی و کارنامه، همه در یک فضای منظم و
            یکپارچه.
          </p>
          <div className="hero-actions">
            <Button
              icon="plus"
              onClick={() => app.open("session")}
              disabled={!app.modules.length}
            >
              ثبت جلسه جدید
            </Button>
            <Button
              icon="chart"
              variant="outline"
              onClick={() => app.go("grades")}
            >
              مشاهده کارنامه
            </Button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-progress">
            <div className="small">نمای کلی کلاس‌های شما</div>
            <div>
              <span className="big">{fmt(app.students.length)}</span>{" "}
              <span className="small">دانش‌آموز در کلاس فعال</span>
            </div>
            <div className="mini-bars" aria-label="تعداد دانش‌آموزان کلاس‌ها">
              {counts.map((item, index) => (
                <span
                  key={index}
                  title={item.name + ": " + fmt(item.count)}
                  style={{ height: (item.count / max) * 35 + 8 + "px" }}
                />
              ))}
            </div>
            <div className="small">مدیریت آموزشی هوشمند و ساده</div>
          </div>
        </div>
      </section>
      <div className="grid-4">
        <Stat
          title="کلاس‌های تعریف‌شده"
          value={db.classes.length}
          icon="layers"
          suffix="قابل مدیریت"
        />
        <Stat
          title="دانش‌آموزان این کلاس"
          value={app.students.length}
          icon="users"
          tint="pink"
          suffix={selected?.name}
        />
        <Stat
          title="جلسات ثبت‌شده"
          value={stats.sessions}
          icon="calendar"
          tint="green"
          suffix="در کلاس فعال"
        />
        <Stat
          title="آیتم‌های ارزیابی"
          value={assessments.length}
          icon="clipboard"
          tint="orange"
          suffix="آزمون و تمرین"
        />
      </div>
      <div className="dashboard-layout">
        <section className="card card-pad dashboard-modules">
          <div className="section-head">
            <div>
              <h3 className="card-title">پودمان‌های کلاس</h3>
              <p className="card-subtitle">ساختار نمره‌دهی و وضعیت هر پودمان</p>
            </div>
            <button
              type="button"
              className="link"
              onClick={() => app.go("modules")}
            >
              مدیریت پودمان‌ها ‹
            </button>
          </div>
          <div className="dashboard-module-list" ref={moduleList}>
            {app.modules.length ? (
              visibleModules.map((module) => {
                const components = db.components.filter(
                    (item) => item.moduleId === module.id,
                  ),
                  weight = moduleWeight(db, module.id);
                return (
                  <button
                    type="button"
                    className="module-row module-link"
                    key={module.id}
                    onClick={() => {
                      app.setState({
                        moduleId: module.id,
                        gradeScope: "module",
                      });
                      app.go("grades");
                    }}
                  >
                    <span className="module-index">{fmt(module.order)}</span>
                    <div className="row-grow">
                      <strong>{module.name}</strong>
                      <p className="mini-muted">
                        {fmt(components.length)} بخش نمره‌دهی · مجموع{" "}
                        {fmt(weight)} نمره
                      </p>
                      <WeightBar components={components} />
                    </div>
                    <Badge
                      kind={
                        Math.abs(weight - 20) < 0.001 ? "success" : "warning"
                      }
                    >
                      {Math.abs(weight - 20) < 0.001 ? "فعال" : "تنظیم بارم"}
                    </Badge>
                  </button>
                );
              })
            ) : (
              <div className="empty">
                <p>هنوز پودمانی تعریف نشده است.</p>
                <Button icon="plus" onClick={() => app.open("module")}>
                  ایجاد پودمان
                </Button>
              </div>
            )}
          </div>
          {pages > 1 && (
            <div
              className="dashboard-pagination"
              aria-label="صفحه‌بندی پودمان‌ها"
            >
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                aria-label="پودمان‌های قبلی"
              >
                ‹ قبلی
              </button>
              <span aria-live="polite">
                {fmt(currentPage + 1)} از {fmt(pages)}
              </span>
              <button
                type="button"
                disabled={currentPage === pages - 1}
                onClick={() => setPage(currentPage + 1)}
                aria-label="پودمان‌های بعدی"
              >
                بعدی ›
              </button>
            </div>
          )}
        </section>
        <section className="card card-pad dashboard-shortcuts">
          <div className="section-head">
            <div>
              <h3 className="card-title">دسترسی سریع</h3>
              <p className="card-subtitle">کارهای پرتکرار در یک نگاه</p>
            </div>
            <Icon name="sparkle" size={19} />
          </div>
          <div className="shortcuts">
            {shortcuts.map(([icon, label, action]) => (
              <button
                type="button"
                className="shortcut"
                key={label}
                onClick={action}
              >
                <Icon name={icon} size={18} />
                {label}
              </button>
            ))}
          </div>
          <div className="workspace-note">
            <strong>
              <Icon name="info" size={14} /> یادآوری دبیر
            </strong>
            <p>
              وضعیت حضور و نمره‌ها را به‌روز نگه دارید؛ برای ثبت سریع اطلاعات
              می‌توانید از دستیار صوتی استفاده کنید.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
