import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarEvent,
  IconHistory,
} from '@tabler/icons-react';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { EventDisplayRow, GerbaEvent } from './EventDisplayRow';
import {
  getEventStatus,
  getStudyYear,
  pluralSl,
  relativeLabel,
  studyYearEnd,
  studyYearLabel,
  studyYearStart,
} from './studyYear';

const useStudyYearEvents = (year: number) =>
  getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('*')
        .gte('event_date', studyYearStart(year).toISOString())
        .lt('event_date', studyYearEnd(year).toISOString())
        .order('event_date', { ascending: true }),
    table: 'events',
    params: { studyYear: year },
  });

const useNow = () => {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(interval);
  }, []);
  return now;
};

export const DisplayEvents = () => {
  const now = useNow();
  const currentYear = getStudyYear(now);
  const [loadedYears, setLoadedYears] = useState(0);
  const [hidePast, setHidePast] = useState(false);

  const current = useStudyYearEvents(currentYear);

  // Earliest event decides how far back "load previous year" can go
  const { data: earliest } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('event_date')
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
    table: 'events',
    params: { earliest: true },
  });
  const oldestYear = earliest
    ? getStudyYear(ReadTimeFromUTCString(earliest.event_date).local())
    : undefined;
  const nextYearToLoad = currentYear - loadedYears - 1;
  const canLoadMore = oldestYear !== undefined && nextYearToLoad >= oldestYear;

  const nextEvent = current.data?.find(
    (event) =>
      getEventStatus(ReadTimeFromUTCString(event.event_date).local(), now) !==
      'past',
  );

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end" gap="md">
        <Stack gap={4}>
          <Title>Dogodki</Title>
          <Text c="dimmed">
            Študijsko leto {studyYearLabel(currentYear)} · 1. oktober{' '}
            {currentYear} – 30. september {currentYear + 1}
          </Text>
        </Stack>
        <Button
          variant="default"
          radius="xl"
          onClick={() => setHidePast((hide) => !hide)}
        >
          {hidePast ? 'Prikaži pretekle' : 'Skrij pretekle'}
        </Button>
      </Group>

      {nextEvent && <NextEventCard event={nextEvent} now={now} />}

      <StudyYearSection
        year={currentYear}
        now={now}
        isCurrent
        hidePast={hidePast}
        query={current}
      />

      {Array.from({ length: loadedYears }, (_, i) => (
        <PastStudyYear
          key={currentYear - i - 1}
          year={currentYear - i - 1}
          now={now}
        />
      ))}

      <Stack align="center" gap="xs">
        {canLoadMore ? (
          <>
            <Button
              variant="default"
              radius="xl"
              size="md"
              leftSection={<IconHistory size={18} />}
              onClick={() => setLoadedYears((n) => n + 1)}
            >
              Naloži študijsko leto {studyYearLabel(nextYearToLoad)}
            </Button>
            <Text size="sm" c="dimmed">
              Starejši dogodki so arhivirani po študijskih letih (oktober –
              september)
            </Text>
          </>
        ) : (
          oldestYear !== undefined &&
          loadedYears > 0 && (
            <Text size="sm" c="dimmed">
              Starejših dogodkov ni.
            </Text>
          )
        )}
      </Stack>
    </Stack>
  );
};

const NextEventCard = ({ event, now }: { event: GerbaEvent; now: Dayjs }) => {
  const navigate = useNavigate();
  const date = ReadTimeFromUTCString(event.event_date).local();

  return (
    <Paper radius="lg" p="xl" bg="var(--mantine-color-cyan-light)">
      <Group gap="xl" align="center">
        <ThemeIcon size={84} radius="md" visibleFrom="xs">
          <Stack gap={4} align="center">
            <Text fw="bold" fz={34} lh={1}>
              {date.format('DD')}
            </Text>
            <Text fw={600} size="sm" tt="uppercase" lh={1}>
              {date.format('MMM')}
            </Text>
          </Stack>
        </ThemeIcon>
        <Stack gap={4} style={{ flex: '999 1 280px', minWidth: 0 }}>
          <Text size="sm" fw={600} tt="uppercase" c="cyan.8">
            Naslednji dogodek · {relativeLabel(date, now)}
          </Text>
          <Title order={2}>{event.title}</Title>
          <Text c="dimmed">{event.subtitle}</Text>
          <Text size="sm">
            {date.format('dddd, D. MMMM YYYY')} ob {date.format('HH:mm')} h
          </Text>
        </Stack>
        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={() => navigate(`/events/${event.id}`)}
        >
          Podrobnosti
        </Button>
      </Group>
    </Paper>
  );
};

const PastStudyYear = ({ year, now }: { year: number; now: Dayjs }) => {
  const query = useStudyYearEvents(year);
  return <StudyYearSection year={year} now={now} query={query} />;
};

