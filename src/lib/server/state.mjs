import * as logic from "../classroom/logic.mjs";

export const collections = [
  "classes",
  "students",
  "modules",
  "components",
  "sessions",
  "attendance",
  "assessments",
  "marks",
];
const entities = [
  "classes",
  "students",
  "modules",
  "components",
  "sessions",
  "assessments",
];
export function validateState(state) {
  if (!logic.validateDatabase(state)) return false;
  if (
    collections.some((key) =>
      state[key].some(
        (record) =>
          !record || typeof record !== "object" || Array.isArray(record),
      ),
    )
  )
    return false;
  const ids = {};
  for (const key of entities) {
    ids[key] = new Set();
    for (const record of state[key]) {
      if (
        typeof record.id !== "string" ||
        !record.id.trim() ||
        ids[key].has(record.id)
      )
        return false;
      ids[key].add(record.id);
    }
  }
  const named = ["classes", "students", "modules", "components"];
  if (
    named.some((key) =>
      state[key].some(
        (record) => typeof record.name !== "string" || !record.name.trim(),
      ),
    )
  )
    return false;
  if (
    ["students", "modules", "sessions"].some((key) =>
      state[key].some((record) => !ids.classes.has(record.classId)),
    )
  )
    return false;
  if (
    ["components", "sessions", "assessments"].some((key) =>
      state[key].some((record) => !ids.modules.has(record.moduleId)),
    )
  )
    return false;
  const byModule = new Map(state.modules.map((record) => [record.id, record]));
  const byComponent = new Map(
    state.components.map((record) => [record.id, record]),
  );
  const byStudent = new Map(
    state.students.map((record) => [record.id, record]),
  );
  const bySession = new Map(
    state.sessions.map((record) => [record.id, record]),
  );
  const byAssessment = new Map(
    state.assessments.map((record) => [record.id, record]),
  );
  if (
    state.components.some(
      (record) =>
        !["assessment", "attendance"].includes(record.kind) ||
        typeof record.weight !== "number" ||
        !Number.isFinite(record.weight) ||
        record.weight < 0 ||
        record.weight > 20,
    )
  )
    return false;
  if (
    state.sessions.some(
      (record) => byModule.get(record.moduleId).classId !== record.classId,
    )
  )
    return false;
  if (
    state.assessments.some((record) => {
      const component = byComponent.get(record.componentId);
      return (
        !component ||
        component.moduleId !== record.moduleId ||
        typeof record.maxScore !== "number" ||
        !Number.isFinite(record.maxScore) ||
        record.maxScore <= 0
      );
    })
  )
    return false;
  const attendancePairs = new Set(),
    markPairs = new Set();
  for (const record of state.attendance) {
    const session = bySession.get(record.sessionId),
      student = byStudent.get(record.studentId),
      pair = JSON.stringify([record.sessionId, record.studentId]);
    if (
      !session ||
      !student ||
      session.classId !== student.classId ||
      !["present", "absent", "late", "excused"].includes(record.status) ||
      attendancePairs.has(pair)
    )
      return false;
    attendancePairs.add(pair);
  }
  for (const record of state.marks) {
    const assessment = byAssessment.get(record.assessmentId),
      student = byStudent.get(record.studentId),
      pair = JSON.stringify([record.assessmentId, record.studentId]);
    if (
      !assessment ||
      !student ||
      byModule.get(assessment.moduleId).classId !== student.classId ||
      typeof record.score !== "number" ||
      !Number.isFinite(record.score) ||
      record.score < 0 ||
      record.score > assessment.maxScore ||
      markPairs.has(pair)
    )
      return false;
    markPairs.add(pair);
  }
  return true;
}
export function normalizeState(state) {
  return logic.normalizedDatabase(state);
}
