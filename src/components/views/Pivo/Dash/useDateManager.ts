import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export const useDateManager = () => {
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());

  useEffect(() => {
    const now = dayjs();
    const year = now.year();

    const from = dayjs().month(10).date(1).year(year);
    const to = dayjs()
      .month(10)
      .date(1)
      .year(year + 1);

    setDateFrom(from.toDate());
    setDateTo(to.toDate());
  }, []);

  const nextEpoch = () => {
    const from = dayjs(dateFrom);
    setDateFrom(from.year(from.year() + 1).toDate());

    const to = dayjs(dateTo);
    setDateTo(to.year(to.year() + 1).toDate());
  };

  const prevEpoch = () => {
    const from = dayjs(dateFrom);
    setDateFrom(from.year(from.year() - 1).toDate());

    const to = dayjs(dateTo);
    setDateTo(to.year(to.year() - 1).toDate());
  };

  return {
    dateFrom,
    dateTo,
    nextEpoch,
    prevEpoch,
  };
};
