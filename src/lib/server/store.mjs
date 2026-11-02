import "server-only";
import { config } from "./config.mjs";
import { openStore } from "./mongodb.mjs";
import { initialState } from "./initial-state.mjs";

// Keep one connection across route calls and development hot reloads.
const cacheKey = Symbol.for("classyar.mongodb");

export function getStore() {
  if (!globalThis[cacheKey]) {
    globalThis[cacheKey] = (async () => {
      const store = await openStore(config);
      try {
        if (!(await store.read())) await store.initialize(await initialState());
        return store;
      } catch (error) {
        await store.close();
        throw error;
      }
    })().catch((error) => {
      delete globalThis[cacheKey];
      throw error;
    });
  }
  return globalThis[cacheKey];
}
