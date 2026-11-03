"use client";
import { useLayoutEffect, useRef, useState } from "react";
const key = "classyar-voice-position-v1";
export default function useFloatingPosition(expanded) {
  const element = useRef(null),
    drag = useRef(null),
    current = useRef(null),
    frame = useRef(null),
    suppressClick = useRef(false);
  const [position, setPosition] = useState(null),
    [dragging, setDragging] = useState(false);
  const clamp = (x, y) => {
    const rect = element.current?.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0,
      top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth,
      height = viewport?.height || innerHeight;
    return {
      x: Math.max(left + 8, Math.min(x, left + width - (rect?.width || 0) - 8)),
      y: Math.max(top + 8, Math.min(y, top + height - (rect?.height || 0) - 8)),
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
      const node = element.current;
      if (!node) return;
      node.style.setProperty(
        "--voice-viewport-height",
        `${window.visualViewport?.height || innerHeight}px`,
      );
      node.style.setProperty(
        "--voice-viewport-width",
        `${window.visualViewport?.width || innerWidth}px`,
      );
      if (current.current) place(current.current, true);
      else {
        const rect = node.getBoundingClientRect(),
          next = clamp(rect.left, rect.top);
        if (Math.abs(next.x - rect.left) > 1 || Math.abs(next.y - rect.top) > 1)
          place(next);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (element.current) observer.observe(element.current);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);
  useLayoutEffect(() => {
    if (current.current) place(current.current, true);
  }, [expanded]);
  const finish = (event) => {
    const start = drag.current;
    if (start?.id !== event.pointerId) return;
    suppressClick.current = start.moved || event.type === "pointercancel";
    drag.current = null;
    setDragging(false);
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (start.moved && current.current) place(current.current, true);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handle = {
    onPointerDown: (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      const rect = element.current.getBoundingClientRect();
      suppressClick.current = false;
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
    },
    onPointerMove: (event) => {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 6) return;
      if (!start.moved) {
        start.moved = true;
        setDragging(true);
      }
      current.current = clamp(start.left + dx, start.top + dy);
      if (!frame.current)
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          setPosition(current.current);
        });
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: (event) => {
      if (drag.current?.id === event.pointerId) finish(event);
    },
    onClickCapture: (event) => {
      if (suppressClick.current && event.detail !== 0) {
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
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
