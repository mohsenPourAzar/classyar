import Select from "../select.jsx";
import { Icon } from "../ui.jsx";
export default function ClassSwitcher({ app }) {
  return (
    <section className="class-context" aria-label="انتخاب کلاس">
      <div className="context-label">
        <Icon name="home" size={17} />
        <span>کلاس فعال</span>
      </div>
      <div className="context-controls">
        <Select
          className="class-select"
          value={app.state.classId || ""}
          onChange={(event) => app.changeClass(event.target.value)}
          aria-label="کلاس فعال"
        >
          {!app.state.db.classes.length && (
            <option value="">ابتدا کلاس بسازید</option>
          )}
          {app.state.db.classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <button
          type="button"
          className="button secondary icon-only"
          title="کلاس جدید"
          aria-label="تعریف کلاس جدید"
          onClick={() => app.open("class")}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
    </section>
  );
}
