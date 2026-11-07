import test from "node:test";
import assert from "node:assert/strict";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import { normalizeState, validateState } from "../src/lib/server/state.mjs";
const fresh = () => structuredClone(seed);
test("public demo is valid and contains only anonymous student names", () => {
  const state = fresh();
  assert.equal(validateState(state), true);
  assert.ok(state.students.length > 0);
  for (const student of state.students) {
    assert.match(student.name, /^دانش‌آموز نمونه /);
    assert.equal(student.note, "");
    assert.equal(student.studentCode, "");
  }
});

test("module settings and direct assessment references validate and survive normalization", () => {
  const state = fresh();
  Object.assign(state.modules[0], { maxScore: 40, attendanceScore: 4 });
  state.assessments.push({
    id: "direct",
    moduleId: state.modules[0].id,
    title: "عملی ۱",
    category: "practical",
    maxScore: 20,
  });
  assert.ok(validateState(state));
  const normalized = normalizeState(state);
  assert.equal(normalized.modules[0].maxScore, 40);
  assert.equal(normalized.modules[0].attendanceScore, 4);
  assert.equal(normalized.assessments[0].componentId, undefined);
  for (const invalid of [
    { maxScore: 0 },
    { maxScore: -1 },
    { maxScore: "20" },
    { maxScore: Infinity },
    { attendanceScore: -1 },
    { attendanceScore: 41 },
    { attendanceScore: "2" },
    { attendanceScore: NaN },
  ]) {
    const bad = structuredClone(state);
    Object.assign(bad.modules[0], invalid);
    assert.equal(validateState(bad), false);
  }
  state.assessments[0].category = "invalid";
  assert.equal(validateState(state), false);
});
test("normalization retains every classroom collection and removes database metadata", () => {
  const state = fresh();
  state._id = "untrusted";
  state.revision = 100;
  const normalized = normalizeState(state);
  assert.equal(normalized._id, undefined);
  assert.equal(normalized.revision, undefined);
  assert.deepEqual(normalized.students, state.students);
});

test("optional session activity bonuses preserve old data and validate student, score and duplicate constraints", () => {
  const state = fresh(),
    studentId = state.students[0].id;
  state.sessions.push({
    id: "bonus-session",
    classId: "class-10",
    moduleId: "module-10-1",
    title: "جلسه",
    bonusMarks: [{ studentId, score: 0.75 }],
  });
  assert.ok(validateState(state));
  assert.deepEqual(normalizeState(state).sessions.at(-1).bonusMarks, [
    { studentId, score: 0.75 },
  ]);
  const session = state.sessions.at(-1);
  for (const bonusMarks of [
    null,
    {},
    [null],
    [{ studentId, score: -1 }],
    [{ studentId, score: NaN }],
    [{ studentId, score: Infinity }],
    [{ studentId, score: "1" }],
    [{ studentId: "missing", score: 1 }],
    [
      {
        studentId: state.students.find((s) => s.classId !== "class-10").id,
        score: 1,
      },
    ],
    [
      { studentId, score: 1 },
      { studentId, score: 2 },
    ],
  ]) {
    session.bonusMarks = bonusMarks;
    assert.equal(validateState(state), false);
  }
  delete session.bonusMarks;
  assert.ok(validateState(state));
});
test("rejects incomplete collections, null rows, duplicate identifiers, and missing parent classes", () => {
  for (const change of [
    (state) => delete state.marks,
    (state) => state.students.push(null),
    (state) => state.students.push({ ...state.students[0] }),
    (state) => (state.students[0].classId = "missing"),
  ]) {
    const state = fresh();
    change(state);
    assert.equal(validateState(state), false);
  }
});
test("rejects invalid attendance and grades while preserving a valid explicit zero", () => {
  const state = fresh(),
    student = state.students[0];
  state.sessions.push({
    id: "session-test",
    classId: student.classId,
    moduleId: "module-10-1",
    title: "Demo session",
  });
  state.assessments.push({
    id: "assessment-test",
    moduleId: "module-10-1",
    componentId: "component-10-exam",
    title: "Demo exam",
    maxScore: 20,
  });
  state.marks.push({
    assessmentId: "assessment-test",
    studentId: student.id,
    score: 0,
  });
  state.attendance.push({
    sessionId: "session-test",
    studentId: student.id,
    status: "present",
  });
  assert.equal(validateState(state), true);
  state.marks[0].score = 21;
  assert.equal(validateState(state), false);
  state.marks[0].score = 0;
  state.attendance[0].status = "unknown";
  assert.equal(validateState(state), false);
});
test("rejects cross-class relationships and duplicate attendance records", () => {
  const state = fresh();
  state.sessions.push({
    id: "session-test",
    classId: "class-10",
    moduleId: "module-11-1",
  });
  assert.equal(validateState(state), false);
  state.sessions[0].moduleId = "module-10-1";
  state.attendance.push({
    sessionId: "session-test",
    studentId: state.students[0].id,
    status: "present",
  });
  assert.equal(validateState(state), true);
  state.attendance.push({ ...state.attendance[0] });
  assert.equal(validateState(state), false);
});
