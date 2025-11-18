import {
  Stack,
  Title,
  Button,
  Group,
  Container,
  Skeleton,
  SimpleGrid,
  Text,
  Alert,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { PermissionPath } from '../PermissionPath';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../global-state/user';
import { getSupaWR } from '../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../supabase/supabaseClient';
import { EventDisplayRow } from './events/EventDisplayRow';
import { useGetUserExpandedFromAuth } from './Washing/MyWashing/GetExpandedUserFromAuth';
import { useGetReservationsForUser } from './Washing/MyWashing/UserReservations';
import { ReservationAlert } from './Washing/MyWashing/ReservationAlert';
import { IconBeer, IconWash } from '@tabler/icons-react';

export const HomePage = () => {
  const user = useStore($currUser);
  const { data: userData } = useGetUserExpandedFromAuth();

  // dogodki
  const { data: eventi, isLoading: isLoadingEventi } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('*')
        .limit(3)
        .order('event_date', { ascending: true }),
    table: 'events',
  });

  // pralni termini
  const { data: reservationData, isLoading: isLoadingPranje } =
    useGetReservationsForUser(userData?.base_user_id);

  // obljube
  const { data: obljube, isLoading: isLoadingObljube } = getSupaWR({
    query: () =>
      supabaseClient
        .from('obljube')
        .select('*')
        .eq('who', userData?.base_user_id || 0)
        .order('created_at', { ascending: false }),
    table: 'obljube',
    params: [userData?.base_user_id || 0],
  });

  return (
    <Container>
      <Stack mt="xl" gap="xl" mb="3rem">
        <Stack gap="xs">
          <Title order={1}>Dobrodošli na G59.si</Title>
          <Title order={5} c="dimmed">
            Dobrodošli {userData?.base_name} {userData?.base_surname}
          </Title>
        </Stack>

        {/* Dogodgki */}
        {!isLoadingEventi && eventi?.length != 0 && (
          <Stack mt="xl">
            <Title order={2}>Prihajajoči dogodki</Title>
            {isLoadingEventi && (
              <>
                <Skeleton h="80" />
                <Skeleton h="80" />
                <Skeleton h="80" />
              </>
            )}
            {eventi &&
              eventi.map((ev) => <EventDisplayRow key={ev.id} event={ev} />)}
          </Stack>
        )}

        {/* Pranje */}
        <Stack gap="md">
          <Title order={2} mt="xl">
            Pranje
          </Title>
          <Group>
            {user && (
              <>
                <PermissionPath permission="CAN_WASH">
                  <Button component={Link} to="/pranje/novo" variant="light">
                    Dodaj termin
                  </Button>
                </PermissionPath>

                <PermissionPath permission="CAN_WASH">
                  <Button
                    component={Link}
                    to="/pranje/info"
                    variant="subtle"
                    size="sm"
                  >
                    Navodila za pranje
                  </Button>
                </PermissionPath>
              </>
            )}
          </Group>

          {/* <Text c="dimmed">Moji termini</Text> */}
          <SimpleGrid cols={{ xs: 2, md: 2, lg: 3 }}>
            {isLoadingPranje && (
              <>
                <Skeleton h="200" />
                <Skeleton h="200" />
                <Skeleton h="200" />
              </>
            )}
            {reservationData &&
              reservationData.map((reservation) => (
                <ReservationAlert
                  key={reservation.reservation_id}
                  reservation={reservation}
                />
              ))}
          </SimpleGrid>
          {reservationData && reservationData.length == 0 && (
            <Alert
              color="gray"
              icon={<IconWash></IconWash>}
              title="Ni terminov"
            >
              Nimate še nobenih prihajajočih terminov za pranje.
            </Alert>
          )}
        </Stack>

        <Stack gap="md">
          <Title order={2} mt="xl">
            Moje PIVO!
          </Title>

          {/* obljube tracker */}
          {obljube && obljube.length != 0 && (
            <Alert
              title="Obljube"
              icon={<IconBeer></IconBeer>}
              variant="outline"
            >
              <Text>Trenutno si vse skupaj dolžan:</Text>
              <Text fw="bold" size="lg">
                {obljube?.reduce((prev, curr) => prev + curr.amount, 0)} piv!
              </Text>
            </Alert>
          )}

          {isLoadingObljube && (
            <>
              <Skeleton h="200" />
              <Skeleton h="200" />
            </>
          )}

          <Text c="dimmed" my="sm">
            Seznam obljub:
          </Text>

          {obljube &&
            obljube.map((obljuba) => (
              <Group key={obljuba.id} gap="xl">
                <Group>
                  <Text fw="bold" miw="3ch">
                    {obljuba.amount}
                  </Text>
                  <IconBeer />
                </Group>
                <Text opacity={0.9}>{obljuba.reason}</Text>
              </Group>
            ))}
        </Stack>
      </Stack>
    </Container>
  );
};
