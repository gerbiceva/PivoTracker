import { SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';
import { ReadTimeFromUTCString } from '../../../../utils/timeUtils';
import { Field, Section } from './UserDetails';

type Reservation =
  Database['public']['Functions']['get_reservations_for_user']['Returns'][number];

// Washing reservations of a user in the current week (mon-sun) and month.
export const WashingStats = ({ userId }: { userId: number }) => {
  // the sl locale starts weeks on monday
  const now = dayjs();
  const weekStart = now.startOf('week');
  const weekEnd = weekStart.add(1, 'week');
  const monthStart = now.startOf('month');
  const monthEnd = monthStart.add(1, 'month');
  // one fetch covering both: a week can spill into the previous/next month
  const from = weekStart.isBefore(monthStart) ? weekStart : monthStart;
  const to = weekEnd.isAfter(monthEnd) ? weekEnd : monthEnd;

  const { data, isLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .rpc('get_reservations_for_user', { p_base_user_id: userId })
        .gte('slot_start_utc', from.toISOString())
        .lt('slot_start_utc', to.toISOString()),
    table: 'reservations',
    params: ['user-washing-stats', userId, from.toISOString()],
  });

  const reservations = (data as Reservation[] | undefined) ?? [];
  const inRange = (r: Reservation, start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    const s = ReadTimeFromUTCString(r.slot_start_utc);
    return !s.isBefore(start) && s.isBefore(end);
  };
  const thisWeek = reservations.filter((r) => inRange(r, weekStart, weekEnd));
  const thisMonth = reservations.filter((r) =>
    inRange(r, monthStart, monthEnd),
  );

  return (
    <Section title="Pranje">
      {isLoading ? (
        <Skeleton h={40} />
      ) : (
        <Stack gap="xs">
          <SimpleGrid
            cols={2}
            spacing="xs"
            verticalSpacing={6}
            style={{ gridTemplateColumns: '120px 1fr' }}
          >
            <Field
              label="Ta teden"
              value={`${thisWeek.length} (${weekStart.format('D. M.')} – ${weekEnd.subtract(1, 'day').format('D. M.')})`}
            />
            <Field
              label="Ta mesec"
              value={`${thisMonth.length} (${monthStart.format('MMMM')})`}
            />
          </SimpleGrid>
          {thisWeek.length > 0 && (
            <Stack gap={2}>
              {thisWeek.map((r) => {
                const start = ReadTimeFromUTCString(r.slot_start_utc).local();
                const end = ReadTimeFromUTCString(r.slot_end_utc).local();
                return (
                  <Text key={r.reservation_id} size="sm" c="dimmed">
                    {start.format('dddd, D. M.')} · {start.format('HH:mm')}–
                    {end.format('HH:mm')} · {r.machine_name}
                  </Text>
                );
              })}
            </Stack>
          )}
        </Stack>
      )}
    </Section>
  );
};
