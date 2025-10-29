import {
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Group,
  SimpleGrid,
  ActionIcon,
  Alert,
  Badge,
  Button,
  ThemeIcon,
} from '@mantine/core';
import { useGetReservationsForUser } from './UserReservations';
import { useGetUserExpandedFromAuth } from './GetExpandedUserFromAuth';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import {
  IconHelp,
  IconHelpCircleFilled,
  IconPlus,
  IconQuestionMark,
  IconTrash,
} from '@tabler/icons-react';
import { groupReservationsByMonth } from './reservationUtils';
import dayjs from 'dayjs';
import { removeReservation } from '../RemoveReservation';
import { Link } from 'react-router-dom';

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
              <Alert
                p="md"
                variant={
                  ReadTimeFromUTCString(reservation.slot_end_utc) <
                  dayjs().utc()
                    ? 'outline'
                    : 'default'
                }
                color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
              >
                <Stack justify="space-between" w="100%">
                  <Group w="100%" justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="gray">
                        {FormatLocalDateCustom(
                          ReadTimeFromUTCString(reservation.slot_start_utc),
                          'DD',
                        )}
                      </ThemeIcon>
                      <Text fw="" c="gray">
                        {FormatLocalDateCustom(
                          ReadTimeFromUTCString(reservation.slot_start_utc),
                          'ddd',
                        )}
                      </Text>
                    </Group>
                    <ActionIcon
                      size="sm"
                      color="grayish"
                      variant="light"
                      onClick={() => {
                        removeReservation(reservation.reservation_id);
                      }}
                    >
                      <IconTrash />
                    </ActionIcon>
                  </Group>

                  <Group>
                    <Text>
                      {FormatLocalDateCustom(
                        ReadTimeFromUTCString(reservation.slot_start_utc),
                        'HH',
                      ) +
                        'h' +
                        ' - ' +
                        FormatLocalDateCustom(
                          ReadTimeFromUTCString(reservation.slot_end_utc),
                          'HH',
                        ) +
                        'h'}
                    </Text>
                    <Badge
                      variant="light"
                      color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
                    >
                      {reservation.machine_name}
                    </Badge>
                  </Group>
                </Stack>
              </Alert>
            ))}
          </SimpleGrid>
        </>
      ))}
    </Stack>
  );
};
