"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatPersianDate,
  parsePersianDate,
  todayPersian,
  monthDays,
  monthOffset,
  shiftPersianDay,
  shiftPersianMonth,
  persianMonths,
  minYear,
  maxYear,
} from "../lib/persian-date.mjs";

const weekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
const number = (n) =>
  new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
export default function PersianDatePicker({
  id,
  name,
  defaultValue = "",
  required,
  disabled,
  ...props
}) {
  const uid = useId(),
    panelId = `${uid}-calendar`;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(
    () => parsePersianDate(defaultValue) || todayPersian(),
  );
  const [focusGrid, setFocusGrid] = useState(false);
  const root = useRef(null),
    input = useRef(null),
    trigger = useRef(null);
  const selected = parsePersianDate(value);
  const today = todayPersian();
  const days = monthDays(active.year, active.month);
  const cells = [
    ...Array(monthOffset(active.year, active.month)).fill(null),
    ...days,
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );
  const valid = !value || !!selected;
  useEffect(() => {
    input.current?.setCustomValidity(
      valid ? "" : "تاریخ شمسی معتبر را با قالب سال/ماه/روز وارد کنید.",
    );
  }, [valid]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => {
    if (open && focusGrid)
      root.current
        ?.querySelector(`[data-date="${formatPersianDate(active)}"]`)
        ?.focus();
  }, [open, focusGrid, active]);
  const choose = (date) => {
    setValue(date ? formatPersianDate(date) : "");
    input.current?.setCustomValidity("");
    setOpen(false);
    trigger.current?.focus();
  };
  const move = (next, focus = false) => {
    if (!next) return;
    setFocusGrid(focus);
    setActive(next);
  };
  const calendarKey = (event, date) => {
    let next;
    if (event.key === "ArrowLeft") next = shiftPersianDay(date, 1);
    else if (event.key === "ArrowRight") next = shiftPersianDay(date, -1);
    else if (event.key === "ArrowDown") next = shiftPersianDay(date, 7);
    else if (event.key === "ArrowUp") next = shiftPersianDay(date, -7);
    else if (event.key === "PageDown") next = shiftPersianMonth(date, 1);
    else if (event.key === "PageUp") next = shiftPersianMonth(date, -1);
    else if (event.key === "Home") next = { ...date, day: 1 };
    else if (event.key === "End")
      next = monthDays(date.year, date.month).at(-1);
    else return;
    event.preventDefault();
    move(next, true);
  };
  return (
    <div
      className="persian-date-picker"
      ref={root}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="date-input-row">
        <input
          {...props}
          ref={input}
          id={id}
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          type="text"
          dir="ltr"
          inputMode="numeric"
          placeholder="۱۴۰۵/۰۸/۱۶"
          autoComplete="off"
          aria-invalid={!valid || undefined}
          aria-describedby={!valid ? `${uid}-error` : undefined}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onBlur={() => {
            if (selected) setValue(formatPersianDate(selected));
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive(selected || today);
              setFocusGrid(true);
              setOpen(true);
            }
          }}
        />
        <button
          ref={trigger}
          type="button"
          className="date-calendar-trigger"
          disabled={disabled}
          aria-label="انتخاب تاریخ از تقویم شمسی"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setActive(selected || today);
            setFocusGrid(true);
            setOpen(!open);
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>
      {!valid && (
        <p className="date-error" id={`${uid}-error`}>
          تاریخ معتبر شمسی وارد کنید؛ مانند ۱۴۰۵/۰۸/۱۶.
        </p>
      )}
      {open && (
        <div
          className="date-calendar-panel"
          id={panelId}
          role="group"
          aria-label="تقویم شمسی"
          dir="rtl"
        >
          <div className="date-calendar-heading">
            <button
              type="button"
              className="date-calendar-nav"
              aria-label="ماه قبل"
              disabled={!shiftPersianMonth(active, -1)}
              onClick={() => move(shiftPersianMonth(active, -1))}
            >
              ‹
            </button>
            <select
              aria-label="ماه تقویم"
              value={active.month}
              onChange={(event) =>
                move({
                  year: active.year,
                  month: Number(event.target.value),
                  day: 1,
                })
              }
            >
              {persianMonths.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label="سال تقویم"
              value={active.year}
              onChange={(event) =>
                move({
                  year: Number(event.target.value),
                  month: active.month,
                  day: 1,
                })
              }
            >
              {Array.from(
                {
                  length:
                    Math.min(maxYear, active.year + 100) -
                    Math.max(minYear, active.year - 100) +
                    1,
                },
                (_, i) => Math.max(minYear, active.year - 100) + i,
              ).map((year) => (
                <option key={year} value={year}>
                  {number(year)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="date-calendar-nav"
              aria-label="ماه بعد"
              disabled={!shiftPersianMonth(active, 1)}
              onClick={() => move(shiftPersianMonth(active, 1))}
            >
              ›
            </button>
          </div>
          <p className="date-calendar-caption" aria-live="polite">
            {persianMonths[active.month - 1]} {number(active.year)}
          </p>
          <table
            className="date-calendar-grid"
            role="grid"
            aria-label={`${persianMonths[active.month - 1]} ${number(active.year)}`}
          >
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th scope="col" key={day} abbr={day}>
                    {day === "پنجشنبه"
                      ? "پ"
                      : day === "جمعه"
                        ? "ج"
                        : day.slice(0, 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, index) => (
                <tr key={index}>
                  {week.map((date, column) => {
                    const text = date ? formatPersianDate(date) : "";
                    return (
                      <td
                        key={column}
                        aria-selected={
                          date
                            ? text === (selected && formatPersianDate(selected))
                            : undefined
                        }
                      >
                        {date && (
                          <button
                            type="button"
                            data-date={text}
                            tabIndex={date.day === active.day ? 0 : -1}
                            aria-label={`${number(date.day)} ${persianMonths[date.month - 1]} ${number(date.year)}`}
                            aria-current={
                              text === formatPersianDate(today)
                                ? "date"
                                : undefined
                            }
                            onKeyDown={(event) => calendarKey(event, date)}
                            onClick={() => choose(date)}
                          >
                            {number(date.day)}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="date-calendar-actions">
            <button type="button" onClick={() => choose(today)}>
              امروز
            </button>
            {!required && (
              <button type="button" onClick={() => choose(null)}>
                پاک کردن
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              بستن تقویم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