interface StudyYearSectionProps {
  year: number;
  now: Dayjs;
  isCurrent?: boolean;
  hidePast?: boolean;
  query: ReturnType<typeof useStudyYearEvents>;
}

type MonthGroup = {
  label: string;
  items: ({ kind: 'event'; event: GerbaEvent } | { kind: 'now' })[];
};

const StudyYearSection = ({
  year,
  now,
  isCurrent = false,
  hidePast = false,
  query: { data, error, isLoading },
}: StudyYearSectionProps) => {
  const events = data ?? [];
  const isPast = (event: GerbaEvent) =>
    getEventStatus(ReadTimeFromUTCString(event.event_date).local(), now) ===
    'past';
  const pastCount = events.filter(isPast).length;
  const shown =
    isCurrent && hidePast ? events.filter((e) => !isPast(e)) : events;

  // Group by month; in the current year, mark "now" before the first upcoming event
  let nowMarked = !isCurrent || hidePast;
  const months = shown.reduce<MonthGroup[]>((acc, event) => {
    const label = ReadTimeFromUTCString(event.event_date)
      .local()
      .format('MMMM YYYY');
    let group = acc[acc.length - 1];
    if (!group || group.label !== label) {
      group = { label, items: [] };
      acc.push(group);
    }
    if (!nowMarked && !isPast(event)) {
      group.items.push({ kind: 'now' });
      nowMarked = true;
    }
    group.items.push({ kind: 'event', event });
    return acc;
  }, []);

  const summary = isCurrent
    ? `${pluralSl(pastCount, ['pretekel', 'pretekla', 'pretekli', 'preteklih'])} · ${pluralSl(
        events.length - pastCount,
        ['prihajajoč', 'prihajajoča', 'prihajajoči', 'prihajajočih'],
      )}`
    : pluralSl(events.length, ['dogodek', 'dogodka', 'dogodki', 'dogodkov']);

  return (
    <Stack gap="xs">
      <Group
        gap="sm"
        pb="sm"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Title order={2}>
          {isCurrent ? 'Letos' : `Študijsko leto ${studyYearLabel(year)}`}
        </Title>
        <Badge
          variant={isCurrent ? 'filled' : 'light'}
          color={isCurrent ? 'cyan' : 'gray'}
        >
          {isCurrent ? `${studyYearLabel(year)} · trenutno` : 'Arhiv'}
        </Badge>
        {data && (
          <Text size="sm" c="dimmed" ml="auto">
            {summary}
          </Text>
        )}
      </Group>

      {/* loading state */}
      {isLoading &&
        Array(4)
          .fill(0)
          .map((_, index) => <Skeleton key={index} h="60" />)}

      {/* data */}
      {months.map((month) => (
        <Stack key={month.label} gap="xs">
          <Text fw={600} tt="uppercase" c="dimmed" mt="lg" mb={4}>
            {month.label}
          </Text>
          {month.items.map((item) =>
            item.kind === 'now' ? (
              <NowMarker key="now" now={now} />
            ) : (
              <EventDisplayRow
                key={item.event.id}
                event={item.event}
                status={getEventStatus(
                  ReadTimeFromUTCString(item.event.event_date).local(),
                  now,
                )}
                now={isCurrent ? now : undefined}
              />
            ),
          )}
        </Stack>
      ))}

      {/* empty state */}
      {!isLoading && !error && months.length === 0 && (
        <Alert
          variant="outline"
          color="gray"
          mt="sm"
          title={
            isCurrent
              ? 'Letos še ni objavljenih dogodkov'
              : 'V tem študijskem letu ni bilo dogodkov'
          }
          icon={<IconCalendarEvent />}
        >
          {isCurrent && (
            <p>Dogodki bodo dodani kmalu. Počakajte da se zgodi kaj kul</p>
          )}
        </Alert>
      )}

      {/* err page */}
      {error && (
        <Alert variant="outline" title="Napaka" icon={<IconAlertCircle />}>
          <p>{error.message}</p>
        </Alert>
      )}
    </Stack>
  );
};

const NowMarker = ({ now }: { now: Dayjs }) => (
  <Group gap="sm" wrap="nowrap" py={4}>
    <Box
      w={10}
      h={10}
      bg="orange.7"
      style={{ borderRadius: '50%', flexShrink: 0 }}
      ml={{ base: 0, sm: 'lg' }}
    />
    <Text
      size="sm"
      fw={700}
      tt="uppercase"
      c="orange.8"
      style={{ flexShrink: 0 }}
    >
      Zdaj · {now.format('D. MMMM')}
    </Text>
    <Box h={2} bg="orange.7" style={{ flex: 1 }} />
  </Group>
);
