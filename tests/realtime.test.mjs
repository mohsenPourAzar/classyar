import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };
import { createRealtimeApi, liveConfig } from "../src/lib/server/realtime.mjs";
import { encodePCM, decodePCM } from "../src/lib/voice/realtime.mjs";
import { confirmationIntent } from "../src/lib/voice/conversation.mjs";
import { prepareAssistantPlan } from "../src/lib/classroom/assistant.mjs";

test("live API issues only constrained temporary tokens and validates classroom tools without writing", async () => {
  const state = { ...structuredClone(seed), revision: 8 },
    time = Date.now();
  state.sessions.push({
    id: "live-session",
    classId: "class-10",
    moduleId: "module-10-1",
    title: "جلسه نمونه",
  });
  let received,
    writes = 0;
  const getStore = async () => ({
    read: async () => state,
    write: async () => writes++,
  });
  const api = createRealtimeApi(getStore, {
    env: { GEMINI_API_KEY: "test-key" },
    now: () => time,
    issueToken: async (value) => {
      received = value;
      return { name: "auth_tokens/short-lived-test" };
    },
  });
  const payload = {
    revision: 8,
    context: {
      classId: "class-10",
      moduleId: "module-10-1",
      sessionId: "live-session",
    },
  };
  const request = (body = payload, headers = {}) =>
    new Request("http://localhost/api/assistant/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  const response = await api.token(request());
  assert.equal(response.status, 200);
  const token = await response.json();
  assert.ok(token.token.startsWith("auth_tokens/"));
  assert.ok(!JSON.stringify(token).includes("test-key"));
  assert.equal(token.model, "gemini-3.8-live");
  assert.ok(new Date(token.expiresAt).getTime() - time <= 15 * 60_000);
  assert.equal(received.apiKey, "test-key");
  assert.equal(received.config.responseModalities[0], "AUDIO");
  assert.deepEqual(received.config.inputAudioTranscription, {});
  assert.ok(
    received.config.tools[0].functionDeclarations.some(
      (tool) => tool.name === "classroom_request",
    ),
  );
  assert.ok(
    !received.config.systemInstruction.includes(
      state.students.find((student) => student.classId === state.classes[1].id)
        .id,
    ),
  );
  assert.equal(
    (await api.token(request(payload, { Origin: "https://other.example" })))
      .status,
    403,
  );
  assert.equal(
    (await api.token(request({ ...payload, revision: 7 }))).status,
    409,
  );
  assert.equal((await api.token(request("{"))).status, 400);
  assert.equal((await api.token(request("x".repeat(60001)))).status, 413);
  const preview = await api.tool(
    request({
      ...payload,
      proposal: {
        transcript: "غایب ثبت کن",
        actions: [
          {
            type: "set_attendance",
            student: state.students[0].name,
            status: "absent",
          },
        ],
      },
    }),
  );
  assert.equal(preview.status, 200);
  assert.equal((await preview.json()).changes[0].after, "absent");
  assert.equal(writes, 0);
  assert.equal(state.attendance.length, 0);
  assert.equal(
    (
      await api.tool(
        request({
          ...payload,
          proposal: {
            transcript: "نامعتبر",
            actions: [{ type: "delete_class" }],
          },
        }),
      )
    ).status,
    422,
  );
  assert.equal(
    (await createRealtimeApi(getStore, { env: {} }).token(request())).status,
    503,
  );
  const failing = createRealtimeApi(getStore, {
    env: { GEMINI_API_KEY: "never-return-this" },
    issueToken: async () => {
      throw Error("never-return-this");
    },
  });
  const failed = await failing.token(request());
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes("never-return-this"));
});
test("voice confirmation distinguishes new affirmative utterances from requests and negations", () => {
  for (const value of [
    "تأیید می‌کنم",
    "تایید میکنم",
    "بله، تأیید می‌کنم",
    "ثبت کن",
    "بله",
    "انجام بده",
  ])
    assert.equal(confirmationIntent(value), "confirm", value);
  for (const value of [
    "نه",
    "خیر",
    "تایید نمی‌کنم",
    "ثبت نکن",
    "انجام نده",
    "لغو",
  ])
    assert.equal(confirmationIntent(value), "decline", value);
  for (const value of [
    "نمره علی را ثبت کن",
    "بله ولی نمره را ۱۲ ثبت کن",
    "تایید چیست؟",
    "",
  ])
    assert.equal(confirmationIntent(value), null, value);
});
test("PCM audio is signed little-endian and survives base64 conversion", () => {
  const data = new ArrayBuffer(8),
    view = new DataView(data);
  [-32768, -16384, 0, 32767].forEach((value, index) =>
    view.setInt16(index * 2, value, true),
  );
  assert.deepEqual(
    [...decodePCM(encodePCM(data))],
    [-1, -0.5, 0, 32767 / 32768],
  );
  assert.throws(() => decodePCM(btoa("a")), /PCM/);
});
test("audio worklet resamples continuous input to 16kHz in bounded 100ms packets", async () => {
  const source = await readFile(
    new URL("../public/audio/pcm-capture.worklet.js", import.meta.url),
    "utf8",
  );
  for (const rate of [16000, 24000, 44100, 48000]) {
    let Processor;
    const packets = [];
    const sandbox = {
      sampleRate: rate,
      AudioWorkletProcessor: class {
        constructor() {
          this.port = { postMessage: (buffer) => packets.push(buffer) };
        }
      },
      registerProcessor: (name, type) => {
        assert.equal(name, "classyar-pcm");
        Processor = type;
      },
    };
    vm.runInNewContext(source, sandbox);
    const processor = new Processor();
    for (let offset = 0; offset < rate; offset += 128)
      assert.equal(
        processor.process([
          [new Float32Array(Math.min(128, rate - offset)).fill(0.5)],
        ]),
        true,
      );
    assert.equal(packets.length, 10, String(rate));
    assert.ok(packets.every((packet) => packet.byteLength === 3200));
    assert.equal(new Int16Array(packets[0])[0], 16384);
  }
});
test("chat replies handle general questions without inventing classroom changes", () => {
  const state = structuredClone(seed);
  const plan = prepareAssistantPlan(
    state,
    { classId: "class-10" },
    {
      transcript: "پایتخت ژاپن؟",
      clarification: "",
      reply: "توکیو پایتخت ژاپن است.",
      actions: [],
    },
  );
  assert.equal(plan.message, "توکیو پایتخت ژاپن است.");
  assert.equal(plan.changes.length, 0);
  assert.equal(liveConfig({}).responseModalities[0], "AUDIO");
});
