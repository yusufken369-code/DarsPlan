/**
 * Date and calendar utilities for DarsPlan.
 * All functions operate strictly in the local calendar timezone to avoid UTC conversion shifts.
 */

export const WEEKDAYS = [
  { index: 0, key: 'mon', uz: 'DUSHANBA', shortUz: 'DU', titleUz: 'Dushanba' },
  { index: 1, key: 'tue', uz: 'SESHANBA', shortUz: 'SE', titleUz: 'Seshanba' },
  { index: 2, key: 'wed', uz: 'CHORSHANBA', shortUz: 'CH', titleUz: 'Chorshanba' },
  { index: 3, key: 'thu', uz: 'PAYSHANBA', shortUz: 'PA', titleUz: 'Payshanba' },
  { index: 4, key: 'fri', uz: 'JUMA', shortUz: 'JU', titleUz: 'Juma' },
  { index: 5, key: 'sat', uz: 'SHANBA', shortUz: 'SH', titleUz: 'Shanba' },
  { index: 6, key: 'sun', uz: 'YAKSHANBA', shortUz: 'YA', titleUz: 'Yakshanba' },
];

export const MONTHS_UZ = [
  { index: 0, name: 'Yanvar', short: 'YAN' },
  { index: 1, name: 'Fevral', short: 'FEV' },
  { index: 2, name: 'Mart', short: 'MAR' },
  { index: 3, name: 'Aprel', short: 'APR' },
  { index: 4, name: 'May', short: 'MAY' },
  { index: 5, name: 'Iyun', short: 'IYUN' },
  { index: 6, name: 'Iyul', short: 'IYUL' },
  { index: 7, name: 'Avgust', short: 'AVG' },
  { index: 8, name: 'Sentabr', short: 'SEN' },
  { index: 9, name: 'Oktabr', short: 'OKT' },
  { index: 10, name: 'Noyabr', short: 'NOY' },
  { index: 11, name: 'Dekabr', short: 'DEK' },
];

/**
 * Parses YYYY-MM-DD string into a local Date without UTC offset shift.
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.substring(0, 10).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Formats a Date into standard PostgreSQL DATE format: YYYY-MM-DD
 */
export function formatToDateString(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Finds Monday (start of the week) for any given date.
 */
export function getMondayOfWeek(date) {
  const d = parseLocalDate(date);
  const dayOfWeek = (d.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  d.setDate(d.getDate() - dayOfWeek);
  return d;
}

/**
 * Returns the 7 days of the week for a given week offset from today (0 = current week, 1 = next, -1 = prev).
 * Correctly calculates month rollovers, year rollovers, leap years, and all 7 weekdays.
 */
export function getWeekDates(weekOffset = 0, referenceDate = new Date()) {
  const monday = getMondayOfWeek(referenceDate);
  if (weekOffset !== 0) {
    monday.setDate(monday.getDate() + (weekOffset * 7));
  }

  const todayStr = formatToDateString(new Date());
  const days = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = formatToDateString(current);
    const dayOfMonth = current.getDate();
    const monthNumber = current.getMonth() + 1;
    const displayDate = `${dayOfMonth}.${monthNumber < 10 ? '0' : ''}${monthNumber}`;

    days.push({
      dayIndex: i, // 0 = Mon ... 6 = Sun
      label: WEEKDAYS[i].uz,
      shortLabel: WEEKDAYS[i].shortUz,
      title: WEEKDAYS[i].titleUz,
      date: displayDate, // e.g. "29.10"
      fullDate: dateStr, // "2026-10-29"
      rawDate: current,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Formats a date badge for upcoming deadlines (e.g. Month abbreviation, day number, weekday name).
 */
export function formatDateBadge(dateStr) {
  if (!dateStr) return { month: 'KUN', day: 1, dayName: 'DU', fullDate: '' };
  const d = parseLocalDate(dateStr);
  const monthObj = MONTHS_UZ[d.getMonth()] || { short: 'MAR' };
  const weekdayIndex = (d.getDay() + 6) % 7;
  const weekdayObj = WEEKDAYS[weekdayIndex] || { shortUz: 'DU' };

  return {
    month: monthObj.short,
    day: d.getDate(),
    dayName: weekdayObj.shortUz,
    fullDate: formatToDateString(d),
  };
}

/**
 * Filter lessons that occur on a specific target date.
 * Handles both:
 * 1. Specific-date lessons: `schedule_type === 'date'` where `specific_date === YYYY-MM-DD`
 * 2. Recurring weekly lessons: `schedule_type !== 'date'` where `day === weekdayIndex (0..6)`
 */
export function getLessonsForDate(lessons, targetDate = new Date()) {
  if (!Array.isArray(lessons)) return [];
  const targetDateStr = formatToDateString(targetDate);
  const targetDayIndex = (parseLocalDate(targetDate).getDay() + 6) % 7;

  return lessons.filter(lesson => {
    if (lesson.schedule_type === 'date' || (lesson.specific_date && !lesson.is_recurring)) {
      return lesson.specific_date === targetDateStr;
    }
    return Number(lesson.day) === targetDayIndex;
  });
}

/**
 * Human-readable week range label in Uzbek (e.g. "27-oktabr – 2-noyabr, 2026")
 */
export function getWeekRangeLabel(days) {
  if (!days || days.length === 0) return '';
  const first = days[0].rawDate;
  const last = days[days.length - 1].rawDate;

  const firstMonth = MONTHS_UZ[first.getMonth()].name.toLowerCase();
  const lastMonth = MONTHS_UZ[last.getMonth()].name.toLowerCase();

  if (first.getFullYear() !== last.getFullYear()) {
    return `${first.getDate()}-${firstMonth}, ${first.getFullYear()} – ${last.getDate()}-${lastMonth}, ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${first.getDate()}-${firstMonth} – ${last.getDate()}-${lastMonth}, ${last.getFullYear()}`;
  }
  return `${first.getDate()} – ${last.getDate()}-${firstMonth}, ${first.getFullYear()}`;
}
