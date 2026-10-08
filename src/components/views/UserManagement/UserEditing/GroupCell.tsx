import { Badge, Menu, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];

// only admins may assign or remove this group; the DB enforces it too
export const ADMIN_GROUP = 'admin';

export const isResidentGroup = (g: PermissionGroup) =>
  [g.name, g.display_name].some((n) => n?.toLowerCase() === 'stanovalec');

interface GroupCellProps {
  userId: number;
  groupId: number | null;
  groups: PermissionGroup[];
  currentUserIsAdmin: boolean;
  onSaved: () => void;
}

// Role badge for the user table; clicking it opens a role picker.
export const GroupCell = ({
  userId,
  groupId,
  groups,
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

  const change = async (value: number) => {
    if (value === groupId) return;
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
