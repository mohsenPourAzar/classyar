/* Pure, framework-agnostic scoring logic. Also loaded in Node tests. */
const statusPoints = { present: 1, late: 0.5, absent: 0 };
const emptyCollections = [
  "classes",
  "students",
  "modules",
  "components",
  "sessions",
  "attendance",
  "assessments",
  "marks",
];
const toNumber = (x) => (typeof x === "number" ? x : Number(x));
const isScore = (score, max) =>
  score !== null &&
  score !== undefined &&
  score !== "" &&
  Number.isFinite(toNumber(score)) &&
  toNumber(score) >= 0 &&
  toNumber(score) <= max;
const round = (v, places = 2) =>
  Math.round((v + Number.EPSILON) * Math.pow(10, places)) /
  Math.pow(10, places);
function validateDatabase(data) {
  return (
    !!data &&
    typeof data === "object" &&
    emptyCollections.every((k) => Array.isArray(data[k]))
  );
}
function normalizedDatabase(data) {
  const next = { version: 1 };
  emptyCollections.forEach(
    (k) => (next[k] = Array.isArray(data && data[k]) ? data[k] : []),
  );
  return next;
}
function getComponents(db, moduleId) {
  return db.components.filter((c) => c.moduleId === moduleId);
}
function moduleWeight(db, moduleId) {
  return round(
    getComponents(db, moduleId).reduce(
      (acc, c) => acc + Number(c.weight || 0),
      0,
    ),
  );
}
function calculateComponent(db, studentId, component) {
  const weight = Number(component.weight || 0);
  if (component.kind === "attendance") {
    const sessions = db.sessions.filter(
      (s) => s.moduleId === component.moduleId,
    );
    if (!sessions.length)
      return {
        complete: false,
        points: null,
        reason: "جلسه‌ای ثبت نشده",
        recorded: 0,
        total: 0,
      };
    let credited = 0,
      counted = 0,
      recorded = 0;
    for (const session of sessions) {
      const rec = db.attendance.find(
        (a) => a.sessionId === session.id && a.studentId === studentId,
      );
      if (!rec || !rec.status || rec.status === "unset")
        return {
          complete: false,
          points: null,
          reason: "حضور برخی جلسات ثبت نشده",
          recorded,
          total: sessions.length,
        };
      recorded++;
      if (rec.status === "excused") continue; // documented: approved absence excluded from denominator
      if (!(rec.status in statusPoints))
        return {
          complete: false,
          points: null,
          reason: "وضعیت حضور نامعتبر",
          recorded,
          total: sessions.length,
        };
      counted++;
      credited += statusPoints[rec.status];
    }
    if (counted === 0)
      return {
        complete: false,
        points: null,
        reason: "همه جلسات غیبت موجه هستند",
        recorded,
        total: sessions.length,
      };
    return {
      complete: true,
      points: round((credited / counted) * weight),
      ratio: credited / counted,
      recorded,
      total: sessions.length,
    };
  }
  const assessments = db.assessments.filter(
    (a) => a.componentId === component.id,
  );
  if (!assessments.length)
    return {
      complete: false,
      points: null,
      reason: "آیتم ارزشیابی تعریف نشده",
      recorded: 0,
      total: 0,
    };
  let earned = 0,
    maximum = 0,
    recorded = 0;
  for (const assessment of assessments) {
    const max = Number(assessment.maxScore);
    if (!Number.isFinite(max) || max <= 0)
      return {
        complete: false,
        points: null,
        reason: "بارم نامعتبر",
        recorded,
        total: assessments.length,
      };
    const rec = db.marks.find(
      (m) => m.assessmentId === assessment.id && m.studentId === studentId,
    );
    if (!rec || !isScore(rec.score, max))
      return {
        complete: false,
        points: null,
        reason: "نمره برخی آیتم‌ها ثبت نشده",
        recorded,
        total: assessments.length,
      };
    earned += Number(rec.score);
    maximum += max;
    recorded++;
  }
  return {
    complete: true,
    points: round((earned / maximum) * weight),
    ratio: earned / maximum,
    recorded,
    total: assessments.length,
  };
}
function calculateModule(db, studentId, moduleId) {
  const components = getComponents(db, moduleId);
  const max = moduleWeight(db, moduleId);
  const breakdown = components.map((c) => ({
    ...c,
    result: calculateComponent(db, studentId, c),
  }));
  const configured = components.length > 0 && Math.abs(max - 20) < 0.001;
  const complete = configured && breakdown.every((c) => c.result.complete);
  const sum = round(breakdown.reduce((a, c) => a + (c.result.points || 0), 0));
  return {
    configured,
    complete,
    total: complete ? Math.min(20, sum) : null,
    provisional: sum,
    max,
    breakdown,
    pending: breakdown.filter((c) => !c.result.complete).map((c) => c.name),
  };
}
function attendanceStats(db, classId) {
  const sessions = db.sessions.filter((s) => s.classId === classId);
  const ids = new Set(sessions.map((s) => s.id));
  const records = db.attendance.filter((a) => ids.has(a.sessionId));
  return {
    sessions: sessions.length,
    absent: records.filter((r) => r.status === "absent").length,
    present: records.filter((r) => r.status === "present").length,
  };
}

export {
  validateDatabase,
  normalizedDatabase,
  calculateModule,
  calculateComponent,
  moduleWeight,
  attendanceStats,
  round,
  isScore,
};
