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
test("normalization retains every classroom collection and removes database metadata", () => {
  const state = fresh();
  state._id = "untrusted";
  state.revision = 100;
  const normalized = normalizeState(state);
  assert.equal(normalized._id, undefined);
  assert.equal(normalized.revision, undefined);
  assert.deepEqual(normalized.students, state.students);
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
