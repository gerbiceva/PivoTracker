import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Stack,
  Title,
  Text,
  LoadingOverlay,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
} from '@mantine/core';
import {
  ReservationForUserType,
  useGetReservationHistoryForUser,
  useGetReservationsForUser,
} from './UserReservations';
import { useGetUserExpandedFromAuth } from './GetExpandedUserFromAuth';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { IconHelpCircleFilled, IconPlus } from '@tabler/icons-react';
import { groupReservationsByMonth } from './reservationUtils';
import { removeReservation } from '../RemoveReservation';
import { Link } from 'react-router-dom';
import { ReservationAlert } from './ReservationAlert';
import { Fragment, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const HISTORY_PAGE = 20;

const monthLabel = (month: Dayjs) =>
  FormatLocalDateCustom(
    month,
    month.local().year() === dayjs().year() ? 'MMMM' : 'MMMM YYYY',
  );

const MonthHeading = ({ month }: { month: Dayjs }) => (
  <Text mt="md" size="xl" c="dimmed" fw="bold">
    {monthLabel(month)}
  </Text>
);

const HistoryRow = ({
  reservation,
}: {
  reservation: ReservationForUserType;
}) => {
  const start = ReadTimeFromUTCString(reservation.slot_start_utc).local();
  const end = ReadTimeFromUTCString(reservation.slot_end_utc).local();
  return (
    <Group wrap="nowrap" py={6}>
      <Paper radius="md" w={52} py={4} ta="center" withBorder>
        <Text size="10px" fw={700} c="dimmed" tt="uppercase">
          {start.format('ddd')}
        </Text>
        <Text fw={700} size="lg" lh={1.2}>
          {start.format('D')}
        </Text>
      </Paper>
      <Stack gap={0} flex={1}>
        <Text size="sm" c="dimmed">
          {start.format('HH:mm')}–{end.format('HH:mm')}
        </Text>
        {reservation.note && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {reservation.note}
          </Text>
        )}
      </Stack>
      <Badge
        variant="light"
        color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
      >
        {reservation.machine_name}
      </Badge>
    </Group>
  );
};

export const MyWashing = () => {
  const { data } = useGetUserExpandedFromAuth();
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE);
  const {
    data: reservationData,
    isLoading,
    error,
  } = useGetReservationsForUser(data?.base_user_id);
  const {
    data: history,
    isLoading: historyLoading,
    isValidating: historyValidating,
    error: historyError,
  } = useGetReservationHistoryForUser(data?.base_user_id, historyLimit);

  const upcomingMonths = reservationData
    ? Array.from(groupReservationsByMonth(reservationData).entries()).sort(
        ([a], [b]) => a.valueOf() - b.valueOf(),
      )
    : undefined;

  // rows come newest first, so insertion order is already descending
  const historyMonths = history
    ? Array.from(groupReservationsByMonth(history.rows).entries())
    : undefined;

  return (
    <Stack gap="xs" mt="md" p="lg">
      <LoadingOverlay visible={isLoading} />
      {error && <Alert>{error.message}</Alert>}
      <Group w="100%" justify="space-between">
        <Stack>
          <Title>Moji termini</Title>
          <Text>
            <b>
              {data?.base_name} {data?.base_surname}
            </b>
            , soba <b>{data?.base_room}</b>:{' '}
            <b>{reservationData?.length ?? 0}</b> prihajajočih,{' '}
            <b>{history?.total ?? 0}</b> preteklih terminov.
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
        <p>
          Na tej strani lahko vidiš in zbrišeš svoje prihajajoče termine za
          pranje ter pregledaš pretekle termine.
        </p>
        <p>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/novo">
            Dodaj termin
          </Button>
          .
        </p>
      </Alert>

      <Title order={2} mt="lg">
        Prihajajoči
      </Title>
      {reservationData?.length === 0 && (
        <Text c="dimmed">
          Nimaš prihajajočih terminov.{' '}
          <Button variant="subtle" component={Link} to="/pranje/novo">
            Dodaj termin
          </Button>
        </Text>
      )}
      {upcomingMonths?.map(([month, entries]) => (
        <Fragment key={month.valueOf()}>
          <MonthHeading month={month} />
          <SimpleGrid cols={{ xs: 2, md: 2, lg: 3 }} mt="0" mb="lg">
            {entries.map((reservation) => (
              <ReservationAlert
                key={reservation.reservation_id}
                reservation={reservation}
                onRemove={removeReservation}
              />
            ))}
          </SimpleGrid>
        </Fragment>
      ))}

      <Title order={2} mt="lg">
        Zgodovina
      </Title>
      {historyError && <Alert color="red">{historyError.message}</Alert>}
      {historyLoading && <Skeleton h={120} />}
      {history?.rows.length === 0 && (
        <Text c="dimmed">Nimaš preteklih terminov.</Text>
      )}
      {historyMonths?.map(([month, entries]) => (
        <Fragment key={month.valueOf()}>
          <MonthHeading month={month} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
            {entries.map((reservation) => (
              <HistoryRow
                key={reservation.reservation_id}
                reservation={reservation}
              />
            ))}
          </SimpleGrid>
        </Fragment>
      ))}
      {history && history.rows.length < history.total && (
        <Group justify="center" mt="md">
          <Button
            variant="light"
            loading={historyValidating}
            onClick={() => setHistoryLimit((l) => l + HISTORY_PAGE)}
          >
            Naloži več ({history.total - history.rows.length})
          </Button>
        </Group>
      )}
    </Stack>
  );
};
