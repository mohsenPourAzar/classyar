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
  if (weight === 0)
    return { complete: true, points: 0, ratio: 0, recorded: 0, total: 0 };
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
function moduleSettings(db, moduleOrId) {
  const module =
    typeof moduleOrId === "string"
      ? db.modules.find((item) => item.id === moduleOrId)
      : moduleOrId;
  const maxScore = module?.maxScore ?? 20;
  const legacyWeight = moduleWeight(db, module?.id);
  const legacyAttendance = getComponents(db, module?.id)
    .filter((c) => c.kind === "attendance")
    .reduce((sum, c) => sum + Number(c.weight || 0), 0);
  return {
    maxScore,
    attendanceScore:
      module?.attendanceScore ??
      (legacyWeight > 0
        ? round((legacyAttendance / legacyWeight) * maxScore)
        : 0),
  };
}
function calculateAttendance(db, studentId, moduleId, weight) {
  if (weight === 0)
    return { complete: true, points: 0, ratio: 0, recorded: 0, total: 0 };
  const sessions = db.sessions.filter((s) => s.moduleId === moduleId);
  let credited = 0,
    counted = 0,
    recorded = 0;
  for (const session of sessions) {
    const rec = db.attendance.find(
      (a) => a.sessionId === session.id && a.studentId === studentId,
    );
    if (
      !rec ||
      !(rec.status === "excused" || Object.hasOwn(statusPoints, rec.status))
    )
      continue;
    recorded++;
    if (rec.status === "excused") continue;
    counted++;
    credited += statusPoints[rec.status];
  }
  return {
    complete:
      sessions.length > 0 && recorded === sessions.length && counted > 0,
    points: counted > 0 ? round((credited / counted) * weight) : null,
    ratio: counted > 0 ? credited / counted : 0,
    recorded,
    total: sessions.length,
    reason: !sessions.length
      ? "جلسه‌ای ثبت نشده"
      : recorded < sessions.length
        ? "حضور برخی جلسات ثبت نشده"
        : counted === 0
          ? "همه جلسات غیبت موجه هستند"
          : "",
  };
}
function moduleBonus(db, studentId, moduleId) {
  const records = db.sessions
    .filter((s) => s.moduleId === moduleId)
    .flatMap((s) => s.bonusMarks || [])
    .filter((mark) => mark.studentId === studentId);
  return {
    points: round(records.reduce((sum, mark) => sum + mark.score, 0)),
    recorded: records.length,
  };
}
function setSessionBonus(db, sessionId, studentId, raw) {
  const session = db.sessions.find((s) => s.id === sessionId);
  const student = db.students.find((s) => s.id === studentId);
  if (
    !session ||
    !student ||
    session.classId !== student.classId ||
    (raw !== "" &&
      ((typeof raw !== "number" && typeof raw !== "string") ||
        !Number.isFinite(Number(raw)) ||
        Number(raw) < 0))
  )
    return false;
  const marks = (session.bonusMarks || []).filter(
    (mark) => mark.studentId !== studentId,
  );
  if (raw !== "") marks.push({ studentId, score: Number(raw) });
  session.bonusMarks = marks;
  return true;
}
function calculateModule(db, studentId, moduleId) {
  const { maxScore: max, attendanceScore } = moduleSettings(db, moduleId);
  const bonus = moduleBonus(db, studentId, moduleId);
  const configured =
    Number.isFinite(max) &&
    max > 0 &&
    Number.isFinite(attendanceScore) &&
    attendanceScore >= 0 &&
    attendanceScore <= max;
  const attendance = calculateAttendance(
    db,
    studentId,
    moduleId,
    attendanceScore,
  );
  const assessments = db.assessments.filter((a) => a.moduleId === moduleId);
  let earned = 0,
    maximum = 0,
    recorded = 0;
  const missing = [];
  for (const assessment of assessments) {
    const mark = db.marks.find(
      (m) => m.assessmentId === assessment.id && m.studentId === studentId,
    );
    maximum += Number(assessment.maxScore);
    if (mark && isScore(mark.score, assessment.maxScore)) {
      earned += Number(mark.score);
      recorded++;
    } else missing.push(assessment.title || "آیتم ارزشیابی");
  }
  const budget = max - attendanceScore;
  const assessmentComplete =
    budget === 0 || (maximum > 0 && recorded === assessments.length);
  const assessmentPoints = maximum > 0 ? (earned / maximum) * budget : 0;
  const pending = [
    ...(!attendance.complete ? ["حضور و غیاب: " + attendance.reason] : []),
    ...(budget > 0
      ? !assessments.length
        ? ["آزمون یا تمرینی تعریف نشده"]
        : missing
      : []),
  ];
  const hasData =
    (budget > 0 && recorded > 0) ||
    (attendanceScore > 0 && attendance.points !== null) ||
    bonus.recorded > 0;
  const total =
    configured && hasData
      ? round(
          Math.min(
            max,
            assessmentPoints +
              attendance.ratio * attendanceScore +
              bonus.points,
          ),
        )
      : null;
  return {
    configured,
    complete: configured && attendance.complete && assessmentComplete,
    total,
    provisional: total,
    max,
    attendance,
    bonus,
    assessmentPoints: round(assessmentPoints),
    recorded,
    assessmentCount: assessments.length,
    pending,
    breakdown: [
      {
        id: "attendance",
        name: "حضور و غیاب",
        kind: "attendance",
        weight: attendanceScore,
        result: attendance,
      },
      {
        id: "assessments",
        name: "آزمون‌ها و تمرین‌ها",
        kind: "assessment",
        weight: budget,
        result: {
          complete: assessmentComplete,
          points: round(assessmentPoints),
          reason: pending
            .filter((p) => !p.startsWith("حضور و غیاب:"))
            .join("، "),
        },
      },
    ],
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
  moduleSettings,
  calculateAttendance,
  moduleBonus,
  setSessionBonus,
  moduleWeight,
  attendanceStats,
  round,
  isScore,
};
