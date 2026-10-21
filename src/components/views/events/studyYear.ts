import dayjs, { Dayjs } from 'dayjs';

// A study year starts on 1 October; 2026/27 is identified by 2026.
export const STUDY_YEAR_START_MONTH = 9; // October (0-based)

export const getStudyYear = (date: Dayjs) =>
  date.month() >= STUDY_YEAR_START_MONTH ? date.year() : date.year() - 1;

export const studyYearStart = (year: number) =>
  dayjs(new Date(year, STUDY_YEAR_START_MONTH, 1));

export const studyYearEnd = (year: number) => studyYearStart(year + 1);

export const studyYearLabel = (year: number) =>
  `${year}/${String(year + 1).slice(2)}`;

export type EventStatus = 'past' | 'today' | 'future';

export const getEventStatus = (date: Dayjs, now: Dayjs): EventStatus => {
  if (date.isBefore(now)) return 'past';
  if (date.isSame(now, 'day')) return 'today';
  return 'future';
};

// Slovenian dual/plural forms: 1, 2, 3–4, 5+
export const pluralSl = (
  n: number,
  forms: [string, string, string, string],
) => {
  const r = n % 100;
  const form =
    r === 1
      ? forms[0]
      : r === 2
        ? forms[1]
        : r === 3 || r === 4
          ? forms[2]
          : forms[3];
  return `${n} ${form}`;
};

export const relativeLabel = (date: Dayjs, now: Dayjs) => {
  const days = date.startOf('day').diff(now.startOf('day'), 'day');
  if (days === 0) {
    if (date.isBefore(now)) return 'danes';
    const hours = Math.round(date.diff(now, 'minute') / 60);
    return hours <= 0 ? 'zdaj' : `danes, čez ${hours} h`;
  }
  if (days === 1) return 'jutri';
  if (days === -1) return 'včeraj';
  if (days > 1) return `čez ${days} dni`;
  return `pred ${-days} dnevi`;
};
