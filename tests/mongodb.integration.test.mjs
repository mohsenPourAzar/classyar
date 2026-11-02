import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { openStore } from "../src/lib/server/mongodb.mjs";
import { createApi } from "../src/lib/server/api.mjs";
import { config } from "../src/lib/server/config.mjs";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };

test("Next.js API logic persists every collection, detects conflicts, and survives MongoDB reconnect", async (t) => {
  const database = "classyar_test_" + process.pid + "_" + Date.now();
  assert.match(database, /^classyar_test_\d+_\d+$/);
  const settings = {
    uri: process.env.MONGODB_TEST_URI || config.uri,
    database,
  };
  let store;
  const api = createApi(() => store);
  const put = (data, revision = 0, extras = {}) =>
    api.write(
      new Request("http://localhost/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"' + revision + '"',
          ...extras,
        },
        body: typeof data === "string" ? data : JSON.stringify(data),
      }),
    );
  try {
    store = await openStore(settings);
    await store.initialize(structuredClone(seed));
    assert.equal((await (await api.health()).json()).storage, "mongodb");
    const first = await api.read();
    assert.equal(first.headers.get("etag"), '"0"');
    assert.equal(first.headers.get("cache-control"), "no-store");
    const state = structuredClone(seed);
    state.sessions.push({
      id: "integration-session",
      classId: "class-10",
      moduleId: "module-10-1",
      title: "جلسه آزمایشی",
      date: "۱۴۰۵/۰۸/۱۱",
    });
    state.assessments.push({
      id: "integration-assessment",
      moduleId: "module-10-1",
      componentId: "component-10-exam",
      title: "آزمون نمونه",
      maxScore: 20,
    });
    state.attendance.push({
      sessionId: "integration-session",
      studentId: state.students[0].id,
      status: "present",
    });
    state.marks.push({
      assessmentId: "integration-assessment",
      studentId: state.students[0].id,
      score: 0,
    });
    assert.equal(
      (await put(state, 0, { "Content-Type": "text/plain" })).status,
      415,
    );
    assert.equal((await put(state, 0, { "If-Match": "" })).status, 428);
    assert.equal((await put("{")).status, 400);
    assert.equal((await put({ ...state, students: [null] })).status, 400);
    assert.equal(
      (await put("{}", 0, { "Content-Length": "12000001" })).status,
      413,
    );
    const saved = await put(state);
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).revision, 1);
    assert.equal((await put(seed)).status, 409);
    const current = await (await api.read()).json();
    for (const key of [
      "classes",
      "students",
      "modules",
      "components",
      "sessions",
      "attendance",
      "assessments",
      "marks",
    ])
      assert.deepEqual(current[key], state[key]);
    assert.equal(current.marks[0].score, 0);
    await store.initialize(seed);
    assert.equal((await store.read()).revision, 1);
    await store.close();
    store = await openStore(settings);
    const restarted = await (await api.read()).json();
    assert.equal(restarted.revision, 1);
    assert.deepEqual(restarted.marks, state.marks);
    await store.close();
    assert.equal((await api.read()).status, 503);
    assert.equal((await api.health()).status, 503);
    const offline = createApi(() => {
      throw new Error("mongodb://private-user:secret@private-host");
    });
    const offlineResponse = await offline.read();
    assert.equal(offlineResponse.status, 503);
    assert.equal(
      await offlineResponse.text(),
      '{"error":"database_unavailable"}',
    );
    t.diagnostic(
      "Verified MongoDB persistence, zero grades, revision conflicts, validation, body limits, reconnect, and sanitized availability errors.",
    );
  } finally {
    await store?.close();
    const cleanup = new MongoClient(settings.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    try {
      await cleanup.connect();
      await cleanup.db(database).dropDatabase();
    } finally {
      await cleanup.close();
    }
  }
});
