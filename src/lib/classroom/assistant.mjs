import {
  calculateModule,
  moduleSettings,
  round,
  normalizedDatabase,
  isScore,
} from "./logic.mjs";
import {
  prepareEntityChange,
  applyEntityChange,
  entityClass,
  entityTables,
  entityLabels,
} from "./entities.mjs";
import { validateState } from "../server/state.mjs";
import { resolveReference } from "./references.mjs";

export const assistantViews = [
  "dashboard",
  "classes",
  "students",
  "attendance",
  "modules",
  "assessments",
  "grades",
  "assistant",
];
export const attendanceLabels = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "غیبت موجه",
  unset: "ثبت نشده",
};
const normalize = (text) =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹٠-٩]/g, (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".includes(digit)
          ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
          : "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
      ),
    )
    .replace(/[\s\u200c]+/g, " ")
    .trim();

export function assistantCatalog(db, context) {
  const klass = db.classes.find((item) => item.id === context.classId);
  if (!klass && context.classId) throw Error("کلاس انتخاب‌شده وجود ندارد.");
  const modules = db.modules.filter((item) => item.classId === klass?.id);
  const moduleIds = new Set(modules.map((item) => item.id));
  return {
    class: klass
      ? {
          id: klass.id,
          name: klass.name,
          grade: Number(klass.grade),
          subject: klass.subject,
          year: klass.year,
        }
      : null,
    classes: db.classes.map(({ id, name, grade, subject, year }) => ({
      id,
      name,
      grade: Number(grade),
      subject,
      year,
    })),
    selected: {
      moduleId: context.moduleId || "all",
      sessionId: context.sessionId || "",
      assessmentId: context.assessmentId || "",
    },
    students: db.students
      .filter((item) => item.classId === klass?.id)
      .map(({ id, name, studentCode }) => ({ id, name, studentCode })),
    modules: modules.map((module) => ({
      id: module.id,
      name: module.name,
      order: module.order,
      ...moduleSettings(db, module),
    })),
    components: db.components
      .filter((item) => moduleIds.has(item.moduleId))
      .map(({ id, moduleId, name, kind, weight }) => ({
        id,
        moduleId,
        name,
        kind,
        weight,
      })),
    today: new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    sessions: db.sessions
      .filter((item) => item.classId === klass?.id)
      .map(({ id, title, date, moduleId }) => ({ id, title, date, moduleId })),
    assessments: db.assessments
      .filter((item) => moduleIds.has(item.moduleId))
      .map(({ id, title, moduleId, maxScore, category }) => ({
        id,
        title,
        moduleId,
        maxScore,
        category,
      })),
  };
}

