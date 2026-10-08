import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconLock } from '@tabler/icons-react';
import { ReactNode, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../../global-state/user';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { refetchTables } from '../../../../supabase/supa-utils/supaSWRCache';
import { Database } from '../../../../supabase/supabase';
import { capitalizeName, UserWithPermissions } from './useUserEditing';
import { ADMIN_GROUP } from './GroupCell';
import { EditUserBaseInfo } from './EditUserBaseInfo';
import { EditUserEmail } from './EditUserEmail';
import { ResidentInfoForm } from './ResidentInfoForm';
import { DeleteUserButton } from './DeleteUserButton';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];
type GroupLink = Database['public']['Tables']['permgroup_permissions']['Row'];

const groupLabel = (g: PermissionGroup) => g.display_name || g.name;
const fullName = (u: UserWithPermissions) =>
  capitalizeName(`${u.name ?? ''} ${u.surname ?? ''}`.trim());
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('sl-SI') : null;

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Stack gap="sm" py="md">
    <Group justify="space-between">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
        {title}
      </Text>
      {action}
    </Group>
    {children}
  </Stack>
);

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text size="sm">
      {value ?? (
        <Text span size="sm" c="dimmed" fs="italic">
          ni vpisan
        </Text>
      )}
    </Text>
  </>
);

const EditToggle = ({
  editing,
  onClick,
}: {
  editing: boolean;
  onClick: () => void;
}) => (
  <Button size="compact-xs" variant="subtle" onClick={onClick}>
    {editing ? 'Končaj' : 'Uredi'}
  </Button>
);

export const UserDetailsHeader = ({
  user,
  groups,
}: {
  user: UserWithPermissions;
  groups: PermissionGroup[];
}) => {
  const group = groups.find((g) => g.id === user.permgroup_id);
  const name = fullName(user);
  return (
    <Group gap="md" wrap="nowrap">
      <Avatar color="teal" radius="xl" size="lg">
        {name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)}
      </Avatar>
      <Stack gap={2}>
        <Text fw={700} size="lg">
          {name}
        </Text>
        <Text size="sm" c="dimmed">
          {user.auth_email}
        </Text>
        <Group gap={6} mt={4}>
          <Badge
            variant="light"
            color={
              group?.name === ADMIN_GROUP ? 'red' : group ? 'teal' : 'gray'
            }
          >
            {group ? groupLabel(group) : 'Brez vloge'}
          </Badge>
          <Badge variant="light" color={user.resident_id ? 'green' : 'gray'}>
            {user.resident_id ? `Soba ${user.room}` : 'Zunanji'}
          </Badge>
        </Group>
      </Stack>
    </Group>
  );
};

type PermState = 'off' | 'role' | 'extra' | 'added' | 'kept';

const PERM_STYLE: Record<
  PermState,
  { bg?: string; border?: string; tag?: string; tagColor?: string }
> = {
  off: {},
  role: {
    bg: 'var(--mantine-color-teal-light)',
    tag: 'vloga',
    tagColor: 'teal',
  },
  extra: { border: 'var(--mantine-color-teal-filled)', tag: 'dodatno' },
  added: {
    bg: 'var(--mantine-color-green-light)',
    tag: 'novo',
    tagColor: 'green',
  },
  kept: {
    bg: 'var(--mantine-color-orange-light)',
    tag: 'ohranjeno',
    tagColor: 'orange',
  },
};

