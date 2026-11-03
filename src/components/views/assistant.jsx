"use client";
import { useAssistant } from "../assistant/assistant-provider.jsx";
import {
  AssistantScope,
  ChatComposer,
  MessageList,
} from "../assistant/chat-ui.jsx";
import { Button, PageHeading, Icon } from "../ui.jsx";

export default function Assistant() {
  const assistant = useAssistant();
  return (
    <div className="assistant-chat-page">
      <PageHeading
        title="گفتگو با دستیار"
        description="سؤال‌های خود را بنویسید یا پیام صوتی بفرستید؛ گفتگو و درخواست‌های کلاس در یکجا."
      >
        <Button icon="mic" onClick={assistant.startLive}>
          دستیار صوتی زنده
        </Button>
        <Button
          icon="plus"
          variant="ghost"
          disabled={
            assistant.liveActive ||
            assistant.busy ||
            assistant.recording ||
            !assistant.history.ready
          }
          onClick={assistant.clear}
        >
          گفتگوی جدید
        </Button>
      </PageHeading>
      <details className="card chat-scope-card">
        <summary>
          <strong>محدودهٔ گفتگو</strong>
          <span>
            {assistant.context.sessionId
              ? assistant.app.classSessions.find(
                  (item) => item.id === assistant.context.sessionId,
                )?.title
              : "انتخاب جلسه و آزمون برای فرمان‌های کلاس"}
          </span>
        </summary>
        <AssistantScope />
      </details>
      <div className="chat-workspace">
        <aside
          className="card chat-history-panel"
          aria-label="تاریخچهٔ گفتگوها"
        >
          <div className="chat-history-heading">
            <Icon name="history" size={17} />
            <strong>گفتگوهای شما</strong>
          </div>
          <div className="chat-history-list">
            {assistant.history.conversations.map((conversation) => (
              <div className="chat-history-entry" key={conversation.id}>
                <button
                  type="button"
                  key={conversation.id}
                  data-conversation-id={conversation.id}
                  className={
                    conversation.id === assistant.history.conversationId
                      ? "active"
                      : ""
                  }
                  disabled={
                    assistant.busy ||
                    assistant.recording ||
                    !assistant.history.ready
                  }
                  onClick={() => assistant.selectHistory(conversation.id)}
                >
                  <span>{conversation.title}</span>
                  <small>
                    {new Intl.DateTimeFormat("fa-IR", {
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Tehran",
                    }).format(new Date(conversation.updatedAt))}
                  </small>
                </button>
                <button
                  type="button"
                  className="chat-history-delete"
                  aria-label={`حذف گفتگو: ${conversation.title}`}
                  title="حذف گفتگو"
                  disabled={
                    assistant.busy ||
                    assistant.recording ||
                    Boolean(assistant.history.deletingId) ||
                    !assistant.history.ready
                  }
                  onClick={() => assistant.deleteHistory(conversation.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
            {!assistant.history.conversations.length && (
              <p className="muted">اولین گفتگوی خود را شروع کنید.</p>
            )}
            {assistant.history.hasMoreConversations && (
              <button type="button" onClick={assistant.history.listMore}>
                گفتگوهای بیشتر
              </button>
            )}
          </div>
          <p className="chat-history-status" role="status">
            {
              {
                loading: "بارگیری تاریخچه…",
                saving: "در حال ذخیرهٔ گفتگو…",
                saved: "تاریخچه در MongoDB ذخیره می‌شود",
                offline: "ذخیرهٔ موقت روی دستگاه؛ در انتظار اتصال MongoDB",
              }[assistant.history.status]
            }
          </p>
        </aside>
        <section
          className="card assistant-chat-shell"
          aria-label="چت‌بات کلاس‌یار"
        >
          <MessageList />
          <ChatComposer />
          <p className="chat-privacy">
            گفتگو با Google پردازش و در MongoDB نگهداری می‌شود.
          </p>
        </section>
      </div>
      {assistant.configured === false && (
        <div className="note warning-note" role="status">
          کلید Gemini را در فایل محلی .env تنظیم و سرور را دوباره اجرا کنید.
        </div>
      )}
      {assistant.error && (
        <div className="note warning-note" role="alert">
          {assistant.error}
        </div>
      )}
    </div>
  );
}
