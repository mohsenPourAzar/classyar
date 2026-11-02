import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { openStore } from "../src/lib/server/mongodb.mjs";
import { createConversationsApi } from "../src/lib/server/conversations.mjs";
import { config } from "../src/lib/server/config.mjs";
import seed from "../src/lib/classroom/seed.json" with { type: "json" };

test("MongoDB conversation history persists across reconnects, pages all messages and never replays pending changes", async () => {
  const database = `classyar_test_history_${process.pid}_${Date.now()}`;
  assert.match(database, /^classyar_test_history_\d+_\d+$/);
  const settings = {
    uri: process.env.MONGODB_TEST_URI || config.uri,
    database,
  };
  let store;
  try {
    store = await openStore(settings);
    await store.initialize(structuredClone(seed));
    const api = createConversationsApi(() => store),
      id = "history-test",
      context = { params: Promise.resolve({ id }) };
    const get = (before) =>
      new Request(
        `http://localhost/api/conversations/${id}/messages${before === undefined ? "" : `?before=${before}`}`,
      );
    const post = (value, headers = {}) =>
      new Request("http://localhost/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof value === "string" ? value : JSON.stringify(value),
      });
    assert.deepEqual(
      await (
        await api.list(new Request("http://localhost/api/conversations"))
      ).json(),
      { conversations: [], hasMore: false },
    );
    const metadata = { id, title: "گفتگوی آزمایشی", classId: "class-10" };
    assert.equal((await api.create(post(metadata))).status, 200);
    const messages = Array.from({ length: 105 }, (_, index) => ({
      id: `message-${index}`,
      order: 1000 + index,
      createdAt: Date.now(),
      role: index % 2 ? "assistant" : "user",
      text: `پیام فارسی ${index}`,
      classId: "class-10",
      source: "live",
    }));
    messages[104] = {
      ...messages[104],
      status: "pending",
      streaming: true,
      snapshot: "DO-NOT-PERSIST",
      plan: {
        changes: [
          {
            name: "دانش‌آموز نمونه",
            target: "نمره",
            beforeLabel: "۱۷",
            afterLabel: "۱۸",
            studentId: "do-not-restore-ids",
            after: 18,
          },
        ],
        commands: [{ type: "delete_item" }],
      },
    };
    for (let start = 0; start < messages.length; start += 20)
      assert.equal(
        (
          await api.save(
            post({ ...metadata, messages: messages.slice(start, start + 20) }),
            context,
          )
        ).status,
        200,
      );
    assert.equal((await store.read()).revision, 0);
    await store.close();
    store = await openStore(settings);
    const latest = await (await api.read(get(), context)).json();
    assert.equal(latest.messages.length, 100);
    assert.equal(latest.hasMore, true);
    assert.equal(latest.messages[0].id, "message-5");
    assert.equal(latest.messages.at(-1).id, "message-104");
    assert.equal(latest.messages.at(-1).status, "stale");
    assert.equal(latest.messages.at(-1).streaming, false);
    assert.ok(!JSON.stringify(latest).includes("DO-NOT-PERSIST"));
    assert.ok(!JSON.stringify(latest).includes("do-not-restore-ids"));
    assert.deepEqual(latest.messages.at(-1).plan.commands, []);
    const earlier = await (
      await api.read(get(latest.messages[0].order), context)
    ).json();
    assert.equal(earlier.messages.length, 5);
    assert.equal(earlier.hasMore, false);
    assert.equal(earlier.messages[0].id, "message-0");
    const changed = { ...messages[0], text: "پیام ویرایش‌شده" };
    await api.save(post({ ...metadata, messages: [changed] }), context);
    const first = await (await api.read(get(1001), context)).json();
    assert.equal(first.messages[0].text, "پیام ویرایش‌شده");
    const list = await (
      await api.list(new Request("http://localhost/api/conversations"))
    ).json();
    assert.equal(list.conversations[0].title, metadata.title);
    assert.equal(
      (
        await api.save(
          post({ ...metadata, messages: [{ ...messages[0], role: "system" }] }),
          context,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await api.save(
          post(
            { ...metadata, messages: [] },
            { Origin: "https://elsewhere.test" },
          ),
          context,
        )
      ).status,
      403,
    );
    assert.equal(
      (await api.save(post("x".repeat(500001)), context)).status,
      413,
    );
    assert.equal((await api.read(get(-1), context)).status, 400);
    const remove = (headers = {}) =>
      api.remove(
        new Request(`http://localhost/api/conversations/${id}`, {
          method: "DELETE",
          headers,
        }),
        context,
      );
    assert.equal(
      (await remove({ Origin: "https://elsewhere.test" })).status,
      403,
    );
    assert.equal(
      (await (await api.read(get(), context)).json()).messages.length,
      100,
    );
    assert.equal((await remove()).status, 200);
    assert.equal((await remove()).status, 200);
    assert.equal((await api.read(get(), context)).status, 410);
    assert.equal((await api.create(post(metadata))).status, 410);
    assert.equal(
      (await api.save(post({ ...metadata, messages: [messages[0]] }), context))
        .status,
      410,
    );
    assert.deepEqual(
      (
        await (
          await api.list(new Request("http://localhost/api/conversations"))
        ).json()
      ).conversations,
      [],
    );
    await store.close();
    store = await openStore(settings);
    assert.equal((await api.read(get(), context)).status, 410);
    const inspection = new MongoClient(settings.uri);
    try {
      await inspection.connect();
      const db = inspection.db(database);
      assert.equal(
        await db
          .collection("conversation_messages")
          .countDocuments({ conversationId: id }),
        0,
      );
      const tombstone = await db
        .collection("conversations")
        .findOne({ _id: id });
      assert.equal(tombstone.deleted, true);
      assert.equal(tombstone.title, undefined);
      assert.equal(tombstone.classId, undefined);
    } finally {
      await inspection.close();
    }
    assert.equal((await store.read()).revision, 0);
  } finally {
    await store?.close();
    const cleanup = new MongoClient(settings.uri);
    try {
      await cleanup.connect();
      await cleanup.db(database).dropDatabase();
    } finally {
      await cleanup.close();
    }
  }
});
