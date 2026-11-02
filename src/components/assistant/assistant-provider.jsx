"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { RealtimeVoice } from "../../lib/voice/realtime.mjs";
import { assistantCatalog } from "../../lib/classroom/assistant.mjs";
import useChatHistory from "./use-chat-history.jsx";
import {
  isSynchronized,
  planText,
  isFarewell,
} from "../../lib/voice/conversation.mjs";

const AssistantContext = createContext(null);
export const useAssistant = () => useContext(AssistantContext);
const id = () => crypto.randomUUID();
const activeStates = ["connecting", "listening", "speaking", "working"];
const blobData = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function AssistantProvider({ app, children }) {
  const history = useChatHistory(app.state.classId);
  const { messages, setMessages } = history;
  const [configured, setConfigured] = useState(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false),
    [liveState, setLiveState] = useState("idle"),
    [muted, setMuted] = useState(false),
    [level, setLevel] = useState(0),
    [expanded, setExpanded] = useState(false);
  const [context, setContext] = useState({
    moduleId: app.currentModule?.id || "all",
    sessionId: app.state.sessionId || "",
    assessmentId: app.state.assessmentId || "",
  });
  const latest = useRef({}),
    mounted = useRef(true),
    live = useRef(null),
    processing = useRef(false),
    committing = useRef(false),
    failedRequests = useRef(new Map()),
    abort = useRef(null),
    recorder = useRef(null),
    media = useRef(null),
    recordLimit = useRef(null),
    userMessage = useRef(null),
    modelMessage = useRef(null),
    turn = useRef(0),
    lastUser = useRef({ text: "", turn: 0 }),
    previousClass = useRef(app.state.classId),
    previousView = useRef(app.state.view),
    recordVersion = useRef(0),
    messageOrder = useRef(0);
  latest.current = {
    app,
    conversationId: history.conversationId,
    messages,
    context: {
      moduleId: app.modules.some((item) => item.id === context.moduleId)
        ? context.moduleId
        : "all",
      sessionId: app.classSessions.some((item) => item.id === context.sessionId)
        ? context.sessionId
        : "",
      assessmentId: app.state.db.assessments.some(
        (item) =>
          item.id === context.assessmentId &&
          app.modules.some((module) => module.id === item.moduleId),
      )
        ? context.assessmentId
        : "",
      classId: app.state.classId || "",
    },
    busy,
    liveState,
  };
  const liveActive = activeStates.includes(liveState);
  function append(message) {
    const key = id();
    messageOrder.current = Math.max(
      messageOrder.current + 1,
      Date.now() * 1000,
      ...latest.current.messages.map((item) => (item.order || 0) + 1),
    );
    const order = messageOrder.current;
    setMessages((items) =>
      [
        ...items,
        {
          id: key,
          createdAt: Date.now(),
          order,
          classId: latest.current.app.state.classId,
          className: latest.current.app.selectedClass?.name || "",
          ...message,
        },
      ].slice(-150),
    );
    return key;
  }
  function update(key, patch) {
    setMessages((items) =>
      items.map((message) =>
        message.id === key ? { ...message, ...patch } : message,
      ),
    );
  }
  function invalidatePreviews() {
    setMessages((items) =>
      items.some((message) => message.status === "pending")
        ? items.map((message) =>
            message.status === "pending"
              ? { ...message, status: "stale" }
              : message,
          )
        : items,
    );
  }
  function stopLive() {
    live.current?.stop();
    live.current = null;
    setLiveState("idle");
    setMuted(false);
    setLevel(0);
    userMessage.current = null;
    modelMessage.current = null;
    setMessages((items) =>
      items.map((message) =>
        message.streaming ? { ...message, streaming: false } : message,
      ),
    );
  }
  function stopRecording(cancel = false) {
    if (cancel) recordVersion.current++;
    const capture = recorder.current;
    if (capture) {
      if (cancel) capture.onstop = null;
      if (capture.state !== "inactive") capture.stop();
    }
    media.current?.getTracks().forEach((track) => track.stop());
    media.current = null;
    clearTimeout(recordLimit.current);
    if (cancel) {
      recorder.current = null;
      setRecording(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    setLiveState("idle");
    const controller = new AbortController();
    fetch("/api/assistant", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (mounted.current) setConfigured(data.configured === true);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("وضعیت دستیار دریافت نشد؛ اتصال سرور را بررسی کنید.");
      });
    return () => {
      mounted.current = false;
      controller.abort();
      abort.current?.abort();
      live.current?.stop();
      live.current = null;
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      media.current?.getTracks().forEach((track) => track.stop());
      clearTimeout(recordLimit.current);
    };
  }, []);
  useEffect(() => {
    if (previousClass.current === app.state.classId) return;
    previousClass.current = app.state.classId;
    stopRecording(true);
    abort.current?.abort();
    invalidatePreviews();
    setContext({
      moduleId: app.currentModule?.id || "all",
      sessionId: "",
      assessmentId: "",
    });
    setError("");
  }, [app.state.classId]);
  useEffect(() => {
    if (previousView.current !== app.state.view) {
      previousView.current = app.state.view;
      if (recorder.current || recording) stopRecording(true);
    }
  }, [app.state.view]);
  useEffect(() => {
    if (!liveActive)
      setMessages((items) =>
        items.some((message) => message.streaming)
          ? items.map((message) => ({ ...message, streaming: false }))
          : items,
      );
  }, [liveActive]);
  function changeContext(patch) {
    if (liveActive || busy || recording) return;
    invalidatePreviews("stale");
    setContext((value) => ({ ...value, ...patch }));
  }
  async function acceptPlan(
    plan,
    snapshot,
    fromLive = false,
    cancelled = () => false,
  ) {
    invalidatePreviews();
    const executes = plan.changes.length > 0 || plan.commands.length > 0;
    const messageId = append({
      role: "assistant",
      text: executes ? "در حال اجرای درخواست…" : planText(plan),
      plan,
      status: executes ? "running" : "answered",
      source: fromLive ? "live" : "chat",
    });
    if (!executes)
      return { answers: plan.answers, message: plan.message, applied: false };
    if (cancelled()) {
      update(messageId, {
        status: "discarded",
        text: "درخواست پیش از اجرا متوقف شد.",
      });
      return { cancelled: true, applied: false };
    }
    committing.current = true;
    try {
      const result = await latest.current.app.applyAssistantPlan(
        plan,
        snapshot,
      );
      let activeContext = { ...latest.current.context };
      for (const change of plan.changes.filter(
        (item) => item.type === "create_item",
      )) {
        if (
          change.entityType === "module" &&
          change.after.classId === latest.current.app.state.classId
        )
          activeContext = {
            ...activeContext,
            moduleId: change.itemId,
            sessionId: "",
            assessmentId: "",
          };
        if (
          change.entityType === "session" &&
          change.after.classId === latest.current.app.state.classId
        )
          activeContext = {
            ...activeContext,
            moduleId: change.after.moduleId,
            sessionId: change.itemId,
            assessmentId: "",
          };
        if (
          change.entityType === "assessment" &&
          latest.current.app.modules.some(
            (module) => module.id === change.after.moduleId,
          )
        )
          activeContext = {
            ...activeContext,
            moduleId: change.after.moduleId,
            assessmentId: change.itemId,
          };
      }
      if (
        plan.changes.some(
          (change) =>
            change.type === "create_item" &&
            ["module", "session", "assessment"].includes(change.entityType),
        )
      )
        await new Promise((resolve) =>
          latest.current.app.setState(
            {
              moduleId:
                activeContext.moduleId === "all"
                  ? null
                  : activeContext.moduleId,
              sessionId: activeContext.sessionId || null,
              assessmentId: activeContext.assessmentId || null,
            },
            resolve,
          ),
        );
      setContext(activeContext);
      latest.current.context = activeContext;
      const message = result.saved
        ? "درخواست انجام شد و در MongoDB ذخیره شد."
        : "درخواست روی این دستگاه اعمال شد؛ ذخیره در MongoDB هنوز انجام نشده و خودکار دوباره تلاش می‌شود.";
      update(messageId, {
        status: result.saved ? "applied" : "local",
        text: planText({ ...plan, message }),
      });
      return {
        ok: true,
        applied: true,
        ...result,
        message,
        answers: plan.answers,
        changes: plan.changes.map(({ name, target, afterLabel }) => ({
          name,
          target,
          value: afterLabel,
        })),
        catalog: assistantCatalog(
          latest.current.app.state.db,
          latest.current.context,
        ),
      };
    } catch (problem) {
      update(messageId, { status: "error", text: problem.message });
      return {
        error: problem.message,
        applied: false,
        needsUserInput: true,
        retryable: false,
      };
    } finally {
      committing.current = false;
    }
  }
  async function send(text, audio = null) {
    if (!history.ready) {
      setError("در حال بارگیری تاریخچهٔ گفتگو؛ کمی صبر کنید.");
      return;
    }
    text = text.trim();
    if ((!text && !audio) || processing.current || committing.current) return;
    setError("");
    const current = latest.current;
    if (live.current && activeStates.includes(current.liveState) && !audio) {
      if (isFarewell(text)) {
        append({ role: "user", text, source: "live" });
        stopLive();
        setExpanded(false);
        return;
      }
      failedRequests.current.clear();
      append({ role: "user", text, source: "live" });
      turn.current++;
      lastUser.current = { text, turn: turn.current };
      live.current.sendText(text);
      return;
    }
    const userId = append({
      role: "user",
      text: text || "پیام صوتی؛ در حال تبدیل به متن…",
      source: audio ? "audio" : "chat",
    });
    if (!isSynchronized(current.app)) {
      setError("ابتدا منتظر اتصال MongoDB و ذخیرهٔ تغییرات بمانید.");
      return;
    }
    processing.current = true;
    setBusy(true);
    abort.current = new AbortController();
    const snapshot = JSON.stringify(current.app.state.db);
    try {
      const history = current.messages
        .filter(
          (message) =>
            message.classId === current.app.state.classId &&
            message.status !== "pending",
        )
        .slice(-12)
        .map(({ role, text: value }) => ({ role, text: value.slice(0, 3000) }));
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          ...(audio ? { audio } : {}),
          context: current.context,
          revision: current.app.serverRevision,
          history,
        }),
        signal: AbortSignal.any([
          abort.current.signal,
          AbortSignal.timeout(70_000),
        ]),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "درخواست انجام نشد.");
      if (
        !mounted.current ||
        abort.current.signal.aborted ||
        current.conversationId !== latest.current.conversationId
      )
        return;
      if (audio) update(userId, { text: result.transcript || "پیام صوتی" });
      await acceptPlan(result, snapshot);
    } catch (problem) {
      if (
        mounted.current &&
        current.conversationId === latest.current.conversationId
      ) {
        const message =
          problem.name === "AbortError"
            ? "درخواست لغو شد."
            : problem.name === "TimeoutError"
              ? "زمان پاسخ تمام شد؛ دوباره تلاش کنید."
              : problem.message;
        setError(message);
        append({ role: "assistant", text: message, status: "error" });
      }
    } finally {
      processing.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function toggleRecording() {
    if (recorder.current) {
      stopRecording();
      return;
    }
    if (liveActive || processing.current) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "ضبط صدا به میکروفن و مرورگر جدید روی localhost یا HTTPS نیاز دارد.",
      );
      return;
    }
    setError("");
    setRecording(true);
    const generation = ++recordVersion.current,
      capturedClass = latest.current.app.state.classId;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (
        !mounted.current ||
        generation !== recordVersion.current ||
        capturedClass !== latest.current.app.state.classId
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      media.current = stream;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw Error("قالب صدای مرورگر پشتیبانی نمی‌شود.");
      const capture = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      recorder.current = capture;
      let chunks = [],
        bytes = 0;
      capture.ondataavailable = (event) => {
        bytes += event.data.size;
        chunks.push(event.data);
        if (bytes > 4_000_000 && capture.state !== "inactive") capture.stop();
      };
      capture.onerror = () => {
        stopRecording(true);
        setError("ضبط صدا انجام نشد؛ دوباره تلاش کنید.");
      };
      capture.onstop = async () => {
        stopRecording(true);
        if (!mounted.current) return;
        if (!bytes || bytes > 4_000_000) {
          setError("صدای ضبط‌شده خالی یا بیش از حد بزرگ است.");
          return;
        }
        try {
          const data = await blobData(new Blob(chunks, { type: mimeType }));
          if (
            mounted.current &&
            capturedClass === latest.current.app.state.classId
          )
            await send("", { data, mimeType: mimeType.split(";")[0] });
        } catch {
          setError("آماده‌سازی صدا انجام نشد.");
        }
        chunks = [];
      };
      capture.start(1000);
      recordLimit.current = setTimeout(() => stopRecording(), 60_000);
    } catch (problem) {
      stopRecording(true);
      setError(
        problem.name === "NotAllowedError"
          ? "اجازهٔ میکروفن داده نشد؛ دسترسی را در مرورگر فعال کنید."
          : problem.message,
      );
    }
  }
  function receiveLive(message) {
    const content = message.serverContent;
    if (message.notice)
      append({ role: "assistant", text: message.notice, source: "live" });
    const transcript = (kind, text) => {
      if (!text) return;
      const ref = kind === "user" ? userMessage : modelMessage;
      if (!ref.current) {
        const key = append({
          role: kind,
          text,
          source: "live",
          streaming: true,
        });
        if (kind === "user") failedRequests.current.clear();
        ref.current = { id: key, text };
        if (kind === "user") turn.current++;
      } else {
        ref.current.text = text.startsWith(ref.current.text)
          ? text
          : ref.current.text + text;
        update(ref.current.id, { text: ref.current.text });
      }
      if (kind === "user")
        lastUser.current = { text: ref.current.text, turn: turn.current };
    };
    transcript("user", content?.inputTranscription?.text);
    if (
      content?.inputTranscription?.text &&
      isFarewell(userMessage.current?.text || content.inputTranscription.text)
    ) {
      stopLive();
      setExpanded(false);
      return;
    }
    transcript("assistant", content?.outputTranscription?.text);
    if (content?.inputTranscription?.finished && userMessage.current) {
      update(userMessage.current.id, { streaming: false });
      userMessage.current = null;
    }
    if (content?.turnComplete || content?.interrupted) {
      for (const ref of [userMessage, modelMessage]) {
        if (ref.current) update(ref.current.id, { streaming: false });
        ref.current = null;
      }
    }
  }
  async function handleTool(call, cancelled) {
    if (cancelled()) return { error: "عملیات لغو شد." };
    if (call.name === "end_conversation") {
      stopLive();
      setExpanded(false);
      return { ended: true };
    }
    if (call.name === "get_context")
      return assistantCatalog(
        latest.current.app.state.db,
        latest.current.context,
      );
    if (call.name !== "classroom_request")
      return { error: "این ابزار در دسترس نیست." };
    const { app: currentApp, context: selected } = latest.current;
    if (
      currentApp.pendingChanges &&
      !currentApp.saving &&
      !currentApp.syncBlocked
    )
      await currentApp.saveToServer();
    const syncDeadline = Date.now() + 6000;
    while (currentApp.saving && !cancelled() && Date.now() < syncDeadline)
      await new Promise((resolve) => setTimeout(resolve, 100));
    if (!isSynchronized(currentApp))
      return {
        error: "تغییرات قبلی هنوز همگام نشده است؛ کمی صبر کنید.",
        retryable: true,
        needsUserInput: false,
      };
    const requestKey = JSON.stringify({
      actions: call.args?.actions,
      classId: selected.classId,
      revision: currentApp.serverRevision,
    });
    if (failedRequests.current.has(requestKey))
      return failedRequests.current.get(requestKey);
    const snapshot = JSON.stringify(currentApp.state.db);
    try {
      const response = await fetch("/api/assistant/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: call.args,
          context: selected,
          revision: currentApp.serverRevision,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          await currentApp.connectServer();
          return {
            error: result.error,
            retryable: true,
            needsUserInput: false,
            catalog: assistantCatalog(
              currentApp.state.db,
              latest.current.context,
            ),
          };
        }
        const failure = {
          ...result,
          retryable: false,
          needsUserInput: response.status === 400 || response.status === 422,
        };
        failedRequests.current.set(requestKey, failure);
        append({
          role: "assistant",
          text: result.error || "اطلاعات درخواست کامل نیست.",
          status: "error",
          source: "live",
        });
        return failure;
      }
      if (selected.classId !== latest.current.context.classId)
        return {
          error:
            "کلاس فعال تغییر کرده است؛ get_context را دریافت و درخواست را دوباره بررسی کنید.",
        };
      if (cancelled()) return { error: "عملیات لغو شد؛ تغییری اعمال نشد." };
      return acceptPlan(result, snapshot, true, cancelled);
    } catch {
      return { error: "ارتباط با سامانه برقرار نشد؛ هیچ تغییری ثبت نشد." };
    }
  }
  async function startLive() {
    if (!history.ready) return;
    if (live.current || busy || recording || committing.current) return;
    if (!isSynchronized(latest.current.app)) {
      setError("ابتدا منتظر اتصال MongoDB و ذخیرهٔ تغییرات بمانید.");
      setExpanded(true);
      return;
    }
    setExpanded(true);
    setError("");
    setLiveState("connecting");
    const voice = new RealtimeVoice({
      onMessage: receiveLive,
      onTool: handleTool,
      onState: (value) => {
        if (mounted.current) {
          setLiveState(value);
          if (value === "ended") live.current = null;
        }
      },
      onError: (value) => {
        if (mounted.current) {
          setError(value);
          live.current = null;
        }
      },
      onLevel: (value) => {
        if (mounted.current) setLevel(value);
      },
    });
    live.current = voice;
    try {
      await voice.prepare();
      if (voice.closed) return;
      const { app: currentApp, context: selected } = latest.current;
      const response = await fetch("/api/assistant/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: selected,
          revision: currentApp.serverRevision,
        }),
        signal: AbortSignal.any([
          voice.abort.signal,
          AbortSignal.timeout(20_000),
        ]),
      });
      const credentials = await response.json();
      if (!response.ok)
        throw Error(credentials.error || "مجوز مکالمه دریافت نشد.");
      if (!voice.closed)
        await voice.start({
          ...credentials,
          history: latest.current.messages
            .filter(
              (message) =>
                message.classId === latest.current.app.state.classId &&
                !message.streaming,
            )
            .slice(-12)
            .map(({ role, text }) => ({ role, text: text.slice(0, 3000) })),
        });
    } catch (problem) {
      if (!voice.closed)
        voice.fail(
          problem.name === "TimeoutError"
            ? "زمان دریافت مجوز مکالمه تمام شد؛ دوباره تلاش کنید."
            : problem.name === "NotAllowedError"
              ? "اجازهٔ میکروفن داده نشد؛ دسترسی را در مرورگر فعال کنید."
              : problem.message,
        );
    }
  }
  const value = {
    app,
    messages,
    configured,
    history,
    error,
    busy,
    recording,
    liveState,
    liveActive,
    muted,
    level,
    expanded,
    setExpanded,
    context: latest.current.context,
    changeContext,
    send,
    toggleRecording,
    cancelRecording: () => stopRecording(true),
    startLive,
    stopLive,
    toggleMute: () => {
      const next = !muted;
      live.current?.mute(next);
      setMuted(next);
    },
    interrupt: () => live.current?.interrupt(),
    clear: async () => {
      invalidatePreviews();
      setError("");
      await history.startNew();
    },
    selectHistory: async (id) => {
      stopLive();
      stopRecording(true);
      abort.current?.abort();
      invalidatePreviews();
      await history.select(id);
    },
    deleteHistory: async (id) => {
      if (id === history.conversationId) {
        stopLive();
        stopRecording(true);
        abort.current?.abort();
        invalidatePreviews();
      }
      try {
        await history.remove(id);
      } catch (problem) {
        setError(problem.message);
      }
    },
    cancel: () => abort.current?.abort(),
  };
  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}
