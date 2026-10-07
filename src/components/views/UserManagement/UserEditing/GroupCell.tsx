import { Badge, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];

// only admins may assign or remove this group; the DB enforces it too
export const ADMIN_GROUP = 'admin';

interface GroupCellProps {
  userId: number;
  groupId: number | null;
  groups: PermissionGroup[];
  currentUserIsAdmin: boolean;
  onSaved: () => void;
}

// Inline role picker for the user table.
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

  // non-admins can't touch admins, so show a plain badge
  if (group?.name === ADMIN_GROUP && !currentUserIsAdmin) {
    return (
      <Badge variant="light" color="red">
        {label(group)}
      </Badge>
    );
  }

  const options = groups
    .filter((g) => currentUserIsAdmin || g.name !== ADMIN_GROUP)
    .map((g) => ({ value: g.id.toString(), label: label(g) }));

  const change = async (value: string | null) => {
    if (value === (groupId?.toString() ?? null)) return;
    setSaving(true);
    const { error } = await supabaseClient.rpc('set_user_group', {
      p_base_user_id: userId,
      p_group_id: value == null ? null : Number(value),
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
      <Select
        size="xs"
        data={options}
        value={groupId?.toString() ?? null}
        onChange={change}
        placeholder="Brez vloge"
        disabled={saving}
        allowDeselect={false}
        comboboxProps={{ withinPortal: true }}
      />
    </div>
  );
};
