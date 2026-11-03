"use client";
import { useEffect } from "react";
import { useAssistant } from "./assistant-provider.jsx";
import { liveLabels } from "./chat-ui.jsx";
import { Button, Icon } from "../ui.jsx";
import useFloatingPosition from "./use-floating-position.jsx";
import BrandMark from "../brand-mark.jsx";

export default function FloatingAssistant() {
  const assistant = useAssistant();
  const floating = useFloatingPosition(assistant.expanded);
  const canStart =
    assistant.configured &&
    assistant.history.ready &&
    !assistant.history.deletingId &&
    !assistant.busy &&
    !assistant.recording;
  const recent = assistant.messages
    .filter((message) => message.text?.trim())
    .slice(-2);
  const toggle = () => {
    if (assistant.expanded) {
      assistant.setExpanded(false);
      return;
    }
    assistant.setExpanded(true);
    if (assistant.liveActive || canStart) assistant.startLive();
  };
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") assistant.setExpanded(false);
    };
    const dismiss = (event) => {
      if (
        floating.element.current &&
        !floating.element.current.contains(event.target)
      )
        assistant.setExpanded(false);
    };
    if (!assistant.expanded) return;
    window.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [assistant.expanded, assistant.setExpanded, floating.element]);
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
            <button
              type="button"
              className="floating-drag-handle"
              aria-label="جابه‌جایی پنجرهٔ دستیار"
              title="برای جابه‌جایی بکشید؛ با دوبار کلیک به جای اول برگردانید"
              {...floating.handle}
            >
              <Icon name="move" size={17} />
            </button>
            <BrandMark size={28} />
            <div>
              <strong>دستیار صوتی</strong>
              <small>{assistant.app.selectedClass?.name || "کلاس‌یار"}</small>
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
          <div className="floating-voice-body">
            <div className="live-voice-status" role="status">
              <div
                className={`voice-orb ${assistant.liveState}`}
                style={{ "--voice-level": assistant.level }}
              >
                <Icon name={assistant.muted ? "mic-off" : "mic"} size={26} />
              </div>
              <strong>
                {assistant.muted
                  ? "میکروفن خاموش است"
                  : liveLabels[assistant.liveState]}
              </strong>
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
                  disabled={!canStart}
                  onClick={assistant.startLive}
                >
                  شروع مکالمه
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
                دستیار صوتی هنوز در دسترس نیست؛ تنظیمات اتصال سرور را بررسی
                کنید.
              </p>
            )}
            {(!assistant.history.ready || assistant.configured === null) && (
              <p className="voice-summary-empty" role="status">
                در حال آماده‌سازی دستیار…
              </p>
            )}
            <div
              className="voice-summary"
              role="log"
              aria-label="خلاصهٔ آخرین گفتگو"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {recent.length ? (
                recent.map((message) => (
                  <div
                    key={message.id}
                    className={`voice-summary-line ${message.role}`}
                  >
                    <span>{message.role === "user" ? "شما" : "دستیار"}</span>
                    <p>
                      {message.text.slice(0, 240)}
                      {message.text.length > 240 ? "…" : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="voice-summary-empty">
                  صحبت کنید؛ آخرین گفتگو به‌صورت کوتاه اینجا نمایش داده می‌شود.
                </p>
              )}
            </div>
          </div>
          <footer className="floating-voice-footer">
            <button
              type="button"
              className="voice-clear-history"
              disabled={
                !assistant.history.ready ||
                !!assistant.history.deletingId ||
                !assistant.messages.length
              }
              onClick={() =>
                assistant.deleteHistory(assistant.history.conversationId)
              }
              title="حذف تاریخچهٔ این گفتگو و پایان مکالمهٔ فعال"
            >
              <Icon name="trash" size={15} />
              {assistant.history.deletingId
                ? "در حال حذف…"
                : "حذف تاریخچهٔ گفتگو"}
            </button>
          </footer>
        </section>
      )}
      <button
        type="button"
        className="floating-voice-button"
        aria-label={
          assistant.expanded
            ? "کوچک کردن دستیار صوتی"
            : assistant.liveActive
              ? "نمایش مکالمهٔ صوتی فعال"
              : "شروع مکالمه با دستیار صوتی"
        }
        title={
          assistant.expanded
            ? "کوچک کردن دستیار"
            : assistant.liveActive
              ? liveLabels[assistant.liveState]
              : "شروع دستیار صوتی"
        }
        aria-expanded={assistant.expanded}
        aria-controls="floating-voice-panel"
        {...floating.handle}
        onDoubleClick={undefined}
        onClick={toggle}
      >
        {assistant.expanded ? (
          <Icon name="chevron-down" size={26} />
        ) : (
          <span className="voice-wave-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
        {assistant.liveActive && (
          <span className="live-indicator" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
