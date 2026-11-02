import { MongoClient } from "mongodb";
import { normalizeState, validateState } from "./state.mjs";

export async function openStore({ uri, database }) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    writeConcern: { w: "majority", j: true },
  });
  try {
    await client.connect();
    await client.db(database).command({ ping: 1 });
  } catch (error) {
    await client.close();
    throw error;
  }
  const db = client.db(database),
    states = db.collection("app_state");
  const conversations = db.collection("conversations"),
    messages = db.collection("conversation_messages");
  try {
    await messages.createIndex({ conversationId: 1, order: -1 });
    await conversations.createIndex({ updatedAt: -1 });
  } catch (error) {
    await client.close();
    throw error;
  }
  async function updateConversation(filter, update, options) {
    try {
      return await conversations.updateOne(filter, update, options);
    } catch (error) {
      if (
        error.code === 11000 &&
        (
          await conversations.findOne(
            { _id: filter._id },
            { projection: { deleted: 1 } },
          )
        )?.deleted
      )
        throw Object.assign(Error("این گفتگو حذف شده است."), { status: 410 });
      throw error;
    }
  }
  return {
    async listConversations(before = Number.MAX_SAFE_INTEGER) {
      const records = await conversations
        .find({ updatedAt: { $lt: before }, deleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .limit(51)
        .toArray();
      return {
        conversations: records
          .slice(0, 50)
          .map(({ _id, ...record }) => ({ id: _id, ...record })),
        hasMore: records.length > 50,
      };
    },
    async saveConversation({ id, title, classId }) {
      if (
        (
          await conversations.findOne(
            { _id: id },
            { projection: { deleted: 1 } },
          )
        )?.deleted
      )
        throw Object.assign(Error("این گفتگو حذف شده است."), { status: 410 });
      await updateConversation(
        { _id: id, deleted: { $ne: true } },
        {
          $setOnInsert: {
            title: title || "گفتگوی جدید",
            classId: classId || "",
            createdAt: Date.now(),
          },
          $set: { updatedAt: Date.now() },
        },
        { upsert: true },
      );
    },
    async readMessages(id, before = Number.MAX_SAFE_INTEGER) {
      if (
        (
          await conversations.findOne(
            { _id: id },
            { projection: { deleted: 1 } },
          )
        )?.deleted
      )
        throw Object.assign(Error("این گفتگو حذف شده است."), { status: 410 });
      const records = await messages
        .find({ conversationId: id, order: { $lt: before } })
        .sort({ order: -1 })
        .limit(101)
        .toArray();
      return {
        messages: records
          .slice(0, 100)
          .reverse()
          .map(({ _id, conversationId, ...record }) => ({
            id: _id,
            ...record,
          })),
        hasMore: records.length > 100,
      };
    },
    async saveMessages(id, metadata, incoming) {
      if (
        (
          await conversations.findOne(
            { _id: id },
            { projection: { deleted: 1 } },
          )
        )?.deleted
      )
        throw Object.assign(Error("این گفتگو حذف شده است."), { status: 410 });
      await updateConversation(
        { _id: id, deleted: { $ne: true } },
        {
          $setOnInsert: {
            classId: metadata.classId || "",
            createdAt: Date.now(),
          },
          $set: {
            title: metadata.title || "گفتگوی جدید",
            updatedAt: Date.now(),
          },
        },
        { upsert: true },
      );
      if (incoming.length)
        await messages.bulkWrite(
          incoming.map(({ id: messageId, ...message }) => ({
            updateOne: {
              filter: { _id: messageId, conversationId: id },
              update: { $set: message, $setOnInsert: { conversationId: id } },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      if (
        (
          await conversations.findOne(
            { _id: id },
            { projection: { deleted: 1 } },
          )
        )?.deleted
      ) {
        await messages.deleteMany({ conversationId: id });
        throw Object.assign(Error("این گفتگو حذف شده است."), { status: 410 });
      }
    },
    async deleteConversation(id) {
      await conversations.updateOne(
        { _id: id },
        {
          $set: { deleted: true, deletedAt: Date.now(), updatedAt: Date.now() },
          $unset: { title: "", classId: "", createdAt: "" },
        },
        { upsert: true },
      );
      await messages.deleteMany({ conversationId: id });
    },
    async initialize(initial) {
      if (!validateState(initial))
        throw new Error("Invalid initial classroom data.");
      await states.updateOne(
        { _id: "primary" },
        {
          $setOnInsert: {
            data: normalizeState(initial),
            revision: 0,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      const current = await states.findOne({ _id: "primary" });
      if (!validateState(current.data))
        throw new Error("Invalid persisted classroom data.");
    },
    async read() {
      const record = await states.findOne({ _id: "primary" });
      return record
        ? {
            ...record.data,
            revision: record.revision,
            updatedAt: record.updatedAt.toISOString(),
          }
        : null;
    },
    async write(state, revision) {
      const result = await states.updateOne(
        { _id: "primary", revision },
        {
          $set: { data: normalizeState(state), updatedAt: new Date() },
          $inc: { revision: 1 },
        },
      );
      return result.matchedCount === 1 ? revision + 1 : null;
    },
    async ping() {
      await db.command({ ping: 1 });
    },
    async close() {
      await client.close();
    },
  };
}
