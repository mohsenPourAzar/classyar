"use client";
import { useLayoutEffect, useRef, useState } from "react";
const key = "classyar-voice-position-v1";
export default function useFloatingPosition(expanded) {
  const element = useRef(null),
    drag = useRef(null),
    current = useRef(null),
    frame = useRef(null);
  const [position, setPosition] = useState(null),
    [dragging, setDragging] = useState(false);
  const clamp = (x, y) => {
    const rect = element.current?.getBoundingClientRect();
    return {
      x: Math.max(8, Math.min(x, innerWidth - (rect?.width || 0) - 8)),
      y: Math.max(8, Math.min(y, innerHeight - (rect?.height || 0) - 8)),
    };
  };
  const place = (value, persist = false) => {
    const next = clamp(value.x, value.y);
    current.current = next;
    setPosition(next);
    if (persist)
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
  };
  const reset = () => {
    current.current = null;
    setPosition(null);
    try {
      localStorage.removeItem(key);
    } catch {}
  };
  useLayoutEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))
        place(saved);
    } catch {}
    const resize = () => {
      if (current.current) place(current.current, true);
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);
  useLayoutEffect(() => {
    if (current.current) place(current.current, true);
  }, [expanded]);
  const finish = (event) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (current.current) place(current.current, true);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handle = {
    onPointerDown: (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      const rect = element.current.getBoundingClientRect();
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: rect.left,
        top: rect.top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
      setDragging(true);
    },
    onPointerMove: (event) => {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      current.current = clamp(
        start.left + event.clientX - start.x,
        start.top + event.clientY - start.y,
      );
      if (!frame.current)
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          setPosition(current.current);
        });
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: () => {
      drag.current = null;
      setDragging(false);
    },
    onDoubleClick: reset,
    onKeyDown: (event) => {
      if (event.key === "Home") {
        event.preventDefault();
        reset();
        return;
      }
      const deltas = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        },
        delta = deltas[event.key];
      if (!delta) return;
      event.preventDefault();
      const rect = element.current.getBoundingClientRect(),
        step = event.shiftKey ? 30 : 10;
      place(
        { x: rect.left + delta[0] * step, y: rect.top + delta[1] * step },
        true,
      );
    },
  };
  return {
    element,
    dragging,
    handle,
    style: position
      ? { left: position.x, top: position.y, bottom: "auto", right: "auto" }
      : undefined,
  };
}
