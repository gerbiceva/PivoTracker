import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  LoadingOverlay,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import {
  IconChevronCompactLeft,
  IconChevronCompactRight,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useGetMonthlyWashing } from './GetWashingByMonth';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

export const WashingTimetable = () => {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs());

  const { data, error, isLoading } = useGetMonthlyWashing(
    currentDate.date(),
    currentDate.year(),
    1,
  );

  const nextDate = useCallback(() => {
    setCurrentDate(currentDate.add(1, 'month'));
  }, [currentDate]);

  const previousDate = useCallback(() => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  }, [currentDate]);

  // Generate days for the current month view
  const generateDays = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');

    // Get the start day of the week (0-6, Sunday to Saturday)
    const startDay = startOfMonth.day();

    // Calculate the number of days to show from previous month
    const daysFromPrevMonth = startDay;

    // Calculate the number of days to show from next month
    const totalDaysInGrid = 42; // 6 weeks * 7 days
    const daysFromNextMonth =
      totalDaysInGrid - daysFromPrevMonth - endOfMonth.date();

    const days = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = startOfMonth.subtract(i + 1, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.isSame(dayjs(), 'day'),
      });
    }

    // Add days from current month
    for (let i = 0; i < endOfMonth.date(); i++) {
      const date = startOfMonth.add(i, 'day');
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(dayjs(), 'day'),
      });
    }

    // Add days from next month
    for (let i = 0; i < daysFromNextMonth; i++) {
      const date = endOfMonth.add(i + 1, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.isSame(dayjs(), 'day'),
      });
    }

    return days;
  };

  const days = generateDays();

  // Weekday names
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // console.log(
  //   supabaseClient
  //     .rpc('add_reservation_by_date_index', {
  //       p_date: '2025-10-8',
  //       p_machine_id: 1,
  //       p_slot_index: 1,
  //       p_user_id: '4da9e026-cee0-4ad4-a004-5d57d69046a6',
  //     })
  //     .select()
  //     .then(console.log),
  // );

  console.log({ data });

  return (
    <Stack w="100%" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group p="md" gap="md" justify="center">
        <ActionIcon size="md" variant="subtle" onClick={previousDate}>
          <IconChevronCompactLeft />
        </ActionIcon>

        <Badge size="lg" variant="light" radius="sm">
          {currentDate.format('MMMM YYYY')}
        </Badge>

        <ActionIcon size="md" variant="subtle" onClick={nextDate}>
          <IconChevronCompactRight />
        </ActionIcon>
      </Group>

      {error && <Alert>{error}</Alert>}

      <SimpleGrid cols={7} spacing={0}>
        {weekdayNames.map((day) => (
          <div
            key={day}
            style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold' }}
          >
            {day}
          </div>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={7} spacing={0}>
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              minHeight: '100px',
              border: '1px solid #dee2e6',
              padding: '4px',
              backgroundColor: day.isCurrentMonth ? 'white' : '#f8f9fa',
              opacity: day.isCurrentMonth ? 1 : 0.3,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontWeight: day.isToday ? 'bold' : 'normal',
                color: day.isToday ? '#228be6' : 'inherit',
                marginBottom: '4px',
                textAlign: 'right',
              }}
            >
              {day.date.format('D')}
            </div>
            {/* <div
              style={{
                backgroundColor: 'red',
                width: '100%',
                height: '100%',
              }}
            ></div> */}
            {/* Here you can add calendar events or other content for each day */}
          </div>
        ))}
      </SimpleGrid>
    </Stack>
  );
};
