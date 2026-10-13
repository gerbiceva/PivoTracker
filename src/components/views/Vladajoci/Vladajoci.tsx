import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  CopyButton,
  Group,
  LoadingOverlay,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconBuilding,
  IconCheck,
  IconCopy,
  IconDoor,
  IconLayoutGrid,
  IconPhone,
  IconPhoneOff,
  IconSearch,
  IconUserQuestion,
} from '@tabler/icons-react';
import { useStore } from '@nanostores/react';
import { useMemo, useState } from 'react';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { Database } from '../../../supabase/supabase';
import { $currUser } from '../../../global-state/user';
import { PageHeader } from '../Admin/PageHeader';

type VladajociRow =
  Database['public']['Functions']['get_vladajoci']['Returns'][number];

interface Person {
  id: number;
  name: string;
  room: number | null;
  floor: number | null;
  phone: string | null;
  role: Role;
}

interface Role {
  id: number;
  name: string;
  description: string;
  color: string;
  people: Person[];
}

// one color per vloga, handed out in display order so neighbours differ
const ROLE_COLORS = [
  'grape',
  'indigo',
  'teal',
  'orange',
  'pink',
  'blue',
  'lime',
  'red',
  'violet',
  'yellow',
];

// rooms are numbered by floor: 009 is pritličje, 214 is the 2nd floor
const floorName = (f: number) => (f === 0 ? 'Pritličje' : `${f}. nadstropje`);
const floorShort = (f: number) => (f === 0 ? 'P' : `${f}`);
const roomLabel = (room: number) => room.toString().padStart(3, '0');

// text color of a light variant, readable in both color schemes
const lightText = (color: string) =>
  `var(--mantine-color-${color}-light-color)`;
const lightBg = (color: string) => `var(--mantine-color-${color}-light)`;

// lowercase and strip diacritics, so "kovac" matches "Kovač"
const normalize = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

const matchesPerson = (p: Person, query: string) =>
  normalize(p.name).includes(query) ||
  (p.room != null && roomLabel(p.room).includes(query)) ||
  normalize(p.role.name).includes(query);

// Slovene dual/plural: 1 oseba, 2 osebi, 3-4 osebe, 5+ oseb
const countLabel = (n: number) =>
  `${n} ${n === 1 ? 'oseba' : n === 2 ? 'osebi' : n <= 4 ? 'osebe' : 'oseb'}`;

// rows come one per (vloga, person), already ordered; vacant vloge have a
// single row with no person
const toRoles = (rows: VladajociRow[]) => {
  const roles = new Map<number, Role>();
  rows.forEach((r) => {
    let role = roles.get(r.group_id);
    if (!role) {
      role = {
        id: r.group_id,
        name: r.group_name,
        description: r.description,
        color: ROLE_COLORS[roles.size % ROLE_COLORS.length],
        people: [],
      };
      roles.set(r.group_id, role);
    }
    if (r.base_user_id == null) return;
    role.people.push({
      id: r.base_user_id,
      name: [r.name, r.surname].filter(Boolean).join(' '),
      room: r.room,
      floor: r.floor,
      phone: r.phone_number,
      role,
    });
  });
  return [...roles.values()];
};

