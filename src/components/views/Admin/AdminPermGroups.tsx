import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Fieldset,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconEye,
  IconPlus,
  IconSearch,
  IconUserMinus,
} from '@tabler/icons-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { Database } from '../../../supabase/supabase';
import { capitalizeFirstLetter } from '../../../utils/userUtils';
import { PageHeader } from './PageHeader';
import { isResidentGroup } from '../UserManagement/UserEditing/GroupCell';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

interface Member {
  id: number;
  name: string;
  room: number | null;
  groupId: number | null;
}

// managed by the devs only; the DB rejects edits to it as well
const ADMIN_GROUP = 'admin';
const ADMIN_PERMISSION = 'ADMIN';

// permission_groups.tier: 0 = stanovalec, 1 = admin (dev-only),
// 2 = shown on the Vladajoči page, 3 = not shown
const TIER_RESIDENT = 0;
const TIER_ADMIN = 1;
const TIER_LISTED = 2;
const TIER_HIDDEN = 3;

// how the permission checkboxes are grouped; unknown types land in "Ostalo"
const PERMISSION_SECTIONS: [string, string[]][] = [
  ['Uporabniki', ['MANAGE_USERS', 'ENROLL', 'ENROLL_RESIDENT', 'DELETE_USERS']],
  ['Vloge in pravice', ['MANAGE_PERMISSIONS', 'MANAGE_GROUPS']],
  ['Pivo', ['MANAGE_ITEMS', 'MANAGE_TRANSACTIONS', 'ADD_OBLJUBA']],
  ['Dogajanje', ['MANAGE_EVENTS']],
  ['Dom', ['CAN_WASH', 'MANAGE_WASHING', 'OPEN_DOORS']],
];

// big lists (Stanovalec) are shown in pages of this size
const MEMBER_PAGE = 50;

const showError = (title: string, message: string) =>
  notifications.show({ color: 'red', title, message });

const groupLabel = (g: PermissionGroup) => g.display_name || g.name;
const isResident = (g: PermissionGroup) =>
  g.tier === TIER_RESIDENT || isResidentGroup(g);

const fullName = (name: string | null, surname: string | null) =>
  [name, surname]
    .filter(Boolean)
    .map((n) => capitalizeFirstLetter(n!.toLocaleLowerCase()))
    .join(' ');

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// Slovene dual/plural: 1 član, 2 člana, 3-4 člani, 5+ članov
const membersLabel = (n: number) => {
  if (n === 0) return 'Brez članov';
  const m = n % 100;
  if (m === 1) return `${n} član`;
  if (m === 2) return `${n} člana`;
  if (m === 3 || m === 4) return `${n} člani`;
  return `${n} članov`;
};

const roomLabel = (room: number | null) =>
  room ? `Soba ${room}` : 'Brez sobe';

// set_user_group replaces the user's permissions with the group's preset
const setUserGroup = async (userId: number, groupId: number) => {
  const { error } = await supabaseClient.rpc('set_user_group', {
    p_base_user_id: userId,
    p_group_id: groupId,
  });
  if (error) {
    showError('Napaka pri spremembi vloge', error.message);
    return false;
  }
  refetchTables(['user_view', 'permissions']);
  return true;
};

const MemberAvatar = ({ name }: { name: string }) => (
  <Avatar size={32} radius="xl" color="teal">
    {initials(name)}
  </Avatar>
);

const MemberRow = ({
  member,
  right,
}: {
  member: Member;
  right?: ReactNode;
}) => (
  <Group gap="sm" wrap="nowrap" px="sm" py={8}>
    <MemberAvatar name={member.name} />
    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
      <Text size="sm" fw={500} truncate>
        {member.name}
      </Text>
      <Text size="xs" c="dimmed">
        {roomLabel(member.room)}
      </Text>
    </Stack>
    {right}
  </Group>
);

