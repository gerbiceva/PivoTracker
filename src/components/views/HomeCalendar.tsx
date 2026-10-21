import {
  Group,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import { getSupaWR } from '../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../supabase/supabaseClient';
import { ReadTimeFromUTCString } from '../../utils/timeUtils';
import { weeklyWashingData } from './Washing/AddTimetable/GetWashingByWeek';
import classes from './HomeCalendar.module.css';

const DAY_FORMAT = 'YYYY-MM-DD';

// same order as the legend; unknown machines fall back to gray
const MACHINE_COLORS: Record<number, string> = { 1: 'blue', 2: 'orange' };
const EVENT_COLOR = 'green';
const machineColor = (id: number) => MACHINE_COLORS[id] ?? 'gray';
const dotColor = (color: string) => `var(--mantine-color-${color}-filled)`;

type Entry =
  | {
      kind: 'washing';
      id: number;
      start: Dayjs;
      end: Dayjs;
      machineId: number;
      machineName: string;
      mine: boolean;
      who: string;
    }
  | {
      kind: 'event';
      id: number;
      start: Dayjs;
      title: string;
      subtitle: string;
    };

// get_reservations_week covers 7 days, so fetch every week the month grid shows
const useReservationsBetween = (from: Dayjs, to: Dayjs, enabled: boolean) =>
  useSWR<weeklyWashingData>(
    // keyed under 'washing-weekly' so invalidateWeeklyWashing refreshes it too
    enabled ? ['washing-weekly', 'home-calendar', from.toISOString()] : null,
    async () => {
      const weeks = Math.ceil(to.diff(from, 'day') / 7);
      const results = await Promise.all(
        Array.from({ length: weeks }, (_, i) =>
          supabaseClient.rpc('get_reservations_week', {
            p_date: from.add(i, 'week').toISOString(),
          }),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      return results.flatMap((r) => r.data ?? []);
    },
  );

export const HomeCalendar = ({
  canWash,
  authUserId,
}: {
  canWash: boolean;
  authUserId: string | undefined;
}) => {
  const today = dayjs().format(DAY_FORMAT);
  const [month, setMonth] = useState(today);
  const [selected, setSelected] = useState(today);
  const [showAll, setShowAll] = useState(false);

  // the grid also shows a few days of the neighbouring months
  const from = dayjs(month).startOf('month').subtract(7, 'day');
  const to = dayjs(month).endOf('month').add(7, 'day');

  const { data: reservations, isLoading: reservationsLoading } =
    useReservationsBetween(from, to, canWash);

  const { data: events, isLoading: eventsLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('id, title, subtitle, event_date')
        .gte('event_date', from.toISOString())
        .lt('event_date', to.toISOString()),
    table: 'events',
    params: ['home-calendar', from.toISOString()],
  });

  const byDay = new Map<string, Entry[]>();
  const add = (e: Entry) => {
    const key = e.start.format(DAY_FORMAT);
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  };
  for (const r of reservations ?? []) {
    add({
      kind: 'washing',
      id: r.reservation_id,
      start: ReadTimeFromUTCString(r.slot_start_utc).local(),
      end: ReadTimeFromUTCString(r.slot_end_utc).local(),
      machineId: r.machine_id,
      machineName: r.machine_name,
      mine: !!authUserId && r.auth_user_id === authUserId,
      who: [r.name, r.room != null && `soba ${r.room}`]
        .filter(Boolean)
        .join(' · '),
    });
  }
  for (const ev of events ?? []) {
    add({
      kind: 'event',
      id: ev.id,
      start: dayjs(ev.event_date),
      title: ev.title,
      subtitle: ev.subtitle,
    });
  }
  for (const list of byDay.values()) {
    list.sort(
      (a, b) =>
        a.start.valueOf() - b.start.valueOf() ||
        (a.kind === 'washing' ? a.machineId : 99) -
          (b.kind === 'washing' ? b.machineId : 99),
    );
  }

  // the toggle only filters the dots, the day list always shows everything
  const dotsFor = (date: string) => {
    const entries = (byDay.get(date) ?? []).filter(
      (e) => e.kind === 'event' || showAll || e.mine,
    );
    const machines = [
      ...new Set(
        entries.flatMap((e) => (e.kind === 'washing' ? [e.machineId] : [])),
      ),
    ].sort();
    return [
      ...machines.map(machineColor),
      ...(entries.some((e) => e.kind === 'event') ? [EVENT_COLOR] : []),
    ];
  };

  const select = (date: string) => {
    setSelected(date);
    // clicking a day of the neighbouring month moves there
    if (!dayjs(date).isSame(month, 'month')) setMonth(date);
  };

  const selectedEntries = byDay.get(selected) ?? [];
  const loading = eventsLoading || reservationsLoading;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Title order={4}>Koledar</Title>
        {canWash && (
          <Switch
            label="Prikaži termine vseh"
            checked={showAll}
            onChange={(e) => setShowAll(e.currentTarget.checked)}
          />
        )}

        <Calendar
          classNames={classes}
          maxLevel="month"
          date={month}
          onDateChange={setMonth}
          highlightToday
          getDayProps={(date) => ({
            selected: date === selected,
            onClick: () => select(date),
          })}
          renderDay={(date) => (
            <div>
              <div>{dayjs(date).date()}</div>
              <div className={classes.dots}>
                {dotsFor(date).map((c) => (
                  <span
                    key={c}
                    className={classes.dot}
                    style={{ background: dotColor(c) }}
                  />
                ))}
              </div>
            </div>
          )}
        />

        <Group gap="md">
          {canWash && (
            <>
              <LegendItem color={machineColor(1)} label="Stroj 1" />
              <LegendItem color={machineColor(2)} label="Stroj 2" />
            </>
          )}
          <LegendItem color={EVENT_COLOR} label="Dogodek" />
        </Group>

        <Stack
          gap="xs"
          pt="sm"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Group justify="space-between" align="baseline">
            <Text fw={600} tt="capitalize">
              {dayjs(selected).format('dddd, D. MMMM')}
            </Text>
            {selectedEntries.length > 0 && (
              <Text size="sm" c="dimmed">
                {countLabel(selectedEntries.length)}
              </Text>
            )}
          </Group>
          {loading && <Skeleton h={40} />}
          {!loading && selectedEntries.length === 0 && (
            <Text size="sm" c="dimmed">
              Ta dan ni rezervacij ne dogodkov.
            </Text>
          )}
          {!loading &&
            selectedEntries.map((e) =>
              e.kind === 'washing' ? (
                <div key={`w${e.id}`} className={classes.entry}>
                  <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {e.start.format('HH:mm')}–{e.end.format('HH:mm')}
                  </Text>
                  <span
                    className={classes.dot}
                    style={{ background: dotColor(machineColor(e.machineId)) }}
                  />
                  <div>
                    <Text size="sm" fw={600}>
                      {e.machineName}
                    </Text>
                    <Text
                      size="xs"
                      c={e.mine ? undefined : 'dimmed'}
                      fw={e.mine ? 600 : undefined}
                      style={
                        e.mine
                          ? {
                              color: 'var(--mantine-primary-color-light-color)',
                            }
                          : undefined
                      }
                    >
                      {e.mine ? 'Tvoj termin' : e.who}
                    </Text>
                  </div>
                </div>
              ) : (
                <UnstyledButton
                  key={`e${e.id}`}
                  component={Link}
                  to={`/events/${e.id}`}
                  className={classes.entry}
                >
                  <Text size="sm" c="dimmed">
                    {e.start.format('HH:mm')}
                  </Text>
                  <span
                    className={classes.dot}
                    style={{ background: dotColor(EVENT_COLOR) }}
                  />
                  <div>
                    <Text size="sm" fw={600}>
                      {e.title}
                    </Text>
                    {e.subtitle && (
                      <Text size="xs" c="dimmed">
                        {e.subtitle}
                      </Text>
                    )}
                  </div>
                </UnstyledButton>
              ),
            )}
        </Stack>
      </Stack>
    </Paper>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <Group gap={6}>
    <span className={classes.dot} style={{ background: dotColor(color) }} />
    <Text size="xs" c="dimmed">
      {label}
    </Text>
  </Group>
);

// Slovenian has a dual: 1 vnos, 2 vnosa, 3–4 vnosi, 5+ vnosov
const countLabel = (n: number) => {
  const m = n % 100;
  const word =
    m === 1
      ? 'vnos'
      : m === 2
        ? 'vnosa'
        : m === 3 || m === 4
          ? 'vnosi'
          : 'vnosov';
  return `${n} ${word}`;
};
