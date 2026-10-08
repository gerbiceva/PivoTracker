import {
  ActionIcon,
  Alert,
  Button,
  ColorSwatch,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertHexagonFilled,
  IconBook,
  IconCalendarUser,
  IconChevronLeft,
  IconChevronRight,
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
import { PageHeader } from '../../Admin/PageHeader';

// Extend dayjs with plugins
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

export type dayType = Unpacked<weeklyWashingData>;

export interface CalendarDay {
  date: dayjs.Dayjs;
  isToday: boolean;
  events: dayType[];
}

const steps = [
  {
    title: 'Izberi prost termin',
    text: 'Klikni na prazen kvadratek pri dnevu in potrdi rezervacijo.',
  },
  {
    title: 'Poglej, kdo pere',
    text: 'Klikni na dan, da vidiš vse rezervacije in kontakte.',
  },
  {
    title: 'Preberi pravila',
    text: 'Pred prvim pranjem obvezno preberi pravila pranja.',
  },
];

const machines = [
  { label: 'Stroj 1', color: 'indigo' },
  { label: 'Stroj 2', color: 'orange' },
];

export const AddWashingTimetable = () => {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs().utc());

  const user = useStore($currUser);

  const { data: userReservations } = getSupaWR({
    query: () => {
      const startOfWeek = currentDate.utc().startOf('week').toISOString();
      const endOfWeek = currentDate.utc().endOf('week').toISOString();

      return supabaseClient
        .from('reservations')
        .select('*user_id')
        .eq('user_id', user?.base_user_id || 0)
        .containedBy('slot', `[${startOfWeek}, ${endOfWeek})`) // Use containedBy
        .limit(3);
    },
    table: 'reservations',
    params: [currentDate.toISOString()],
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

  const isCurrentWeek = fromDate.isSame(dayjs().utc().startOf('week'), 'day');
  const weekLabel = fromDate.isSame(toDate, 'month')
    ? `${fromDate.format('D.')}–${toDate.format('D. MMMM')}`
    : `${fromDate.format('D. MMM')} – ${toDate.format('D. MMM')}`;

  return (
    <Stack w="100%" pos="relative" gap="lg">
      <LoadingOverlay visible={isLoading} />

      <PageHeader
        title="Pranje"
        description="Rezerviraj termin za pralni stroj."
        action={
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconCalendarUser size={16} />}
              component={Link}
              to="/pranje/moje"
            >
              Moji termini
            </Button>
            <Button
              variant="light"
              leftSection={<IconBook size={16} />}
              component={Link}
              to="/pranje/info"
            >
              Pravila pranja
            </Button>
          </Group>
        }
      />

      {/* instructions */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        {steps.map((step, i) => (
          <Paper key={step.title} withBorder radius="md" p="md">
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" radius="xl" size="md">
                <Text size="sm" fw={700}>
                  {i + 1}
                </Text>
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={600} size="sm">
                  {step.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {step.text}
                </Text>
              </Stack>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {userReservations && userReservations.length >= 3 && (
        <Alert
          color="orange"
          icon={<IconAlertHexagonFilled />}
          title="Bodi prijazen!"
        >
          Ta teden imaš že <b>{userReservations.length}</b> termine. Pusti jih
          nekaj še za druge.
        </Alert>
      )}

      {/* week select */}
      <Paper withBorder radius="md" px="md" py="xs">
        <Group justify="space-between" gap="xs">
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              size="lg"
              variant="subtle"
              aria-label="Prejšnji teden"
              onClick={previousWeek}
            >
              <IconChevronLeft />
            </ActionIcon>
            <Text fw={700} size="lg" miw="9rem" ta="center">
              {weekLabel}
            </Text>
            <ActionIcon
              size="lg"
              variant="subtle"
              aria-label="Naslednji teden"
              onClick={nextWeek}
            >
              <IconChevronRight />
            </ActionIcon>
            {!isCurrentWeek && (
              <Button
                size="xs"
                variant="light"
                onClick={() => setCurrentDate(dayjs().utc())}
              >
                Ta teden
              </Button>
            )}
          </Group>
          <Group gap="md">
            {machines.map((m) => (
              <Group key={m.label} gap={6} wrap="nowrap">
                <ColorSwatch
                  color={`var(--mantine-color-${m.color}-filled)`}
                  size={12}
                />
                <Text size="sm">{m.label}</Text>
              </Group>
            ))}
            <Group gap={6} wrap="nowrap">
              <ColorSwatch
                color="var(--mantine-color-default-border)"
                size={12}
              />
              <Text size="sm" c="dimmed">
                Prosto
              </Text>
            </Group>
          </Group>
        </Group>
      </Paper>

      <Stack gap="sm">
        {days.map((day, index) => (
          <WashingDayItem day={day} key={day.date.toString() + index} />
        ))}
      </Stack>

      <Group justify="space-between" pb="4rem">
        <Button
          variant="subtle"
          leftSection={<IconChevronLeft size={18} />}
          onClick={previousWeek}
        >
          Prejšnji teden
        </Button>
        <Button
          variant="subtle"
          rightSection={<IconChevronRight size={18} />}
          onClick={nextWeek}
        >
          Naslednji teden
        </Button>
      </Group>
    </Stack>
  );
};
