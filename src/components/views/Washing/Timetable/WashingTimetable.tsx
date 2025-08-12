import { ActionIcon, Badge, Group, LoadingOverlay, Stack } from '@mantine/core';
import {
  IconChevronCompactLeft,
  IconChevronCompactRight,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useGetWeeklyWashing, weeklyWashingData } from './GetWashingByWeek';
import { DayItem } from './DayItem';
import { ReadTimeFromUTCString } from '../../../../utils/timeUtils';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

type Unpacked<T> = T extends (infer U)[] ? U : T;
export type dayType = Unpacked<weeklyWashingData>;

export interface CalendarDay {
  date: dayjs.Dayjs;
  isToday: boolean;
  events: dayType[];
}

export const WashingTimetable = () => {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs().utc());

  const nextWeek = useCallback(() => {
    setCurrentDate(currentDate.add(1, 'week'));
  }, [currentDate]);

  const previousWeek = useCallback(() => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  }, [currentDate]);

  const generateWeekDays = (data: weeklyWashingData = []): CalendarDay[] => {
    const startOfWeek = currentDate.startOf('week');

    const days: CalendarDay[] = [];
    const allEvents = data;

    // Generate days for the current week (7 days)
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day');
      const eventsForDay = allEvents.filter((event) => {
        const eventDate = ReadTimeFromUTCString(event.slot_start_utc).local();
        return eventDate.isSame(date, 'day');
      });

      days.push({
        date,
        isToday: date.isSame(dayjs(), 'day'),
        events: eventsForDay,
      });
    }

    return days;
  };

  const { data, isLoading } = useGetWeeklyWashing(currentDate.startOf('week'));

  const days = generateWeekDays(data);

  return (
    <Stack w="100%" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group p="md" gap="md" justify="center">
        <ActionIcon size="md" variant="subtle" onClick={previousWeek}>
          <IconChevronCompactLeft />
        </ActionIcon>

        <Badge size="lg" variant="light" radius="sm">
          {currentDate.format('MMMM YYYY')}
        </Badge>

        <ActionIcon size="md" variant="subtle" onClick={nextWeek}>
          <IconChevronCompactRight />
        </ActionIcon>
      </Group>

      <Stack gap="sm" px="sm">
        {days.map((day, index) => (
          <DayItem day={day} key={day.date.toString() + index} />
        ))}
      </Stack>
    </Stack>
  );
};
