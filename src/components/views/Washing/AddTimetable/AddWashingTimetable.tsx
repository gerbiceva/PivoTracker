import {
  ActionIcon,
  Alert,
  Button,
  Text,
  Group,
  LoadingOverlay,
  Stack,
  Center,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconAlertHexagonFilled,
  IconChevronCompactLeft,
  IconChevronCompactRight,
  IconChevronLeft,
  IconChevronRight,
  IconHelpCircleFilled,
} from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useGetWeeklyWashing, weeklyWashingData } from './GetWashingByWeek';
import { WashingDayItem } from './DayItem';
import { ReadTimeFromUTCString } from '../../../../utils/timeUtils';
import { Unpacked } from '../../../../utils/objectSplit';
import { Link } from 'react-router-dom';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../../global-state/user';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

export type dayType = Unpacked<weeklyWashingData>;

export interface CalendarDay {
  date: dayjs.Dayjs;
  isToday: boolean;
  events: dayType[];
}

export const AddWashingTimetable = () => {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs().utc());

  const user = useStore($currUser);

  const { data: userReservations } = getSupaWR({
    query: () =>
      supabaseClient
        .from('reservations')
        .select('*user_id')
        .eq('user_id', user?.base_user_id || 0)
        // .filter('slot', 'gt', dayjs().utc().endOf('day').toISOString())
        .rangeGte(
          'slot',
          `[${currentDate.utc().startOf('week').toISOString()}, ${currentDate
            .utc()
            .startOf('week')
            .toISOString()}]`,
        )
        .limit(3),
    table: 'reservations',
  });

  const { fromDate, toDate } = useMemo(() => {
    return {
      fromDate: currentDate.startOf('week'),
      toDate: currentDate.endOf('week'),
    };
  }, [currentDate]);

  const nextWeek = useCallback(() => {
    setCurrentDate((prevDate) => prevDate.add(1, 'week'));
  }, []);

  const previousWeek = useCallback(() => {
    setCurrentDate((prevDate) => prevDate.subtract(1, 'week'));
  }, []);

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

      {userReservations && userReservations.length >= 3 && (
        <Alert
          color="orange"
          icon={<IconAlertHexagonFilled />}
          title="Bodi prijazen!"
        >
          <p>
            V tem tednu imaš registriranih terminov že:{' '}
            <b>{userReservations.length}</b>
          </p>
          <p>
            Če v enem tednu registriraš več kot 3 termine, pazi da nisi kreten
            in jih ostane dovolj tudi za druge.
          </p>
        </Alert>
      )}

      {/* Date select */}
      <Center>
        <Group p="md" gap="md" justify="end">
          <ActionIcon size="lg" variant="subtle" onClick={previousWeek}>
            <IconChevronCompactLeft />
          </ActionIcon>
          <Group>
            <Text fw="bold" size="xl" c="cyan">
              {fromDate.format('MMM DD')}
            </Text>
            -
            <Text fw="bold" size="xl" c="cyan">
              {toDate.format('MMM DD')}
            </Text>
          </Group>
          <ActionIcon size="lg" variant="subtle" onClick={nextWeek}>
            <IconChevronCompactRight />
          </ActionIcon>
        </Group>
      </Center>

      <SimpleGrid cols={2} visibleFrom="sm">
        <Center>
          <Text fw="bold">Stroj 1</Text>
        </Center>
        <Center>
          <Text fw="bold">Stroj 2</Text>
        </Center>
      </SimpleGrid>

      <Stack gap="sm" py="lg" pb="4rem">
        <Box>
          <Button
            mb="lg"
            variant="subtle"
            leftSection={<IconChevronLeft />}
            onClick={previousWeek}
          >
            Prikaži prejšnji teden
          </Button>
        </Box>

        {days.map((day, index) => (
          <WashingDayItem day={day} key={day.date.toString() + index} />
        ))}

        <Box ml="auto">
          <Button
            mt="lg"
            variant="subtle"
            rightSection={<IconChevronRight />}
            onClick={nextWeek}
          >
            Prikaži naslednji teden
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
};