// "Dodaj vlogo" button with its name prompt.
const AddGroupButton = ({ onCreated }: { onCreated: () => void }) => {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabaseClient.rpc('create_permission_group', {
      p_display_name: name.trim(),
    });
    setBusy(false);
    if (error) return showError('Vloge ni bilo mogoče dodati', error.message);
    setOpened(false);
    setName('');
    onCreated();
  };

  return (
    <>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => setOpened(true)}
      >
        Dodaj vlogo
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Nova vloga"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <Stack>
            <TextInput
              label="Ime vloge"
              placeholder="npr. Minister za šport"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              data-autofocus
            />
            <Text size="sm" c="dimmed">
              Člane in dovoljenja vlogi dodaš, ko je ustvarjena.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)}>
                Prekliči
              </Button>
              <Button type="submit" loading={busy} disabled={!name.trim()}>
                Dodaj
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

// Left column: every vloga with its member count.
const GroupList = ({
  groups,
  memberCount,
  selectedId,
  onSelect,
}: {
  groups: PermissionGroup[];
  memberCount: Map<number, number>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) => (
  <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
    {groups.map((g) => {
      const active = g.id === selectedId;
      return (
        <UnstyledButton
          key={g.id}
          onClick={() => onSelect(g.id)}
          aria-current={active ? 'true' : undefined}
          w="100%"
          px="md"
          py="xs"
          mih={56}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid var(--mantine-color-default-border)',
            background: active
              ? 'var(--mantine-primary-color-light)'
              : undefined,
            boxShadow: active
              ? 'inset 3px 0 0 var(--mantine-primary-color-filled)'
              : undefined,
          }}
        >
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {groupLabel(g)}
            </Text>
            <Text size="xs" c="dimmed">
              {membersLabel(memberCount.get(g.id) ?? 0)}
            </Text>
          </Stack>
          {g.tier === TIER_LISTED && (
            <Tooltip label="Prikazan na Vladajočih">
              <IconEye
                size={16}
                color="var(--mantine-color-green-7)"
                aria-label="Prikazan na Vladajočih"
              />
            </Tooltip>
          )}
        </UnstyledButton>
      );
    })}
  </Paper>
);

