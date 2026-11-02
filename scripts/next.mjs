import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const mode = process.argv[2] || "dev";
process.env.NODE_ENV ||= mode === "start" ? "production" : "development";
const { config, root } = await import("../src/lib/server/config.mjs");
if (!["dev", "start"].includes(mode))
  throw new Error("Use npm run dev or npm start.");
if (
  !Number.isInteger(config.port) ||
  config.port < 1 ||
  config.port > 65535 ||
  config.port === 27017
) {
  console.error(
    "Set PORT in .env to a valid website port, such as 4173. MongoDB uses MONGODB_URI, normally on port 27017.",
  );
  process.exit(1);
}
if (mode === "start" && !fs.existsSync(path.join(root, ".next/BUILD_ID"))) {
  console.error(
    "No production build found. Run npm run build before npm start, or use npm run dev for development.",
  );
  process.exit(1);
}
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    mode,
    "--hostname",
    "127.0.0.1",
    "--port",
    String(config.port),
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
child.once("error", () => {
  console.error("Could not launch Next.js. Run npm ci and try again.");
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
