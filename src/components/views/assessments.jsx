import {
  Icon,
  IconButton,
  Button,
  PageHeading,
  CardHeading,
  Person,
  Badge,
  Empty,
} from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
export default function Assessments({ app }) {
  const module = app.currentModule,
    db = app.state.db;
  if (!module)
    return (
      <Empty
        title="ابتدا یک پودمان تعریف کنید"
        action={
          <Button icon="plus" onClick={() => app.open("module")}>
            ایجاد پودمان
          </Button>
        }
      />
    );
  const components = db.components.filter(
      (item) => item.moduleId === module.id && item.kind === "assessment",
    ),
    items = db.assessments.filter((item) => item.moduleId === module.id),
    selected = items.find((item) => item.id === app.state.assessmentId);
  return (
    <>
      <PageHeading
        title="آزمون و تمرین"
        description="آیتم‌های ارزیابی را بسازید و نمره‌های هر دانش‌آموز را ثبت کنید."
      >
        <Button
          icon="plus"
          disabled={!components.length}
          onClick={() => app.open("assessment")}
        >
          آیتم ارزیابی جدید
        </Button>
      </PageHeading>
      <div className="card filter-card">
        <div>
          <h3 className="card-title">پودمان موردنظر</h3>
          <p className="card-subtitle">
            آزمون‌ها و تمرین‌های هر پودمان را جداگانه مدیریت کنید.
          </p>
        </div>
        <div className="filters">
          <select
            className="class-select"
            value={module.id}
            aria-label="پودمان ارزیابی"
            onChange={(event) =>
              app.setState({ moduleId: event.target.value, assessmentId: null })
            }
          >
            {app.modules.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Badge>{fmt(items.length)} آیتم</Badge>
        </div>
      </div>
      {!components.length && (
        <div className="note">
          برای ثبت ارزیابی، ابتدا در صفحهٔ پودمان‌ها یک بخش آزمون یا تمرین ایجاد
          کنید.
        </div>
      )}
      {items.length ? (
        <div className="grid-2 assessments-grid">
          {items.map((item) => {
            const count = db.marks.filter(
              (mark) => mark.assessmentId === item.id,
            ).length;
            return (
              <article className="card assessment-card" key={item.id}>
                <span className="assessment-symbol">
                  <Icon name="clipboard" size={22} />
                </span>
                <div className="row-grow">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-subtitle">
                    {
                      components.find(
                        (component) => component.id === item.componentId,
                      )?.name
                    }{" "}
                    · {item.date || "بدون تاریخ"}
                  </p>
                  <div className="assessment-meta">
                    <Badge kind="brand">بارم {fmt(item.maxScore)}</Badge>
                    <span className="mini-muted">
                      {fmt(count)} از {fmt(app.students.length)} نمره ثبت‌شده
                    </span>
                  </div>
                  <div className="assessment-actions">
                    <Button
                      icon="edit"
                      variant="secondary"
                      className="small"
                      onClick={() => app.setState({ assessmentId: item.id })}
                    >
                      ثبت نمره
                    </Button>
                    <IconButton
                      icon="edit"
                      label="ویرایش ارزیابی"
                      onClick={() => app.open("assessment", item)}
                    />
                    <IconButton
                      icon="trash"
                      label="حذف ارزیابی"
                      danger
                      onClick={() => app.remove("assessment", item)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          icon="clipboard"
          title="هنوز آزمون یا تمرینی ثبت نشده"
          description="آیتم جدیدی با بارم دلخواه برای این پودمان بسازید."
          action={
            components.length ? (
              <Button icon="plus" onClick={() => app.open("assessment")}>
                تعریف ارزیابی
              </Button>
            ) : null
          }
        />
      )}
      {selected && (
        <section className="card score-panel">
          <CardHeading
            title={"ثبت نمره · " + selected.title}
            description={
              "بارم " +
              fmt(selected.maxScore) +
              " · نمرهٔ خالی با صفر تفاوت دارد."
            }
          >
            <IconButton
              icon="close"
              label="بستن ثبت نمره"
              onClick={() => app.setState({ assessmentId: null })}
            />
          </CardHeading>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>دانش‌آموز</th>
                  <th>نمره از {fmt(selected.maxScore)}</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {app.students.map((student, index) => {
                  const mark = db.marks.find(
                    (item) =>
                      item.assessmentId === selected.id &&
                      item.studentId === student.id,
                  );
                  return (
                    <tr key={student.id}>
                      <td className="muted">{fmt(index + 1)}</td>
                      <td>
                        <Person student={student} />
                      </td>
                      <td>
                        <input
                          className="grades-input"
                          type="number"
                          min="0"
                          max={selected.maxScore}
                          step="0.25"
                          value={mark?.score ?? ""}
                          placeholder="—"
                          aria-label={"نمره " + student.name}
                          onChange={(event) =>
                            app.setMark(
                              selected.id,
                              student.id,
                              event.target.value,
                              selected.maxScore,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Badge kind={mark ? "success" : ""}>
                          {mark ? "ثبت‌شده" : "ثبت‌نشده"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
