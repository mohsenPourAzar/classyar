import { Icon, IconButton, Button, PageHeading, Empty, Badge } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
export default function Classes({ app }) {
  return (
    <>
      <PageHeading
        title="مدیریت کلاس‌ها"
        description="مشخصات کلاس‌ها و فهرست دانش‌آموزان هر کلاس را مدیریت کنید."
      >
        <Button icon="plus" onClick={() => app.open("class")}>
          کلاس جدید
        </Button>
      </PageHeading>
      {app.state.db.classes.length ? (
        <div className="grid-3">
          {app.state.db.classes.map((item) => (
            <article
              className={`card class-card ${item.id === app.state.classId ? "is-current-class" : ""}`}
              key={item.id}
            >
              <div className="class-card-top">
                <span
                  className="class-icon"
                  style={{ background: item.color + "20", color: item.color }}
                >
                  <Icon name="home" size={23} />
                </span>
                <div className="class-card-badges">
                  {item.id === app.state.classId && (
                    <Badge kind="brand">کلاس جاری</Badge>
                  )}
                  <span className="grade-chip">
                    پایه {fmt(Number(item.grade))}
                  </span>
                </div>
              </div>
              <h3 className="class-card-title">{item.name}</h3>
              <p className="class-card-desc">
                {item.subject || "درس تعریف نشده"} <span>·</span> {item.year}
              </p>
              <div className="class-meta">
                <span>
                  <Icon name="users" size={15} />
                  {fmt(
                    app.state.db.students.filter(
                      (student) => student.classId === item.id,
                    ).length,
                  )}{" "}
                  دانش‌آموز
                </span>
                <span>
                  <Icon name="boxes" size={15} />
                  {fmt(
                    app.state.db.modules.filter(
                      (module) => module.classId === item.id,
                    ).length,
                  )}{" "}
                  پودمان
                </span>
              </div>
              <div className="class-actions">
                <Button
                  icon="users"
                  aria-label={`دانش‌آموزان ${item.name}`}
                  onClick={() => app.changeClass(item.id, "students")}
                >
                  مشاهدهٔ دانش‌آموزان
                </Button>
                <IconButton
                  icon="edit"
                  label="ویرایش کلاس"
                  onClick={() => app.open("class", item)}
                />
                <IconButton
                  icon="trash"
                  label="حذف کلاس"
                  danger
                  onClick={() => app.remove("class", item)}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="هنوز کلاسی ندارید"
          action={
            <Button icon="plus" onClick={() => app.open("class")}>
              ساخت اولین کلاس
            </Button>
          }
        />
      )}
    </>
  );
}
