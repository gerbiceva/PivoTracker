import {
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Group,
  SimpleGrid,
  ActionIcon,
  Alert,
} from '@mantine/core';
import { useGetReservationsForUser } from './UserReservations';
import { useGetUserExpandedFromAuth } from './GetExpandedUserFromAuth';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { groupReservationsByMonth } from './reservationUtils';
import dayjs from 'dayjs';
import { removeReservation } from '../RemoveReservation';
import { Link } from 'react-router-dom';

export const MyWashing = () => {
  const { data } = useGetUserExpandedFromAuth();
  const { data: reservationData, isLoading } = useGetReservationsForUser(
    data?.gerba_user_id,
  );

  const byMonth = reservationData
    ? groupReservationsByMonth(reservationData)
    : undefined;

  // Map-like iteration (stable order via Array.from)
  const monthEntries = byMonth
    ? Array.from(byMonth.entries()).sort(
        ([a], [b]) => a.valueOf() - b.valueOf(),
      )
    : undefined;

  return (
    <Stack gap="xs" mt="md">
      <LoadingOverlay visible={isLoading} />
      <Group w="100%" justify="space-between">
        <Stack>
          <Title>Moji termini</Title>
          <Text>
            Prikazanih <b>{reservationData?.length}</b> terminov za{' '}
            <b>
              {data?.gerba_name} {data?.gerba_surname}
            </b>{' '}
            soba <b>{data?.gerba_room}</b>.
          </Text>
        </Stack>
        <ActionIcon size="lg" variant="outline" component={Link} to="/pranje">
          <IconPlus />
        </ActionIcon>
      </Group>

      {monthEntries?.map(([days, entries]) => (
        <>
          <Text mt="md" size="xl" color="dimmed">
            {FormatLocalDateCustom(days, 'MMMM')}
          </Text>

          <SimpleGrid cols={{ xs: 1, md: 2, lg: 3 }} mt="md">
            {entries.map((reservation) => (
              <Alert
                p="md"
                variant={
                  ReadTimeFromUTCString(reservation.slot_end_utc) <
                  dayjs().utc()
                    ? 'filled'
                    : 'light'
                }
                color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
              >
                <Group justify="space-between">
                  <Text fw="bold">
                    {FormatLocalDateCustom(
                      ReadTimeFromUTCString(reservation.slot_start_utc),
                      'DD.MM HH:mm',
                    ) +
                      ' - ' +
                      FormatLocalDateCustom(
                        ReadTimeFromUTCString(reservation.slot_end_utc),
                        'HH:mm',
                      )}
                  </Text>
                  <Text>{reservation.machine_name}</Text>
                  <ActionIcon
                    color="grayish"
                    variant="light"
                    onClick={() => {
                      removeReservation(reservation.reservation_id);
                    }}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Group>
              </Alert>
            ))}
          </SimpleGrid>
        </>
      ))}
    </Stack>
  );
};
