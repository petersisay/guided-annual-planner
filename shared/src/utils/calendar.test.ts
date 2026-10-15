import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInYear,
  getDaysInMonth,
  getAllYearDates,
  generateMonthGrid,
  formatDateStr,
  getISOWeeksInYear,
  isValidISOWeek,
  getWeekDates,
  isValidDateStr,
  getPreviousDay,
  getNextDay,
  getDayOfWeekName,
  formatDisplayDate,
} from './calendar';

describe('Calendar and Leap Year Utilities', () => {
  it('correctly calculates leap years across centuries and quadrennials', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(1900)).toBe(false); // Divisible by 100 but not 400
    expect(isLeapYear(2000)).toBe(true); // Divisible by 400
  });

  it('computes exact days in year', () => {
    expect(getDaysInYear(2026)).toBe(365);
    expect(getDaysInYear(2028)).toBe(366);
  });

  it('computes exact days in February based on leap year', () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2028, 2)).toBe(29);
    expect(getDaysInMonth(2026, 4)).toBe(30);
    expect(getDaysInMonth(2026, 1)).toBe(31);
  });

  it('generates all 365 or 366 consecutive calendar dates without gaps', () => {
    const dates2026 = getAllYearDates(2026);
    expect(dates2026).toHaveLength(365);
    expect(dates2026[0]).toBe('2026-01-01');
    expect(dates2026[364]).toBe('2026-12-31');
    expect(dates2026).toContain('2026-02-28');
    expect(dates2026).not.toContain('2026-02-29');

    const dates2028 = getAllYearDates(2028);
    expect(dates2028).toHaveLength(366);
    expect(dates2028[0]).toBe('2028-01-01');
    expect(dates2028[365]).toBe('2028-12-31');
    expect(dates2028).toContain('2028-02-29');
  });

  it('generates consistent month grid for Monday and Sunday start', () => {
    const gridMon = generateMonthGrid(2026, 10, 'monday'); // October 2026
    expect(gridMon.length % 7).toBe(0);
    expect(gridMon.length).toBeGreaterThanOrEqual(35);

    // Oct 1, 2026 is a Thursday
    const oct1 = gridMon.find((t) => t.isCurrentMonth && t.dayNumber === 1);
    expect(oct1).toBeDefined();
    expect(oct1?.dateStr).toBe('2026-10-01');
    expect(oct1?.dayOfWeek).toBe(4); // Thursday

    const gridSun = generateMonthGrid(2026, 10, 'sunday');
    expect(gridSun.length % 7).toBe(0);
  });

  it('correctly pads date strings', () => {
    expect(formatDateStr(2026, 3, 5)).toBe('2026-03-05');
    expect(formatDateStr(2026, 12, 25)).toBe('2026-12-25');
  });

  it('correctly calculates the number of ISO weeks in a year (52 vs 53)', () => {
    // 2020: Jan 1 was Wed (leap year) -> Dec 31 was Thu -> 53 weeks
    expect(getISOWeeksInYear(2020)).toBe(53);
    // 2021: Jan 1 was Fri -> 52 weeks
    expect(getISOWeeksInYear(2021)).toBe(52);
    // 2024: Jan 1 was Mon -> 52 weeks
    expect(getISOWeeksInYear(2024)).toBe(52);
    // 2025: Jan 1 was Wed (non-leap) -> 52 weeks
    expect(getISOWeeksInYear(2025)).toBe(52);
    // 2026: Jan 1 is Thu -> 53 weeks
    expect(getISOWeeksInYear(2026)).toBe(53);
    // 2027: Jan 1 is Fri -> 52 weeks
    expect(getISOWeeksInYear(2027)).toBe(52);
  });

  it('validates ISO week numbers and strictly rejects week 53 in 52-week years', () => {
    // 2025 has only 52 weeks
    expect(isValidISOWeek(2025, 1)).toBe(true);
    expect(isValidISOWeek(2025, 52)).toBe(true);
    expect(isValidISOWeek(2025, 53)).toBe(false);
    expect(isValidISOWeek(2025, 0)).toBe(false);

    // 2026 has 53 weeks
    expect(isValidISOWeek(2026, 53)).toBe(true);
    expect(isValidISOWeek(2026, 54)).toBe(false);

    // Out of range years
    expect(isValidISOWeek(1999, 1)).toBe(false);
    expect(isValidISOWeek(2101, 1)).toBe(false);
  });

  it('generates correct boundary dates when ISO week-year differs from calendar year', () => {
    // 2020 Week 1 began on Monday Dec 30, 2019
    const dates2020W1 = getWeekDates(2020, 1);
    expect(dates2020W1).toHaveLength(7);
    expect(dates2020W1[0]).toBe('2019-12-30');
    expect(dates2020W1[1]).toBe('2019-12-31');
    expect(dates2020W1[2]).toBe('2020-01-01');
    expect(dates2020W1[6]).toBe('2020-01-05');

    // 2020 Week 53 ended on Sunday Jan 3, 2021
    const dates2020W53 = getWeekDates(2020, 53);
    expect(dates2020W53).toHaveLength(7);
    expect(dates2020W53[0]).toBe('2020-12-28');
    expect(dates2020W53[3]).toBe('2020-12-31');
    expect(dates2020W53[4]).toBe('2021-01-01');
    expect(dates2020W53[6]).toBe('2021-01-03');
  });

  it('validates canonical ISO date strings (YYYY-MM-DD)', () => {
    expect(isValidDateStr('2026-10-15')).toBe(true);
    expect(isValidDateStr('2028-02-29')).toBe(true); // Leap day
    expect(isValidDateStr('2026-02-29')).toBe(false); // Not a leap day
    expect(isValidDateStr('2026-13-01')).toBe(false); // Invalid month
    expect(isValidDateStr('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidDateStr('invalid-date')).toBe(false);
  });

  it('navigates previous and next days across year boundaries and leap years', () => {
    // New Year rollover backwards
    expect(getPreviousDay('2026-01-01')).toBe('2025-12-31');
    // Leap year February backwards
    expect(getPreviousDay('2028-03-01')).toBe('2028-02-29');
    // Common year February backwards
    expect(getPreviousDay('2026-03-01')).toBe('2026-02-28');

    // Year rollover forwards
    expect(getNextDay('2026-12-31')).toBe('2027-01-01');
    // Leap day forwards
    expect(getNextDay('2028-02-28')).toBe('2028-02-29');
    expect(getNextDay('2028-02-29')).toBe('2028-03-01');
  });

  it('formats dates for rich journal display and resolves weekday names', () => {
    expect(getDayOfWeekName('2026-10-15')).toBe('Thursday');
    expect(formatDisplayDate('2026-10-15')).toBe('Thursday, October 15, 2026');
  });
});

