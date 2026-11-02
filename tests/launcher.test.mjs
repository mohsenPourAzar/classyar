import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("launcher rejects a MongoDB port or invalid website port without exposing secrets", () => {
  for (const port of ["27017", "invalid", "-1", "65536"]) {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("../scripts/next.mjs", import.meta.url)), "dev"],
      {
        encoding: "utf8",
        timeout: 10000,
        env: {
          ...process.env,
          PORT: port,
          MONGODB_URI:
            "mongodb://private-user:do-not-print-this@localhost:27017",
        },
      },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /valid website port/);
    assert.doesNotMatch(result.stderr, /private-user|do-not-print-this/);
  }
});