// Treat model output as an untrusted proposal. Resolve references, calculate answers
// locally and validate the entire batch before allowing any change.
export function prepareAssistantPlan(db, context, proposal) {
  assistantCatalog(db, context);
  if (
    !proposal ||
    typeof proposal.transcript !== "string" ||
    proposal.transcript.length > 12000 ||
    !Array.isArray(proposal.actions) ||
    proposal.actions.length > 250
  )
    throw Error(
      "پاسخ دستیار معتبر نبود؛ درخواست را کوتاه‌تر و روشن‌تر تکرار کنید.",
    );
  if (
    proposal.reply !== undefined &&
    (typeof proposal.reply !== "string" || proposal.reply.length > 12000)
  )
    throw Error("پاسخ متنی دستیار معتبر نیست.");
  if (proposal.clarification) {
    if (
      typeof proposal.clarification !== "string" ||
      proposal.clarification.length > 1000
    )
      throw Error("پاسخ دستیار معتبر نبود.");
    return {
      transcript: proposal.transcript,
      message: proposal.clarification,
      changes: [],
      commands: [],
      answers: [],
      context,
    };
  }
  const students = db.students.filter(
    (item) => item.classId === context.classId,
  );
  const modules = db.modules.filter((item) => item.classId === context.classId);
  const moduleIds = new Set(modules.map((item) => item.id));
  const resolveStudent = (name) => {
    const term = normalize(name);
    if (!term) throw Error("نام یا کد دانش‌آموز مشخص نشده است.");
    let matches = students.filter(
      (student) =>
        normalize(student.name) === term ||
        (student.studentCode && normalize(student.studentCode) === term),
    );
    if (!matches.length)
      matches = students.filter((student) =>
        normalize(student.name)
          .split(" ")
          .some((part) => part === term),
      );
    if (matches.length !== 1)
      throw Error(
        matches.length
          ? `نام «${name}» مشترک است؛ نام کامل یا کد دانش‌آموزی را بگویید.`
          : `دانش‌آموز «${name}» در این کلاس پیدا نشد.`,
      );
    return matches[0];
  };
  const sessionFor = (action) => {
    return resolveReference(
      db.sessions.filter((item) => item.classId === context.classId),
      action.sessionId || context.sessionId,
      "جلسه",
    );
  };
  const assessmentFor = (action) => {
    const explicit = db.assessments.find(
      (item) => item.id === action.assessmentId && moduleIds.has(item.moduleId),
    );
    if (explicit) return explicit;
    const scope = action.moduleId || context.moduleId;
    const selected =
      scope && scope !== "all"
        ? resolveReference(modules, scope, "پودمان").id
        : null;
    return resolveReference(
      db.assessments.filter(
        (item) =>
          moduleIds.has(item.moduleId) &&
          (!selected || item.moduleId === selected),
      ),
      action.assessmentId || context.assessmentId,
      "آزمون یا تمرین",
    );
  };
  const scopeFor = (action) => {
    const scope = action.moduleId || context.moduleId || "all";
    return scope === "all"
      ? scope
      : resolveReference(modules, scope, "پودمان").id;
  };
  let unchanged = 0;
  const changes = [],
    commands = [],
    answers = [],
    touched = new Set();
  const addChange = (change) => {
    const key = `${change.type}:${change.studentId}:${change.sessionId || change.assessmentId}`;
    if (touched.has(key))
      throw Error(
        "برای یک دانش‌آموز مقدارهای تکراری گفته شده؛ درخواست را دوباره با یک مقدار نهایی بیان کنید.",
      );
    touched.add(key);
    if (change.before !== change.after) changes.push(change);
    else unchanged++;
  };
  for (const action of [...proposal.actions].sort(
    (a, b) =>
      Number(a?.type === "mark_unset_present") -
      Number(b?.type === "mark_unset_present"),
  )) {
    if (!action || typeof action !== "object")
      throw Error("عملیات نامعتبر است.");
    switch (action.type) {
      case "list_items": {
        const table = entityTables[action.entityType];
        if (!Object.hasOwn(entityTables, action.entityType))
          throw Error("نوع فهرست را مشخص کنید.");
        let items = db[table].filter(
          (item) =>
            action.entityType === "class" ||
            entityClass(db, action.entityType, item) === context.classId,
        );
        if (action.entityType === "student" && action.student)
          items = items.filter(
            (item) => item.id === resolveStudent(action.student).id,
          );
        const columns = {
          class: [
            ["name", "نام کلاس"],
            ["grade", "پایه"],
            ["subject", "درس"],
            ["year", "سال"],
          ],
          student: [
            ["name", "نام دانش‌آموز"],
            ["studentCode", "کد دانش‌آموزی"],
            ...(action.includeNotes === true ? [["note", "یادداشت"]] : []),
          ],
          module: [
            ["name", "پودمان"],
            ["order", "ترتیب"],
          ],
          component: [
            ["name", "بخش"],
            ["kind", "نوع"],
            ["weight", "سهم نمره"],
          ],
          session: [
            ["title", "جلسه"],
            ["date", "تاریخ"],
          ],
          assessment: [
            ["title", "ارزشیابی"],
            ["date", "تاریخ"],
            ["maxScore", "بارم"],
          ],
        }[action.entityType];
        answers.push({
          title: `فهرست ${entityLabels[action.entityType]}`,
          headers: columns.map(([, label]) => label),
          rows: items.map((item) =>
            columns.map(([key]) =>
              key === "kind"
                ? item[key] === "attendance"
                  ? "حضور و غیاب"
                  : "ارزشیابی"
                : (item[key] ?? ""),
            ),
          ),
          text: items.length ? "" : "آیتمی ثبت نشده است.",
        });
        break;
      }
      case "create_item":
      case "update_item":
      case "delete_item": {
        const change = prepareEntityChange(db, context, action),
          key = `entity:${change.entityType}:${change.itemId}`;
        if (change.type === "noop") {
          answers.push({
            title: change.name,
            headers: ["آیتم", "وضعیت"],
            rows: [[change.name, "از قبل با همین اطلاعات ثبت شده است"]],
            text: "دوباره ایجاد نشد.",
          });
          break;
        }
        if (touched.has(key))
          throw Error("ویرایش‌های تکراری یک آیتم را در یک درخواست ادغام کنید.");
        touched.add(key);
        changes.push(change);
        break;
      }
      case "switch_class":
        if (!db.classes.some((klass) => klass.id === action.classId))
          throw Error("کلاس موردنظر پیدا نشد.");
        commands.push({ type: "switch_class", classId: action.classId });
        break;
      case "set_appearance":
        if (!["light", "dark"].includes(action.theme))
          throw Error(
            "تم روشن یا تاریک را مشخص کنید. فونت پروژه پرستو و ثابت است.",
          );
        commands.push({ type: "set_appearance", theme: action.theme });
        break;
      case "clear_mark": {
        const student = resolveStudent(action.student),
          assessment = assessmentFor(action);
        const before =
          db.marks.find(
            (item) =>
              item.studentId === student.id &&
              item.assessmentId === assessment.id,
          )?.score ?? null;
        addChange({
          type: "clear_mark",
          studentId: student.id,
          assessmentId: assessment.id,
          before,
          after: null,
          name: student.name,
          target: assessment.title,
          beforeLabel: before ?? "ثبت نشده",
          afterLabel: "پاک کردن نمره",
        });
        break;
      }
      case "set_attendance": {
        const student = resolveStudent(action.student),
          session = sessionFor(action);
        if (
          !Object.hasOwn(attendanceLabels, action.status) ||
          action.status === "unset"
        )
          throw Error("وضعیت حضور نامعتبر است.");
        const before =
          db.attendance.find(
            (item) =>
              item.studentId === student.id && item.sessionId === session.id,
          )?.status || "unset";
        addChange({
          type: action.type,
          studentId: student.id,
          sessionId: session.id,
          before,
          after: action.status,
          name: student.name,
          target: `${session.title} · ${session.date || ""}`,
          beforeLabel: attendanceLabels[before],
          afterLabel: attendanceLabels[action.status],
        });
        break;
      }
      case "mark_unset_present": {
        const session = sessionFor(action);
        for (const student of students) {
          if (
            !touched.has(`set_attendance:${student.id}:${session.id}`) &&
            !db.attendance.some(
              (item) =>
                item.studentId === student.id && item.sessionId === session.id,
            )
          )
            addChange({
              type: "set_attendance",
              studentId: student.id,
              sessionId: session.id,
              before: "unset",
              after: "present",
              name: student.name,
              target: session.title,
              beforeLabel: "ثبت نشده",
              afterLabel: "حاضر",
            });
        }
        break;
      }
      case "set_mark": {
        const student = resolveStudent(action.student),
          assessment = assessmentFor(action);
        if (
          typeof action.score !== "number" ||
          !Number.isFinite(action.score) ||
          action.score < 0 ||
          action.score > assessment.maxScore
        )
          throw Error(
            `نمرهٔ ${student.name} باید بین صفر و ${assessment.maxScore} باشد.`,
          );
        const before =
          db.marks.find(
            (item) =>
              item.studentId === student.id &&
              item.assessmentId === assessment.id,
          )?.score ?? null;
        addChange({
          type: action.type,
          studentId: student.id,
          assessmentId: assessment.id,
          before,
          after: action.score,
          name: student.name,
          target: `${assessment.title} (از ${assessment.maxScore})`,
          beforeLabel: before ?? "ثبت نشده",
          afterLabel: action.score,
        });
        break;
      }
      case "query_absent": {
        const session = sessionFor(action);
        const records = students.map((student) => ({
          student,
          status:
            db.attendance.find(
              (item) =>
                item.studentId === student.id && item.sessionId === session.id,
            )?.status || "unset",
        }));
        const absent = records.filter((item) =>
          ["absent", "excused"].includes(item.status),
        );
        answers.push({
          title: `غایبین ${session.title} · ${session.date || ""}`,
          headers: ["نام دانش‌آموز", "وضعیت"],
          rows: absent.map((item) => [
            item.student.name,
            attendanceLabels[item.status],
          ]),
          text: `غیبت غیرموجه: ${records.filter((item) => item.status === "absent").length} نفر؛ موجه: ${records.filter((item) => item.status === "excused").length} نفر؛ وضعیت ثبت‌نشده: ${records.filter((item) => item.status === "unset").length} نفر.`,
        });
        break;
      }
      case "query_attendance": {
        const student = resolveStudent(action.student);
        const sessionId = action.sessionId || context.sessionId;
        const sessions =
          sessionId && sessionId !== "all"
            ? [sessionFor(action)]
            : db.sessions.filter((item) => item.classId === context.classId);
        answers.push({
          title: `حضور و غیاب ${student.name}`,
          headers: ["جلسه", "تاریخ", "وضعیت"],
          rows: sessions.map((session) => [
            session.title,
            session.date || "",
            attendanceLabels[
              db.attendance.find(
                (item) =>
                  item.studentId === student.id &&
                  item.sessionId === session.id,
              )?.status || "unset"
            ],
          ]),
          text: sessions.length ? "" : "جلسه‌ای ثبت نشده است.",
        });
        break;
      }
      case "query_grades": {
        const student = resolveStudent(action.student),
          scope = scopeFor(action);
        if (action.assessmentId) {
          const assessment = assessmentFor(action),
            mark = db.marks.find(
              (item) =>
                item.studentId === student.id &&
                item.assessmentId === assessment.id,
            );
          answers.push({
            title: `نمرهٔ ${student.name}`,
            headers: ["ارزشیابی", "نمره", "بارم"],
            rows: [
              [
                assessment.title,
                mark?.score ?? "ثبت نشده",
                assessment.maxScore,
              ],
            ],
            text: "",
          });
          break;
        }
        const selectedModules = modules.filter(
          (item) => scope === "all" || item.id === scope,
        );
        const results = selectedModules.map((module) => ({
          module,
          grade: calculateModule(db, student.id, module.id),
        }));
        const complete =
          results.length && results.every((item) => item.grade.complete);
        answers.push({
          title: `نمرات ${student.name}`,
          headers: [
            "پودمان",
            "نمره نهایی",
            "بارم پودمان",
            "نمره اضافی",
            "وضعیت",
          ],
          rows: results.map(({ module, grade }) => [
            module.name,
            grade.total ?? "ثبت نشده",
            grade.max,
            grade.bonus.points,
            grade.complete
              ? "نهایی"
              : `در حال تکمیل: ${grade.pending.join("، ") || "بارم پودمان"}`,
          ]),
          text: complete
            ? "نمره‌ها براساس بارم پودمان و سهم حضور محاسبه شده‌اند."
            : "نمرهٔ فعلی خودکار محاسبه می‌شود و تا تکمیل موارد باقی‌مانده موقت است؛ خانهٔ خالی به معنی نمرهٔ صفر نیست.",
        });
        const selectedIds = new Set(selectedModules.map((module) => module.id));
        const recordedAssessments = db.assessments.filter((item) =>
          selectedIds.has(item.moduleId),
        );
        if (recordedAssessments.length)
          answers.push({
            title: `ریز نمرات ${student.name}`,
            headers: ["ارزشیابی", "نمرهٔ ثبت‌شده", "بارم"],
            rows: recordedAssessments.map((assessment) => [
              assessment.title,
              db.marks.find(
                (mark) =>
                  mark.studentId === student.id &&
                  mark.assessmentId === assessment.id,
              )?.score ?? "ثبت نشده",
              assessment.maxScore,
            ]),
            text: "صفر، نمرهٔ ثبت‌شده است؛ موارد خالی و اجزای ناقص جداگانه محاسبه می‌شوند.",
          });
        break;
      }
      case "navigate":
        if (!assistantViews.includes(action.view))
          throw Error("بخش درخواست‌شده موجود نیست.");
        commands.push({ type: "navigate", view: action.view });
        break;
      case "export":
        if (
          !["final", "detailed"].includes(action.reportKind) ||
          !["xlsx", "csv", "print"].includes(action.format)
        )
          throw Error("نوع خروجی نامعتبر است.");
        commands.push({
          type: "export",
          reportKind: action.reportKind,
          format: action.format,
          moduleId: scopeFor(action),
        });
        break;
      default:
        throw Error(
          "این عملیات پشتیبانی نمی‌شود. ثبت نمره، حضور و غیاب، پرسش از سوابق و دریافت گزارش را درخواست کنید.",
        );
    }
  }
  if (changes.length) {
    const next = applyAssistantChanges(db, changes);
    if (!validateState(next))
      throw Error(
        "مجموع تغییرات با اطلاعات وابسته سازگار نیست؛ آن‌ها را مرحله‌به‌مرحله انجام دهید.",
      );
    const queries = proposal.actions.filter(
      (action) =>
        action.type.startsWith("query_") || action.type === "list_items",
    );
    if (queries.length)
      try {
        const refreshed = prepareAssistantPlan(next, context, {
          transcript: proposal.transcript,
          actions: queries,
        });
        answers.splice(0, answers.length, ...refreshed.answers);
      } catch {
        answers.splice(0, answers.length, {
          title: "نتیجهٔ درخواست",
          headers: [],
          rows: [],
          text: "آیتم مورد پرسش پس از تغییرات دیگر وجود ندارد؛ نتیجهٔ حذف را در سابقهٔ فرمان ببینید.",
        });
      }
  }
  return {
    transcript: proposal.transcript,
    context,
    changes,
    commands,
    answers,
    message: changes.length
      ? `${changes.length} تغییر برای بازبینی آماده است.`
      : answers.length
        ? "پاسخ بر اساس اطلاعات ثبت‌شده آماده شد."
        : commands.length
          ? "درخواست آمادهٔ اجراست."
          : unchanged
            ? "مقدار درخواست‌شده از قبل ثبت شده است."
            : proposal.reply ||
              "عملیات مشخص نشده است؛ درخواست را دقیق‌تر بیان کنید.",
  };
}

