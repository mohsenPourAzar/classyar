import "server-only";
import { config } from "./config.mjs";
import { openStore } from "./mongodb.mjs";
import { initialState } from "./initial-state.mjs";

// Keep one connection across route calls and development hot reloads.
const cacheKey = Symbol.for("classyar.mongodb");
const versionKey = Symbol.for("classyar.mongodb.store-version");
const storeVersion = 4;

export function getStore() {
  // Development hot reload can retain a connection wrapper created before the
  // conversation methods existed. Replace that wrapper once, preserving data.
  if (globalThis[versionKey] !== storeVersion) {
    const previous = globalThis[cacheKey];
    delete globalThis[cacheKey];
    globalThis[versionKey] = storeVersion;
    if (previous) {
      const cleanup = setTimeout(
        () =>
          Promise.resolve(previous)
            .then((store) => store.close())
            .catch(() => {}),
        30_000,
      );
      cleanup.unref?.();
    }
  }
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
