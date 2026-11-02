import test from "node:test";
import assert from "node:assert/strict";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import {
  assistantCatalog,
  prepareAssistantPlan,
  applyAssistantChanges,
} from "../src/lib/classroom/assistant.mjs";
import { createAssistantApi } from "../src/lib/server/assistant.mjs";
import { validateState } from "../src/lib/server/state.mjs";

const context = {
  classId: "class-10",
  moduleId: "module-10-1",
  sessionId: "voice-session",
  assessmentId: "voice-exam",
};
function fixture() {
  const db = structuredClone(seed);
  Object.assign(db.students[0], { name: "علی رضایی", studentCode: "1001" });
  Object.assign(db.students[1], { name: "علی احمدی", studentCode: "1002" });
  db.sessions.push({
    id: context.sessionId,
    classId: context.classId,
    moduleId: context.moduleId,
    title: "جلسه نمونه",
    date: "۱۴۰۵/۰۸/۱۲",
  });
  db.assessments.push({
    id: context.assessmentId,
    moduleId: context.moduleId,
    componentId: "component-10-exam",
    title: "آزمون نمونه",
    maxScore: 20,
  });
  return db;
}
const proposal = (actions) => ({
  transcript: "درخواست نمونه",
  clarification: "",
  actions,
});
test("assistant atomically prepares zero grades and explicit attendance; unanswered students remain unset", () => {
  const db = fixture(),
    snapshot = structuredClone(db);
  const plan = prepareAssistantPlan(
    db,
    context,
    proposal([
      { type: "set_mark", student: "۱۰۰۱", score: 0 },
      { type: "set_attendance", student: "علی رضایی", status: "absent" },
    ]),
  );
  assert.deepEqual(db, snapshot);
  assert.equal(plan.changes.length, 2);
  const next = applyAssistantChanges(db, plan.changes);
  assert.equal(next.marks[0].score, 0);
  assert.equal(next.attendance.length, 1);
  assert.ok(validateState(next));
  assert.throws(() => applyAssistantChanges(next, plan.changes), /تغییر/);
});
test("assistant rejects ambiguous names, cross-class targets, duplicate marks, unsupported and out-of-range actions", () => {
  const db = fixture(),
    snapshot = structuredClone(db);
  for (const actions of [
    [{ type: "set_mark", student: "علی", score: 18 }],
    [{ type: "set_mark", student: "علی رضایی", score: 21 }],
    [{ type: "set_mark", student: "علی رضایی", score: null }],
    [{ type: "set_mark", student: "علی رضایی", score: "0" }],
    [
      {
        type: "set_attendance",
        student: db.students.find((item) => item.classId === "class-11").name,
        status: "absent",
      },
    ],
    [{ type: "set_attendance", student: "علی رضایی", status: "unset" }],
    [
      { type: "set_mark", student: "1001", score: 18 },
      { type: "set_mark", student: "1001", score: 19 },
    ],
    [
      { type: "set_mark", student: "1001", score: 18 },
      { type: "delete_class" },
    ],
  ])
    assert.throws(() => prepareAssistantPlan(db, context, proposal(actions)));
  assert.deepEqual(db, snapshot);
  assert.throws(
    () =>
      prepareAssistantPlan(
        db,
        { ...context, sessionId: "" },
        proposal([{ type: "query_absent" }]),
      ),
    /جلسه/,
  );
  assert.throws(
    () =>
      prepareAssistantPlan(
        db,
        { ...context, assessmentId: "" },
        proposal([{ type: "set_mark", student: "1001", score: 18 }]),
      ),
    /آزمون/,
  );
});
test("mark remaining present requires an explicit action and preserves existing absences", () => {
  const db = fixture();
  db.attendance.push({
    sessionId: context.sessionId,
    studentId: db.students[1].id,
    status: "excused",
  });
  const plan = prepareAssistantPlan(
    db,
    context,
    proposal([
      { type: "mark_unset_present" },
      { type: "set_attendance", student: "1001", status: "absent" },
    ]),
  );
  const next = applyAssistantChanges(db, plan.changes);
  assert.equal(next.attendance.length, 24);
  assert.equal(
    next.attendance.find((item) => item.studentId === db.students[0].id).status,
    "absent",
  );
  assert.equal(
    next.attendance.find((item) => item.studentId === db.students[1].id).status,
    "excused",
  );
});
test("queries use actual stored zero and attendance, report missing data explicitly, and never mutate", () => {
  const db = fixture();
  db.marks.push({
    studentId: db.students[0].id,
    assessmentId: context.assessmentId,
    score: 0,
  });
  db.attendance.push({
    studentId: db.students[0].id,
    sessionId: context.sessionId,
    status: "absent",
  });
  const plan = prepareAssistantPlan(
    db,
    context,
    proposal([
      { type: "query_absent" },
      { type: "query_attendance", student: "1002" },
      {
        type: "query_grades",
        student: "1001",
        assessmentId: context.assessmentId,
      },
      { type: "query_grades", student: "1002" },
    ]),
  );
  assert.equal(plan.changes.length, 0);
  assert.equal(plan.answers[0].rows[0][0], "علی رضایی");
  assert.match(plan.answers[0].text, /ثبت‌نشده: 23/);
  assert.equal(plan.answers[1].rows[0][2], "ثبت نشده");
  assert.equal(plan.answers[2].rows[0][1], 0);
  assert.equal(plan.answers[3].rows[0][1], "ثبت نشده");
  db.sessions.push({
    ...db.sessions[0],
    id: "history-session",
    title: "جلسه بعد",
  });
  const history = prepareAssistantPlan(
    db,
    context,
    proposal([{ type: "query_attendance", student: "1001", sessionId: "all" }]),
  );
  assert.equal(history.answers[0].rows.length, 2);
});
test("catalog sends only selected class directory, never marks, notes or attendance to Gemini", () => {
  const db = fixture();
  db.students[0].note = "private note";
  const catalog = assistantCatalog(db, context),
    source = JSON.stringify(catalog);
  assert.equal(catalog.students.length, 24);
  for (const value of ["private note", '"marks":', '"attendance":'])
    assert.ok(!source.includes(value));
  assert.equal(catalog.classes.length, db.classes.length);
  assert.ok(
    catalog.students.every((student) =>
      db.students.some(
        (item) => item.id === student.id && item.classId === context.classId,
      ),
    ),
  );
  assert.ok(
    catalog.components.every((component) =>
      db.modules.some(
        (module) =>
          module.id === component.moduleId &&
          module.classId === context.classId,
      ),
    ),
  );
  const plan = prepareAssistantPlan(db, context, {
    ...proposal([{ type: "set_mark", student: "1001", score: 18 }]),
    clarification: "کدام آزمون؟",
  });
  assert.equal(plan.changes.length, 0);
});
test("assistant API validates origin, payload, limits, revisions and hides provider secrets", async () => {
  const db = { ...fixture(), revision: 7 };
  let calls = 0;
  const options = {
    env: { GEMINI_API_KEY: "test-secret" },
    interpret: async () => {
      calls++;
      return proposal([{ type: "set_mark", student: "1001", score: 0 }]);
    },
  };
  const makeApi = () =>
    createAssistantApi(async () => ({ read: async () => db }), options);
  const body = { text: "نمره را صفر ثبت کن", context, revision: 7 };
  const request = (payload = body, headers = {}) =>
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    });
  const api = makeApi();
  assert.deepEqual(await (await api.status()).json(), { configured: true });
  const response = await api.request(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).changes[0].after, 0);
  assert.equal(db.marks.length, 0);
  assert.equal(
    (await api.request(request(body, { Origin: "https://elsewhere.test" })))
      .status,
    403,
  );
  assert.equal((await api.request(request("{"))).status, 400);
  assert.equal(
    (await api.request(request({ ...body, revision: 6 }))).status,
    409,
  );
  assert.equal(
    (
      await api.request(
        request({
          ...body,
          audio: { mimeType: "text/html", data: "deadbeef" },
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await api.request(request(body, { "Content-Length": "6000001" }))).status,
    413,
  );
  assert.equal((await api.request(request("x".repeat(6_000_001)))).status, 413);
  assert.equal(calls, 1);
  const proxied = await makeApi().request(
    request(body, { Host: "127.0.0.1:4173", Origin: "http://127.0.0.1:4173" }),
  );
  assert.equal(proxied.status, 200);
  const failed = createAssistantApi(async () => ({ read: async () => db }), {
    ...options,
    interpret: async () => {
      throw Error("test-secret provider internals");
    },
  });
  const error = await failed.request(request());
  assert.equal(error.status, 502);
  assert.ok(!(await error.text()).includes("test-secret"));
  const disabled = createAssistantApi(
    () => {
      throw Error();
    },
    { env: {} },
  );
  assert.equal((await disabled.request(request())).status, 503);
  const limited = makeApi();
  for (let i = 0; i < 10; i++)
    assert.equal((await limited.request(request())).status, 200);
  assert.equal((await limited.request(request())).status, 429);
});
