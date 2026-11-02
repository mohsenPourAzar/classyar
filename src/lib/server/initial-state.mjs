import fs from "node:fs/promises";
import path from "node:path";
import { root } from "./config.mjs";
import { normalizeState, validateState } from "./state.mjs";
import seed from "../classroom/seed.json" with { type: "json" };

export async function initialState() {
  try {
    const state = JSON.parse(
      await fs.readFile(path.join(root, "data/store.json"), "utf8"),
    );
    if (!validateState(state))
      throw new Error(
        "Invalid legacy classroom data. Preserve the original backup.",
      );
    return normalizeState(state);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return structuredClone(seed);
}
