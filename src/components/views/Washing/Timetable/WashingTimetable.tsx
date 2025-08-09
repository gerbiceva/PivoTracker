import {
  ActionIcon,
  Badge,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconChevronCompactLeft,
  IconChevronCompactRight,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { Tables } from '../../../../supabase/supabase';
import { useGetWeeklyWashing } from './GetWashingByWeek';
import { DayItem } from './DayItem';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

type dayType = Tables<'reservations_expanded'>;

export interface CalendarDay {
  date: dayjs.Dayjs;
  isToday: boolean;
  events: dayType[];
}

export const WashingTimetable = () => {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs());

  const nextWeek = useCallback(() => {
    setCurrentDate(currentDate.add(1, 'week'));
  }, [currentDate]);

  const previousWeek = useCallback(() => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  }, [currentDate]);

  const generateWeekDays = (
    machine1Data: any[] = [],
    machine2Data: any[] = [],
  ): CalendarDay[] => {
    const startOfWeek = currentDate.startOf('week');
    const endOfWeek = currentDate.endOf('week');

    const days: CalendarDay[] = [];
    const allEvents = [...(machine1Data || []), ...(machine2Data || [])];

    // Generate days for the current week (7 days)
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day');
      const eventsForDay = allEvents.filter((event) => {
        const eventDate = dayjs(event.slot_start);
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
  const { data: machine1Data, isLoading: isLoading1 } = useGetWeeklyWashing(
    currentDate,
    1,
  );

  const { data: machine2Data, isLoading: isLoading2 } = useGetWeeklyWashing(
    currentDate,
    2,
  );

  const days = generateWeekDays(machine1Data, machine2Data);

  return (
    <Stack w="100%" pos="relative">
      <LoadingOverlay visible={isLoading1 || isLoading2} />
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
          <DayItem day={day} />
        ))}
      </Stack>
    </Stack>
  );
};
