import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { ReactNode } from 'react';
import {
  IconBeer,
  IconDoor,
  IconUser,
  IconWash,
  type Icon,
} from '@tabler/icons-react';
import dayjs, { Dayjs } from 'dayjs';
import { $currUser } from '../../global-state/user';
import { getSupaWR } from '../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../supabase/supabaseClient';
import { useGetUserExpandedFromAuth } from './Washing/MyWashing/GetExpandedUserFromAuth';
import { useGetReservationsForUser } from './Washing/MyWashing/UserReservations';
import { ReadTimeFromUTCString } from '../../utils/timeUtils';
import { formatCurrency } from '../../utils/Converter';
import { MyProfileModal } from './UserManagement/MyProfileModal';

interface QuickAction {
  label: string;
  hint: string;
  // a route, or 'profile' to open the own-profile modal instead
  to: string;
  icon: Icon;
  // shown only with this permission; none = everyone logged in
  permission?: string;
}

// same permissions as the routes they lead to
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Rezerviraj pranje',
    hint: 'Pralni in sušilni stroj',
    to: '/pranje/novo',
    icon: IconWash,
    permission: 'CAN_WASH',
  },
  {
    label: 'Odpri vrata',
    hint: 'Vhod G59',
    to: '/vrata',
    icon: IconDoor,
    permission: 'OPEN_DOORS',
  },
  {
    label: 'Moj profil',
    hint: 'Podatki in soba',
    to: 'profile',
    icon: IconUser,
  },
];

const Card = ({
  title,
  link,
  color,
  children,
}: {
  title: string;
  link?: ReactNode;
  // tinted background for the summary cards (owing / all clear)
  color?: string;
  children: ReactNode;
}) => (
  <Paper
    // tinted cards stand out on their own, so only plain ones get a border
    withBorder={!color}
    radius="md"
    p="md"
    bg={color ? `var(--mantine-color-${color}-light)` : undefined}
  >
    <Stack gap="sm">
      <Group justify="space-between">
        <Title order={4}>{title}</Title>
        {link}
      </Group>
      {children}
    </Stack>
  </Paper>
);

const DateTile = ({ date }: { date: Dayjs }) => (
  <Paper radius="md" w={52} py={4} ta="center" withBorder>
    <Text size="10px" fw={700} c="dimmed" tt="uppercase">
      {date.format('ddd')}
    </Text>
    <Text fw={700} size="lg" lh={1.2}>
      {date.format('D')}
    </Text>
  </Paper>
);

