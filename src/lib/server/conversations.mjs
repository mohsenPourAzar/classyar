import { storedMessage, validChatId } from "../voice/history.mjs";
const json = (value, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function body(request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let valid = false;
    try {
      const source = new URL(origin);
      valid =
        ["http:", "https:"].includes(source.protocol) &&
        source.host ===
          (request.headers.get("host") || new URL(request.url).host);
    } catch {}
    if (!valid)
      throw Object.assign(Error("درخواست از مبدا مجاز نیست."), { status: 403 });
  }
  if (
    !(request.headers.get("content-type") || "").startsWith("application/json")
  )
    throw Object.assign(Error("JSON لازم است."), { status: 415 });
  const chunks = [],
    reader = request.body?.getReader();
  let size = 0;
  if (Number(request.headers.get("content-length")) > 500_000)
    throw Object.assign(Error("حجم درخواست زیاد است."), { status: 413 });
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 500_000) {
        await reader.cancel();
        throw Object.assign(Error("حجم درخواست زیاد است."), { status: 413 });
      }
      chunks.push(value);
    }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(Error("درخواست معتبر نیست."), { status: 400 });
  }
}
const beforeValue = (request) => {
  const value = new URL(request.url).searchParams.get("before");
  if (value === null) return undefined;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0)
    throw Object.assign(Error("صفحهٔ گفتگو معتبر نیست."), { status: 400 });
  return number;
};
export function createConversationsApi(getStore) {
  const execute = (fn) => async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (!error.status)
        console.warn("Conversation history unavailable", {
          type: error.name,
          code: Number.isInteger(error.code) ? error.code : undefined,
        });
      return json(
        {
          error: error.status
            ? error.message
            : "تاریخچهٔ گفتگو در دسترس نیست؛ اتصال MongoDB را بررسی کنید.",
        },
        error.status || 503,
      );
    }
  };
  const metadata = (value) => {
    if (
      !value ||
      typeof value.title !== "string" ||
      value.title.length > 100 ||
      typeof value.classId !== "string" ||
      value.classId.length > 100
    )
      throw Object.assign(Error("مشخصات گفتگو معتبر نیست."), { status: 400 });
    return { title: value.title, classId: value.classId };
  };
  const conversationId = async (context) => {
    const { id } = await context.params;
    if (!validChatId(id))
      throw Object.assign(Error("گفتگو معتبر نیست."), { status: 400 });
    return id;
  };
  return {
    remove: execute(async (request, context) => {
      const origin = request.headers.get("origin");
      if (origin) {
        let valid = false;
        try {
          const source = new URL(origin);
          valid =
            ["http:", "https:"].includes(source.protocol) &&
            source.host ===
              (request.headers.get("host") || new URL(request.url).host);
        } catch {}
        if (!valid)
          throw Object.assign(Error("درخواست از مبدا مجاز نیست."), {
            status: 403,
          });
      }
      await (
        await getStore()
      ).deleteConversation(await conversationId(context));
      return json({ ok: true });
    }),
    list: execute(async (request) =>
      json(await (await getStore()).listConversations(beforeValue(request))),
    ),
    create: execute(async (request) => {
      const value = await body(request);
      if (!validChatId(value?.id))
        throw Object.assign(Error("گفتگو معتبر نیست."), { status: 400 });
      await (
        await getStore()
      ).saveConversation({ id: value.id, ...metadata(value) });
      return json({ ok: true, id: value.id });
    }),
    read: execute(async (request, context) =>
      json(
        await (
          await getStore()
        ).readMessages(await conversationId(context), beforeValue(request)),
      ),
    ),
    save: execute(async (request, context) => {
      const id = await conversationId(context),
        value = await body(request),
        meta = metadata(value);
      if (!Array.isArray(value.messages) || value.messages.length > 20)
        throw Object.assign(Error("تعداد پیام‌ها معتبر نیست."), {
          status: 400,
        });
      let messages;
      try {
        messages = value.messages.map(storedMessage);
      } catch (error) {
        throw Object.assign(error, { status: 400 });
      }
      await (await getStore()).saveMessages(id, meta, messages);
      return json({ ok: true, saved: messages.length });
    }),
  };
}
