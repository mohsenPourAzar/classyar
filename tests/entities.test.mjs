import test from "node:test";
import assert from "node:assert/strict";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import {
  prepareAssistantPlan,
  applyAssistantChanges,
  assistantCatalog,
} from "../src/lib/classroom/assistant.mjs";
import { validateState } from "../src/lib/server/state.mjs";
import { deleteEntity } from "../src/lib/classroom/entities.mjs";
const context = { classId: "class-10", moduleId: "module-10-1" };
const plan = (db, actions, ctx = context) =>
  prepareAssistantPlan(db, ctx, { transcript: "درخواست آزمایشی", actions });

test("deleting a student, session, module or class removes related activity bonuses only", () => {
  const original = structuredClone(seed),
    studentId = original.students[0].id;
  original.sessions.push({
    id: "bonus-session",
    classId: "class-10",
    moduleId: context.moduleId,
    title: "جلسه",
    date: "۱۴۰۵/۰۸/۱۶",
    bonusMarks: [
      { studentId, score: 1 },
      { studentId: original.students[1].id, score: 2 },
    ],
  });
  for (const [type, id] of [
    ["student", studentId],
    ["session", "bonus-session"],
    ["module", context.moduleId],
    ["class", "class-10"],
  ]) {
    const db = structuredClone(original);
    deleteEntity(db, type, id);
    assert.ok(validateState(db));
    assert.ok(
      !db.sessions.some((s) =>
        s.bonusMarks?.some((mark) => mark.studentId === studentId),
      ),
    );
    if (type === "student")
      assert.equal(
        db.sessions.find((s) => s.id === "bonus-session").bonusMarks[0].score,
        2,
      );
  }
  const updated = applyAssistantChanges(
    original,
    plan(original, [
      {
        type: "update_item",
        entityType: "session",
        itemId: "bonus-session",
        fields: { title: "جلسه ویرایش شده" },
      },
    ]).changes,
  );
  assert.deepEqual(
    updated.sessions.find((s) => s.id === "bonus-session").bonusMarks,
    original.sessions.at(-1).bonusMarks,
  );
});
test("assistant creates all six entity types through validated previews, with manual UI defaults", () => {
  const db = structuredClone(seed),
    original = structuredClone(db);
  const definitions = [
    {
      entityType: "class",
      fields: { name: "کلاس آزمایشی جدید", grade: 11, year: "۱۴۰۵–۱۴۰۶" },
    },
    {
      entityType: "student",
      fields: { name: "دانش‌آموز آزمایشی جدید", studentCode: "123" },
    },
    { entityType: "module", fields: { name: "پودمان آزمایشی جدید" } },
    {
      entityType: "component",
      fields: { name: "پروژه آزمایشی", kind: "assessment", weight: 2 },
    },
    {
      entityType: "session",
      fields: { title: "جلسه آزمایشی جدید", date: "۱۴۰۵/۰۸/۱۲" },
    },
    {
      entityType: "assessment",
      fields: {
        title: "آزمون آزمایشی جدید",
        componentId: "component-10-exam",
        maxScore: 20,
      },
    },
  ];
  for (const definition of definitions) {
    const preview = plan(db, [{ type: "create_item", ...definition }]);
    assert.equal(preview.changes.length, 1);
    assert.deepEqual(db, original);
    const result = applyAssistantChanges(db, preview.changes);
    assert.ok(validateState(result));
    if (definition.entityType === "class") {
      assert.equal(result.classes.length, db.classes.length + 1);
      assert.equal(result.modules.length, db.modules.length + 1);
      assert.equal(result.components.length, db.components.length);
    }
    if (definition.entityType === "module")
      assert.equal(result.components.length, db.components.length);
    assert.throws(
      () => applyAssistantChanges(result, preview.changes),
      /تغییر/,
    );
  }
});
test("creation asks for unknown details and rejects invalid fields, ranges, types and parent references", () => {
  const db = structuredClone(seed);
  assert.throws(
    () =>
      plan(db, [
        {
          type: "create_item",
          entityType: "session",
          fields: { title: "جلسه جدید" },
        },
      ]),
    /تاریخ/,
  );
  assert.throws(
    () =>
      plan(db, [
        {
          type: "create_item",
          entityType: "assessment",
          fields: { title: "آزمون", componentId: "component-10-exam" },
        },
      ]),
    /بارم/,
  );
  assert.throws(
    () =>
      plan(db, [
        {
          type: "create_item",
          entityType: "class",
          fields: { name: "کلاس جدید" },
        },
      ]),
    /پایه.*سال تحصیلی/,
  );
  for (const action of [
    {
      entityType: "component",
      fields: { name: "بخش", kind: "assessment", weight: 21 },
    },
    {
      entityType: "component",
      fields: { name: "بخش", kind: "assessment", weight: "2" },
    },
    { entityType: "student", fields: { name: "دانش‌آموز", id: "injected" } },
    {
      entityType: "session",
      fields: { title: "جلسه", date: "۱۴۰۵/۰۸/۱۲", moduleId: "module-11-1" },
    },
    {
      entityType: "assessment",
      fields: {
        title: "آزمون",
        componentId: "component-10-attendance",
        maxScore: 20,
      },
    },
  ])
    assert.throws(() => plan(db, [{ type: "create_item", ...action }]));
  const empty = {
    version: 1,
    classes: [],
    students: [],
    modules: [],
    components: [],
    sessions: [],
    attendance: [],
    assessments: [],
    marks: [],
  };
  const first = plan(
    empty,
    [
      {
        type: "create_item",
        entityType: "class",
        fields: { name: "اولین کلاس", grade: 10, year: "۱۴۰۵" },
      },
    ],
    { classId: "" },
  );
  assert.ok(validateState(applyAssistantChanges(empty, first.changes)));
});
test("updates preserve unrelated fields, protect existing marks, and cascading deletions remove only dependencies", () => {
  let db = structuredClone(seed);
  db.assessments.push({
    id: "exam",
    moduleId: context.moduleId,
    componentId: "component-10-exam",
    title: "آزمون",
    maxScore: 20,
  });
  db.sessions.push({
    id: "session",
    moduleId: context.moduleId,
    classId: context.classId,
    title: "جلسه",
    date: "۱۴۰۵/۰۸/۱۲",
  });
  db.marks.push({
    studentId: db.students[0].id,
    assessmentId: "exam",
    score: 18,
  });
  db.attendance.push({
    studentId: db.students[0].id,
    sessionId: "session",
    status: "present",
  });
  const old = db.students[0],
    preview = plan(db, [
      {
        type: "update_item",
        entityType: "student",
        itemId: old.id,
        fields: { studentCode: "new-code" },
      },
    ]);
  db = applyAssistantChanges(db, preview.changes);
  assert.equal(db.students[0].name, old.name);
  assert.equal(db.students[0].studentCode, "new-code");
  assert.throws(
    () =>
      plan(db, [
        {
          type: "update_item",
          entityType: "assessment",
          itemId: "exam",
          fields: { maxScore: 10 },
        },
      ]),
    /نمره/,
  );
  const deletePreview = plan(db, [
    { type: "delete_item", entityType: "module", itemId: context.moduleId },
  ]);
  assert.match(deletePreview.changes[0].afterLabel, /سابقهٔ وابسته/);
  const next = applyAssistantChanges(db, deletePreview.changes);
  assert.ok(validateState(next));
  assert.equal(next.marks.length, 0);
  assert.equal(next.attendance.length, 0);
  assert.equal(next.students.length, db.students.length);
  assert.equal(next.classes.length, db.classes.length);
  const cleared = applyAssistantChanges(
    db,
    plan(db, [
      {
        type: "clear_mark",
        student: db.students[0].name,
        assessmentId: "exam",
      },
    ]).changes,
  );
  assert.equal(cleared.marks.length, 0);
});
test("platform commands validate class and theme; catalogs refresh after creation", () => {
  const db = structuredClone(seed);
  const result = plan(db, [
    { type: "switch_class", classId: "class-11" },
    { type: "set_appearance", theme: "dark" },
  ]);
  assert.equal(result.commands.length, 2);
  assert.equal(result.changes.length, 0);
  assert.throws(() => plan(db, [{ type: "set_appearance", theme: "unknown" }]));
  assert.throws(() => plan(db, [{ type: "switch_class", classId: "missing" }]));
  const next = applyAssistantChanges(
    db,
    plan(db, [
      {
        type: "create_item",
        entityType: "module",
        fields: { name: "پودمان تازه" },
      },
    ]).changes,
  );
  assert.ok(
    assistantCatalog(next, context).modules.some(
      (module) => module.name === "پودمان تازه",
    ),
  );
});

