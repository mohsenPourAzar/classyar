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

test("formal exports contain only a plain table and retain every assessment and explicit zero", () => {
  const db = fresh(),
    student = db.students[0],
    moduleId = "module-10-1";
  db.assessments.push({
    id: "formal-exam",
    moduleId,
    componentId: "component-10-exam",
    title: "آزمون رسمی",
    maxScore: 20,
  });
  db.marks.push({
    studentId: student.id,
    assessmentId: "formal-exam",
    score: 0,
  });
  const final = EX.exportRows(db, "class-10", moduleId, "final");
  assert.deepEqual(final.headers, ["نام و نام خانوادگی", "نمره نهایی (از ۲۰)"]);
  assert.deepEqual(final.rows[0], [student.name, ""]);
  const detailed = EX.exportRows(db, "class-10", moduleId, "detailed");
  assert.equal(detailed.rows[0][2], 0);
  assert.equal(detailed.rows[1][2], "");
  assert.equal(
    detailed.rows[0][detailed.headers.indexOf("جمع نمرات ثبت‌شده (خام)")],
    0,
  );
  const csv = EX.makeCSV(detailed);
  assert.equal(csv.split("\r\n").length, detailed.rows.length + 1);
  assert.ok(csv.startsWith('\ufeff"ردیف"'));
  assert.ok(!csv.includes("سامانه کلاس‌یار"));
  const files = unzipStored(EX.makeXLSX(db, "class-10", moduleId, "detailed"));
  const sheet = files.get("xl/worksheets/sheet1.xml"),
    styles = files.get("xl/styles.xml");
  assert.match(sheet, /autoFilter ref="A1:/);
  assert.ok(!sheet.includes("mergeCell"));
  assert.ok(!sheet.includes("کلاس‌یار"));
  assert.equal((sheet.match(/<row /g) || []).length, detailed.rows.length + 1);
  assert.ok(!styles.includes('patternType="solid"'));
  assert.ok(
    [...styles.matchAll(/rgb="([A-F0-9]+)"/g)].every(
      (match) => match[1] === "FF000000",
    ),
  );
  assert.equal(
    [...files.keys()].filter((name) => /worksheets\/sheet/.test(name)).length,
    1,
  );
});

test("final report calculates weighted grades and all-module average only when complete; raw sum stays distinct", () => {
  const db = fresh(),
    student = db.students[0];
  db.components = [
    {
      id: "formal-component",
      moduleId: "module-10-1",
      kind: "assessment",
      name: "آزمون",
      weight: 20,
    },
  ];
  db.assessments = [
    {
      id: "formal-a",
      moduleId: "module-10-1",
      componentId: "formal-component",
      title: "آزمون یک",
      maxScore: 10,
    },
    {
      id: "formal-b",
      moduleId: "module-10-1",
      componentId: "formal-component",
      title: "آزمون دو",
      maxScore: 30,
    },
  ];
  db.marks = [
    { studentId: student.id, assessmentId: "formal-a", score: 0 },
    { studentId: student.id, assessmentId: "formal-b", score: 20 },
  ];
  assert.equal(EX.exportRows(db, "class-10", "all", "final").rows[0][1], 10);
  let detailed = EX.exportRows(db, "class-10", "all", "detailed");
  assert.equal(
    detailed.rows[0][detailed.headers.indexOf("جمع نمرات ثبت‌شده (خام)")],
    20,
  );
  db.modules.push({
    id: "formal-module2",
    classId: "class-10",
    name: "پودمان دوم",
    order: 2,
  });
  assert.equal(EX.exportRows(db, "class-10", "all", "final").rows[0][1], "");
  db.components.push({
    id: "formal-c2",
    moduleId: "formal-module2",
    kind: "assessment",
    name: "آزمون",
    weight: 20,
  });
  db.assessments.push({
    id: "formal-a2",
    moduleId: "formal-module2",
    componentId: "formal-c2",
    title: "آزمون پودمان دوم",
    maxScore: 20,
  });
  db.marks.push({
    studentId: student.id,
    assessmentId: "formal-a2",
    score: 20,
  });
  assert.equal(EX.exportRows(db, "class-10", "all", "final").rows[0][1], 15);
  detailed = EX.exportRows(db, "class-10", "all", "detailed");
  assert.equal(
    detailed.rows[0][detailed.headers.indexOf("جمع نمرات پودمان‌ها")],
    30,
  );
  assert.ok(
    detailed.headers.some((header) => header.includes("آزمون پودمان دوم")),
  );
});

test("CSV and print reports escape untrusted names without extra headings or scripts", () => {
  const db = fresh();
  db.students[0].name = '=HYPERLINK("example")';
  assert.match(EX.makeCSV(EX.exportRows(db, "class-10")), /'=/);
  db.students[0].name = '<script>alert("x")</script>';
  const html = EX.makePrintHTML(EX.exportRows(db, "class-10"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!/<h[1-6][\s>]/.test(html));
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
