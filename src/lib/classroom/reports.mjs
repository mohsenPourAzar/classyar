/* Classyar report exporter: CSV and native XLSX (offline, no third-party dependency). */
import * as L from "./logic.mjs";
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const n = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;
function listRows(db, classId, moduleId = "all") {
  return exportRows(db, classId, moduleId, "detailed");
}
const csvCell = (v) =>
  '"' +
  String(v ?? "")
    .replace(/^[=+@\-\t\r]/, (m) => "'" + m)
    .replace(/"/g, '""') +
  '"';
// One attendance column, individual assessment marks, and the live final grade.
function exportRows(db, classId, moduleId = "all", kind = "final") {
  const klass = db.classes.find((item) => item.id === classId);
  if (!klass) throw Error("کلاس انتخاب نشده است");
  if (!["final", "detailed"].includes(kind))
    throw Error("نوع گزارش نامعتبر است");
  const modules = db.modules
    .filter(
      (item) =>
        item.classId === classId &&
        (moduleId === "all" || item.id === moduleId),
    )
    .sort((a, b) => a.order - b.order);
  if (moduleId !== "all" && !modules.length)
    throw Error("پودمان انتخاب نشده است");
  const students = db.students.filter((item) => item.classId === classId);
  const prefix = (module) => (moduleId === "all" ? module.name + " / " : "");
  const sections = modules.map((module) => ({
    module,
    settings: L.moduleSettings(db, module),
    assessments: db.assessments
      .filter((a) => a.moduleId === module.id)
      .map((a, index) => ({ ...a, index }))
      .sort(
        (a, b) => assessmentOrder(a) - assessmentOrder(b) || a.index - b.index,
      ),
  }));
  const finalMax = moduleId === "all" ? 20 : sections[0].settings.maxScore;
  const finalTitle = "نمره نهایی (از " + finalMax + ")";
  const headers =
    kind === "final"
      ? ["نام و نام خانوادگی", finalTitle]
      : [
          "ردیف",
          "نام و نام خانوادگی",
          ...sections.flatMap(({ module, settings, assessments }) => [
            prefix(module) +
              "حضور و غیاب (از " +
              settings.attendanceScore +
              ")",
            prefix(module) + "نمره اضافی",
            ...assessments.map(
              (a) => prefix(module) + a.title + " (از " + a.maxScore + ")",
            ),
            ...(moduleId === "all"
              ? [module.name + " (از " + settings.maxScore + ")"]
              : []),
          ]),
          finalTitle,
        ];
  const pendingRows = [];
  const rows = students.map((student, index) => {
    const grades = sections.map(({ module }) =>
      L.calculateModule(db, student.id, module.id),
    );
    const available = grades.filter((g) => g.total !== null);
    const final =
      moduleId === "all"
        ? available.length
          ? n(
              available.reduce((sum, g) => sum + (g.total / g.max) * 20, 0) /
                available.length,
            )
          : ""
        : (grades[0].total ?? "");
    if (grades.some((g) => !g.complete))
      pendingRows.push({
        studentId: student.id,
        row: index,
        reasons: grades.flatMap((g, i) =>
          g.pending.map((reason) => prefix(sections[i].module) + reason),
        ),
      });
    if (kind === "final") return [student.name, final];
    return [
      index + 1,
      student.name,
      ...sections.flatMap(({ assessments }, i) => [
        grades[i].attendance.points ?? "",
        grades[i].bonus.points,
        ...assessments.map((a) => {
          const mark = db.marks.find(
            (m) => m.assessmentId === a.id && m.studentId === student.id,
          );
          return mark && L.isScore(mark.score, a.maxScore)
            ? Number(mark.score)
            : "";
        }),
        ...(moduleId === "all" ? [grades[i].total ?? ""] : []),
      ]),
      final,
    ];
  });
  return {
    klass,
    kind,
    title: kind === "final" ? "نمرات نهایی" : "ریز نمرات",
    headers,
    rows,
    pendingRows,
    students: students.length,
    modules: modules.length,
  };
}
function assessmentOrder(assessment) {
  if (
    assessment.category === "exercise" ||
    /تمرین|تکلیف/.test(assessment.title)
  )
    return 0;
  return 1;
}
function makePrintHTML(report) {
  const line = (values, tag) =>
    `<tr>${values.map((value) => `<${tag}>${esc(value)}</${tag}>`).join("")}</tr>`;
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title></title><style>@font-face{font-family:Parastoo;src:url(/fonts/Parastoo.woff2) format("woff2");font-weight:400}@font-face{font-family:Parastoo;src:url(/fonts/Parastoo-Bold.woff2) format("woff2");font-weight:700}@page{size:A4 ${report.headers.length > 5 ? "landscape" : "portrait"};margin:12mm}body{margin:0;background:white;color:black;font-family:Parastoo,serif}table{width:100%;border-collapse:collapse;font-size:${report.headers.length > 12 ? "8" : "10"}pt}th,td{border:1px solid black;padding:6px;text-align:center;background:white;color:black}th{font-weight:bold}tr{break-inside:avoid}thead{display:table-header-group}td:nth-child(${report.kind === "final" ? 1 : 2}){text-align:right}</style></head><body><table><thead>${line(report.headers, "th")}</thead><tbody>${report.rows.map((row) => line(row, "td")).join("")}</tbody></table></body></html>`;
}
function makeCSV(report) {
  const heading = [report.headers, ...report.rows];
  return "\ufeff" + heading.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
function colName(i) {
  let s = "";
  for (i++; i; i = Math.floor((i - 1) / 26))
    s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}
function sheetXML(report) {
  const count = report.headers.length;
  const data = [report.headers, ...report.rows];
  const width = Array.from({ length: count }, (_, i) =>
    report.headers[i] === "نام و نام خانوادگی"
      ? 34
      : i === 0 && report.kind === "detailed"
        ? 8
        : Math.max(14, Math.min(25, (report.headers[i] || "").length + 4)),
  );
  const cols = width
    .map(
      (w, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
    )
    .join("");
  const rows = data
    .map((line, r) => {
      const cells = line
        .map((v, c) => {
          const addr = colName(c) + (r + 1);
          const header = r === 0;
          const style = header ? 1 : typeof v === "number" ? 2 : 3;
          if (v === null || v === undefined || v === "")
            return `<c r="${addr}" s="${style}"/>`;
          if (typeof v === "number" && !header && Number.isFinite(v))
            return `<c r="${addr}" s="${style}"><v>${v}</v></c>`;
          return `<c r="${addr}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}"${r === 0 ? ' ht="38" customHeight="1"' : ""}>${cells}</row>`;
    })
    .join("");
  const last = colName(count - 1);
  const lastrow = data.length;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="25"/><cols>${cols}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${last}${lastrow}"/><printOptions gridLines="0"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0" footer="0"/><pageSetup orientation="landscape" fitToWidth="1"/></worksheet>`;
}
function zipStore(parts) {
  const encoder = new TextEncoder(),
    chunks = [],
    centers = [];
  let offset = 0;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const b of bytes) crc = table[(crc ^ b) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function write16(arr, pos, v) {
    arr[pos] = v & 255;
    arr[pos + 1] = (v >>> 8) & 255;
  }
  function write32(arr, pos, v) {
    write16(arr, pos, v & 65535);
    write16(arr, pos + 2, v >>> 16);
  }
  for (const [name, source] of parts) {
    const fn = encoder.encode(name),
      body = encoder.encode(source),
      crc = crc32(body);
    const local = new Uint8Array(30 + fn.length);
    write32(local, 0, 0x04034b50);
    write16(local, 4, 20);
    write16(local, 8, 0);
    write32(local, 14, crc);
    write32(local, 18, body.length);
    write32(local, 22, body.length);
    write16(local, 26, fn.length);
    local.set(fn, 30);
    chunks.push(local, body);
    const central = new Uint8Array(46 + fn.length);
    write32(central, 0, 0x02014b50);
    write16(central, 4, 20);
    write16(central, 6, 20);
    write32(central, 16, crc);
    write32(central, 20, body.length);
    write32(central, 24, body.length);
    write16(central, 28, fn.length);
    write32(central, 42, offset);
    central.set(fn, 46);
    centers.push(central);
    offset += local.length + body.length;
  }
  const cdLen = centers.reduce((s, a) => s + a.length, 0),
    ending = new Uint8Array(22);
  write32(ending, 0, 0x06054b50);
  write16(ending, 8, parts.length);
  write16(ending, 10, parts.length);
  write32(ending, 12, cdLen);
  write32(ending, 16, offset);
  const all = [...chunks, ...centers, ending];
  const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
  let cur = 0;
  for (const v of all) {
    out.set(v, cur);
    cur += v.length;
  }
  return out;
}
const stylesheet = `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Parastoo"/><color rgb="FF000000"/></font><font><b/><sz val="11"/><name val="Parastoo"/><color rgb="FF000000"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
const names = (reports) =>
  reports.map((r, i) => {
    const s = r.title.replace(/[\\/*?:\[\]]/g, "-").slice(0, 27);
    return (i ? s + " " + (i + 1) : s).slice(0, 31);
  });
function makeXLSX(db, classId, moduleId = "all", kind = "detailed") {
  const reports = [exportRows(db, classId, moduleId, kind)];
  const sheetNames = names(reports);
  const wbSheets = sheetNames
    .map(
      (name, i) =>
        `<sheet name="${esc(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join("");
  const rels = reports
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join("");
  const types = reports
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const entries = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${types}</Types>`,
    ],
    [
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${wbSheets}</sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${reports.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    ["xl/styles.xml", stylesheet],
    ...reports.map((r, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXML(r)]),
  ];
  return zipStore(entries);
}
export { listRows, exportRows, makeCSV, makeXLSX, makePrintHTML };
