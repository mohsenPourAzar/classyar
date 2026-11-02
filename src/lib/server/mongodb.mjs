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
  return {
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
