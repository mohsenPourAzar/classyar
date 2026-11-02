"use client";
import { useEffect } from "react";
import { useAssistant } from "./assistant-provider.jsx";
import {
  AssistantScope,
  ChatComposer,
  MessageList,
  liveLabels,
} from "./chat-ui.jsx";
import { Button, Icon } from "../ui.jsx";
import useFloatingPosition from "./use-floating-position.jsx";

export default function FloatingAssistant() {
  const assistant = useAssistant();
  const floating = useFloatingPosition(assistant.expanded);
  const moveButton = (
    <button
      type="button"
      className="floating-drag-handle"
      aria-label="جابه‌جایی پنجرهٔ دستیار"
      title="برای جابه‌جایی بکشید؛ با دوبار کلیک به جای اول برگردانید"
      {...floating.handle}
    >
      <Icon name="move" size={17} />
    </button>
  );
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") assistant.setExpanded(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [assistant.setExpanded]);
  return (
    <div
      ref={floating.element}
      style={floating.style}
      className={`floating-assistant no-print ${assistant.liveActive ? "is-live" : ""} ${floating.dragging ? "is-dragging" : ""}`}
    >
      {assistant.expanded && (
        <section
          id="floating-voice-panel"
          className="floating-voice-panel"
          role="region"
          aria-label="مکالمهٔ زنده با دستیار"
        >
          <header className="floating-voice-heading">
            {moveButton}
            <span className="assistant-emblem">
              <Icon name="mic" size={20} />
            </span>
            <div>
              <strong>دستیار صوتی زنده</strong>
              <small>
                {assistant.app.selectedClass?.name || "هنوز کلاسی انتخاب نشده"}
              </small>
            </div>
            <button
              type="button"
              className="subaction"
              aria-label="کوچک کردن پنجرهٔ دستیار"
              onClick={() => assistant.setExpanded(false)}
            >
              <Icon name="minus" size={18} />
            </button>
          </header>
          <div className="live-voice-status" role="status">
            <div
              className={`voice-orb ${assistant.liveState}`}
              style={{ "--voice-level": assistant.level }}
            >
              <Icon name={assistant.muted ? "mic-off" : "mic"} size={30} />
            </div>
            <strong>
              {assistant.muted
                ? "میکروفن خاموش است"
                : liveLabels[assistant.liveState]}
            </strong>
            <span>
              {assistant.liveActive
                ? "می‌توانید هنگام پاسخ دادن دستیار، صحبت کنید."
                : "گفتگوی پیوسته با صدا، همراه با انجام فرمان‌های شما"}
            </span>
          </div>
          <div className="live-voice-controls">
            {assistant.liveActive ? (
              <>
                <Button
                  icon="stop"
                  className="live-end"
                  onClick={assistant.stopLive}
                >
                  پایان مکالمه
                </Button>
                <Button
                  icon={assistant.muted ? "mic" : "mic-off"}
                  variant="ghost"
                  onClick={assistant.toggleMute}
                >
                  {assistant.muted ? "روشن کردن میکروفن" : "قطع میکروفن"}
                </Button>
              </>
            ) : (
              <Button
                icon="mic"
                disabled={
                  !assistant.configured ||
                  assistant.busy ||
                  assistant.recording ||
                  !assistant.history.ready
                }
                onClick={assistant.startLive}
              >
                شروع مکالمهٔ زنده
              </Button>
            )}
          </div>
          {assistant.error && (
            <p className="voice-error" role="alert">
              {assistant.error}
            </p>
          )}
          {assistant.configured === false && (
            <p className="voice-error">
              کلید Gemini را در .env سرور تنظیم کنید.
            </p>
          )}
          <details className="floating-voice-scope">
            <summary>محدودهٔ درخواست و تنظیم جلسه</summary>
            <AssistantScope compact />
          </details>
          <MessageList compact />
          <ChatComposer compact />
          <p className="voice-privacy">
            صدا، متن گفتگو و نتایج درخواست برای پاسخ‌گویی به Google ارسال
            می‌شود.
          </p>
        </section>
      )}
      <div className="floating-voice-launcher">
        {!assistant.expanded && moveButton}
        {assistant.liveActive && !assistant.expanded && (
          <button
            type="button"
            className="floating-quick-stop"
            aria-label="پایان مکالمهٔ زنده"
            onClick={assistant.stopLive}
          >
            <Icon name="stop" size={17} />
          </button>
        )}
        <button
          type="button"
          className="floating-voice-button"
          aria-label={
            assistant.liveActive
              ? "باز کردن مکالمهٔ صوتی فعال"
              : "باز کردن دستیار صوتی زنده"
          }
          aria-expanded={assistant.expanded}
          aria-controls="floating-voice-panel"
          onClick={() => assistant.setExpanded(!assistant.expanded)}
        >
          <span className="floating-mic-icon">
            <Icon
              name={assistant.expanded ? "chevron-down" : "mic"}
              size={22}
            />
          </span>
          <span>
            {assistant.liveActive
              ? liveLabels[assistant.liveState]
              : "گفتگوی زنده"}
          </span>
          {assistant.liveActive && <span className="live-indicator" />}
        </button>
      </div>
    </div>
  );
}
