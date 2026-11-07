import test from "node:test";
import assert from "node:assert/strict";
import * as L from "../src/lib/classroom/logic.mjs";
const sample = () => ({
  version: 1,
  classes: [],
  students: [],
  modules: [{ id: "m1", name: "پودمان اول", maxScore: 20, attendanceScore: 1 }],
  components: [
    {
      id: "exam",
      moduleId: "m1",
      name: "آزمون",
      kind: "assessment",
      weight: 15,
    },
    {
      id: "exercise",
      moduleId: "m1",
      name: "تمرین",
      kind: "assessment",
      weight: 4,
    },
    { id: "att", moduleId: "m1", name: "حضور", kind: "attendance", weight: 1 },
  ],
  sessions: [{ id: "s1", moduleId: "m1" }],
  attendance: [],
  assessments: [
    { id: "a1", moduleId: "m1", componentId: "exam", maxScore: 20 },
    { id: "a2", moduleId: "m1", componentId: "exercise", maxScore: 10 },
  ],
  marks: [],
});
test("validates required arrays", () => {
  assert.equal(L.validateDatabase(sample()), true);
  assert.equal(L.validateDatabase({ classes: [] }), false);
});
test("does not treat missing marks as zero", () => {
  const db = sample();
  db.attendance.push({
    sessionId: "s1",
    studentId: "alice",
    status: "present",
  });
  db.marks.push({ assessmentId: "a1", studentId: "alice", score: 16 });
  const res = L.calculateModule(db, "alice", "m1");
  assert.equal(res.complete, false);
  assert.equal(res.total, 11.13);
  assert.equal(db.marks.length, 1);
});
test("combines assessment totals with the module attendance allocation", () => {
  const db = sample();
  db.attendance.push({
    sessionId: "s1",
    studentId: "alice",
    status: "present",
  });
  db.marks.push(
    { assessmentId: "a1", studentId: "alice", score: 16 },
    { assessmentId: "a2", studentId: "alice", score: 8 },
  );
  const res = L.calculateModule(db, "alice", "m1");
  assert.equal(res.complete, true);
  assert.equal(res.total, 16.2);
});
test("multiple exercises aggregate by their maximum scores", () => {
  const db = sample();
  db.assessments.push({
    id: "a3",
    moduleId: "m1",
    componentId: "exercise",
    maxScore: 30,
  });
  db.marks = [
    { assessmentId: "a2", studentId: "alice", score: 8 },
    { assessmentId: "a3", studentId: "alice", score: 12 },
  ];
  assert.equal(L.calculateComponent(db, "alice", db.components[1]).points, 2);
});
test("absence permitted only when explicitly marked", () => {
  const db = sample();
  db.attendance = [];
  assert.equal(
    L.calculateComponent(db, "alice", db.components[2]).complete,
    false,
  );
  db.attendance.push({ sessionId: "s1", studentId: "alice", status: "absent" });
  assert.equal(L.calculateComponent(db, "alice", db.components[2]).points, 0);
});
test("excused absence is excluded, late earns half credit", () => {
  const db = sample();
  db.sessions.push({ id: "s2", moduleId: "m1" }, { id: "s3", moduleId: "m1" });
  db.attendance = [
    { sessionId: "s1", studentId: "alice", status: "present" },
    { sessionId: "s2", studentId: "alice", status: "late" },
    { sessionId: "s3", studentId: "alice", status: "excused" },
  ];
  const res = L.calculateComponent(db, "alice", db.components[2]);
  assert.equal(res.complete, true);
  assert.equal(res.points, 0.75);
});
test("all excused sessions remain incomplete rather than divide by zero", () => {
  const db = sample();
  db.attendance = [{ sessionId: "s1", studentId: "alice", status: "excused" }];
  assert.equal(
    L.calculateComponent(db, "alice", db.components[2]).complete,
    false,
  );
});
test("module scale and attendance allocation determine the final grade", () => {
  const db = sample();
  db.modules[0].maxScore = 40;
  db.modules[0].attendanceScore = 10;
  db.attendance = [{ sessionId: "s1", studentId: "alice", status: "present" }];
  db.marks = [
    { assessmentId: "a1", studentId: "alice", score: 16 },
    { assessmentId: "a2", studentId: "alice", score: 8 },
  ];
  const result = L.calculateModule(db, "alice", "m1");
  assert.equal(result.max, 40);
  assert.equal(result.complete, true);
  assert.equal(result.total, 34);
});