const PermissionItem = ({
  label,
  state,
  onToggle,
}: {
  label: string;
  state: PermState;
  onToggle?: () => void;
}) => {
  const s = PERM_STYLE[state];
  return (
    <UnstyledButton
      onClick={onToggle}
      disabled={!onToggle}
      px="xs"
      py={6}
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        border: `1px solid ${s.border ?? (s.bg ? 'transparent' : 'var(--mantine-color-default-border)')}`,
        background: s.bg,
        cursor: onToggle ? 'pointer' : 'default',
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <Checkbox
          size="xs"
          checked={state !== 'off'}
          readOnly
          tabIndex={-1}
          style={{ pointerEvents: 'none' }}
        />
        <Text size="sm" c={state === 'off' ? 'dimmed' : undefined} flex={1}>
          {label}
        </Text>
        {s.tag && (
          <Text size="10px" fw={700} tt="uppercase" c={s.tagColor ?? 'dimmed'}>
            {s.tag}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
};

const RoleAndPermissions = ({
  user,
  groups,
  permissionTypes,
  canEdit,
  onSaved,
}: {
  user: UserWithPermissions;
  groups: PermissionGroup[];
  permissionTypes: PermissionType[];
  canEdit: boolean;
  onSaved: () => void;
}) => {
  const { data: links } = getSupaWR({
    query: () => supabaseClient.from('permgroup_permissions').select('*'),
    table: 'permgroup_permissions',
  });
  const groupPerms = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const l of (links as GroupLink[] | undefined) ?? []) {
      map.set(
        l.group_id,
        (map.get(l.group_id) ?? new Set()).add(l.permission_type),
      );
    }
    return (id: number | null) =>
      id == null ? new Set<number>() : (map.get(id) ?? new Set<number>());
  }, [links]);

  const savedExtras = useMemo(
    () =>
      user.permissions
        .map((p) => p.permission_type_id)
        .filter((id): id is number => id != null),
    [user.permissions],
  );
  const [draft, setDraft] = useState<{
    group: number | null;
    extras: number[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const group = draft ? draft.group : user.permgroup_id;
  const extras = draft ? draft.extras : savedExtras;
  const oldRole = groupPerms(user.permgroup_id);
  const newRole = groupPerms(group);
  const roleChanged = draft != null && draft.group !== user.permgroup_id;

  const stateOf = (id: number): PermState => {
    const had = oldRole.has(id) || savedExtras.includes(id);
    if (newRole.has(id)) return roleChanged && !had ? 'added' : 'role';
    if (!extras.includes(id)) return 'off';
    return roleChanged && oldRole.has(id) ? 'kept' : 'extra';
  };

  const changeGroup = (value: string | null) => {
    const next = value == null ? null : Number(value);
    if (next === user.permgroup_id) return setDraft(null);
    const nextRole = groupPerms(next);
    // switching never takes anything away: what the old role gave but the
    // new one doesn't stays on the user as an extra permission
    const kept = [...oldRole].filter((id) => !nextRole.has(id));
    setDraft({
      group: next,
      extras: [...new Set([...savedExtras, ...kept])].filter(
        (id) => !nextRole.has(id),
      ),
    });
  };

  const toggle = (id: number) =>
    setDraft({
      group,
      extras: extras.includes(id)
        ? extras.filter((x) => x !== id)
        : [...extras, id],
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error: permError } = await supabaseClient.rpc(
      'set_user_permissions',
      {
        p_base_user_id: user.base_user_id!,
        p_permission_type_ids: [...draft.extras].sort((a, b) => a - b),
      },
    );
    const { error: groupError } =
      permError || !roleChanged
        ? { error: null }
        : await supabaseClient.rpc('set_user_group', {
            p_base_user_id: user.base_user_id!,
            p_group_id: draft.group,
          });
    setSaving(false);
    const error = permError || groupError;
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Shranjevanje ni uspelo',
        message: error.message,
      });
      return;
    }
    setDraft(null);
    onSaved();
  };

  const added = permissionTypes.filter((p) => stateOf(p.id) === 'added');
  const kept = permissionTypes.filter((p) => stateOf(p.id) === 'kept');
  const options = groups
    .filter((g) => g.name !== ADMIN_GROUP)
    .map((g) => ({
      value: g.id.toString(),
      label: groupLabel(g),
    }));

  return (
    <Section title="Vloga in dovoljenja">
      <Select
        aria-label="Vloga"
        size="sm"
        data={options}
        value={group?.toString() ?? null}
        onChange={changeGroup}
        placeholder="Brez vloge"
        disabled={!canEdit || saving}
        clearable
      />
      {added.length > 0 && (
        <Alert color="green" variant="light" p="xs">
          <Text size="sm" fw={600}>
            + {added.length} novih iz vloge
          </Text>
          <Text size="sm">{added.map((p) => p.display_name).join(', ')}</Text>
        </Alert>
      )}
      {kept.length > 0 && (
        <Alert color="orange" variant="light" p="xs">
          <Text size="sm" fw={600}>
            {kept.length} ostane kot dodatno
          </Text>
          <Text size="sm">{kept.map((p) => p.display_name).join(', ')}</Text>
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={6} verticalSpacing={6}>
        {permissionTypes.map((p) => {
          const state = stateOf(p.id);
          const fromRole = state === 'role' || state === 'added';
          return (
            <PermissionItem
              key={p.id}
              label={p.display_name || p.name}
              state={state}
              onToggle={canEdit && !fromRole ? () => toggle(p.id) : undefined}
            />
          );
        })}
      </SimpleGrid>
      {canEdit ? (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Dovoljenja iz vloge se urejajo na zavihku Vloge.
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="default"
              disabled={!draft || saving}
              onClick={() => setDraft(null)}
            >
              Prekliči
            </Button>
            <Button size="xs" disabled={!draft} loading={saving} onClick={save}>
              Shrani
            </Button>
          </Group>
        </Group>
      ) : (
        <Text size="xs" c="dimmed">
          Nimaš dovoljenja za urejanje vlog in dovoljenj.
        </Text>
      )}
    </Section>
  );
};

interface UserDetailsProps {
  user: UserWithPermissions;
  allUsers: UserWithPermissions[];
  groups: PermissionGroup[];
  permissionTypes: PermissionType[];
  onChanged: () => void;
  onDeleted: () => void;
}

export const UserDetails = ({
  user,
  allUsers,
  groups,
  permissionTypes,
  onChanged,
  onDeleted,
}: UserDetailsProps) => {
  const currentUser = useStore($currUser);
  const can = (p: string) => !!currentUser?.permissions.includes(p);
  const [editingResidence, setEditingResidence] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const userId = user.base_user_id!;
  const isAdmin =
    groups.find((g) => g.id === user.permgroup_id)?.name === ADMIN_GROUP;

  const { data: baseUser } = getSupaWR({
    query: () =>
      supabaseClient
        .from('base_users')
        .select('invited_by, created_at')
        .eq('id', userId)
        .single(),
    table: 'base_users',
    params: ['invited', userId],
  });
  const inviter = allUsers.find((u) => u.base_user_id === baseUser?.invited_by);

  const moveOut = () =>
    modals.openConfirmModal({
      title: 'Odseli uporabnika',
      children: (
        <Text size="sm">
          {fullName(user)} ne bo imel več sobe, telefona in rojstnega datuma.
          Uporabnik, njegova prijava in dovoljenja ostanejo.
        </Text>
      ),
      labels: { confirm: 'Odseli', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabaseClient
          .from('residents')
          .delete()
          .eq('id', user.resident_id!);
        if (error) {
          notifications.show({
            color: 'red',
            title: 'Odselitev ni uspela',
            message: error.message,
          });
          return;
        }
        refetchTables('residents');
        onChanged();
      },
    });

  return (
    <Stack gap={0}>
      <Section
        title="Osebni podatki"
        action={
          !isAdmin && (
            <EditToggle
              editing={editingPersonal}
              onClick={() => {
                // closing the editor: reload so the summary shows the saved values
                if (editingPersonal) onChanged();
                setEditingPersonal(!editingPersonal);
              }}
            />
          )
        }
      >
        {editingPersonal ? (
          <Stack gap="md">
            <EditUserBaseInfo userId={userId} withTitle={false} />
            <EditUserEmail userId={userId} withTitle={false} />
          </Stack>
        ) : (
          <SimpleGrid
            cols={2}
            spacing="xs"
            verticalSpacing={6}
            style={{ gridTemplateColumns: '120px 1fr' }}
          >
            <Field label="Ime in priimek" value={fullName(user) || null} />
            <Field label="E-pošta" value={user.auth_email} />
          </SimpleGrid>
        )}
      </Section>
      <Divider />

      <Section
        title="Bivanje"
        action={
          !isAdmin &&
          (user.resident_id || editingResidence ? (
            <Group gap={4}>
              <EditToggle
                editing={editingResidence}
                onClick={() => {
                  // closing the editor: reload so the summary shows the saved values
                  if (editingResidence) onChanged();
                  setEditingResidence(!editingResidence);
                }}
              />
              {user.resident_id && !editingResidence && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  onClick={moveOut}
                >
                  Odseli
                </Button>
              )}
            </Group>
          ) : (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => setEditingResidence(true)}
            >
              Vseli
            </Button>
          ))
        }
      >
        {editingResidence ? (
          <ResidentInfoForm
            baseUserId={userId}
            withTitle={false}
            startCreating
          />
        ) : user.resident_id ? (
          <>
            <SimpleGrid
              cols={2}
              spacing="xs"
              verticalSpacing={6}
              style={{ gridTemplateColumns: '120px 1fr' }}
            >
              <Field label="Soba" value={user.room} />
              <Field label="Telefon" value={user.phone_number || null} />
              <Field
                label="Rojstni datum"
                value={formatDate(user.birth_date)}
              />
            </SimpleGrid>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            Ni stanovalec, zato nima sobe, telefona ali rojstnega datuma.
          </Text>
        )}
      </Section>
      <Divider />

      {isAdmin ? (
        <Alert icon={<IconLock />} color="gray" my="md">
          Administrator je rezerviran za razvijalce. Ima vsa dovoljenja, ni ga
          mogoče urejati ali izbrisati.
        </Alert>
      ) : (
        <RoleAndPermissions
          key={userId}
          user={user}
          groups={groups}
          permissionTypes={permissionTypes}
          canEdit={can('MANAGE_PERMISSIONS') && can('MANAGE_USERS')}
          onSaved={onChanged}
        />
      )}
      <Divider />

      <Group justify="space-between" py="md">
        <Text size="xs" c="dimmed">
          {inviter ? `Povabil: ${fullName(inviter)} · ` : 'Ustvarjen: '}
          {formatDate(user.created_at)}
        </Text>
        {!isAdmin && can('DELETE_USERS') && (
          <Box>
            <DeleteUserButton
              userId={userId}
              name={fullName(user)}
              onDeleted={onDeleted}
              asButton
            />
          </Box>
        )}
      </Group>
    </Stack>
  );
};
