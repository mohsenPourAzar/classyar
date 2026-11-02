import { validateState } from "./state.mjs";

const maxBodyBytes = 12_000_000;
function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function unavailable(error) {
  // Never expose driver messages, connection strings, or classroom records.
  if (error.code === 10334 || error.name === "BSONError")
    return json({ error: "too_large" }, 413);
  return json({ error: "database_unavailable" }, 503);
}

export function createApi(getStore) {
  return {
    async health() {
      try {
        await (await getStore()).ping();
        return json({ ok: true, version: 3, storage: "mongodb" });
      } catch (error) {
        return unavailable(error);
      }
    },
    async read() {
      try {
        const state = await (await getStore()).read();
        return state
          ? json(state, 200, { ETag: `"${state.revision}"` })
          : json({ error: "not_initialized" }, 404);
      } catch (error) {
        return unavailable(error);
      }
    },
    async write(request) {
      if (
        !(request.headers.get("content-type") || "").startsWith(
          "application/json",
        )
      )
        return json({ error: "json_required" }, 415);
      const match = request.headers.get("if-match");
      if (!match || !/^"\d+"$/.test(match))
        return json({ error: "revision_required" }, 428);
      const revision = Number(match.slice(1, -1));
      if (!Number.isSafeInteger(revision))
        return json({ error: "invalid_revision" }, 400);
      if (Number(request.headers.get("content-length")) > maxBodyBytes)
        return json({ error: "too_large" }, 413);
      let payload;
      try {
        const reader = request.body?.getReader();
        const chunks = [];
        let size = 0;
        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > maxBodyBytes) {
              await reader.cancel();
              return json({ error: "too_large" }, 413);
            }
            chunks.push(value);
          }
        }
        payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return json({ error: "invalid_json" }, 400);
      }
      if (!validateState(payload))
        return json({ error: "invalid_schema" }, 400);
      try {
        const nextRevision = await (await getStore()).write(payload, revision);
        return nextRevision === null
          ? json({ error: "revision_conflict" }, 409)
          : json({ ok: true, storage: "mongodb", revision: nextRevision });
      } catch (error) {
        return unavailable(error);
      }
    },
  };
}
