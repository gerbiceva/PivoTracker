import { Badge, Menu, Stack, Text, UnstyledButton } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';
import { GroupPreset } from './useUserEditing';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

// only admins may assign or remove this group; the DB enforces it too
export const ADMIN_GROUP = 'admin';

export const isResidentGroup = (g: PermissionGroup) =>
  [g.name, g.display_name].some((n) => n?.toLowerCase() === 'stanovalec');

interface GroupCellProps {
  userId: number;
  groupId: number | null;
  groups: PermissionGroup[];
  // the user's current permission type ids
  permissions: number[];
  permissionTypes: PermissionType[];
  groupPreset: GroupPreset;
  currentUserIsAdmin: boolean;
  onSaved: () => void;
}

// Role badge for the user table; clicking it opens a role picker.
// Picking a role replaces the user's permissions with the role's preset.
export const GroupCell = ({
  userId,
  groupId,
  groups,
  permissions,
  permissionTypes,
  groupPreset,
  currentUserIsAdmin,
  onSaved,
}: GroupCellProps) => {
  const [saving, setSaving] = useState(false);
  const group = groups.find((g) => g.id === groupId);
  const label = (g: PermissionGroup) => g.display_name || g.name;

  // most users are plain residents, so only the other roles get a badge
  const isDefault =
    groupId == null || (group != null && isResidentGroup(group));
  const badge = isDefault ? (
    <Text size="sm" c="dimmed">
      {group ? label(group) : 'Brez vloge'}
    </Text>
  ) : (
    <Badge variant="light" color={group?.name === ADMIN_GROUP ? 'red' : 'teal'}>
      {/* a set id with no matching group means the groups failed to load */}
      {group ? label(group) : `#${groupId}`}
    </Badge>
  );

  // non-admins can't touch admins, so show a plain badge
  if (group?.name === ADMIN_GROUP && !currentUserIsAdmin) return badge;

  const options = groups.filter(
    (g) => currentUserIsAdmin || g.name !== ADMIN_GROUP,
  );

  const assign = async (value: number) => {
    setSaving(true);
    const { error } = await supabaseClient.rpc('set_user_group', {
      p_base_user_id: userId,
      p_group_id: value,
    });
    setSaving(false);
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Napaka pri spremembi vloge',
        message: error.message,
      });
      return;
    }
    onSaved();
  };

  const change = (value: number) => {
    if (value === groupId) return;
    const target = groups.find((g) => g.id === value);
    // the admin group implies everything and leaves the list untouched
    if (!target || target.name === ADMIN_GROUP) return assign(value);
    const preset = groupPreset(value);
    const names = (ids: number[]) =>
      ids
        .map((id) => permissionTypes.find((t) => t.id === id))
        .map((t) => t?.display_name || t?.name)
        .join(', ');
    const removed = permissions.filter((id) => !preset.has(id));
    const added = [...preset].filter((id) => !permissions.includes(id));
    if (removed.length === 0 && added.length === 0) return assign(value);
    modals.openConfirmModal({
      title: `Vloga ${label(target)}`,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Dovoljenja bodo zamenjana s prednastavitvijo vloge.
          </Text>
          {added.length > 0 && (
            <Text size="sm" c="green">
              + {names(added)}
            </Text>
          )}
          {removed.length > 0 && (
            <Text size="sm" c="red">
              − {names(removed)}
            </Text>
          )}
        </Stack>
      ),
      labels: { confirm: 'Zamenjaj', cancel: 'Prekliči' },
      onConfirm: () => assign(value),
    });
  };

  return (
    // stop clicks from triggering the row's open-user handler
    <div onClick={(e) => e.stopPropagation()}>
      <Menu withinPortal disabled={saving}>
        <Menu.Target>
          <UnstyledButton>{badge}</UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {options.map((g) => (
            <Menu.Item
              key={g.id}
              onClick={() => change(g.id)}
              fw={g.id === groupId ? 700 : undefined}
            >
              {label(g)}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};
