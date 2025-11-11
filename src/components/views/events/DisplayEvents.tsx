import { Alert, Skeleton, Stack, Title, Text } from '@mantine/core';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { IconAlertCircle, IconCalendarEvent } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { EventDisplayRow } from './EventDisplayRow'; // Import the new component

export const DisplayEvents = () => {
  const { data, error, isLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('*')
        .order('event_date', { ascending: true }),
    table: 'events',
  });

  // Group events by month
  const groupedEvents = data?.reduce((acc, event) => {
    const month = dayjs(event.event_date).local().format('MMMM YYYY'); // Include year for grouping
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <Stack gap="xl">
      <Title>Dogodki</Title>
      {/* loading state */}
      {isLoading &&
        Array(6)
          .fill(0)
          .map((_, index) => <Skeleton key={index} h="60" />)}

      {/* data */}
      {groupedEvents && Object.keys(groupedEvents).length > 0
        ? Object.entries(groupedEvents).map(([month, events]) => (
            <Stack key={month} gap="md">
              <Title order={2} c="dimmed" my="lg">
                {month}
              </Title>

              {events.map((event) => (
                <EventDisplayRow key={event.id} event={event} />
              ))}
            </Stack>
          ))
        : // empty page
          !isLoading && (
            <Alert
              variant="outline"
              title="Ni še objavljenih dogodkov"
              icon={<IconCalendarEvent></IconCalendarEvent>}
            >
              <p>Dogodki bodo dodani kmalu. Počakajte da se zgodi kaj kul</p>
            </Alert>
          )}

      {/* err page */}
      {error && (
        <Alert
          variant="outline"
          title="Napaka"
          icon={<IconAlertCircle></IconAlertCircle>}
        >
          <p>{error.message}</p>
        </Alert>
      )}
    </Stack>
  );
};
