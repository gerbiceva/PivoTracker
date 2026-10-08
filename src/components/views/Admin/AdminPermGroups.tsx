import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  MultiSelect,
  Stack,
  Text,
  TextInput,
  Tooltip,
  type MultiSelectProps,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { numToColor } from '../../../utils/colorUtils';
import { Database } from '../../../supabase/supabase';
import { PageHeader } from './PageHeader';
import { isResidentGroup } from '../UserManagement/UserEditing/GroupCell';

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
  // renamed or deleted: the group list itself changed
  onGroupsChanged: () => void;
}

const showError = (title: string, message: string) =>
  notifications.show({ color: 'red', title, message });

// Title row of a vloga card: the name, editable in place, plus delete.
const GroupTitle = ({
  group,
  onGroupsChanged,
}: {
  group: PermissionGroup;
  onGroupsChanged: () => void;
}) => {
  const label = group.display_name || group.name;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);
  const [busy, setBusy] = useState(false);
  // Stanovalec is the default vloga everyone gets reset to
  const deletable = !isResidentGroup(group);

  const rename = async () => {
    if (!name.trim() || name.trim() === label) return setEditing(false);
    setBusy(true);
    const { error } = await supabaseClient.rpc('rename_permission_group', {
      p_group_id: group.id,
      p_display_name: name.trim(),
    });
    setBusy(false);
    if (error) return showError('Preimenovanje ni uspelo', error.message);
    setEditing(false);
    onGroupsChanged();
  };

  const remove = () =>
    modals.openConfirmModal({
      title: 'Izbriši vlogo',
      children: (
        <Text size="sm">
          Ali res želiš izbrisati vlogo <b>{label}</b>? Vlogo lahko izbrišeš
          samo, če je nima noben uporabnik.
        </Text>
      ),
      labels: { confirm: 'Izbriši', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabaseClient.rpc('delete_permission_group', {
          p_group_id: group.id,
        });
        if (error) return showError('Brisanje ni uspelo', error.message);
        onGroupsChanged();
      },
    });

  if (editing) {
    return (
      <Group gap="xs" wrap="nowrap">
        <TextInput
          aria-label="Ime vloge"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') rename();
            if (e.key === 'Escape') setEditing(false);
          }}
          size="xs"
          flex={1}
          autoFocus
        />
        <ActionIcon aria-label="Shrani ime" loading={busy} onClick={rename}>
          <IconCheck size={16} />
        </ActionIcon>
        <ActionIcon
          aria-label="Prekliči"
          variant="subtle"
          color="gray"
          onClick={() => {
            setName(label);
            setEditing(false);
          }}
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>
    );
  }

  return (
    <Group justify="space-between" wrap="nowrap">
      <Text fw={600}>{label}</Text>
      <Group gap={4} wrap="nowrap">
        <Tooltip label="Preimenuj">
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Preimenuj"
            onClick={() => {
              setName(label);
              setEditing(true);
            }}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          label={deletable ? 'Izbriši' : 'Stanovalca ni mogoče izbrisati'}
        >
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Izbriši"
            disabled={!deletable}
            onClick={remove}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};

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
              Dovoljenja vlogi dodaš na njeni kartici, ko je ustvarjena.
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

const GroupCard = ({
  group,
  current,
  permissionTypes,
  onSaved,
  onGroupsChanged,
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
        <GroupTitle group={group} onGroupsChanged={onGroupsChanged} />
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
        action={<AddGroupButton onCreated={() => groups.mutate()} />}
      />
      {editable.map((g) => (
        <GroupCard
          key={g.id}
          group={g}
          current={byGroup.get(g.id) ?? []}
          permissionTypes={types.data ?? []}
          onSaved={() => links.mutate()}
          onGroupsChanged={() => {
            groups.mutate();
            links.mutate();
          }}
        />
      ))}
    </Stack>
  );
};
