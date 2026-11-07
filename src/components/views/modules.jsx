import { IconButton, Button, PageHeading, Badge, Empty } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import { moduleSettings } from "../../lib/classroom/logic.mjs";

export default function Modules({ app }) {
  const db = app.state.db;
  return (
    <>
      <PageHeading
        title="پودمان‌ها و بارم‌بندی"
        description="فقط بارم نهایی پودمان و سهم حضور و غیاب را مشخص کنید."
      >
        <Button icon="plus" onClick={() => app.open("module")}>
          پودمان جدید
        </Button>
      </PageHeading>
      {app.modules.length ? (
        <div className="grid-2">
          {app.modules.map((module) => {
            const settings = moduleSettings(db, module);
            const items = db.assessments.filter(
              (a) => a.moduleId === module.id,
            );
            return (
              <section className="card module-card" key={module.id}>
                <div className="module-heading">
                  <span className="module-ordinal">{fmt(module.order)}</span>
                  <div className="row-grow">
                    <h3 className="card-title">{module.name}</h3>
                    <p className="card-subtitle">
                      {module.description ||
                        "محاسبهٔ خودکار نمره از آزمون‌ها، تمرین‌ها و حضور"}
                    </p>
                  </div>
                  <IconButton
                    icon="edit"
                    label="ویرایش پودمان و بارم"
                    onClick={() => app.open("module", module)}
                  />
                  <IconButton
                    icon="trash"
                    label="حذف پودمان"
                    danger
                    onClick={() => app.remove("module", module)}
                  />
                </div>
                <div className="weight-summary">
                  <strong>بارم نهایی پودمان</strong>
                  <Badge kind="brand">{fmt(settings.maxScore)}</Badge>
                </div>
                <div className="module-parts">
                  <div className="module-part">
                    <strong className="row-grow">حضور و غیاب</strong>
                    <span>{fmt(settings.attendanceScore)} نمره</span>
                  </div>
                  <div className="module-part">
                    <strong className="row-grow">آزمون‌ها و تمرین‌ها</strong>
                    <span>
                      {fmt(settings.maxScore - settings.attendanceScore)} نمره
                    </span>
                  </div>
                </div>
                <p className="card-subtitle">
                  {fmt(items.length)} آیتم ثبت شده؛ بارم هر آیتم هنگام تعریف آن
                  مشخص می‌شود.
                </p>
                <Button
                  icon="clipboard"
                  variant="secondary"
                  className="full-width"
                  onClick={() => {
                    app.setState({ moduleId: module.id, assessmentId: null });
                    app.go("assessments");
                  }}
                >
                  مدیریت آزمون‌ها و تمرین‌ها
                </Button>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty
          title="هنوز پودمانی تعریف نشده"
          action={
            <Button icon="plus" onClick={() => app.open("module")}>
              ایجاد پودمان
            </Button>
          }
        />
      )}
    </>
  );
}
