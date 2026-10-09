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
import { ADMIN_GROUP, isResidentGroup } from './GroupCell';
import { EditUserBaseInfo } from './EditUserBaseInfo';
import { EditUserEmail } from './EditUserEmail';
import { ResidentInfoForm } from './ResidentInfoForm';
import { DeleteUserButton } from './DeleteUserButton';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];
type GroupLink = Database['public']['Tables']['permgroup_permissions']['Row'];

const groupLabel = (g: PermissionGroup) => g.display_name || g.name;
const fullName = (u: Pick<UserWithPermissions, 'name' | 'surname'>) =>
  capitalizeName(`${u.name ?? ''} ${u.surname ?? ''}`.trim());
export const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('sl-SI') : null;

export const Section = ({
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

export const Field = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
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

// only what the header shows, so the own-profile modal can use it too
type HeaderUser = Pick<
  UserWithPermissions,
  'name' | 'surname' | 'auth_email' | 'permgroup_id' | 'resident_id' | 'room'
>;

export const UserDetailsHeader = ({
  user,
  groups,
}: {
  user: HeaderUser;
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

type PermState = 'off' | 'on' | 'added' | 'removed';

const PERM_STYLE: Record<
  PermState,
  { bg?: string; border?: string; tag?: string; tagColor?: string }
> = {
  off: {},
  on: { border: 'var(--mantine-color-teal-filled)' },
  added: {
    bg: 'var(--mantine-color-green-light)',
    tag: 'novo',
    tagColor: 'green',
  },
  removed: {
    bg: 'var(--mantine-color-red-light)',
    tag: 'odstranjeno',
    tagColor: 'red',
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
  const checked = state === 'on' || state === 'added';
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
          checked={checked}
          readOnly
          tabIndex={-1}
          style={{ pointerEvents: 'none' }}
        />
        <Text size="sm" c={checked ? undefined : 'dimmed'} flex={1}>
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

const sameSet = (a: number[], b: Set<number>) =>
  a.length === b.size && a.every((id) => b.has(id));

// The vloga is a preset: picking one fills in its permissions, which can then
// be changed freely. Saved permissions are the user's real permissions.
const RoleAndPermissions = ({
  user,
  groups,
  permissionTypes,
  canEdit,
  allowAdmin,
  onSaved,
}: {
  user: UserWithPermissions;
  groups: PermissionGroup[];
  permissionTypes: PermissionType[];
  canEdit: boolean;
  // only admins may move people into or out of the admin group
  allowAdmin: boolean;
  onSaved: () => void;
}) => {
  const { data: links } = getSupaWR({
    query: () => supabaseClient.from('permgroup_permissions').select('*'),
    table: 'permgroup_permissions',
  });
  const preset = useMemo(() => {
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

  const saved = useMemo(
    () =>
      user.permissions
        .map((p) => p.permission_type_id)
        .filter((id): id is number => id != null),
    [user.permissions],
  );
  const [draft, setDraft] = useState<{
    group: number | null;
    perms: number[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const group = draft ? draft.group : user.permgroup_id;
  const perms = draft ? draft.perms : saved;
  const roleChanged = draft != null && draft.group !== user.permgroup_id;
  const isAdminGroup =
    group != null && groups.find((g) => g.id === group)?.name === ADMIN_GROUP;
  const groupPreset = preset(group);
  const customized =
    group != null && !isAdminGroup && !sameSet(perms, groupPreset);

  const stateOf = (id: number): PermState => {
    const was = saved.includes(id);
    const is = perms.includes(id);
    if (is) return was ? 'on' : 'added';
    return was ? 'removed' : 'off';
  };

  const changeGroup = (value: string | null) => {
    const next = value == null ? null : Number(value);
    if (next === user.permgroup_id) return setDraft(null);
    const nextIsAdmin = groups.find((g) => g.id === next)?.name === ADMIN_GROUP;
    // a new vloga replaces the permissions with its preset; admin and
    // "no vloga" keep the current list
    setDraft({
      group: next,
      perms: next == null || nextIsAdmin ? saved : [...preset(next)],
    });
  };

  const resetToPreset = () => setDraft({ group, perms: [...groupPreset] });

  const residentGroup = groups.find(isResidentGroup);
  const resetToResident = () =>
    residentGroup &&
    setDraft({ group: residentGroup.id, perms: [...preset(residentGroup.id)] });
  const isResident =
    group === residentGroup?.id &&
    residentGroup != null &&
    sameSet(perms, preset(residentGroup.id));

  const toggle = (id: number) =>
    setDraft({
      group,
      perms: perms.includes(id)
        ? perms.filter((x) => x !== id)
        : [...perms, id],
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const ids = [...draft.perms].sort((a, b) => a - b);
    const { error } = roleChanged
      ? await supabaseClient.rpc('set_user_group', {
          p_base_user_id: user.base_user_id!,
          p_group_id: draft.group,
          p_permission_type_ids: ids,
        })
      : await supabaseClient.rpc('set_user_permissions', {
          p_base_user_id: user.base_user_id!,
          p_permission_type_ids: ids,
        });
    setSaving(false);
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

  const label = (p: PermissionType) => p.display_name || p.name;
  const added = permissionTypes.filter((p) => stateOf(p.id) === 'added');
  const removed = permissionTypes.filter((p) => stateOf(p.id) === 'removed');
  const options = groups
    .filter((g) => allowAdmin || g.name !== ADMIN_GROUP)
    .map((g) => ({
      value: g.id.toString(),
      label: groupLabel(g),
    }));

  return (
    <Section title="Vloga in dovoljenja">
      <Group gap="xs" wrap="nowrap" align="center">
        <Select
          aria-label="Vloga"
          size="sm"
          flex={1}
          data={options}
          value={group?.toString() ?? null}
          onChange={changeGroup}
          placeholder="Brez vloge"
          disabled={!canEdit || saving}
          clearable
        />
        {customized && (
          <Text size="xs" c="dimmed">
            prilagojeno
          </Text>
        )}
      </Group>
      {(added.length > 0 || removed.length > 0) && (
        <Alert color="gray" variant="light" p="xs">
          {added.length > 0 && (
            <Text size="sm" c="green">
              + {added.map(label).join(', ')}
            </Text>
          )}
          {removed.length > 0 && (
            <Text size="sm" c="red">
              − {removed.map(label).join(', ')}
            </Text>
          )}
        </Alert>
      )}
      {isAdminGroup ? (
        <Text size="sm" c="dimmed">
          Administrator ima vsa dovoljenja.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={6} verticalSpacing={6}>
          {permissionTypes.map((p) => (
            <PermissionItem
              key={p.id}
              label={label(p)}
              state={stateOf(p.id)}
              onToggle={canEdit ? () => toggle(p.id) : undefined}
            />
          ))}
        </SimpleGrid>
      )}
      {canEdit ? (
        <Group justify="space-between">
          <Group gap={0}>
            <Button
              size="xs"
              variant="subtle"
              color="red"
              disabled={!residentGroup || isResident || saving}
              onClick={resetToResident}
            >
              Ponastavi na stanovalca
            </Button>
            {customized && (
              <Button
                size="xs"
                variant="subtle"
                disabled={saving}
                onClick={resetToPreset}
              >
                Ponastavi na vlogo
              </Button>
            )}
          </Group>
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
  const adminGroupId = groups.find((g) => g.name === ADMIN_GROUP)?.id;
  const currentUserIsAdmin =
    adminGroupId != null &&
    allUsers.some(
      (u) =>
        u.base_user_id === currentUser?.base_user_id &&
        u.permgroup_id === adminGroupId,
    );
  // admins are reserved for developers: only other admins may edit them
  const locked =
    user.permgroup_id != null &&
    user.permgroup_id === adminGroupId &&
    !currentUserIsAdmin;

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
          !locked && (
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
          !locked &&
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

      {locked ? (
        <Alert icon={<IconLock />} color="gray" my="md">
          Administrator je rezerviran za razvijalce. Ima vsa dovoljenja, urejajo
          ga lahko samo drugi administratorji.
        </Alert>
      ) : (
        <RoleAndPermissions
          key={userId}
          user={user}
          groups={groups}
          permissionTypes={permissionTypes}
          canEdit={can('MANAGE_PERMISSIONS') && can('MANAGE_USERS')}
          allowAdmin={currentUserIsAdmin}
          onSaved={onChanged}
        />
      )}
      <Divider />

      <Group justify="space-between" py="md">
        <Text size="xs" c="dimmed">
          {inviter ? `Povabil: ${fullName(inviter)} · ` : 'Ustvarjen: '}
          {formatDate(user.created_at)}
        </Text>
        {!locked && can('DELETE_USERS') && (
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
