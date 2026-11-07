import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePersianDate,
  formatPersianDate,
  persianToDate,
  persianParts,
  monthDays,
  monthOffset,
  shiftPersianDay,
  shiftPersianMonth,
  todayPersian,
} from "../src/lib/persian-date.mjs";

test("Persian date input accepts Persian, Arabic and Latin digits and canonicalizes storage", () => {
  for (const input of [
    "۱۴۰۵/۰۸/۱۶",
    "1405/8/16",
    "١٤٠٥/٠٨/١٦",
    "1405-08-16",
    "\u200f۱۴۰۵/۰۸/۱۶",
  ]) {
    assert.deepEqual(parsePersianDate(input), {
      year: 1405,
      month: 8,
      day: 16,
    });
    assert.equal(formatPersianDate(parsePersianDate(input)), "۱۴۰۵/۰۸/۱۶");
  }
});
test("calendar rejects malformed dates, impossible days and unsupported years", () => {
  for (const input of [
    "",
    "today",
    "2026-11-07",
    "۱۴۰۵/۱۳/۰۱",
    "۱۴۰۵/۰۷/۳۱",
    "۱۴۰۵/۰۱/۰۰",
    "۱۴۰۵/۰۲/۳۲",
    "۱۴۰۵/۸",
    "0999/1/1",
  ]) {
    assert.equal(parsePersianDate(input), null, input);
  }
});
test("UTC conversion handles Persian leap days and Gregorian year boundaries", () => {
  assert.equal(
    persianToDate(1403, 1, 1).toISOString(),
    "2024-03-20T00:00:00.000Z",
  );
  assert.equal(
    persianToDate(1403, 12, 30).toISOString(),
    "2025-03-20T00:00:00.000Z",
  );
  assert.equal(persianToDate(1402, 12, 30), null);
  assert.equal(monthDays(1403, 12).length, 30);
  assert.equal(monthDays(1402, 12).length, 29);
  for (const month of [1, 6, 7, 12]) {
    const date = { year: 1405, month, day: 20 };
    assert.deepEqual(
      persianParts(persianToDate(date.year, month, date.day)),
      date,
    );
  }
});
test("keyboard navigation crosses month and year boundaries and clamps shorter months", () => {
  assert.deepEqual(shiftPersianDay({ year: 1403, month: 12, day: 30 }, 1), {
    year: 1404,
    month: 1,
    day: 1,
  });
  assert.deepEqual(shiftPersianDay({ year: 1404, month: 1, day: 1 }, -1), {
    year: 1403,
    month: 12,
    day: 30,
  });
  assert.deepEqual(shiftPersianMonth({ year: 1405, month: 6, day: 31 }, 1), {
    year: 1405,
    month: 7,
    day: 30,
  });
  assert.equal(monthOffset(1403, 1), 4);
});
test("today uses Tehran midnight regardless of the host timezone", () => {
  assert.deepEqual(todayPersian(new Date("2024-03-19T21:00:00Z")), {
    year: 1403,
    month: 1,
    day: 1,
  });
  assert.deepEqual(todayPersian(new Date("2024-03-19T20:00:00Z")), {
    year: 1402,
    month: 12,
    day: 29,
  });
});