test("20/10/10 weights finalize completed marks without changing the configured weights", () => {
  const db = sample();
  delete db.modules[0].maxScore;
  delete db.modules[0].attendanceScore;
  db.components.forEach((component, index) => {
    component.weight = [20, 10, 10][index];
  });
  db.attendance = [{ sessionId: "s1", studentId: "alice", status: "present" }];
  db.marks = [
    { assessmentId: "a1", studentId: "alice", score: 16 },
    { assessmentId: "a2", studentId: "alice", score: 8 },
  ];
  const before = structuredClone(db);
  const result = L.calculateModule(db, "alice", "m1");
  assert.equal(result.max, 20);
  assert.equal(result.complete, true);
  assert.equal(result.total, 17);
  assert.equal(result.provisional, 17);
  assert.deepEqual(db, before);
  db.marks.pop();
  assert.equal(L.calculateModule(db, "alice", "m1").complete, false);
  assert.equal(L.calculateModule(db, "alice", "m1").total, 13);
});

test("assessments work without components and zero attendance needs no sessions", () => {
  const db = sample();
  db.modules[0].attendanceScore = 0;
  db.components = [];
  db.sessions = [];
  db.assessments = [
    { id: "a1", moduleId: "m1", maxScore: 20, title: "عملی ۱" },
  ];
  db.marks = [{ assessmentId: "a1", studentId: "alice", score: 0 }];
  const result = L.calculateModule(db, "alice", "m1");
  assert.equal(result.complete, true);
  assert.equal(result.total, 0);
  assert.deepEqual(result.pending, []);
  db.assessments = db.assessments.filter((a) => a.id === "a1");
  assert.equal(L.calculateModule(db, "alice", "m1").complete, true);
});

test("empty modules retain a blank grade and invalid allocations are rejected", () => {
  const db = sample();
  assert.equal(L.calculateModule(db, "alice", "m1").complete, false);
  assert.equal(L.calculateModule(db, "alice", "m1").total, null);
  db.modules[0].attendanceScore = 21;
  assert.equal(L.calculateModule(db, "alice", "m1").configured, false);
  assert.equal(L.calculateModule(db, "alice", "m1").total, null);
});

test("normalization rounds only after summing precise component contributions", () => {
  const db = sample();
  db.modules[0].attendanceScore = 0;
  db.components = [db.components[0], db.components[1]];
  db.components.forEach((component) => {
    component.weight = 0.25;
  });
  db.marks = [
    { assessmentId: "a1", studentId: "alice", score: 10 },
    { assessmentId: "a2", studentId: "alice", score: 5 },
  ];
  assert.equal(L.calculateModule(db, "alice", "m1").total, 10);
});
test("invalid scores cannot be graded", () => {
  assert.equal(L.isScore(21, 20), false);
  assert.equal(L.isScore(-1, 20), false);
  assert.equal(L.isScore("", 20), false);
  assert.equal(L.isScore(0, 20), true);
});

test("activity bonuses sum only the student's sessions in the selected module and cap the final", () => {
  const db = sample();
  db.marks = [
    { assessmentId: "a1", studentId: "alice", score: 10 },
    { assessmentId: "a2", studentId: "alice", score: 5 },
  ];
  db.attendance = [{ sessionId: "s1", studentId: "alice", status: "present" }];
  db.sessions[0].bonusMarks = [
    { studentId: "alice", score: 0.5 },
    { studentId: "bob", score: 4 },
  ];
  db.sessions.push({
    id: "s2",
    moduleId: "m1",
    bonusMarks: [{ studentId: "alice", score: 1.25 }],
  });
  db.sessions.push({
    id: "other",
    moduleId: "m2",
    bonusMarks: [{ studentId: "alice", score: 10 }],
  });
  db.attendance.push({
    sessionId: "s2",
    studentId: "alice",
    status: "present",
  });
  let grade = L.calculateModule(db, "alice", "m1");
  assert.deepEqual(grade.bonus, { points: 1.75, recorded: 2 });
  assert.equal(grade.total, 12.25);
  assert.equal(grade.attendance.points, 1);
  assert.equal(grade.complete, true);
  db.sessions[0].bonusMarks[0].score = 15;
  assert.equal(L.calculateModule(db, "alice", "m1").total, 20);
  Object.assign(db.modules[0], { maxScore: 40, attendanceScore: 2 });
  assert.equal(L.calculateModule(db, "alice", "m1").total, 37.25);
});

