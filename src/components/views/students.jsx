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
export default function Students({ app }) {
  const students = app.students.filter((student) =>
    (student.name + " " + (student.studentCode || "")).includes(
      app.state.search.trim(),
    ),
  );
  return (
    <>
      <PageHeading
        title="دانش‌آموزان"
        description={
          fmt(app.students.length) + " دانش‌آموز در " + app.selectedClass?.name
        }
      >
        <Button icon="plus" onClick={() => app.open("student")}>
          افزودن دانش‌آموز
        </Button>
        <Button icon="upload" variant="ghost" onClick={() => app.open("bulk")}>
          ورود گروهی
        </Button>
      </PageHeading>
      <section className="card">
        <CardHeading
          title="فهرست دانش‌آموزان"
          description="مشخصات، جست‌وجو و مدیریت اعضای کلاس"
        >
          <label className="search">
            <span className="sr-only">جست‌وجوی دانش‌آموز</span>
            <Icon name="search" size={15} />
            <input
              type="search"
              placeholder="جست‌وجوی نام یا کد…"
              value={app.state.search}
              onChange={(event) => app.setState({ search: event.target.value })}
            />
          </label>
        </CardHeading>
        {students.length ? (
          <div className="table-wrap">
            <table className="data-table students-table">
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>نام و نام خانوادگی</th>
                  <th>کد دانش‌آموزی</th>
                  <th>توضیحات</th>
                  <th className="center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td className="muted">{fmt(index + 1)}</td>
                    <td>
                      <Person student={student} />
                    </td>
                    <td className="muted">{student.studentCode || "—"}</td>
                    <td className="muted">{student.note || "—"}</td>
                    <td className="center">
                      <span className="actions-inline">
                        <IconButton
                          icon="edit"
                          label={"ویرایش " + student.name}
                          onClick={() => app.open("student", student)}
                        />
                        <IconButton
                          icon="trash"
                          label={"حذف " + student.name}
                          danger
                          onClick={() => app.remove("student", student)}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h3 className="empty-title">
              {app.state.search
                ? "نتیجه‌ای پیدا نشد"
                : "فهرست دانش‌آموزان خالی است"}
            </h3>
            <p>دانش‌آموز جدید اضافه کنید یا عبارت جست‌وجو را تغییر دهید.</p>
          </div>
        )}
      </section>
    </>
  );
}
