export const validChatId = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
export function storedMessage(message) {
  if (
    !message ||
    !validChatId(message.id) ||
    !["user", "assistant"].includes(message.role) ||
    typeof message.text !== "string" ||
    message.text.length > 12000 ||
    !Number.isSafeInteger(message.createdAt) ||
    !Number.isSafeInteger(message.order) ||
    message.order < 0
  )
    throw Error("پیام گفتگو معتبر نیست.");
  const result = {
    id: message.id,
    role: message.role,
    text: message.text,
    createdAt: message.createdAt,
    order: message.order,
    classId:
      typeof message.classId === "string" ? message.classId.slice(0, 100) : "",
    source: ["live", "chat", "audio"].includes(message.source)
      ? message.source
      : "chat",
    streaming: false,
  };
  if (typeof message.className === "string")
    result.className = message.className.slice(0, 200);
  if (
    [
      "answered",
      "applied",
      "local",
      "discarded",
      "replaced",
      "stale",
      "error",
    ].includes(message.status)
  )
    result.status = message.status;
  if (message.status === "pending" || message.status === "running")
    result.status = "stale";
  if (
    Array.isArray(message.plan?.changes) &&
    message.plan.changes.length <= 250
  )
    result.plan = {
      changes: message.plan.changes.map((change) =>
        Object.fromEntries(
          ["name", "target", "beforeLabel", "afterLabel"].map((key) => [
            key,
            String(change[key] ?? "").slice(0, 3000),
          ]),
        ),
      ),
      answers: [],
      commands: [],
    };
  return result;
}
