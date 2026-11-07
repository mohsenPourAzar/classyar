import test from "node:test";
import assert from "node:assert/strict";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import * as EX from "../src/lib/classroom/reports.mjs";
const moduleId = "module-10-1",
  classId = "class-10";
function fixture() {
  const db = structuredClone(seed);
  Object.assign(db.modules[0], { maxScore: 20, attendanceScore: 2 });
  db.components = [];
  db.sessions = [
    { id: "s1", moduleId, classId },
    { id: "s2", moduleId, classId },
  ];
  db.assessments = [
    {
      id: "a1",
      moduleId,
      category: "practical",
      title: "عملی ۱",
      maxScore: 20,
    },
    { id: "a2", moduleId, category: "exercise", title: "تمرین ۱", maxScore: 5 },
    { id: "a3", moduleId, category: "exercise", title: "تمرین ۲", maxScore: 5 },
    { id: "a4", moduleId, category: "written", title: "کتبی ۱", maxScore: 10 },
  ];
  return db;
}
function complete(db) {
  const studentId = db.students[0].id;
  db.marks = db.assessments.map((a) => ({
    assessmentId: a.id,
    studentId,
    score: a.maxScore * 0.8,
  }));
  db.attendance = [
    { sessionId: "s1", studentId, status: "present" },
    { sessionId: "s2", studentId, status: "absent" },
  ];
}
test("detailed report has attendance, activity bonus, exercises, exams and final grade", () => {
  const db = fixture();
  complete(db);
  const report = EX.exportRows(db, classId, moduleId, "detailed");
  assert.deepEqual(report.headers, [
    "ردیف",
    "نام و نام خانوادگی",
    "حضور و غیاب (از 2)",
    "نمره اضافی",
    "تمرین ۱ (از 5)",
    "تمرین ۲ (از 5)",
    "عملی ۱ (از 20)",
    "کتبی ۱ (از 10)",
    "نمره نهایی (از 20)",
  ]);
  assert.deepEqual(report.rows[0], [
    1,
    db.students[0].name,
    1,
    0,
    4,
    4,
    16,
    8,
    15.4,
  ]);
  assert.equal(report.rows.length, 24);
  assert.ok(!report.pendingRows.some((r) => r.row === 0));
  assert.deepEqual(EX.listRows(db, classId, moduleId).rows, report.rows);
});
test("live finals update for missing marks, preserve zero and keep unrecorded marks blank", () => {
  const db = fixture(),
    studentId = db.students[0].id;
  assert.equal(EX.exportRows(db, classId, moduleId).rows[0][1], "");
  db.marks = [{ assessmentId: "a1", studentId, score: 0 }];
  let report = EX.exportRows(db, classId, moduleId, "detailed");
  assert.equal(report.rows[0][2], "");
  assert.equal(report.rows[0][3], 0);
  assert.equal(report.rows[0][4], "");
  assert.equal(report.rows[0][6], 0);
  assert.equal(report.rows[0].at(-1), 0);
  assert.ok(report.pendingRows.some((r) => r.row === 0));
  assert.equal(report.rows[1].at(-1), "");
  db.marks[0].score = 20;
  assert.equal(EX.exportRows(db, classId, moduleId).rows[0][1], 9);
  db.attendance = [{ sessionId: "s1", studentId, status: "present" }];
  assert.equal(EX.exportRows(db, classId, moduleId).rows[0][1], 11);
});
test("reports respect custom module scales and normalize mixed scales for overall averages", () => {
  const db = fixture();
  complete(db);
  Object.assign(db.modules[0], { maxScore: 40, attendanceScore: 4 });
  assert.equal(EX.exportRows(db, classId, moduleId).rows[0][1], 30.8);
  assert.equal(
    EX.exportRows(db, classId, moduleId).headers[1],
    "نمره نهایی (از 40)",
  );
  db.modules.push({
    id: "m2",
    classId,
    name: "پودمان دوم",
    order: 2,
    maxScore: 10,
    attendanceScore: 0,
  });
  let report = EX.exportRows(db, classId, "all", "detailed");
  assert.equal(report.rows[0].at(-1), 15.4);
  assert.ok(report.pendingRows.some((r) => r.row === 0));
  db.assessments.push({
    id: "other",
    moduleId: "m2",
    title: "آزمون دوم",
    maxScore: 10,
  });
  db.marks.push({
    assessmentId: "other",
    studentId: db.students[0].id,
    score: 10,
  });
  report = EX.exportRows(db, classId, "all", "detailed");
  assert.equal(report.rows[0].at(-1), 17.7);
  assert.equal(
    report.headers.filter((h) => h.includes("حضور و غیاب")).length,
    2,
  );
});
test("CSV, print and XLSX use the same simplified columns and calculated grade", () => {
  const db = fixture();
  complete(db);
  const report = EX.exportRows(db, classId, moduleId, "detailed");
  const csv = EX.makeCSV(report);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.split("\r\n").length, 25);
  assert.ok(csv.includes('"15.4"'));
  const html = EX.makePrintHTML(report);
  assert.ok(html.includes("<td>15.4</td>"));
  assert.ok(!/<h[1-6][\s>]/.test(html));
  const files = unzipStored(EX.makeXLSX(db, classId, moduleId, "detailed"));
  assert.match(
    files.get("xl/worksheets/sheet1.xml"),
    /<c r="I2"[^>]*><v>15.4<\/v>/,
  );
  assert.equal(
    (files.get("xl/worksheets/sheet1.xml").match(/<row /g) || []).length,
    25,
  );
  assert.ok(!files.get("xl/styles.xml").includes('patternType="solid"'));
});
test("export escaping protects spreadsheet formulas and printed names", () => {
  const db = fixture();
  db.students[0].name = '=HYPERLINK("example")';
  assert.match(EX.makeCSV(EX.exportRows(db, classId)), /'=/);
  db.students[0].name = '<script>alert("x")</script>';
  const html = EX.makePrintHTML(EX.exportRows(db, classId));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("activity bonus column totals sessions independently and agrees in final, CSV, print and Excel", () => {
  const db = fixture();
  complete(db);
  const studentId = db.students[0].id;
  db.sessions[0].bonusMarks = [{ studentId, score: 0.5 }];
  db.sessions[1].bonusMarks = [{ studentId, score: 1.25 }];
  const report = EX.exportRows(db, classId, moduleId, "detailed");
  const column = report.headers.indexOf("نمره اضافی");
  assert.equal(report.rows[0][column], 1.75);
  assert.equal(report.rows[1][column], 0);
  assert.equal(report.rows[0][2], 1);
  assert.equal(report.rows[0].at(-1), 17.15);
  assert.equal(EX.exportRows(db, classId, moduleId, "final").rows[0][1], 17.15);
  assert.ok(EX.makeCSV(report).includes('"1.75"'));
  assert.ok(EX.makePrintHTML(report).includes("<td>1.75</td>"));
  const files = unzipStored(EX.makeXLSX(db, classId, moduleId, "detailed"));
  assert.match(
    files.get("xl/worksheets/sheet1.xml"),
    /<c r="D2"[^>]*><v>1.75<\/v>/,
  );
  assert.match(
    files.get("xl/worksheets/sheet1.xml"),
    /<c r="I2"[^>]*><v>17.15<\/v>/,
  );
});
function unzipStored(bytes) {
  const buffer = Buffer.from(bytes),
    files = new Map();
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18),
      nameLength = buffer.readUInt16LE(offset + 26),
      extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer
        .subarray(offset + 30, offset + 30 + nameLength)
        .toString("utf8"),
      start = offset + 30 + nameLength + extraLength;
    files.set(name, buffer.subarray(start, start + size).toString("utf8"));
    offset = start + size;
  }
  return files;
}
