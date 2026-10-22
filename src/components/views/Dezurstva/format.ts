import dayjs, { Dayjs } from 'dayjs';

// Slovene has singular, dual, plural for 3-4 and plural for 5+
export const plural = (
  n: number,
  [one, two, few, many]: [string, string, string, string],
) => {
  const mod = Math.abs(n) % 100;
  if (mod === 1) return one;
  if (mod === 2) return two;
  if (mod === 3 || mod === 4) return few;
  return many;
};

// pool.month is the first day of the month: "november 2026"
export const poolMonthLabel = (month: string) =>
  dayjs(month).format('MMMM YYYY');

// "sreda, 28. 10. 2026 ob 20:00"
export const drawTimeLabel = (closesAt: string) =>
  dayjs(closesAt).format('dddd, D. M. YYYY [ob] HH:mm');

// "še 6 dni", "še 5 ur", "še 20 minut", or null once it has passed
export const timeLeftLabel = (closesAt: string | Dayjs, now = dayjs()) => {
  const end = dayjs(closesAt);
  const minutes = end.diff(now, 'minute');
  if (minutes <= 0) return null;
  if (minutes < 60)
    return `še ${minutes} ${plural(minutes, ['minuta', 'minuti', 'minute', 'minut'])}`;
  const hours = end.diff(now, 'hour');
  if (hours < 24)
    return `še ${hours} ${plural(hours, ['ura', 'uri', 'ure', 'ur'])}`;
  const days = end.diff(now, 'day');
  return `še ${days} ${plural(days, ['dan', 'dneva', 'dni', 'dni'])}`;
};

export const signupCountLabel = (n: number) =>
  `${n} ${plural(n, ['prijavljen', 'prijavljena', 'prijavljeni', 'prijavljenih'])}`;
