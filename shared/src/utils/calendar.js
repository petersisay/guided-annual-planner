export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

export function getDaysInMonth(year, month) {
  // month is 1-indexed (1 = January, 12 = December)
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getMonthName(month) {
  return MONTH_NAMES[month - 1] || '';
}

export function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

export function formatDateStr(year, month, day) {
  return `${year}-${padZero(month)}-${padZero(day)}`;
}

/**
 * Generates an array of all exact calendar dates (YYYY-MM-DD) for a full year.
 * Length is 366 for leap years and 365 for common years.
 */
export function getAllYearDates(year) {
  const dates = [];
  const daysInMonths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  for (let m = 1; m <= 12; m++) {
    const maxDays = daysInMonths[m - 1];
    for (let d = 1; d <= maxDays; d++) {
      dates.push(formatDateStr(year, m, d));
    }
  }

  return dates;
}

/**
 * Generates a 35 or 42 tile grid for a single month, aligned to Monday or Sunday start.
 */
export function generateMonthGrid(
  year,
  month,
  weekStart = 'monday'
) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday, 1 is Monday...

  // Compute leading empty / previous month offset
  let offset;
  if (weekStart === 'monday') {
    offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  } else {
    offset = firstDayOfWeek;
  }

  const tiles = [];

  // Previous month trailing days
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = offset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(prevYear, prevMonth - 1, dayNum);
    tiles.push({
      dateStr: formatDateStr(prevYear, prevMonth, dayNum),
      dayNumber: dayNum,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dayOfWeek: date.getDay(),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    tiles.push({
      dateStr: formatDateStr(year, month, d),
      dayNumber: d,
      month,
      year,
      isCurrentMonth: true,
      dayOfWeek: date.getDay(),
    });
  }

  // Next month leading days to complete grid (multiples of 7, 35 or 42)
  const totalCells = tiles.length > 35 ? 42 : 35;
  const remaining = totalCells - tiles.length;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  for (let d = 1; d <= remaining; d++) {
    const date = new Date(nextYear, nextMonth - 1, d);
    tiles.push({
      dateStr: formatDateStr(nextYear, nextMonth, d),
      dayNumber: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dayOfWeek: date.getDay(),
    });
  }

  return tiles;
}

// ─────────────────────────────────────────────────────────────
// ISO 8601 Week Utilities (week starts Monday, week 1 contains
// the first Thursday of the year)
// ─────────────────────────────────────────────────────────────

/**
 * Returns the ISO 8601 week number (1–53) for a given date.
 */
export function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the ISO week-year for a given date.
 * (Can differ from calendar year for dates in week 52/53 or week 1.)
 */
export function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

/**
 * Returns the 7 dates (Mon → Sun) for a given ISO week.
 * Returns an array of YYYY-MM-DD strings, length 7.
 */
export function getWeekDates(isoYear, isoWeek) {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1);
  const monday = new Date(mondayW1);
  monday.setUTCDate(mondayW1.getUTCDate() + (isoWeek - 1) * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(formatDateStr(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }
  return dates;
}

/**
 * Returns the number of ISO weeks in a given ISO week-year (52 or 53).
 */
export function getISOWeeksInYear(year) {
  const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const dec31Day = new Date(Date.UTC(year, 11, 31)).getUTCDay();
  return jan1Day === 4 || dec31Day === 4 ? 53 : 52;
}

/**
 * Validates whether a week number is valid for a given calendar year under ISO 8601.
 */
export function isValidISOWeek(year, week) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  if (!Number.isInteger(week) || week < 1) return false;
  const maxWeeks = getISOWeeksInYear(year);
  return week <= maxWeeks;
}

/**
 * Validates whether a string is a canonical ISO date formatted as YYYY-MM-DD.
 */
export function isValidDateStr(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12) return false;
  const maxDays = getDaysInMonth(y, m);
  return d >= 1 && d <= maxDays;
}

/**
 * Returns the canonical YYYY-MM-DD for the day immediately preceding dateStr.
 */
export function getPreviousDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return formatDateStr(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Returns the canonical YYYY-MM-DD for the day immediately following dateStr.
 */
export function getNextDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return formatDateStr(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Returns full English name of the day of the week (e.g. "Monday", "Sunday").
 */
export function getDayOfWeekName(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAY_NAMES[date.getUTCDay()] || '';
}

/**
 * Formats a canonical date string into a rich journal heading.
 * e.g. "Monday, October 15, 2026"
 */
export function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayName = getDayOfWeekName(dateStr);
  const monthName = getMonthName(m);
  return `${dayName}, ${monthName} ${d}, ${y}`;
}
