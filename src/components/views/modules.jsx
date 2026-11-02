import {
  IconButton,
  Button,
  PageHeading,
  Badge,
  Empty,
  WeightBar,
  componentColor,
} from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";
import { moduleWeight } from "../../lib/classroom/logic.mjs";
export default function Modules({ app }) {
  const db = app.state.db;
  return (
    <>
      <PageHeading
        title="ساختار پودمان‌ها"
        description="تعداد پودمان‌ها، بخش‌های نمره‌دهی و وزن هر بخش قابل ویرایش است."
      >
        <Button icon="plus" onClick={() => app.open("module")}>
          پودمان جدید
        </Button>
      </PageHeading>
      {app.modules.length ? (
        <div className="grid-2">
          {app.modules.map((module) => {
            const components = db.components.filter(
                (item) => item.moduleId === module.id,
              ),
              weight = moduleWeight(db, module.id);
            return (
              <section className="card module-card" key={module.id}>
                <div className="module-heading">
                  <span className="module-ordinal">{fmt(module.order)}</span>
                  <div className="row-grow">
                    <h3 className="card-title">{module.name}</h3>
                    <p className="card-subtitle">
                      {module.description || "ارزیابی بخش‌های عملی و نظری"}
                    </p>
                  </div>
                  <IconButton
                    icon="edit"
                    label="ویرایش پودمان"
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
                  <strong>توزیع بارم</strong>
                  <Badge
                    kind={Math.abs(weight - 20) < 0.001 ? "success" : "warning"}
                  >
                    مجموع {fmt(weight)} از ۲۰
                  </Badge>
                </div>
                <WeightBar components={components} />
                {Math.abs(weight - 20) > 0.001 && (
                  <p className="weight-warning">
                    برای محاسبهٔ نمرهٔ نهایی، مجموع بارم‌ها باید ۲۰ باشد.
                  </p>
                )}
                <div className="module-parts">
                  {components.map((component, index) => (
                    <div className="module-part" key={component.id}>
                      <span
                        className="part-dot"
                        style={{ background: componentColor(component, index) }}
                      />
                      <strong className="row-grow">{component.name}</strong>
                      <span className="part-weight">
                        {fmt(component.weight)} نمره
                      </span>
                      <IconButton
                        icon="edit"
                        label={"ویرایش " + component.name}
                        onClick={() =>
                          app.setState({ moduleId: module.id }, () =>
                            app.open("component", component),
                          )
                        }
                      />
                      <IconButton
                        icon="trash"
                        label={"حذف " + component.name}
                        danger
                        onClick={() => app.remove("component", component)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  icon="plus"
                  variant="secondary"
                  className="full-width"
                  onClick={() =>
                    app.setState({ moduleId: module.id }, () =>
                      app.open("component"),
                    )
                  }
                >
                  افزودن بخش نمره‌دهی
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