const BigNumber = ({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) => (
  <Group gap="xs" align="baseline">
    <Text
      fz={36}
      fw={700}
      lh={1}
      c={color}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </Text>
    <Text c="dimmed">{label}</Text>
  </Group>
);

export const HomePage = () => {
  const user = useStore($currUser);
  const { data: userData } = useGetUserExpandedFromAuth();
  const userId = userData?.base_user_id;
  const can = (p?: string) => !p || !!user?.permissions.includes(p);
  const canWash = can('CAN_WASH');

  const { data: events, isLoading: eventsLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('*')
        .limit(3)
        // only upcoming events
        .filter('event_date', 'gte', dayjs().startOf('day').toISOString())
        .order('event_date', { ascending: true }),
    table: 'events',
  });

  const { data: reservations, isLoading: reservationsLoading } =
    useGetReservationsForUser(canWash ? userId : undefined);

  const { data: obljube, isLoading: obljubeLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .from('obljube_with_user_info')
        .select('id, reason, amount, paid, remaining')
        .eq('who', userId || 0)
        .order('created_at', { ascending: false }),
    // sales pay off obljube, so a new transaction changes what's owed
    table: ['obljube', 'obljube_poplacila', 'transactions'],
    params: [userId || 0],
  });

  const { data: debt, isLoading: debtLoading } = getSupaWR({
    query: () =>
      supabaseClient
        .from('everything_sum')
        .select('total_difference')
        .eq('id', userId || 0)
        .maybeSingle(),
    table: 'transactions',
    params: ['home-debt', userId || 0],
  });

  // ?profil opens the own-profile modal, so other pages (spotlight) can link to it
  const [searchParams, setSearchParams] = useSearchParams();
  const profileOpened = searchParams.has('profil');
  const openProfile = () => setSearchParams({ profil: '' });
  const closeProfile = () => setSearchParams({}, { replace: true });
  const quickActions = QUICK_ACTIONS.filter((a) => can(a.permission));
  const owedBeers = (obljube ?? []).reduce(
    (sum, o) => sum + (o.remaining ?? 0),
    0,
  );
  // open obljube first, paid ones stay visible as history
  const sortedObljube = [...(obljube ?? [])].sort(
    (a, b) => Number(!a.remaining) - Number(!b.remaining),
  );
  const puf = Number(debt?.total_difference ?? 0);

  return (
    <Container>
      <MyProfileModal opened={profileOpened} onClose={closeProfile} />
      <Stack mt="xl" gap="xl" mb="3rem">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Title order={1}>
              {userData ? (
                `Živjo, ${userData.base_name}`
              ) : (
                <Skeleton h={36} w={200} />
              )}
            </Title>
            <Text c="dimmed" tt="capitalize">
              {dayjs().format('dddd, D. MMMM')}
            </Text>
          </Stack>
          {userData?.base_room != null && (
            <Badge variant="light" size="lg">
              Soba {userData.base_room}
            </Badge>
          )}
        </Group>

        <SimpleGrid cols={{ base: 2, sm: Math.min(quickActions.length, 4) }}>
          {quickActions.map((a) => {
            const tile = (
              <Paper withBorder radius="md" p="md" h="100%">
                <Stack gap={6}>
                  <ThemeIcon variant="light" size="lg" radius="md">
                    <a.icon size={18} />
                  </ThemeIcon>
                  <Text fw={600}>{a.label}</Text>
                  <Text size="sm" c="dimmed">
                    {a.hint}
                  </Text>
                </Stack>
              </Paper>
            );
            return a.to === 'profile' ? (
              <UnstyledButton key={a.to} onClick={openProfile}>
                {tile}
              </UnstyledButton>
            ) : (
              <UnstyledButton key={a.to} component={Link} to={a.to}>
                {tile}
              </UnstyledButton>
            );
          })}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap="md">
            {canWash && (
              <Card
                title="Moji termini pranja"
                link={
                  <Anchor component={Link} to="/pranje/info" size="sm" fw={600}>
                    Navodila
                  </Anchor>
                }
              >
                {reservationsLoading && <Skeleton h={60} />}
                {reservations?.length === 0 && (
                  <Text size="sm" c="dimmed">
                    Nimaš prihajajočih terminov.
                  </Text>
                )}
                {reservations?.map((r) => {
                  const start = ReadTimeFromUTCString(r.slot_start_utc).local();
                  const end = ReadTimeFromUTCString(r.slot_end_utc).local();
                  return (
                    <Group key={r.reservation_id} wrap="nowrap">
                      <DateTile date={start} />
                      <Stack gap={0}>
                        <Text fw={600}>{r.machine_name}</Text>
                        <Text size="sm" c="dimmed">
                          {start.format('HH:mm')}–{end.format('HH:mm')}
                        </Text>
                      </Stack>
                    </Group>
                  );
                })}
                <div>
                  <Button
                    component={Link}
                    to="/pranje/novo"
                    variant="light"
                    size="xs"
                  >
                    + Dodaj termin
                  </Button>
                </div>
              </Card>
            )}

            <Card
              title="Prihajajoči dogodki"
              link={
                <Anchor component={Link} to="/events" size="sm" fw={600}>
                  Vsi dogodki
                </Anchor>
              }
            >
              {eventsLoading && <Skeleton h={60} />}
              {events?.length === 0 && (
                <Text size="sm" c="dimmed">
                  Ni prihajajočih dogodkov.
                </Text>
              )}
              {events?.map((ev) => (
                <UnstyledButton
                  key={ev.id}
                  component={Link}
                  to={`/events/${ev.id}`}
                >
                  <Group wrap="nowrap">
                    <DateTile date={dayjs(ev.event_date)} />
                    <Stack gap={0}>
                      <Text fw={600}>{ev.title}</Text>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {dayjs(ev.event_date).format('HH:mm')}
                        {ev.subtitle && ` · ${ev.subtitle}`}
                      </Text>
                    </Stack>
                  </Group>
                </UnstyledButton>
              ))}
            </Card>
          </Stack>

          <Stack gap="md">
            <Card title="Moj puf" color={puf > 0 ? 'orange' : 'green'}>
              {debtLoading || !userData ? (
                <Skeleton h={36} />
              ) : (
                <BigNumber
                  value={formatCurrency(puf)}
                  label={puf > 0 ? 'za plačat' : 'vse poravnano'}
                  color={puf > 0 ? 'orange' : 'green'}
                />
              )}
            </Card>

            <Card
              title="Obljube"
              color={owedBeers > 0 ? 'orange' : 'green'}
              link={
                <Anchor
                  component={Link}
                  to="/promises/view"
                  size="sm"
                  fw={600}
                  c="orange"
                >
                  Lestvica dolžnikov ›
                </Anchor>
              }
            >
              {obljubeLoading || !userData ? (
                <Skeleton h={36} />
              ) : (
                <BigNumber
                  value={String(owedBeers)}
                  label={
                    owedBeers > 0 ? 'piv dolguješ' : 'piv, nič ne dolguješ'
                  }
                  color={owedBeers > 0 ? 'orange' : 'green'}
                />
              )}
              {sortedObljube.map((o) => (
                <Group
                  key={o.id}
                  justify="space-between"
                  wrap="nowrap"
                  opacity={o.remaining ? 1 : 0.5}
                >
                  <Text size="sm" td={o.remaining ? undefined : 'line-through'}>
                    {o.reason}
                  </Text>
                  <Group gap={4} wrap="nowrap">
                    {o.remaining ? (
                      <>
                        <Text size="sm" fw={700}>
                          {o.remaining}
                        </Text>
                        {!!o.paid && (
                          <Text size="sm" c="dimmed">
                            / {o.amount}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text size="sm" fw={700}>
                        Plačano ({o.amount})
                      </Text>
                    )}
                    <IconBeer size={16} />
                  </Group>
                </Group>
              ))}
            </Card>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