test("bonus entry updates and clears independently of attendance without duplicating or inferring status", () => {
  const db = sample();
  db.students = [
    { id: "alice", classId: "c1" },
    { id: "bob", classId: "c2" },
  ];
  db.sessions[0].classId = "c1";
  assert.equal(L.setSessionBonus(db, "s1", "alice", "0.5"), true);
  assert.equal(L.setSessionBonus(db, "s1", "alice", "1.25"), true);
  assert.deepEqual(db.sessions[0].bonusMarks, [
    { studentId: "alice", score: 1.25 },
  ]);
  assert.equal(db.attendance.length, 0);
  assert.equal(L.calculateModule(db, "alice", "m1").total, 1.25);
  assert.equal(L.calculateModule(db, "alice", "m1").complete, false);
  const before = structuredClone(db);
  for (const raw of [-1, Infinity, NaN, "invalid", null, {}, true])
    assert.equal(L.setSessionBonus(db, "s1", "alice", raw), false);
  assert.equal(L.setSessionBonus(db, "s1", "bob", "1"), false);
  assert.equal(L.setSessionBonus(db, "missing", "alice", "1"), false);
  assert.deepEqual(db, before);
  L.setSessionBonus(db, "s1", "alice", "0");
  assert.equal(L.calculateModule(db, "alice", "m1").total, 0);
  L.setSessionBonus(db, "s1", "alice", "");
  assert.deepEqual(db.sessions[0].bonusMarks, []);
  assert.equal(L.calculateModule(db, "alice", "m1").total, null);
});

test("live module grade recalculates after mark, attendance, item and module edits", () => {
  const db = sample();
  Object.assign(db.modules[0], { maxScore: 20, attendanceScore: 2 });
  db.components = [];
  db.marks = [
    { assessmentId: "a1", studentId: "alice", score: 20 },
    { assessmentId: "a2", studentId: "alice", score: 10 },
  ];
  db.attendance = [{ sessionId: "s1", studentId: "alice", status: "present" }];
  assert.equal(L.calculateModule(db, "alice", "m1").total, 20);
  db.sessions.push({ id: "s2", moduleId: "m1" });
  db.attendance.push({ sessionId: "s2", studentId: "alice", status: "absent" });
  assert.equal(L.calculateModule(db, "alice", "m1").attendance.points, 1);
  assert.equal(L.calculateModule(db, "alice", "m1").total, 19);
  db.marks[0].score = 10;
  assert.equal(L.calculateModule(db, "alice", "m1").total, 13);
  db.assessments[0].maxScore = 30;
  assert.equal(L.calculateModule(db, "alice", "m1").total, 10);
  db.assessments.pop();
  assert.equal(L.calculateModule(db, "alice", "m1").total, 7);
  Object.assign(db.modules[0], { maxScore: 40, attendanceScore: 4 });
  assert.equal(L.calculateModule(db, "alice", "m1").total, 14);
});

test("attendance handles late, excused, unknown and unrecorded sessions without guessing absence", () => {
  const db = sample();
  db.sessions.push({ id: "s2", moduleId: "m1" }, { id: "s3", moduleId: "m1" });
  db.attendance = [
    { sessionId: "s1", studentId: "alice", status: "present" },
    { sessionId: "s2", studentId: "alice", status: "late" },
    { sessionId: "s3", studentId: "alice", status: "excused" },
  ];
  assert.equal(L.calculateAttendance(db, "alice", "m1", 4).points, 3);
  db.attendance.pop();
  const partial = L.calculateAttendance(db, "alice", "m1", 4);
  assert.equal(partial.complete, false);
  assert.equal(partial.points, 3);
  assert.equal(partial.recorded, 2);
  db.attendance = db.sessions.map((s) => ({
    sessionId: s.id,
    studentId: "alice",
    status: "excused",
  }));
  assert.equal(L.calculateAttendance(db, "alice", "m1", 4).points, null);
  assert.equal(L.calculateAttendance(db, "alice", "m1", 0).complete, true);
});