const MembersTab = ({
  group,
  groups,
  users,
}: {
  group: PermissionGroup;
  groups: PermissionGroup[];
  users: Member[];
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [shown, setShown] = useState(MEMBER_PAGE);
  const [busyId, setBusyId] = useState<number | null>(null);

  const resident = groups.find(isResident);
  const groupById = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups],
  );

  const members = users.filter((u) => u.groupId === group.id);
  const filterTerm = filter.trim().toLowerCase();
  const filtered = members.filter(
    (u) => !filterTerm || u.name.toLowerCase().includes(filterTerm),
  );

  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions =
    terms.length === 0
      ? []
      : users
          .filter((u) => {
            if (u.groupId === group.id) return false;
            // admins are dev-managed, they never move from here
            const from = u.groupId != null ? groupById.get(u.groupId) : null;
            if (from && (from.name === ADMIN_GROUP || from.tier === TIER_ADMIN))
              return false;
            const name = u.name.toLowerCase();
            return terms.every((t) => name.includes(t));
          })
          .slice(0, 6);

  const fromLabel = (u: Member) => {
    const from = u.groupId != null ? groupById.get(u.groupId) : null;
    return from ? groupLabel(from) : 'Brez vloge';
  };

  const add = (u: Member) =>
    modals.openConfirmModal({
      title: `Dodaj v vlogo ${groupLabel(group)}`,
      children: (
        <Text size="sm">
          <b>{u.name}</b> se premakne iz vloge {fromLabel(u)}. Dovoljenja
          uporabnika bodo zamenjana z dovoljenji vloge {groupLabel(group)}.
        </Text>
      ),
      labels: { confirm: 'Dodaj', cancel: 'Prekliči' },
      onConfirm: async () => {
        setBusyId(u.id);
        const ok = await setUserGroup(u.id, group.id);
        setBusyId(null);
        if (!ok) return;
        setSearch('');
        notifications.show({
          color: 'green',
          message: `Vloga uporabnika ${u.name} je zdaj ${groupLabel(group)}.`,
        });
      },
    });

  const remove = (u: Member) => {
    if (!resident) return;
    modals.openConfirmModal({
      title: 'Odstrani iz vloge',
      children: (
        <Text size="sm">
          <b>{u.name}</b> se premakne v vlogo {groupLabel(resident)} in dobi
          njena dovoljenja.
        </Text>
      ),
      labels: { confirm: 'Odstrani', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setBusyId(u.id);
        const ok = await setUserGroup(u.id, resident.id);
        setBusyId(null);
        if (ok) {
          notifications.show({
            color: 'green',
            message: `Vloga uporabnika ${u.name} je zdaj ${groupLabel(resident)}.`,
          });
        }
      },
    });
  };

  const canRemove = !isResident(group) && resident != null;

  return (
    <Stack gap="md">
      <Stack gap={6}>
        <TextInput
          label="Dodaj člana"
          placeholder="Išči uporabnika po imenu"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <Paper withBorder radius="md" shadow="sm">
            {suggestions.map((u) => (
              <MemberRow
                key={u.id}
                member={{ ...u }}
                right={
                  <Group gap="sm" wrap="nowrap">
                    <Text size="xs" c="dimmed" visibleFrom="xs">
                      Zdaj: {fromLabel(u)}
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      loading={busyId === u.id}
                      onClick={() => add(u)}
                    >
                      Dodaj
                    </Button>
                  </Group>
                }
              />
            ))}
          </Paper>
        )}
        {terms.length > 0 && suggestions.length === 0 && (
          <Text size="sm" c="dimmed">
            Ni zadetkov.
          </Text>
        )}
        <Text size="xs" c="dimmed">
          Uporabnik ima lahko samo eno vlogo, zato se ob dodajanju premakne iz
          trenutne in dobi dovoljenja nove vloge.
        </Text>
      </Stack>

      <Group justify="space-between" gap="xs">
        <Text size="sm" fw={600}>
          Člani{' '}
          <Text span c="dimmed" fw={400}>
            ({members.length})
          </Text>
        </Text>
        {members.length > 5 && (
          <TextInput
            size="xs"
            w={200}
            aria-label="Filtriraj člane"
            placeholder="Filtriraj člane"
            value={filter}
            onChange={(e) => {
              setFilter(e.currentTarget.value);
              setShown(MEMBER_PAGE);
            }}
          />
        )}
      </Group>

      {members.length === 0 ? (
        <Paper
          withBorder
          radius="md"
          p="xl"
          style={{ borderStyle: 'dashed', textAlign: 'center' }}
        >
          <Text size="sm" c="dimmed">
            Ta vloga še nima članov. Dodaj jih z iskanjem zgoraj.
          </Text>
        </Paper>
      ) : (
        <Paper withBorder radius="md">
          {filtered.slice(0, shown).map((u) => (
            <MemberRow
              key={u.id}
              member={u}
              right={
                canRemove && (
                  <Tooltip label={`Premakni v ${groupLabel(resident!)}`}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Odstrani ${u.name} iz vloge`}
                      loading={busyId === u.id}
                      onClick={() => remove(u)}
                    >
                      <IconUserMinus size={16} />
                    </ActionIcon>
                  </Tooltip>
                )
              }
            />
          ))}
          {filtered.length === 0 && (
            <Text size="sm" c="dimmed" p="sm">
              Ni zadetkov.
            </Text>
          )}
        </Paper>
      )}
      {filtered.length > shown && (
        <Button
          variant="subtle"
          size="xs"
          mx="auto"
          onClick={() => setShown(shown + MEMBER_PAGE)}
        >
          Pokaži več ({filtered.length - shown})
        </Button>
      )}
    </Stack>
  );
};

const PermissionsTab = ({
  group,
  current,
  members,
  permissionTypes,
  onSaved,
}: {
  group: PermissionGroup;
  current: number[];
  members: number;
  permissionTypes: PermissionType[];
  onSaved: () => void;
}) => {
  const [selected, setSelected] = useState<number[]>(current);
  const [saving, setSaving] = useState<'preset' | 'all' | null>(null);

  // reset when the saved data changes (after save or a refetch)
  const currentKey = [...current].sort((a, b) => a - b).join(',');
  useEffect(() => {
    setSelected(current);
  }, [currentKey]);

  const changed = [...selected].sort((a, b) => a - b).join(',') !== currentKey;

  const sections = useMemo(() => {
    const types = permissionTypes.filter((t) => t.name !== ADMIN_PERMISSION);
    const known = new Set(PERMISSION_SECTIONS.flatMap(([, names]) => names));
    const result = PERMISSION_SECTIONS.map(([title, names]) => ({
      title,
      types: names
        .map((n) => types.find((t) => t.name === n))
        .filter((t): t is PermissionType => t != null),
    }));
    result.push({
      title: 'Ostalo',
      types: types.filter((t) => !known.has(t.name)),
    });
    return result.filter((s) => s.types.length > 0);
  }, [permissionTypes]);

  const toggle = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  // existing members keep their permissions unless the change is pushed to them
  const save = async (propagate: boolean) => {
    setSaving(propagate ? 'all' : 'preset');
    const { error } = await supabaseClient.rpc('set_group_permissions', {
      p_group_id: group.id,
      p_permission_type_ids: [...selected].sort((a, b) => a - b),
      p_propagate: propagate,
    });
    setSaving(null);
    if (error) return showError('Napaka pri shranjevanju vloge', error.message);
    notifications.show({
      color: 'green',
      title: 'Shranjeno',
      message: propagate
        ? `Vloga ${groupLabel(group)} in njeni člani so posodobljeni.`
        : `Prednastavitev vloge ${groupLabel(group)} je posodobljena.`,
    });
    onSaved();
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Vloga je prednastavitev: ob dodelitvi uporabnik dobi njena dovoljenja,
        ki jih lahko nato posamezno spremeniš pri uporabniku.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {sections.map((s) => (
          <Fieldset key={s.title} legend={s.title} radius="md" p="sm">
            <Stack gap="xs">
              {s.types.map((t) => (
                <Checkbox
                  key={t.id}
                  label={t.display_name || t.name}
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                />
              ))}
            </Stack>
          </Fieldset>
        ))}
      </SimpleGrid>
      {changed && (
        <Paper radius="md" p="sm" bg="var(--mantine-color-orange-light)">
          <Group gap="xs">
            <Text size="sm" style={{ flex: '1 1 14rem' }}>
              {members > 0
                ? `Neshranjene spremembe. Ali naj jih dobijo tudi obstoječi člani (${members})? Njihova ostala dovoljenja ostanejo nespremenjena.`
                : 'Neshranjene spremembe.'}
            </Text>
            <Button
              size="xs"
              variant="default"
              disabled={saving != null}
              onClick={() => setSelected(current)}
            >
              Prekliči
            </Button>
            {members > 0 && (
              <Button
                size="xs"
                variant="light"
                loading={saving === 'preset'}
                disabled={saving === 'all'}
                onClick={() => save(false)}
              >
                Samo za nove člane
              </Button>
            )}
            <Button
              size="xs"
              loading={saving === 'all'}
              disabled={saving === 'preset'}
              onClick={() => save(members > 0)}
            >
              {members > 0 ? 'Shrani za vse člane' : 'Shrani'}
            </Button>
          </Group>
        </Paper>
      )}
    </Stack>
  );
};

const SettingsTab = ({
  group,
  members,
  onGroupsChanged,
  onDeleted,
}: {
  group: PermissionGroup;
  members: number;
  onGroupsChanged: () => void;
  onDeleted: () => void;
}) => {
  const label = groupLabel(group);
  const [name, setName] = useState(label);
  const [description, setDescription] = useState(group.description);
  const [busy, setBusy] = useState(false);
  useEffect(() => setName(label), [label]);
  useEffect(() => setDescription(group.description), [group.description]);

  const resident = isResident(group);
  const listed = group.tier === TIER_LISTED;

  const rename = async () => {
    if (!name.trim() || name.trim() === label) return setName(label);
    const { error } = await supabaseClient.rpc('rename_permission_group', {
      p_group_id: group.id,
      p_display_name: name.trim(),
    });
    if (error) return showError('Preimenovanje ni uspelo', error.message);
    onGroupsChanged();
  };

  const saveDescription = async () => {
    if (description.trim() === group.description) return;
    const { error } = await supabaseClient.rpc('set_permission_group_listing', {
      p_group_id: group.id,
      p_sort_order: group.sort_order,
      p_description: description.trim(),
    });
    if (error) return showError('Shranjevanje ni uspelo', error.message);
    onGroupsChanged();
  };

  const toggleListed = async () => {
    setBusy(true);
    const { error } = await supabaseClient.rpc('set_permission_group_tier', {
      p_group_id: group.id,
      p_tier: listed ? TIER_HIDDEN : TIER_LISTED,
    });
    setBusy(false);
    if (error) return showError('Shranjevanje ni uspelo', error.message);
    onGroupsChanged();
  };

  const remove = () =>
    modals.openConfirmModal({
      title: 'Izbriši vlogo',
      children: (
        <Text size="sm">
          Ali res želiš izbrisati vlogo <b>{label}</b>?
          {members > 0 &&
            ` ${membersLabel(members)} se premakne v vlogo Stanovalec in dobi njena dovoljenja.`}
        </Text>
      ),
      labels: { confirm: 'Izbriši', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabaseClient.rpc('delete_permission_group', {
          p_group_id: group.id,
        });
        if (error) return showError('Brisanje ni uspelo', error.message);
        // members were moved to Stanovalec
        if (members > 0) refetchTables(['user_view', 'permissions']);
        onDeleted();
      },
    });

  let deleteNote = 'Vloga nima članov.';
  if (resident) deleteNote = 'Privzete vloge ni mogoče izbrisati.';
  else if (members > 0)
    deleteNote = `Člani (${members}) se premaknejo v vlogo Stanovalec in dobijo njena dovoljenja.`;

  return (
    <Stack gap="lg" maw={560}>
      <TextInput
        label="Ime vloge"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onBlur={rename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setName(label);
        }}
      />
      <Checkbox
        label="Prikaži na strani Vladajoči"
        description={
          resident
            ? 'Stanovalci niso prikazani med vladajočimi.'
            : 'Člani bodo z imenom, sobo in telefonom vidni vsem stanovalcem.'
        }
        checked={listed}
        disabled={resident || busy}
        onChange={toggleListed}
      />
      {listed && (
        <Textarea
          label="Opis"
          description="Prikazan pod vlogo na strani Vladajoči."
          placeholder="npr. Pivo, pufi, nabava in zaloge"
          autosize
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          onBlur={saveDescription}
        />
      )}
      <Group
        gap="sm"
        pt="lg"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <Button
          variant="outline"
          color="red"
          disabled={resident}
          onClick={remove}
        >
          Izbriši vlogo
        </Button>
        <Text size="xs" c="dimmed" style={{ flex: '1 1 12rem' }}>
          {deleteNote}
        </Text>
      </Group>
    </Stack>
  );
};

export const AdminPermGroups = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<string | null>('clani');

  const groups = getSupaWR({
    query: () =>
      supabaseClient.from('permission_groups').select('*').order('id'),
    table: 'permission_groups',
  });
  const links = getSupaWR({
    query: () => supabaseClient.from('permgroup_permissions').select('*'),
    table: 'permgroup_permissions',
  });
  const types = getSupaWR({
    query: () =>
      supabaseClient.from('permission_types').select('*').order('id'),
    table: 'permission_types',
  });
  const users = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('base_user_id, name, surname, room, permgroup_id'),
    table: 'user_view',
    params: ['group-members'],
  });

  const members = useMemo<Member[]>(
    () =>
      (users.data ?? [])
        .filter((u) => u.base_user_id != null)
        .map((u) => ({
          id: u.base_user_id!,
          name: fullName(u.name, u.surname) || `#${u.base_user_id}`,
          room: u.room,
          groupId: u.permgroup_id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'sl')),
    [users.data],
  );

  const memberCount = useMemo(() => {
    const map = new Map<number, number>();
    members.forEach((u) => {
      if (u.groupId == null) return;
      map.set(u.groupId, (map.get(u.groupId) ?? 0) + 1);
    });
    return map;
  }, [members]);

  const byGroup = useMemo(() => {
    const map = new Map<number, number[]>();
    links.data?.forEach((l) => {
      const list = map.get(l.group_id) ?? [];
      list.push(l.permission_type);
      map.set(l.group_id, list);
    });
    return map;
  }, [links.data]);

  const editable = useMemo(
    () =>
      (groups.data ?? [])
        .filter((g) => g.name !== ADMIN_GROUP && g.tier !== TIER_ADMIN)
        // Stanovalec is the default everyone has, so it goes last
        .sort((a, b) => Number(isResident(a)) - Number(isResident(b))),
    [groups.data],
  );

  const paramId = Number(searchParams.get('vloga'));
  const selected =
    editable.find((g) => g.id === paramId) ?? editable[0] ?? null;

  const select = (id: number | null) =>
    setSearchParams(
      (params) => {
        if (id == null) params.delete('vloga');
        else params.set('vloga', id.toString());
        return params;
      },
      { replace: true },
    );

  const error = groups.error || links.error || types.error || users.error;
  if (error) {
    return (
      <Alert title="Napaka pri nalaganju vlog" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const isLoading =
    groups.isLoading || links.isLoading || types.isLoading || users.isLoading;
  const onGroupsChanged = () => {
    groups.mutate();
    links.mutate();
  };
  const selectedMembers = selected ? (memberCount.get(selected.id) ?? 0) : 0;

  return (
    <Stack pos="relative">
      <LoadingOverlay visible={isLoading} />
      <PageHeader
        title="Vloge"
        description="Izberi vlogo, da vidiš njene člane in dovoljenja. Vsak uporabnik ima eno vlogo."
        action={<AddGroupButton onCreated={() => groups.mutate()} />}
      />
      <Group align="flex-start" gap="lg">
        <Box style={{ flex: '1 1 14rem', maxWidth: '20rem' }}>
          <GroupList
            groups={editable}
            memberCount={memberCount}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              select(id);
              setTab('clani');
            }}
          />
        </Box>
        {selected && (
          <Paper
            withBorder
            radius="md"
            style={{ flex: '999 1 26rem', minWidth: 0 }}
          >
            <Stack gap="sm" px="lg" pt="md">
              <Group gap="sm">
                <Text fz="xl" fw={700}>
                  {groupLabel(selected)}
                </Text>
                {isResident(selected) ? (
                  <Badge variant="light" color="gray">
                    Privzeta vloga
                  </Badge>
                ) : selected.tier === TIER_LISTED ? (
                  <Badge variant="light" color="green">
                    Prikazan na Vladajočih
                  </Badge>
                ) : (
                  <Badge variant="light" color="gray">
                    Skrit
                  </Badge>
                )}
              </Group>
            </Stack>
            <Tabs value={tab} onChange={setTab} keepMounted={false}>
              <Tabs.List px="lg" mt="sm">
                <Tabs.Tab value="clani">Člani ({selectedMembers})</Tabs.Tab>
                <Tabs.Tab value="dovoljenja">
                  Dovoljenja ({(byGroup.get(selected.id) ?? []).length})
                </Tabs.Tab>
                <Tabs.Tab value="nastavitve">Nastavitve</Tabs.Tab>
              </Tabs.List>
              <Box p="lg">
                <Tabs.Panel value="clani">
                  <MembersTab
                    key={selected.id}
                    group={selected}
                    groups={groups.data ?? []}
                    users={members}
                  />
                </Tabs.Panel>
                <Tabs.Panel value="dovoljenja">
                  <PermissionsTab
                    key={selected.id}
                    group={selected}
                    current={byGroup.get(selected.id) ?? []}
                    members={selectedMembers}
                    permissionTypes={types.data ?? []}
                    onSaved={() => links.mutate()}
                  />
                </Tabs.Panel>
                <Tabs.Panel value="nastavitve">
                  <SettingsTab
                    key={selected.id}
                    group={selected}
                    members={selectedMembers}
                    onGroupsChanged={onGroupsChanged}
                    onDeleted={() => {
                      select(null);
                      onGroupsChanged();
                    }}
                  />
                </Tabs.Panel>
              </Box>
            </Tabs>
          </Paper>
        )}
      </Group>
    </Stack>
  );
};