const Phone = ({
  phone,
  name,
  color,
}: {
  phone: string | null;
  name: string;
  color: string;
}) => {
  if (!phone) {
    return (
      <Group gap={4} wrap="nowrap" c="dimmed">
        <IconPhoneOff size={14} />
        <Text size="xs" fs="italic">
          ni telefona
        </Text>
      </Group>
    );
  }
  return (
    <Group gap={4} wrap="nowrap">
      <Button
        component="a"
        href={`tel:${phone.replace(/\s/g, '')}`}
        size="compact-sm"
        variant="light"
        color={color}
        leftSection={<IconPhone size={14} />}
        ff="monospace"
      >
        {phone}
      </Button>
      <CopyButton value={phone} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Kopirano' : 'Kopiraj številko'}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'green' : 'gray'}
              onClick={copy}
              aria-label={`Kopiraj številko ${name}`}
            >
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
};

const PersonRow = ({
  person,
  showRole,
}: {
  person: Person;
  // the floor view mixes vloge, so each row names its vloga
  showRole?: boolean;
}) => {
  const { role } = person;
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <Avatar name={person.name} color={role.color} radius="xl" />
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text fw={600} lh={1.2}>
            {person.name}
          </Text>
          <Group gap={6} wrap="wrap">
            <Group gap={3} wrap="nowrap" c="dimmed">
              <IconDoor size={13} />
              <Text size="xs">
                {person.room != null
                  ? `soba ${roomLabel(person.room)}`
                  : 'brez sobe'}
              </Text>
            </Group>
            {showRole && (
              <Badge size="xs" variant="light" color={role.color}>
                {role.name}
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>
      <Phone phone={person.phone} name={person.name} color={role.color} />
    </Group>
  );
};

const RoleCard = ({ role, people }: { role: Role; people: Person[] }) => (
  <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
    <Stack gap={2} px="md" py="sm" bg={lightBg(role.color)}>
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Title order={4} c={lightText(role.color)}>
          {role.name}
        </Title>
        <Badge variant="filled" color={role.color} style={{ flexShrink: 0 }}>
          {countLabel(role.people.length)}
        </Badge>
      </Group>
      {role.description && (
        <Text size="sm" c="dimmed">
          {role.description}
        </Text>
      )}
    </Stack>
    <Stack gap="sm" p="md">
      {people.length === 0 ? (
        <Group gap="xs" c="dimmed">
          <IconUserQuestion size={18} />
          <Text fs="italic">Nezasedeno</Text>
        </Group>
      ) : (
        people.map((p) => <PersonRow key={p.id} person={p} />)
      )}
    </Stack>
  </Paper>
);

const RoleList = ({ roles, query }: { roles: Role[]; query: string }) => {
  const visible = roles
    .map((role) => {
      const matchesRole = normalize(role.name).includes(query);
      const people = role.people.filter(
        (p) => !query || matchesRole || matchesPerson(p, query),
      );
      return { role, people };
    })
    .filter(({ people }) => !query || people.length > 0);

  const card = ({ role, people }: (typeof visible)[number]) => (
    <RoleCard key={role.id} role={role} people={people} />
  );

  // two independent columns, so a long vloga doesn't leave a gap next to a
  // short one; each card goes to the shorter column, keeping the order
  const columns: (typeof visible)[] = [[], []];
  const heights = [0, 0];
  visible.forEach((v) => {
    const col = heights[0] <= heights[1] ? 0 : 1;
    columns[col].push(v);
    // header + one row per person (an empty vloga still has one line)
    heights[col] += 2 + Math.max(v.people.length, 1);
  });

  return (
    <>
      <Stack gap="md" hiddenFrom="md">
        {visible.map(card)}
      </Stack>
      <SimpleGrid cols={2} spacing="md" visibleFrom="md">
        {columns.map((list, i) => (
          <Stack key={i} gap="md">
            {list.map(card)}
          </Stack>
        ))}
      </SimpleGrid>
    </>
  );
};

const FloorList = ({
  people,
  myFloor,
}: {
  people: Person[];
  myFloor: number | null;
}) => {
  const floors = new Set<number>();
  people.forEach((p) => p.floor != null && floors.add(p.floor));
  if (myFloor != null) floors.add(myFloor);
  // pritličje first, going up
  const ordered = [...floors].sort((a, b) => a - b);
  const noRoom = people.filter((p) => p.floor == null);

  const section = (
    key: string,
    floor: number | null,
    list: Person[],
    mine = false,
  ) => (
    <Paper
      key={key}
      withBorder
      radius="md"
      p="md"
      style={mine ? { borderColor: 'var(--mantine-color-cyan-6)' } : undefined}
      bg={mine ? lightBg('cyan') : undefined}
    >
      <Group gap="sm" mb="sm">
        <ThemeIcon
          size={36}
          radius="md"
          variant={mine ? 'filled' : 'light'}
          color="cyan"
        >
          <Text fw={700}>{floor != null ? floorShort(floor) : '?'}</Text>
        </ThemeIcon>
        <Title order={5}>
          {floor != null ? floorName(floor) : 'Brez sobe'}
        </Title>
        {mine && (
          <Badge size="sm" color="cyan">
            tvoje nadstropje
          </Badge>
        )}
      </Group>
      <Stack gap="sm">
        {list.length === 0 ? (
          <Text size="sm" c="dimmed" fs="italic">
            Nihče
          </Text>
        ) : (
          list.map((p) => (
            <PersonRow key={`${p.role.id}-${p.id}`} person={p} showRole />
          ))
        )}
      </Stack>
    </Paper>
  );

  return (
    <Stack gap="sm">
      {ordered.map((f) =>
        section(
          `f${f}`,
          f,
          people.filter((p) => p.floor === f),
          f === myFloor,
        ),
      )}
      {noRoom.length > 0 && section('none', null, noRoom)}
    </Stack>
  );
};

export const Vladajoci = () => {
  const user = useStore($currUser);
  const [view, setView] = useLocalStorage({
    key: 'vladajoci-view',
    defaultValue: 'role',
  });
  const [search, setSearch] = useState('');
  const query = normalize(search);

  const { data, error, isLoading } = getSupaWR({
    query: () => supabaseClient.rpc('get_vladajoci'),
    table: ['permission_groups', 'base_users', 'residents'],
    params: ['vladajoci'],
  });

  const roles = useMemo(() => toRoles(data ?? []), [data]);
  const people = useMemo(() => roles.flatMap((r) => r.people), [roles]);

  const myFloor = user?.room != null ? Math.floor(user.room / 100) : null;
  const meWithoutPhone = people.find(
    (p) => p.id === user?.base_user_id && !p.phone,
  );

  if (error) {
    return (
      <Alert title="Napaka pri nalaganju" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Stack pos="relative">
      <LoadingOverlay visible={isLoading} />
      <PageHeader
        title="Vladajoči"
        description="Kdo skrbi za kaj v domu. Za vprašanja se obrni na pristojnega ministra."
      />

      {meWithoutPhone && (
        <Alert color="yellow" icon={<IconAlertCircle />}>
          Si med vladajočimi ({meWithoutPhone.role.name}), a tvoja telefonska
          številka ni vpisana, zato te stanovalci ne morejo poklicati. Vpiše jo
          lahko kdo, ki ureja uporabnike.
        </Alert>
      )}

      <Group justify="space-between" gap="sm">
        <SegmentedControl
          value={view}
          onChange={setView}
          color="cyan"
          data={[
            {
              value: 'role',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconLayoutGrid size={14} />
                  Po vlogah
                </Group>
              ),
            },
            {
              value: 'floor',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconBuilding size={14} />
                  Po nadstropjih
                </Group>
              ),
            },
          ]}
        />
        <TextInput
          placeholder="Išči ime ali sobo"
          aria-label="Išči"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: '1 1 12rem', maxWidth: '20rem' }}
        />
      </Group>

      {view === 'floor' ? (
        <FloorList
          people={people.filter((p) => !query || matchesPerson(p, query))}
          myFloor={myFloor}
        />
      ) : (
        <RoleList roles={roles} query={query} />
      )}
    </Stack>
  );
};
