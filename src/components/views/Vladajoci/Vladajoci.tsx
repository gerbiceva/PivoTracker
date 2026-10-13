import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Card,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconSearch,
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
  people: Person[];
}

// rooms are numbered by floor: 009 is pritličje, 214 is the 2nd floor
const floorName = (f: number) => (f === 0 ? 'Pritličje' : `${f}. nadstropje`);
const roomLabel = (room: number) => room.toString().padStart(3, '0');

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

const Phone = ({ phone, name }: { phone: string | null; name: string }) => {
  if (!phone) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        ni telefona
      </Text>
    );
  }
  return (
    <Group gap={4} wrap="nowrap">
      <Anchor href={`tel:${phone.replace(/\s/g, '')}`} size="sm" ff="monospace">
        {phone}
      </Anchor>
      <CopyButton value={phone} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Kopirano' : 'Kopiraj številko'}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'teal' : 'gray'}
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
  const badge = showRole && (
    <Badge variant="light" color="gray">
      {role.name}
    </Badge>
  );

  return (
    <Group justify="space-between" wrap="nowrap" py={6} gap="sm">
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Group gap="xs" wrap="wrap">
          <Text fw={600}>{person.name}</Text>
          {badge}
        </Group>
        <Text size="sm" c="dimmed">
          {person.room != null ? `soba ${roomLabel(person.room)}` : 'brez sobe'}
        </Text>
      </Stack>
      <Phone phone={person.phone} name={person.name} />
    </Group>
  );
};

const RoleList = ({ roles, query }: { roles: Role[]; query: string }) => (
  <Stack gap="lg">
    {roles.map((role) => {
      const matchesRole = normalize(role.name).includes(query);
      const people = role.people.filter(
        (p) => !query || matchesRole || matchesPerson(p, query),
      );
      if (query && people.length === 0) return null;
      return (
        <Box key={role.id}>
          <Group justify="space-between" align="baseline" gap="xs">
            <Title order={4}>{role.name}</Title>
            <Text size="sm" c="dimmed">
              {countLabel(role.people.length)}
            </Text>
          </Group>
          {role.description && (
            <Text size="sm" c="dimmed">
              {role.description}
            </Text>
          )}
          <Divider mt={4} />
          {people.length === 0 ? (
            <Text c="dimmed" fs="italic" py={6}>
              Nezasedeno
            </Text>
          ) : (
            <Stack gap={0}>
              {people.map((p) => (
                <Box key={p.id}>
                  <PersonRow person={p} />
                  <Divider variant="dashed" />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      );
    })}
  </Stack>
);

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
    title: string,
    list: Person[],
    mine = false,
  ) => (
    <Card
      key={key}
      withBorder
      padding="sm"
      bg={mine ? 'var(--mantine-color-teal-light)' : undefined}
    >
      <Group gap="xs" mb={4}>
        <Title order={5}>{title}</Title>
        {mine && (
          <Badge size="sm" color="teal">
            tvoje nadstropje
          </Badge>
        )}
      </Group>
      {list.length === 0 ? (
        <Text size="sm" c="dimmed" fs="italic">
          Nihče
        </Text>
      ) : (
        list.map((p) => (
          <PersonRow key={`${p.role.id}-${p.id}`} person={p} showRole />
        ))
      )}
    </Card>
  );

  return (
    <Stack gap="sm">
      {ordered.map((f) =>
        section(
          `f${f}`,
          floorName(f),
          people.filter((p) => p.floor === f),
          f === myFloor,
        ),
      )}
      {noRoom.length > 0 && section('none', 'Brez sobe', noRoom)}
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
          data={[
            { value: 'role', label: 'Po vlogah' },
            { value: 'floor', label: 'Po nadstropjih' },
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
