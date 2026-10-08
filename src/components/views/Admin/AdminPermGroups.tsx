import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  MultiSelect,
  Stack,
  Text,
  type MultiSelectProps,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { numToColor } from '../../../utils/colorUtils';
import { Database } from '../../../supabase/supabase';
import { PageHeader } from './PageHeader';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

// managed by the devs only; the DB rejects edits to it as well
const ADMIN_GROUP = 'admin';
const ADMIN_PERMISSION = 'ADMIN';

const renderPermissionOption: MultiSelectProps['renderOption'] = ({
  option,
}) => (
  <Badge variant="light" color={numToColor(Number(option.value))}>
    {option.label}
  </Badge>
);

interface GroupCardProps {
  group: PermissionGroup;
  current: string[];
  permissionTypes: PermissionType[];
  onSaved: () => void;
}

const GroupCard = ({
  group,
  current,
  permissionTypes,
  onSaved,
}: GroupCardProps) => {
  const [selected, setSelected] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);

  // reset when the saved data changes (after save or a refetch)
  const currentKey = [...current].sort().join(',');
  useEffect(() => {
    setSelected(current);
  }, [currentKey]);

  const changed = [...selected].sort().join(',') !== currentKey;

  const options = permissionTypes
    .filter((t) => t.name !== ADMIN_PERMISSION)
    .map((t) => ({
      value: t.id.toString(),
      label: t.display_name || t.name,
    }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabaseClient.rpc('set_group_permissions', {
      p_group_id: group.id,
      p_permission_type_ids: selected.map(Number).sort((a, b) => a - b),
    });
    setSaving(false);
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Napaka pri shranjevanju vloge',
        message: error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: 'Shranjeno',
      message: `Dovoljenja za ${group.display_name || group.name} so posodobljena.`,
    });
    onSaved();
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Text fw={600}>{group.display_name || group.name}</Text>
        <MultiSelect
          data={options}
          value={selected}
          onChange={setSelected}
          placeholder="Izberi dovoljenja"
          renderOption={renderPermissionOption}
          hidePickedOptions
          searchable
        />
        <Group justify="flex-end" gap="xs">
          <Button
            size="xs"
            variant="subtle"
            disabled={!changed}
            onClick={() => setSelected(current)}
          >
            Prekliči
          </Button>
          <Button size="xs" disabled={!changed} loading={saving} onClick={save}>
            Shrani
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export const AdminPermGroups = () => {
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

  const byGroup = useMemo(() => {
    const map = new Map<number, string[]>();
    links.data?.forEach((l) => {
      const list = map.get(l.group_id) ?? [];
      list.push(l.permission_type.toString());
      map.set(l.group_id, list);
    });
    return map;
  }, [links.data]);

  const error = groups.error || links.error || types.error;
  if (error) {
    return (
      <Alert title="Napaka pri nalaganju vlog" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const editable = (groups.data ?? []).filter((g) => g.name !== ADMIN_GROUP);
  const isLoading = groups.isLoading || links.isLoading || types.isLoading;

  return (
    <Stack pos="relative">
      <LoadingOverlay visible={isLoading} />
      <PageHeader
        title="Vloge"
        description="Dovoljenja, ki jih dobi vsak član vloge. Dodatna dovoljenja posameznim uporabnikom se urejajo pri uporabnikih."
      />
      <Alert variant="light" icon={<IconLock />}>
        Vloge Administrator ni mogoče urejati.
      </Alert>
      {editable.map((g) => (
        <GroupCard
          key={g.id}
          group={g}
          current={byGroup.get(g.id) ?? []}
          permissionTypes={types.data ?? []}
          onSaved={() => links.mutate()}
        />
      ))}
    </Stack>
  );
};
