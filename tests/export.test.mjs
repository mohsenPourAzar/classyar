import test from "node:test";
import assert from "node:assert/strict";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import * as L from "../src/lib/classroom/logic.mjs";
import * as EX from "../src/lib/classroom/reports.mjs";
const fresh = () => structuredClone(seed);
test("module report preserves blanks and 0 and lists all students", () => {
  const db = fresh();
  const cid = "class-10",
    m = "module-10-1",
    student = db.students.find((s) => s.classId === cid);
  const a = {
    id: "test-exam",
    moduleId: m,
    componentId: "component-10-exam",
    title: "آزمون",
    maxScore: 20,
  };
  db.assessments.push(a);
  db.marks.push({ studentId: student.id, assessmentId: a.id, score: 0 });
  const report = EX.listRows(db, cid, m);
  assert.equal(report.rows.length, 24);
  assert.equal(report.rows[0][3], 0); // zero is an explicit score
  assert.equal(report.rows[0][report.rows[0].length - 3], ""); // no final score yet
  assert.equal(report.rows[1][3], ""); // absent mark must stay blank
  assert.match(report.rows[0][report.rows[0].length - 1], /تمرین‌ها/);
});
test("summary report generates independent columns for every module", () => {
  const db = fresh();
  db.modules.push({
    id: "m2",
    classId: "class-10",
    order: 2,
    name: "پودمان دوم",
  });
  const report = EX.listRows(db, "class-10", "all");
  assert.equal(report.rows.length, 24);
  assert.equal(report.headers.includes("پودمان دوم (از ۲۰)"), true);
  assert.equal(report.rows[0].at(-3), ""); // incomplete average, not zero
});
test("XLSX generated fully offline and CSV emits UTF-8 BOM", () => {
  const db = fresh();
  const data = EX.makeXLSX(db, "class-10", "all");
  assert.equal(data[0], 0x50);
  assert.equal(data[1], 0x4b);
  assert.ok(data.length > 12000);
  assert.equal(
    EX.makeCSV(EX.listRows(db, "class-10", "all")).charCodeAt(0),
    0xfeff,
  );
});
