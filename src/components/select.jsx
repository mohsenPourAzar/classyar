"use client";
import { Children, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Select({
  children,
  value,
  defaultValue,
  onChange,
  className = "",
  id,
  disabled,
  required,
  name,
  ...props
}) {
  const generatedId = useId(),
    listId = `${generatedId}-options`;
  const options = Children.toArray(children)
    .filter((child) => child?.type === "option")
    .map((child) => ({
      value: String(child.props.value ?? child.props.children ?? ""),
      label: child.props.children,
      text: Children.toArray(child.props.children).join(""),
      disabled: !!child.props.disabled,
    }));
  const [localValue, setLocalValue] = useState(
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selectedValue = String(value ?? localValue);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );
  const selected = options[selectedIndex];
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [position, setPosition] = useState(null);
  const trigger = useRef(null),
    native = useRef(null),
    list = useRef(null),
    search = useRef({ text: "", at: 0 });
  const show = () => {
    if (trigger.current?.matches(":disabled") || !options.length) return;
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (index) => {
    const option = options[index];
    if (!option || option.disabled || trigger.current?.matches(":disabled")) {
      setOpen(false);
      return;
    }
    setLocalValue(option.value);
    native.current.value = option.value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    trigger.current.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0,
        top = viewport?.offsetTop || 0;
      const right = left + (viewport?.width || innerWidth);
      const bottom = top + (viewport?.height || innerHeight);
      const width = Math.min(Math.max(rect.width, 190), right - left - 16);
      const below = bottom - rect.bottom - 14,
        above = rect.top - top - 14;
      const upward = below < 180 && above > below;
      const height = Math.max(44, Math.min(280, upward ? above : below));
      setPosition({
        position: "fixed",
        width,
        maxHeight: height,
        left: Math.max(
          left + 8,
          Math.min(rect.right - width, right - width - 8),
        ),
        ...(upward
          ? { bottom: innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    };
    const dismiss = (event) => {
      if (
        !trigger.current?.contains(event.target) &&
        !list.current?.contains(event.target)
      )
        setOpen(false);
    };
    place();
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  useLayoutEffect(() => {
    const item = list.current?.children[active];
    if (!open || !item) return;
    const top = item.offsetTop,
      bottom = top + item.offsetHeight;
    if (top < list.current.scrollTop) list.current.scrollTop = top;
    else if (bottom > list.current.scrollTop + list.current.clientHeight)
      list.current.scrollTop = bottom - list.current.clientHeight;
  }, [open, active, position]);
  const keyDown = (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (open) choose(active);
      else show();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const indices = options
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0);
      if (!indices.length) return;
      const current = indices.indexOf(open ? active : selectedIndex);
      const next =
        event.key === "Home"
          ? indices[0]
          : event.key === "End"
            ? indices.at(-1)
            : indices[
                (Math.max(0, current) +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  indices.length) %
                  indices.length
              ];
      setActive(next);
      setOpen(true);
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      search.current = {
        text:
          now - search.current.at < 700
            ? search.current.text + event.key
            : event.key,
        at: now,
      };
      const text = search.current.text.toLocaleLowerCase("fa");
      const index = options.findIndex(
        (option) =>
          !option.disabled &&
          option.text.toLocaleLowerCase("fa").startsWith(text),
      );
      if (index >= 0) {
        setActive(index);
        setOpen(true);
      }
    }
  };
  return (
    <span className={`select-control ${className}`}>
      <select
        {...props}
        id={`${id || generatedId}-native`}
        ref={native}
        name={name}
        required={required}
        disabled={disabled}
        value={selected?.value ?? ""}
        tabIndex={-1}
        aria-hidden="true"
        className="select-native"
        onChange={(event) => {
          setLocalValue(event.target.value);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          trigger.current.focus();
          show();
        }}
      >
        {children}
      </select>
      <button
        id={id}
        ref={trigger}
        type="button"
        className="select-trigger"
        disabled={disabled || !options.length}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-required={required || undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={keyDown}
      >
        <span className="select-value">{selected?.label || "انتخاب کنید"}</span>
        <svg
          className="select-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="m7 10 5 5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={props["aria-label"] || "گزینه‌ها"}
            className="select-menu"
            style={position}
            onPointerDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                aria-disabled={option.disabled || undefined}
                className={`select-option ${index === active ? "is-active" : ""}`}
                onPointerMove={() => !option.disabled && setActive(index)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  choose(index);
                }}
              >
                <span>{option.label}</span>
                {index === selectedIndex && (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 4 4L19 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
