import { makeId } from "../format.mjs";
import { moduleSettings } from "./logic.mjs";
import { validateState } from "../server/state.mjs";
import { resolveReference, normalizeReference } from "./references.mjs";

export const entityTables = {
  class: "classes",
  student: "students",
  module: "modules",
  component: "components",
  session: "sessions",
  assessment: "assessments",
};
export const entityLabels = {
  class: "کلاس",
  student: "دانش‌آموز",
  module: "پودمان",
  component: "بخش نمره‌دهی",
  session: "جلسه",
  assessment: "ارزشیابی",
};
const fieldsByType = {
  class: ["name", "grade", "subject", "year", "color"],
  student: ["name", "studentCode", "note"],
  module: ["name", "description", "order", "maxScore", "attendanceScore"],
  component: ["name", "kind", "weight"],
  session: ["title", "date", "moduleId"],
  assessment: ["title", "date", "componentId", "maxScore", "category"],
};
const fieldLabels = {
  name: "نام",
  grade: "پایه",
  subject: "درس",
  year: "سال تحصیلی",
  color: "رنگ",
  studentCode: "کد دانش‌آموزی",
  note: "یادداشت",
  description: "توضیحات",
  order: "ترتیب",
  kind: "نوع محاسبه",
  weight: "سهم نمره",
  title: "عنوان",
  date: "تاریخ",
  moduleId: "پودمان",
  componentId: "بخش نمره‌دهی",
  maxScore: "بارم",
  attendanceScore: "سهم حضور و غیاب",
  category: "نوع آیتم",
};
const requiredFields = {
  class: ["name", "grade", "year"],
  student: ["name"],
  module: ["name"],
  component: ["name", "kind", "weight"],
  session: ["title", "date", "moduleId"],
  assessment: ["title", "maxScore"],
};
const text = (value) => typeof value === "string" && value.trim().length > 0;
export function entityClass(db, type, item) {
  if (type === "class") return item.id;
  if (["student", "module", "session"].includes(type)) return item.classId;
  return db.modules.find((module) => module.id === item.moduleId)?.classId;
}
export function deleteEntity(db, type, id) {
  const table = entityTables[type];
  if (!Object.hasOwn(entityTables, type)) throw Error("نوع آیتم معتبر نیست.");
  const studentIds = new Set(),
    moduleIds = new Set(),
    componentIds = new Set(),
    sessionIds = new Set(),
    assessmentIds = new Set();
  if (type === "class") {
    db.classes = db.classes.filter((item) => item.id !== id);
    db.students
      .filter((item) => item.classId === id)
      .forEach((item) => studentIds.add(item.id));
    db.modules
      .filter((item) => item.classId === id)
      .forEach((item) => moduleIds.add(item.id));
    db.sessions
      .filter((item) => item.classId === id)
      .forEach((item) => sessionIds.add(item.id));
  }
  if (type === "student") studentIds.add(id);
  if (type === "module") moduleIds.add(id);
  if (type === "component") componentIds.add(id);
  if (type === "session") sessionIds.add(id);
  if (type === "assessment") assessmentIds.add(id);
  db.sessions
    .filter((item) => moduleIds.has(item.moduleId))
    .forEach((item) => sessionIds.add(item.id));
  db.components
    .filter((item) => moduleIds.has(item.moduleId))
    .forEach((item) => componentIds.add(item.id));
  db.assessments
    .filter(
      (item) =>
        moduleIds.has(item.moduleId) || componentIds.has(item.componentId),
    )
    .forEach((item) => assessmentIds.add(item.id));
  for (const [name, ids] of [
    ["students", studentIds],
    ["modules", moduleIds],
    ["components", componentIds],
    ["sessions", sessionIds],
    ["assessments", assessmentIds],
  ])
    db[name] = db[name].filter((item) => !ids.has(item.id));
  db.attendance = db.attendance.filter(
    (item) =>
      !studentIds.has(item.studentId) && !sessionIds.has(item.sessionId),
  );
  for (const session of db.sessions) {
    if (session.bonusMarks)
      session.bonusMarks = session.bonusMarks.filter(
        (mark) => !studentIds.has(mark.studentId),
      );
  }
  db.marks = db.marks.filter(
    (item) =>
      !studentIds.has(item.studentId) && !assessmentIds.has(item.assessmentId),
  );
}
function describe(db, type, item, includeNote = false) {
  return fieldsByType[type]
    .filter(
      (key) =>
        item[key] !== "" &&
        item[key] !== undefined &&
        (key !== "note" || includeNote),
    )
    .map((key) => {
      let value = item[key];
      if (key === "moduleId")
        value = db.modules.find((module) => module.id === value)?.name || value;
      if (key === "componentId")
        value =
          db.components.find((component) => component.id === value)?.name ||
          value;
      if (key === "kind")
        value = value === "attendance" ? "حضور و غیاب" : "نمره ارزشیابی";
      return `${fieldLabels[key]}: ${value}`;
    })
    .join("؛ ");
}
export function prepareEntityChange(db, context, action) {
  const type = action.entityType,
    table = entityTables[type];
  if (!Object.hasOwn(entityTables, type))
    throw Error(
      "نوع آیتم را مشخص کنید: کلاس، دانش‌آموز، پودمان، بخش نمره‌دهی، جلسه یا ارزشیابی.",
    );
  const mode = action.type;
  const existing =
    mode === "create_item"
      ? null
      : resolveReference(
          db[table].filter(
            (item) =>
              type === "class" ||
              entityClass(db, type, item) === context.classId,
          ),
          action.itemId,
          entityLabels[type],
        );
  if (mode !== "create_item" && !existing)
    throw Error(
      `${entityLabels[type]} موردنظر پیدا نشد؛ نام دقیق آن را مشخص کنید.`,
    );
  if (
    existing &&
    type !== "class" &&
    entityClass(db, type, existing) !== context.classId
  )
    throw Error("ابتدا کلاس مربوط به این آیتم را انتخاب کنید.");
  if (mode === "delete_item") {
    const affected = structuredClone(db);
    deleteEntity(affected, type, existing.id);
    const count = Object.keys(entityTables).reduce(
      (sum, key) =>
        sum + db[entityTables[key]].length - affected[entityTables[key]].length,
      0,
    );
    const records =
      db.attendance.length +
      db.marks.length -
      affected.attendance.length -
      affected.marks.length +
      db.sessions.reduce(
        (sum, session) => sum + (session.bonusMarks?.length || 0),
        0,
      ) -
      affected.sessions.reduce(
        (sum, session) => sum + (session.bonusMarks?.length || 0),
        0,
      );
    return {
      type: mode,
      entityType: type,
      itemId: existing.id,
      before: existing,
      after: null,
      name: existing.name || existing.title,
      target: `حذف ${entityLabels[type]}`,
      beforeLabel: describe(db, type, existing),
      afterLabel: `حذف ${count} آیتم و ${records} سابقهٔ وابسته`,
    };
  }
  if (
    !action.fields ||
    typeof action.fields !== "object" ||
    Array.isArray(action.fields) ||
    Object.keys(action.fields).some((key) => !fieldsByType[type].includes(key))
  )
    throw Error(`اطلاعات ${entityLabels[type]} معتبر نیست.`);
  const fields = {};
  for (const [key, value] of Object.entries(action.fields)) {
    if (
      ["weight", "order", "maxScore", "grade", "attendanceScore"].includes(key)
    ) {
      if (typeof value !== "number" || !Number.isFinite(value))
        throw Error(`${fieldLabels[key]} باید عدد معتبر باشد.`);
      fields[key] = value;
    } else {
      if (
        typeof value !== "string" ||
        value.length > (key === "note" || key === "description" ? 3000 : 200)
      )
        throw Error(`${fieldLabels[key]} معتبر نیست.`);
      fields[key] = value.trim();
    }
  }
  let item;
  if (fields.moduleId)
    fields.moduleId = resolveReference(
      db.modules.filter((module) => module.classId === context.classId),
      fields.moduleId,
      "پودمان",
    ).id;
  if (fields.componentId)
    fields.componentId = resolveReference(
      db.components.filter((component) =>
        db.modules.some(
          (module) =>
            module.id === component.moduleId &&
            module.classId === context.classId,
        ),
      ),
      fields.componentId,
      "بخش نمره‌دهی",
    ).id;
  if (mode === "create_item") {
    const id = makeId(),
      classId = context.classId;
    if (type !== "class" && !db.classes.some((klass) => klass.id === classId))
      throw Error("ابتدا کلاس را انتخاب یا تعریف کنید.");
    let moduleId =
      action.moduleId ||
      (type === "session" ? fields.moduleId : null) ||
      (type === "assessment"
        ? db.components.find((component) => component.id === fields.componentId)
            ?.moduleId
        : null) ||
      context.moduleId;
    if (
      ["component", "session", "assessment"].includes(type) &&
      moduleId &&
      moduleId !== "all"
    )
      moduleId = resolveReference(
        db.modules.filter((module) => module.classId === classId),
        moduleId,
        "پودمان",
      ).id;
    if (
      ["component", "session", "assessment"].includes(type) &&
      !db.modules.some(
        (module) => module.id === moduleId && module.classId === classId,
      )
    )
      throw Error("برای این آیتم، پودمان مشخص نشده است؛ کدام پودمان؟");
    const defaults = {
      class: { subject: "", color: "#5666e9" },
      student: { classId, studentCode: "", note: "" },
      module: {
        classId,
        maxScore: 20,
        attendanceScore: 0,
        description: "",
        order:
          Math.max(
            0,
            ...db.modules
              .filter((module) => module.classId === classId)
              .map((module) => Number(module.order) || 0),
          ) + 1,
      },
      component: { moduleId, tag: "custom" },
      session: {
        classId,
        moduleId,
        order:
          Math.max(
            0,
            ...db.sessions
              .filter((session) => session.classId === classId)
              .map((session) => Number(session.order) || 0),
          ) + 1,
      },
      assessment: { moduleId, date: "", category: "other" },
    };
    item = { id, ...defaults[type], ...fields };
  } else item = { ...existing, ...fields };
  if (type === "class" && item.grade !== undefined)
    item.grade = Number(item.grade);
  const missing = requiredFields[type].filter((key) =>
    ["weight", "grade", "maxScore"].includes(key)
      ? item[key] === undefined || item[key] === null
      : !text(item[key]),
  );
  if (missing.length)
    throw Error(
      `برای تعریف ${entityLabels[type]} این اطلاعات را بپرسید: ${missing.map((key) => fieldLabels[key]).join("، ")}.`,
    );
  if (
    type === "class" &&
    (![10, 11, 12, 13].includes(item.grade) ||
      !/^#[0-9a-fA-F]{6}$/.test(item.color))
  )
    throw Error("پایه باید ۱۰، ۱۱، ۱۲ یا سایر (۱۳) و رنگ باید معتبر باشد.");
  if (
    type === "module" &&
    (!Number.isSafeInteger(item.order) || item.order < 1)
  )
    throw Error("ترتیب پودمان باید عدد صحیح مثبت باشد.");
  if (type === "module") {
    const settings = moduleSettings(db, item);
    if (
      !(settings.maxScore > 0) ||
      settings.attendanceScore < 0 ||
      settings.attendanceScore > settings.maxScore
    )
      throw Error(
        "بارم پودمان باید مثبت و سهم حضور بین صفر و بارم پودمان باشد.",
      );
    item.maxScore = settings.maxScore;
    item.attendanceScore = settings.attendanceScore;
  }
  if (
    type === "component" &&
    (!["assessment", "attendance"].includes(item.kind) ||
      item.weight < 0 ||
      item.weight > 20)
  )
    throw Error("نوع بخش و سهم نمره بین صفر تا ۲۰ را مشخص کنید.");
  if (
    type === "session" &&
    !db.modules.some(
      (module) =>
        module.id === item.moduleId && module.classId === item.classId,
    )
  )
    throw Error("پودمان جلسه باید در همین کلاس باشد.");
  if (type === "assessment") {
    const component = db.components.find(
      (component) => component.id === item.componentId,
    );
    if (
      item.componentId !== undefined &&
      (!component ||
        component.kind !== "assessment" ||
        component.moduleId !== item.moduleId)
    )
      throw Error("بخش ارزشیابی باید از نوع نمره و در پودمان همین آزمون باشد.");
    if (!(item.maxScore > 0))
      throw Error("بارم آزمون باید بزرگ‌تر از صفر باشد.");
    if (
      item.category !== undefined &&
      !["exercise", "practical", "written", "other"].includes(item.category)
    )
      throw Error("نوع آیتم باید تمرین، آزمون عملی، آزمون کتبی یا سایر باشد.");
    if (
      db.marks.some(
        (mark) => mark.assessmentId === item.id && mark.score > item.maxScore,
      )
    )
      throw Error(
        "بارم جدید از بعضی نمره‌های ثبت‌شده کمتر است؛ ابتدا نمره‌ها را بررسی کنید.",
      );
  }
  if (mode === "create_item") {
    const duplicate = db[table].find(
      (record) =>
        normalizeReference(record.name || record.title) ===
          normalizeReference(item.name || item.title) &&
        (type === "class" ||
          entityClass(db, type, record) === context.classId) &&
        (!item.moduleId || record.moduleId === item.moduleId) &&
        (type !== "session" || record.date === item.date) &&
        (type !== "class" ||
          normalizeReference(record.year) === normalizeReference(item.year)) &&
        (type !== "student" ||
          !record.studentCode ||
          !item.studentCode ||
          record.studentCode === item.studentCode),
    );
    if (duplicate) {
      if (
        Object.entries(fields).every(
          ([key, value]) =>
            normalizeReference(duplicate[key] ?? "") ===
            normalizeReference(value),
        )
      )
        return {
          type: "noop",
          entityType: type,
          itemId: duplicate.id,
          name: duplicate.name || duplicate.title,
        };
      throw Error(
        `این ${entityLabels[type]} از قبل وجود دارد؛ مشخص کنید کدام مشخصات آن باید ویرایش شود.`,
      );
    }
  }
  const related = { modules: [], components: [] };
  if (mode === "create_item" && type === "class") {
    const module = {
      id: makeId(),
      classId: item.id,
      name: "پودمان اول",
      description: "",
      order: 1,
      maxScore: 20,
      attendanceScore: 0,
    };
    related.modules.push(module);
  }
  const change = {
    type: mode,
    entityType: type,
    itemId: item.id,
    before: existing,
    after: item,
    related,
    name: item.name || item.title,
    target: `${mode === "create_item" ? "تعریف" : "ویرایش"} ${entityLabels[type]}`,
    beforeLabel: existing
      ? describe(db, type, existing, Object.hasOwn(fields, "note"))
      : "وجود ندارد",
    afterLabel: describe(db, type, item, Object.hasOwn(fields, "note")),
  };
  const candidate = structuredClone(db);
  applyEntityChange(candidate, change);
  if (!validateState(candidate))
    throw Error(
      "این تغییر با داده‌های وابسته سازگار نیست؛ اطلاعات کامل‌تر لازم است.",
    );
  return change;
}
export function applyEntityChange(db, change) {
  const table = entityTables[change.entityType];
  if (!Object.hasOwn(entityTables, change.entityType))
    throw Error("نوع آیتم نامعتبر است.");
  const existing = db[table].find((item) => item.id === change.itemId);
  if (JSON.stringify(existing || null) !== JSON.stringify(change.before))
    throw Error(
      "این آیتم پس از پیش‌نمایش تغییر کرده است؛ دوباره درخواست بدهید.",
    );
  if (change.type === "delete_item") {
    deleteEntity(db, change.entityType, change.itemId);
    return;
  }
  if (change.type === "create_item") {
    db[table].push(structuredClone(change.after));
    for (const key of ["modules", "components"])
      db[key].push(...structuredClone(change.related?.[key] || []));
  } else if (change.type === "update_item")
    db[table] = db[table].map((item) =>
      item.id === change.itemId ? structuredClone(change.after) : item,
    );
  else throw Error("عملیات آیتم نامعتبر است.");
}
