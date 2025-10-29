import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  ColorSwatch,
  Text,
  Group,
  LoadingOverlay,
  Stack,
  ThemeIcon,
} from '@mantine/core';
import {
  IconChevronCompactLeft,
  IconChevronCompactRight,
  IconHelpCircleFilled,
  IconQuestionMark,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useGetWeeklyWashing, weeklyWashingData } from './GetWashingByWeek';
import { DayItem } from './DayItem';
import { ReadTimeFromUTCString } from '../../../../utils/timeUtils';
import { Unpacked } from '../../../../utils/objectSplit';
import { Link } from 'react-router-dom';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

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
    const newWeek = currentDate.subtract(1, 'week');
    // if (newWeek.startOf('week') <= dayjs().startOf('week')) {
    //   return;
    // }

    setCurrentDate(newWeek);
  }, [currentDate]);

  const generateWeekDays = (data: weeklyWashingData = []): CalendarDay[] => {
    const startOfWeek = currentDate.startOf('week');

    const days: CalendarDay[] = [];
    const allEvents = data;

    // Generate days for the current week (7 days)
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day');
      const eventsForDay = allEvents.filter((event) => {
        const eventDate = ReadTimeFromUTCString(event.slot_start_utc).local(); // LOCAL() is necessary to transform the UTC server time to local Europe/Ljubljana
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

      {/* instructions */}
      <Alert color="gray" icon={<IconHelpCircleFilled />} title="Navodila">
        <p>Na tej strani lahko dodaš termine za pranje.</p>
        <p>Za vsak dan je prikazano kateri termini so že rezervirani.</p>
        <p>
          Za dodajanje rezervacij klikni na dropdown in pritisni gumb{' '}
          <b>Dodaj termin +</b>, ter klikni na enega od prostih terminov, da
          potrdiš rezervacijo.
        </p>

        <p>
          Pregled svojega pranja lahko vidiš na strani{' '}
          <Button variant="subtle" component={Link} to="/pranje/moje">
            Moji termini
          </Button>
          .
        </p>
        <p>
          Preden pereš si obvezno preberi
          <Button variant="subtle" color="" component={Link} to="/pranje/info">
            Pravila pranja
          </Button>
          .
        </p>
      </Alert>

      {/* Date select */}
      <Group p="md" gap="md" justify="end">
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

      <Group gap="xl">
        <Group gap="xs">
          <ThemeIcon color="indigo" />
          <Text>Stroj 1 (levi)</Text>
        </Group>
        <Group gap="xs">
          <ThemeIcon color="orange" />
          <Text>Stroj 2 (desni)</Text>
        </Group>
      </Group>

      <Stack gap="sm" py="xl" pb="4rem">
        {days.map((day, index) => (
          <DayItem day={day} key={day.date.toString() + index} />
        ))}
      </Stack>
    </Stack>
  );
};