export function applyAssistantChanges(db, changes) {
  const next = structuredClone(normalizedDatabase(db));
  for (const change of changes) {
    if (["create_item", "update_item", "delete_item"].includes(change.type)) {
      applyEntityChange(next, change);
      continue;
    }
    const student = next.students.find((item) => item.id === change.studentId);
    if (!student) throw Error("دانش‌آموز دیگر در کلاس وجود ندارد.");
    if (change.type === "set_attendance") {
      const session = next.sessions.find(
        (item) => item.id === change.sessionId,
      );
      const before =
        next.attendance.find(
          (item) =>
            item.studentId === change.studentId &&
            item.sessionId === change.sessionId,
        )?.status || "unset";
      if (
        !session ||
        session.classId !== student.classId ||
        !["present", "absent", "late", "excused"].includes(change.after) ||
        before !== change.before
      )
        throw Error(
          "وضعیت حضور تغییر کرده یا معتبر نیست؛ درخواست را دوباره ارسال کنید.",
        );
      next.attendance = next.attendance.filter(
        (item) =>
          !(
            item.studentId === change.studentId &&
            item.sessionId === change.sessionId
          ),
      );
      next.attendance.push({
        studentId: change.studentId,
        sessionId: change.sessionId,
        status: change.after,
      });
    } else if (["set_mark", "clear_mark"].includes(change.type)) {
      const assessment = next.assessments.find(
        (item) => item.id === change.assessmentId,
      );
      const module = next.modules.find(
        (item) => item.id === assessment?.moduleId,
      );
      const before =
        next.marks.find(
          (item) =>
            item.studentId === change.studentId &&
            item.assessmentId === change.assessmentId,
        )?.score ?? null;
      if (
        !assessment ||
        module?.classId !== student.classId ||
        (change.type === "set_mark" &&
          (typeof change.after !== "number" ||
            !isScore(change.after, assessment.maxScore))) ||
        before !== change.before
      )
        throw Error(
          "نمره تغییر کرده یا معتبر نیست؛ درخواست را دوباره ارسال کنید.",
        );
      next.marks = next.marks.filter(
        (item) =>
          !(
            item.studentId === change.studentId &&
            item.assessmentId === change.assessmentId
          ),
      );
      if (change.type !== "clear_mark")
        next.marks.push({
          studentId: change.studentId,
          assessmentId: change.assessmentId,
          score: change.after,
        });
    } else throw Error("تغییر نامعتبر است.");
  }
  return next;
}
