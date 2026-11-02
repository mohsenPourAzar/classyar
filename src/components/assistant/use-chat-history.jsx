"use client";
import { useEffect, useRef, useState } from "react";
import { storedMessage } from "../../lib/voice/history.mjs";

const cacheKey = "classyar-chat-history-v1";
function cached() {
  try {
    return JSON.parse(localStorage.getItem(cacheKey) || "null");
  } catch {
    return null;
  }
}
const unique = (items) => [
  ...new Map(items.map((item) => [item.id, item])).values(),
];
const sorted = (items) => unique(items).sort((a, b) => a.order - b.order);
async function jsonFetch(url, options) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(Error(data.error || "تاریخچه در دسترس نیست."), {
      status: response.status,
    });
  return data;
}
export default function useChatHistory(classId) {
  const initial = useRef(cached()),
    [conversationId, setConversationId] = useState(
      () => initial.current?.conversationId || crypto.randomUUID(),
    );
  const [messages, setMessages] = useState(
      () => initial.current?.messages || [],
    ),
    [conversations, setConversations] = useState(
      () => initial.current?.conversations || [],
    ),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("loading"),
    [hasEarlier, setHasEarlier] = useState(false),
    [hasMoreConversations, setHasMoreConversations] = useState(false),
    [deletingId, setDeletingId] = useState(null);
  const versions = useRef(new Map()),
    outbox = useRef(initial.current?.outbox || {}),
    sending = useRef(false),
    mounted = useRef(true),
    generation = useRef(0),
    latest = useRef({}),
    switching = useRef(false),
    deletedIds = useRef(new Set(initial.current?.deletedIds || []));
  latest.current = {
    conversationId,
    messages,
    conversations,
    ready,
    classId: classId || "",
  };
  const titleFor = (current) => {
    const existing = current.conversations.find(
      (item) => item.id === current.conversationId,
    )?.title;
    if (existing && existing !== "گفتگوی جدید") return existing;
    const first = current.messages.find(
      (item) => item.role === "user" && !item.text.startsWith("پیام صوتی؛"),
    );
    return first?.text.replace(/\s+/g, " ").slice(0, 80) || "گفتگوی جدید";
  };
  function dirty(current, includeStreaming = false) {
    if (deletedIds.current.has(current.conversationId)) return [];
    const result = [];
    for (const message of current.messages) {
      if (message.streaming && !includeStreaming) continue;
      try {
        const value = storedMessage(message);
        if (versions.current.get(value.id) !== JSON.stringify(value))
          result.push(value);
      } catch {}
    }
    return result;
  }
  function cache() {
    const current = latest.current;
    if (!current.ready) return;
    outbox.current[current.conversationId] = dirty(current, true);
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          conversationId: current.conversationId,
          messages: deletedIds.current.has(current.conversationId)
            ? []
            : current.messages.slice(-150).map(storedMessage),
          conversations: current.conversations.filter(
            (item) => !deletedIds.current.has(item.id),
          ),
          outbox: outbox.current,
          deletedIds: [...deletedIds.current],
        }),
      );
    } catch {}
  }
  function payload(current, incoming) {
    return {
      title: titleFor(current),
      classId: current.classId,
      messages: incoming,
    };
  }
  async function flush() {
    if (sending.current || !latest.current.ready || switching.current) return;
    sending.current = true;
    try {
      for (let batch = 0; batch < 20; batch++) {
        const current = latest.current,
          items = dirty(current).slice(0, 20);
        if (!items.length) {
          if (mounted.current) setStatus("saved");
          break;
        }
        if (mounted.current) setStatus("saving");
        await jsonFetch(
          `/api/conversations/${current.conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload(current, items)),
          },
        );
        for (const item of items)
          versions.current.set(item.id, JSON.stringify(item));
        if (mounted.current)
          setConversations((list) => {
            const meta = {
              id: current.conversationId,
              title: titleFor(current),
              classId: current.classId,
              updatedAt: Date.now(),
            };
            return [meta, ...list.filter((item) => item.id !== meta.id)];
          });
        if (latest.current.conversationId !== current.conversationId) break;
      }
      cache();
    } catch (error) {
      if (error.status === 410) {
        const removed = latest.current.conversationId;
        deletedIds.current.add(removed);
        delete outbox.current[removed];
        setConversations((list) => list.filter((item) => item.id !== removed));
        await startNew();
      } else if (mounted.current) setStatus("offline");
      cache();
    } finally {
      sending.current = false;
    }
  }
  async function listMore() {
    const current = latest.current.conversations,
      before = current.at(-1)?.updatedAt;
    try {
      const result = await jsonFetch(
        `/api/conversations${before ? `?before=${before}` : ""}`,
      );
      setConversations((items) => unique([...items, ...result.conversations]));
      setHasMoreConversations(result.hasMore);
    } catch {
      setStatus("offline");
    }
  }
  async function load(id, { initialLoad = false } = {}) {
    const run = ++generation.current;
    if (!initialLoad) await flush();
    switching.current = true;
    setReady(false);
    try {
      const result = await jsonFetch(`/api/conversations/${id}/messages`);
      if (!mounted.current || generation.current !== run) return;
      for (const item of result.messages)
        versions.current.set(item.id, JSON.stringify(item));
      setMessages(sorted([...result.messages, ...(outbox.current[id] || [])]));
      setHasEarlier(result.hasMore);
      setConversationId(id);
      setStatus("saved");
    } catch (error) {
      if (!mounted.current || generation.current !== run) return;
      if (error.status === 410) {
        deletedIds.current.add(id);
        delete outbox.current[id];
        setConversations((list) => list.filter((item) => item.id !== id));
        setMessages([]);
        setConversationId(crypto.randomUUID());
        setStatus("saved");
        setHasEarlier(false);
        return;
      }
      setMessages(
        initialLoad
          ? initial.current?.messages || []
          : outbox.current[id] || [],
      );
      setConversationId(id);
      setStatus("offline");
      setHasEarlier(false);
    } finally {
      switching.current = false;
      if (mounted.current && generation.current === run) setReady(true);
    }
  }
  async function startNew() {
    await flush();
    const id = crypto.randomUUID(),
      meta = {
        id,
        title: "گفتگوی جدید",
        classId: latest.current.classId,
        updatedAt: Date.now(),
      };
    setConversations((items) => [meta, ...items]);
    setConversationId(id);
    setMessages([]);
    setHasEarlier(false);
    setReady(true);
    try {
      await jsonFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
    } catch {
      setStatus("offline");
    }
  }
  async function loadEarlier() {
    const current = latest.current,
      before = current.messages[0]?.order;
    if (before === undefined) return;
    try {
      const result = await jsonFetch(
        `/api/conversations/${current.conversationId}/messages?before=${before}`,
      );
      if (latest.current.conversationId !== current.conversationId) return;
      for (const item of result.messages)
        versions.current.set(item.id, JSON.stringify(item));
      setMessages((items) => sorted([...result.messages, ...items]));
      setHasEarlier(result.hasMore);
    } catch {
      setStatus("offline");
    }
  }
  async function remove(id) {
    if (deletingId) return;
    setDeletingId(id);
    deletedIds.current.add(id);
    try {
      const deadline = Date.now() + 11000;
      while (sending.current && Date.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 50));
      await jsonFetch(`/api/conversations/${id}`, { method: "DELETE" });
      delete outbox.current[id];
      setConversations((items) => items.filter((item) => item.id !== id));
      if (latest.current.conversationId === id) {
        setMessages([]);
        await startNew();
      }
      cache();
    } catch (error) {
      deletedIds.current.delete(id);
      setStatus("offline");
      throw error;
    } finally {
      setDeletingId(null);
    }
  }
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const result = await jsonFetch("/api/conversations");
        if (!mounted.current) return;
        const localId = initial.current?.conversationId;
        const id =
          localId &&
          (result.conversations.some((item) => item.id === localId) ||
            outbox.current[localId]?.length)
            ? localId
            : result.conversations[0]?.id || latest.current.conversationId;
        const localMeta = (initial.current?.conversations || []).filter(
          (item) => outbox.current[item.id]?.length,
        );
        setConversations(unique([...localMeta, ...result.conversations]));
        setHasMoreConversations(result.hasMore);
        // Restore offline message batches from other conversations as well.
        for (const [conversation, drafts] of Object.entries(outbox.current)) {
          if (conversation === id || !drafts.length) continue;
          const meta = localMeta.find((item) => item.id === conversation) || {
            title: "گفتگوی بازیابی‌شده",
            classId: "",
          };
          for (let offset = 0; offset < drafts.length; offset += 20)
            try {
              await jsonFetch(`/api/conversations/${conversation}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...meta,
                  messages: drafts.slice(offset, offset + 20),
                }),
              });
            } catch (error) {
              if (error.status !== 410) throw error;
              deletedIds.current.add(conversation);
              break;
            }
          outbox.current[conversation] = [];
        }
        await load(id, { initialLoad: true });
      } catch {
        if (mounted.current) {
          setReady(true);
          setStatus("offline");
        }
      }
    })();
    const timer = setInterval(() => flush(), 5000);
    const pagehide = () => {
      cache();
      const current = latest.current;
      let items = dirty(current, true).slice(-20);
      while (
        items.length &&
        new Blob([JSON.stringify(payload(current, items))]).size > 60000
      )
        items.shift();
      if (items.length)
        navigator.sendBeacon(
          `/api/conversations/${current.conversationId}/messages`,
          new Blob([JSON.stringify(payload(current, items))], {
            type: "application/json",
          }),
        );
    };
    window.addEventListener("pagehide", pagehide);
    return () => {
      pagehide();
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("pagehide", pagehide);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    cache();
    const timer = setTimeout(() => flush(), 700);
    return () => clearTimeout(timer);
  }, [messages, conversationId, ready]);
  return {
    messages,
    setMessages,
    conversationId,
    conversations,
    ready,
    status,
    hasEarlier,
    hasMoreConversations,
    loadEarlier,
    listMore,
    startNew,
    select: load,
    remove,
    deletingId,
  };
}
