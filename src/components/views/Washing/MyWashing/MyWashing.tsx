import {
  ActionIcon,
  Alert,
  Button,
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Group,
  SimpleGrid,
} from '@mantine/core';
import { useGetReservationsForUser } from './UserReservations';
import { useGetUserExpandedFromAuth } from './GetExpandedUserFromAuth';
import { FormatLocalDateCustom } from '../../../../utils/timeUtils';
import { IconHelpCircleFilled, IconPlus } from '@tabler/icons-react';
import { groupReservationsByMonth } from './reservationUtils';
import { removeReservation } from '../RemoveReservation';
import { Link } from 'react-router-dom';
import { ReservationAlert } from './ReservationAlert';

export const MyWashing = () => {
  const { data } = useGetUserExpandedFromAuth();
  const {
    data: reservationData,
    isLoading,
    error,
  } = useGetReservationsForUser(data?.base_user_id);

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
    <Stack gap="xs" mt="md" p="lg">
      <LoadingOverlay visible={isLoading} />
      {error && <Alert>{error.message}</Alert>}
      <Group w="100%" justify="space-between">
        <Stack>
          <Title>Moji termini</Title>
          <Text>
            Prikazanih <b>{reservationData?.length}</b> terminov za{' '}
            <b>
              {data?.base_name} {data?.base_surname}
            </b>{' '}
            soba <b>{data?.base_room}</b>.
          </Text>
        </Stack>
        <ActionIcon
          size="lg"
          variant="outline"
          component={Link}
          to="/pranje/novo"
        >
          <IconPlus />
        </ActionIcon>
      </Group>

      <Alert
        color="gray"
        icon={<IconHelpCircleFilled />}
        title="Navodila"
        mt="lg"
      >
        <p>Na tej strani lahko vidiš in zbrišeš svoje termine za pranje.</p>
        <p>Termini so združeni po mesecih. Pretekli termini niso prikazani.</p>
        <p>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/novo">
            Dodaj termin
          </Button>
          .
        </p>
      </Alert>

      {monthEntries?.map(([days, entries]) => (
        <>
          <Text mt="md" size="xl" c="dimmed" fw="bold">
            {FormatLocalDateCustom(days, 'MMMM')}
          </Text>

          <SimpleGrid cols={{ xs: 2, md: 2, lg: 3 }} mt="0" mb="lg">
            {entries.map((reservation) => (
              <ReservationAlert
                key={reservation.reservation_id}
                reservation={reservation}
                onRemove={removeReservation}
              />
            ))}
          </SimpleGrid>
        </>
      ))}
    </Stack>
  );
};
