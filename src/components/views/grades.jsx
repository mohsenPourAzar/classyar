import { Button, PageHeading, Empty } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import { exportRows } from "../../lib/classroom/reports.mjs";

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
  return (
    <div className="grade-report-page">
      <PageHeading
        title="لیست نمرات و کارنامه"
        description="جدول رسمی و بدون رنگ برای دریافت فایل یا چاپ."
      >
        <Button icon="download" onClick={() => app.exportGradeList("xlsx")}>
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
            <select
              className="class-select"
              aria-label="نوع گزارش"
              value={kind}
              onChange={(event) =>
                app.setState({ reportKind: event.target.value })
              }
            >
              <option value="final">نمرات نهایی</option>
              <option value="detailed">ریز نمرات و جمع</option>
            </select>
          </label>
          <label>
            محدوده{" "}
            <select
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
            </select>
          </label>
        </div>
      </div>
      <div className="formal-report table-wrap">
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
                  <td key={column}>
                    {typeof value === "number" ? fmt(value) : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note no-print report-note">
        خانهٔ خالی یعنی نمره تکمیل نشده است. جمع خام، مجموع نمره‌های ثبت‌شدهٔ
        آزمون‌ها و تمرین‌هاست؛ نمره نهایی با بارم بخش‌ها محاسبه می‌شود. در
        محدودهٔ تمام پودمان‌ها، نمره نهایی فقط پس از تکمیل همهٔ پودمان‌ها و از
        میانگین آن‌ها محاسبه می‌شود. فایل و چاپ فقط شامل جدول هستند.
      </div>
      <div className="no-print">
        <Button variant="ghost" onClick={() => app.go("assessments")}>
          ثبت و ویرایش نمره‌ها
        </Button>
      </div>
    </div>
  );
}
