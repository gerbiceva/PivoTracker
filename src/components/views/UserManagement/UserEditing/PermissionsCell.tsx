import {
  Badge,
  Button,
  Group,
  HoverCard,
  MultiSelect,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLayoutEffect, useRef, useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { numToColor } from '../../../../utils/colorUtils';
import { Database } from '../../../../supabase/supabase';

type PermissionRow =
  Database['public']['Views']['user_permissions_view']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

interface PermissionsCellProps {
  userId: number;
  // admins implicitly have every permission, so their list isn't shown
  isAdminUser: boolean;
  permissions: PermissionRow[];
  permissionTypes: PermissionType[];
  onSaved: () => void;
}

// Inline permission editor for the user table: click the badges to edit.
export const PermissionsCell = ({
  userId,
  isAdminUser,
  permissions,
  permissionTypes,
  onSaved,
}: PermissionsCellProps) => {
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // how many badges fit on one line; the rest collapse into a "…" badge
  const [visibleCount, setVisibleCount] = useState(permissions.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;
    const ELLIPSIS_WIDTH = 32;
    const recompute = () => {
      const width = container.clientWidth;
      const badges = Array.from(measure.children) as HTMLElement[];
      const allFit = badges.every((b) => b.offsetLeft + b.offsetWidth <= width);
      if (allFit) {
        setVisibleCount(badges.length);
        return;
      }
      const fit = badges.filter(
        (b) => b.offsetLeft + b.offsetWidth <= width - ELLIPSIS_WIDTH,
      ).length;
      setVisibleCount(fit);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [permissions]);

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

  const renderBadge = (p: PermissionRow) => (
    <Badge
      key={p.permission_id}
      variant="light"
      size="sm"
      style={{ flexShrink: 0 }}
      color={numToColor(p.permission_type_id || 0)}
    >
      {p.permission_display_name ?? p.permission_name}
    </Badge>
  );

  if (isAdminUser) {
    return (
      <Badge variant="light" size="sm" color="red">
        Vsa dovoljenja
      </Badge>
    );
  }

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
          <UnstyledButton
            w="100%"
            onClick={() => (opened ? setOpened(false) : open())}
          >
            <div ref={containerRef} style={{ position: 'relative' }}>
              {/* invisible full row, used only to measure badge widths */}
              <Group
                ref={measureRef}
                gap={4}
                wrap="nowrap"
                aria-hidden
                style={{
                  position: 'absolute',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {permissions.map(renderBadge)}
              </Group>
              <Group
                gap={4}
                mih={22}
                wrap="nowrap"
                style={{ overflow: 'hidden' }}
              >
                {permissions.slice(0, visibleCount).map(renderBadge)}
                {visibleCount < permissions.length && (
                  <HoverCard
                    position="top"
                    withArrow
                    shadow="md"
                    openDelay={100}
                  >
                    <HoverCard.Target>
                      <Badge
                        variant="default"
                        size="sm"
                        style={{ flexShrink: 0 }}
                      >
                        …
                      </Badge>
                    </HoverCard.Target>
                    <HoverCard.Dropdown maw={320}>
                      <Group gap={4}>{permissions.map(renderBadge)}</Group>
                    </HoverCard.Dropdown>
                  </HoverCard>
                )}
                {permissions.length === 0 && (
                  <Text size="xs" c="dimmed">
                    + dodaj
                  </Text>
                )}
              </Group>
            </div>
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
