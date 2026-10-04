import {
  Badge,
  Button,
  Group,
  MultiSelect,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { numToColor } from '../../../../utils/colorUtils';
import { Database } from '../../../../supabase/supabase';

type PermissionRow =
  Database['public']['Views']['user_permissions_view']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

interface PermissionsCellProps {
  userId: number;
  permissions: PermissionRow[];
  permissionTypes: PermissionType[];
  onSaved: () => void;
}

// Inline permission editor for the user table: click the badges to edit.
export const PermissionsCell = ({
  userId,
  permissions,
  permissionTypes,
  onSaved,
}: PermissionsCellProps) => {
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const current = permissions
    .map((p) => p.permission_type_id?.toString() ?? '')
    .filter(Boolean);

  const open = () => {
    setSelected(current);
    setOpened(true);
  };

  const changed =
    JSON.stringify([...current].sort()) !==
    JSON.stringify([...selected].sort());

  const save = async () => {
    setSaving(true);
    const { error } = await supabaseClient.rpc('set_user_permissions', {
      p_base_user_id: userId,
      p_permission_type_ids: selected.map(Number).sort((a, b) => a - b),
    });
    setSaving(false);
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Napaka pri shranjevanju dovoljenj',
        message: error.message,
      });
      return;
    }
    setOpened(false);
    onSaved();
  };

  return (
    // stop clicks from triggering the row's navigate-to-user handler
    <div onClick={(e) => e.stopPropagation()}>
      <Popover
        opened={opened}
        onChange={setOpened}
        width={320}
        position="bottom-start"
        trapFocus
        withArrow
        shadow="md"
      >
        <Popover.Target>
          <UnstyledButton onClick={() => (opened ? setOpened(false) : open())}>
            <Group gap={4} mih={22}>
              {permissions.map((p) => (
                <Badge
                  key={p.permission_id}
                  variant="light"
                  size="sm"
                  color={numToColor(p.permission_type_id || 0)}
                >
                  {p.permission_display_name ?? p.permission_name}
                </Badge>
              ))}
              {permissions.length === 0 && (
                <Text size="xs" c="dimmed">
                  + dodaj
                </Text>
              )}
            </Group>
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <MultiSelect
              data={permissionTypes.map((t) => ({
                value: t.id.toString(),
                label: t.display_name || t.name,
              }))}
              value={selected}
              onChange={setSelected}
              placeholder="Izberi dovoljenja"
              comboboxProps={{ withinPortal: false }}
              hidePickedOptions
              searchable
            />
            <Group justify="flex-end" gap="xs">
              <Button
                size="xs"
                variant="subtle"
                onClick={() => setOpened(false)}
              >
                Prekliči
              </Button>
              <Button
                size="xs"
                disabled={!changed}
                loading={saving}
                onClick={save}
              >
                Shrani
              </Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};