test("module budgets and direct assessments persist through assistant actions without grading components", () => {
  let db = structuredClone(seed);
  const created = plan(db, [
    {
      type: "create_item",
      entityType: "module",
      fields: {
        name: "پودمان ساده",
        maxScore: 40,
        attendanceScore: 4,
      },
    },
  ]);
  db = applyAssistantChanges(db, created.changes);
  const moduleId = created.changes[0].itemId;
  assert.ok(validateState(db));
  assert.equal(db.components.filter((c) => c.moduleId === moduleId).length, 0);
  const assessment = plan(db, [
    {
      type: "create_item",
      entityType: "assessment",
      moduleId,
      fields: { title: "عملی ۱", maxScore: 10, category: "practical" },
    },
  ]);
  db = applyAssistantChanges(db, assessment.changes);
  assert.ok(validateState(db));
  const item = db.assessments.find(
    (a) => a.id === assessment.changes[0].itemId,
  );
  assert.equal(item.componentId, undefined);
  assert.equal(item.moduleId, moduleId);
  assert.equal(item.category, "practical");
  assert.deepEqual(
    assistantCatalog(db, context).modules.find((m) => m.id === moduleId),
    {
      id: moduleId,
      name: "پودمان ساده",
      order: 2,
      maxScore: 40,
      attendanceScore: 4,
    },
  );
  assert.throws(
    () =>
      plan(db, [
        {
          type: "update_item",
          entityType: "module",
          itemId: moduleId,
          fields: { attendanceScore: 41 },
        },
      ]),
    /سهم حضور/,
  );
  assert.throws(
    () =>
      plan(db, [
        {
          type: "update_item",
          entityType: "module",
          itemId: moduleId,
          fields: { maxScore: 0 },
        },
      ]),
    /بارم/,
  );
  assert.throws(
    () =>
      plan(db, [
        {
          type: "create_item",
          entityType: "assessment",
          moduleId,
          fields: { title: "آزمون نامعتبر", maxScore: 10, category: "invalid" },
        },
      ]),
    /نوع آیتم/,
  );
});
