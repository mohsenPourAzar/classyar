import Select from "../select.jsx";
import {
  IconButton,
  Button,
  PageHeading,
  CardHeading,
  Person,
  Badge,
  Empty,
} from "../ui.jsx";
import { fmt, cn } from "../../lib/format.mjs";
import { statuses } from "../navigation.mjs";
export default function Attendance({ app }) {
  const sessions = app.classSessions,
    active =
      sessions.find((item) => item.id === app.state.sessionId) || sessions[0];
  const records = active
    ? app.state.db.attendance.filter((item) => item.sessionId === active.id)
    : [];
  return (
    <>
      <PageHeading
        title="ثبت حضور و غیاب"
        description="برای هر جلسه، وضعیت دانش‌آموزان را ثبت یا ویرایش کنید."
      >
        <Button
          icon="plus"
          onClick={() => app.open("session")}
          disabled={!app.modules.length}
        >
          جلسه جدید
        </Button>
      </PageHeading>
      {!active ? (
        <Empty
          icon="calendar"
          title="هنوز جلسه‌ای ثبت نشده"
          description="جلسه‌ای ایجاد کنید و آن را به پودمان مربوط متصل کنید."
          action={
            <Button
              icon="plus"
              disabled={!app.modules.length}
              onClick={() => app.open("session")}
            >
              تعریف جلسه جدید
            </Button>
          }
        />
      ) : (
        <>
          <div className="attendance-session-picker">
            <Select
              value={active.id}
              aria-label="جلسهٔ حضور و غیاب"
              onChange={(event) =>
                app.setState({ sessionId: event.target.value })
              }
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} · {session.date}
                </option>
              ))}
            </Select>
          </div>
          <div className="sessions-strip" aria-label="جلسه‌ها">
            {sessions.map((session) => (
              <button
                type="button"
                key={session.id}
                className={cn(
                  "session-tab",
                  session.id === active.id && "active",
                )}
                aria-pressed={session.id === active.id}
                onClick={() => app.setState({ sessionId: session.id })}
              >
                <strong>{session.title}</strong>
                <small>{session.date}</small>
              </button>
            ))}
          </div>
          <section className="card">
            <CardHeading
              title={active.title}
              description={
                (app.modules.find((module) => module.id === active.moduleId)
                  ?.name || "پودمان") +
                " · تغییر وضعیت‌ها به‌صورت خودکار ذخیره می‌شود"
              }
            >
              <div className="toolbar-actions">
                <Button
                  icon="check"
                  variant="secondary"
                  onClick={() => app.markAllPresent(active.id)}
                >
                  همه حاضر
                </Button>
                <Button
                  icon="edit"
                  variant="ghost"
                  onClick={() => app.open("session", active)}
                >
                  ویرایش جلسه
                </Button>
                <IconButton
                  icon="trash"
                  label="حذف جلسه"
                  danger
                  onClick={() => app.remove("session", active)}
                />
              </div>
            </CardHeading>
            <div className="attendance-summary">
              {[
                ["present", "حاضر", "success"],
                ["absent", "غایب", "danger"],
                ["late", "تأخیر", "warning"],
                ["excused", "موجه", "brand"],
              ].map(([value, label, kind]) => (
                <Badge key={value} kind={kind}>
                  {label}:{" "}
                  {fmt(records.filter((item) => item.status === value).length)}
                </Badge>
              ))}
              {records.length < app.students.length && (
                <Badge>
                  ثبت‌نشده: {fmt(app.students.length - records.length)}
                </Badge>
              )}
            </div>
            <div className="table-wrap">
              <table className="data-table attendance-table">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>دانش‌آموز</th>
                    <th>وضعیت حضور</th>
                  </tr>
                </thead>
                <tbody>
                  {app.students.map((student, index) => {
                    const current = records.find(
                      (item) => item.studentId === student.id,
                    )?.status;
                    return (
                      <tr key={student.id}>
                        <td className="muted">{fmt(index + 1)}</td>
                        <td>
                          <Person student={student} />
                        </td>
                        <td>
                          <div className="status-options">
                            {statuses.map(([value, label]) => (
                              <button
                                type="button"
                                key={value}
                                className={cn(
                                  "status-option",
                                  value,
                                  current === value && "active",
                                )}
                                aria-label={label + ": " + student.name}
                                aria-pressed={current === value}
                                onClick={() =>
                                  app.setAttendance(
                                    active.id,
                                    student.id,
                                    value,
                                  )
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
