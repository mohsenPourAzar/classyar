"use client";
import { useEffect, useRef, useState } from "react";
import { useAssistant } from "./assistant-provider.jsx";
import { Button, Icon } from "../ui.jsx";
import { fmt } from "../../lib/format.mjs";

export const liveLabels = {
  idle: "آمادهٔ گفتگو",
  connecting: "در حال اتصال…",
  listening: "در حال گوش دادن",
  speaking: "در حال پاسخ دادن",
  working: "در حال انجام درخواست",
  ended: "مکالمه پایان یافت",
  error: "اتصال برقرار نیست",
};
export function AssistantScope({ compact = false }) {
  const assistant = useAssistant(),
    { app, context, changeContext } = assistant;
  return (
    <fieldset
      className={`assistant-context ${compact ? "compact" : ""}`}
      disabled={assistant.liveActive || assistant.busy || assistant.recording}
    >
      <legend>محدودهٔ کلاس</legend>
      <label>
        پودمان
        <select
          aria-label="پودمان دستیار"
          value={context.moduleId}
          onChange={(event) =>
            changeContext({ moduleId: event.target.value, assessmentId: "" })
          }
        >
          <option value="all">تمام پودمان‌ها</option>
          {app.modules.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        جلسه
        <select
          aria-label="جلسه دستیار"
          value={context.sessionId}
          onChange={(event) => changeContext({ sessionId: event.target.value })}
        >
          <option value="">جلسه مشخص نشده</option>
          {app.classSessions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · {item.date}
            </option>
          ))}
        </select>
      </label>
      <label>
        آزمون یا تمرین
        <select
          aria-label="ارزشیابی دستیار"
          value={context.assessmentId}
          onChange={(event) =>
            changeContext({ assessmentId: event.target.value })
          }
        >
          <option value="">ارزشیابی مشخص نشده</option>
          {app.state.db.assessments
            .filter(
              (item) =>
                app.modules.some((module) => module.id === item.moduleId) &&
                (context.moduleId === "all" ||
                  item.moduleId === context.moduleId),
            )
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} (از {fmt(item.maxScore)})
              </option>
            ))}
        </select>
      </label>
    </fieldset>
  );
}
export function AssistantMessage({ message, compact = false }) {
  const assistant = useAssistant(),
    plan = message.plan;
  return (
    <article
      className={`chat-message ${message.role} ${message.status === "error" ? "error" : ""}`}
      data-message-id={message.id}
    >
      <div className="chat-message-by">
        <Icon name={message.role === "user" ? "user" : "sparkle"} size={15} />
        <span>{message.role === "user" ? "شما" : "دستیار کلاس‌یار"}</span>
        {message.source === "live" && <span className="chat-source">زنده</span>}
        {message.source === "audio" && <Icon name="mic" size={12} />}
      </div>
      <p className="chat-message-text">{message.text}</p>
      {plan?.changes.length > 0 && (
        <div className="chat-change-preview">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>آیتم / دانش‌آموز</th>
                  {!compact && <th>عملیات / محدوده</th>}
                  <th>قبلی</th>
                  <th>جدید</th>
                </tr>
              </thead>
              <tbody>
                {plan.changes.map((change, index) => (
                  <tr key={index}>
                    <td>
                      {change.name}
                      {compact && (
                        <small className="muted">{change.target}</small>
                      )}
                    </td>
                    {!compact && <td>{change.target}</td>}
                    <td>{String(change.beforeLabel)}</td>
                    <td>{String(change.afterLabel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message.status && message.status !== "pending" && (
            <p className="chat-action-status" role="status">
              {
                {
                  applied: "در MongoDB ذخیره شد",
                  local: "روی این دستگاه اعمال شد؛ منتظر ذخیره در سرور",
                  discarded: "لغو شد",
                  replaced: "با درخواست جدید جایگزین شد",
                  stale:
                    "سابقهٔ فرمان قبلی؛ نتیجه را از اطلاعات فعلی بررسی کنید.",
                  running: "در حال ثبت…",
                }[message.status]
              }
            </p>
          )}
        </div>
      )}
      {message.streaming && (
        <span className="chat-stream-cursor" aria-label="در حال دریافت" />
      )}
    </article>
  );
}
export function ChatComposer({ compact = false }) {
  const assistant = useAssistant(),
    [text, setText] = useState("");
  const disabled =
    !assistant.history.ready ||
    assistant.busy ||
    assistant.recording ||
    assistant.liveState === "connecting";
  const submit = (event) => {
    event.preventDefault();
    if (!text.trim() || disabled) return;
    assistant.send(text);
    setText("");
  };
  return (
    <form
      className={`chat-composer ${compact ? "compact" : ""}`}
      onSubmit={submit}
    >
      <label
        className="sr-only"
        htmlFor={compact ? "floating-assistant-input" : "assistant-request"}
      >
        پیام شما
      </label>
      <textarea
        id={compact ? "floating-assistant-input" : "assistant-request"}
        rows={compact ? 1 : 2}
        maxLength={12000}
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            if (text.trim() && !disabled) {
              assistant.send(text);
              setText("");
            }
          }
        }}
        placeholder={
          assistant.recording
            ? "در حال ضبط پیام صوتی…"
            : assistant.liveActive
              ? "پیام به مکالمهٔ زنده…"
              : "هر سؤالی دارید بنویسید…"
        }
      />
      <div className="chat-composer-actions">
        <Button
          type="submit"
          icon="send"
          disabled={disabled || !text.trim() || !assistant.configured}
        >
          ارسال
        </Button>
        {!assistant.liveActive && (
          <Button
            icon={assistant.recording ? "stop" : "mic"}
            variant="ghost"
            disabled={
              assistant.busy ||
              !assistant.configured ||
              !assistant.history.ready
            }
            onClick={assistant.toggleRecording}
          >
            {assistant.recording ? "پایان و ارسال" : "پیام صوتی"}
          </Button>
        )}
        {assistant.recording && (
          <Button variant="ghost" onClick={assistant.cancelRecording}>
            لغو ضبط
          </Button>
        )}
        {assistant.busy && (
          <Button variant="ghost" onClick={assistant.cancel}>
            لغو درخواست
          </Button>
        )}
        <span className="chat-composer-hint">
          {assistant.busy ? "در حال بررسی…" : "Enter برای ارسال"}
        </span>
      </div>
    </form>
  );
}
export function MessageList({ compact = false }) {
  const assistant = useAssistant(),
    bottom = useRef(null),
    container = useRef(null),
    previousLast = useRef(null);
  const messages = assistant.messages;
  useEffect(() => {
    const list = container.current,
      last = messages.at(-1);
    if (
      list &&
      (!previousLast.current ||
        previousLast.current !== last?.id ||
        list.scrollHeight - list.scrollTop - list.clientHeight < 120)
    )
      list.scrollTop = list.scrollHeight;
    previousLast.current = last?.id;
  }, [messages.length, messages.at(-1)?.text]);
  return (
    <div
      className={`chat-messages ${compact ? "compact" : ""}`}
      ref={container}
      role="log"
      aria-label="پیام‌های گفتگو"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {assistant.history.hasEarlier && (
        <button
          type="button"
          className="chat-load-earlier"
          onClick={assistant.history.loadEarlier}
        >
          نمایش پیام‌های قبلی
        </button>
      )}
      {!assistant.history.ready ? (
        <p role="status">در حال بارگیری گفتگو…</p>
      ) : messages.length ? (
        messages.map((message) => (
          <AssistantMessage
            key={message.id}
            message={message}
            compact={compact}
          />
        ))
      ) : (
        <div className="chat-welcome">
          <span className="assistant-emblem">
            <Icon name="sparkle" size={28} />
          </span>
          <h3>سلام، چطور کمک کنم؟</h3>
          <p>سؤال بپرسید، نمره بخوانید یا حضور و غیاب را به من بسپارید.</p>
          {!compact && (
            <div className="chat-suggestions">
              {[
                "غایبین جلسه چه کسانی هستند؟",
                "نمره نهایی چگونه محاسبه می‌شود؟",
                "چطور یک آزمون اضافه کنم؟",
              ].map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={assistant.busy || !assistant.configured}
                  onClick={() => assistant.send(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={bottom} />
    </div>
  );
}
