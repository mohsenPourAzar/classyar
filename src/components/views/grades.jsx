import Select from "../select.jsx";
import { Button, PageHeading, Empty } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import { exportRows } from "../../lib/classroom/reports.mjs";
import { calculateModule } from "../../lib/classroom/logic.mjs";

export default function Grades({ app }) {
  if (!app.currentModule)
    return <Empty title="برای دریافت کارنامه، ابتدا یک پودمان بسازید." />;
  const kind = app.state.reportKind;
  const report = exportRows(
    app.state.db,
    app.state.classId,
    app.reportScope,
    kind,
  );
  const incompleteModules = app.modules
    .filter(
      (module) => app.reportScope === "all" || module.id === app.reportScope,
    )
    .map((module) => {
      const grades = app.students.map((student) =>
        calculateModule(app.state.db, student.id, module.id),
      );
      const incomplete = grades.filter((grade) => !grade.complete);
      return {
        module,
        count: incomplete.length,
        reasons: [
          ...new Set(
            incomplete.flatMap((grade) =>
              grade.configured
                ? grade.pending
                : ["بارم پودمان و سهم حضور را بررسی کنید"],
            ),
          ),
        ],
      };
    })
    .filter((item) => item.count > 0);
  return (
    <div className="grade-report-page">
      <PageHeading
        title="لیست نمرات و کارنامه"
        description="جدول رسمی و بدون رنگ برای دریافت فایل یا چاپ."
      >
        <Button icon="edit" onClick={() => app.go("assessments")}>
          ثبت و ویرایش نمره‌ها
        </Button>
        <Button
          variant="ghost"
          icon="download"
          onClick={() => app.exportGradeList("xlsx")}
        >
          دانلود Excel
        </Button>
        <Button
          icon="download"
          variant="ghost"
          onClick={() => app.exportGradeList("csv")}
        >
          خروجی CSV
        </Button>
        <Button
          icon="print"
          variant="ghost"
          onClick={() => app.printGradeList()}
        >
          چاپ / PDF
        </Button>
      </PageHeading>
      <div className="card filter-card no-print">
        <div className="filters">
          <label>
            نوع گزارش{" "}
            <Select
              className="class-select"
              aria-label="نوع گزارش"
              value={kind}
              onChange={(event) =>
                app.setState({ reportKind: event.target.value })
              }
            >
              <option value="final">نمرات نهایی</option>
              <option value="detailed">ریز نمرات</option>
            </Select>
          </label>
          <label>
            محدوده{" "}
            <Select
              className="class-select"
              aria-label="محدوده گزارش"
              value={app.reportScope}
              onChange={(event) =>
                app.setState(
                  event.target.value === "all"
                    ? { gradeScope: "all" }
                    : { gradeScope: "module", moduleId: event.target.value },
                )
              }
            >
              {app.modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
              <option value="all">تمام پودمان‌ها</option>
            </Select>
          </label>
        </div>
      </div>
      {incompleteModules.map(({ module, count, reasons }) => (
        <details className="note no-print" key={module.id}>
          <summary>
            {module.name} · نمرهٔ {fmt(count)} دانش‌آموز در حال تکمیل است.
          </summary>
          <p>{reasons.join("؛ ")}</p>
          <Button
            variant="ghost"
            icon="edit"
            onClick={() => {
              app.setState({ moduleId: module.id, assessmentId: null });
              app.go("assessments");
            }}
          >
            تکمیل نمره‌ها
          </Button>
        </details>
      ))}
      <div className={`formal-report table-wrap report-${kind}`}>
        <table className="formal-table">
          <thead>
            <tr>
              {report.headers.map((title, index) => (
                <th key={index} scope="col">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, index) => (
              <tr key={app.students[index].id}>
                {row.map((value, column) => (
                  <td
                    key={column}
                    title={
                      column === row.length - 1 &&
                      report.pendingRows.some((item) => item.row === index)
                        ? "در حال تکمیل؛ براساس اطلاعات ثبت‌شده"
                        : undefined
                    }
                  >
                    {typeof value === "number" ? fmt(value) : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note no-print report-note">
        خانهٔ خالی یعنی نمره‌ای ثبت نشده است؛ صفر یک نمرهٔ ثبت‌شده است. سهم حضور
        از جلسات همین پودمان محاسبه می‌شود و مجموع نمرهٔ آزمون‌ها و تمرین‌ها به
        باقی بارم پودمان تبدیل می‌شود. نمرهٔ اضافی، جمع امتیاز فعالیت‌های مستمر
        جلسات همان پودمان است و تا سقف بارم پودمان به نمره افزوده می‌شود. نمرهٔ
        نهایی با هر تغییر به‌روز می‌شود؛ تا تکمیل موارد بالا، نمره در حال تکمیل
        است. در گزارش تمام پودمان‌ها، میانگین نمره‌های موجود پس از تبدیل به
        مقیاس ۲۰ نمایش داده می‌شود.
      </div>
    </div>
  );
}
