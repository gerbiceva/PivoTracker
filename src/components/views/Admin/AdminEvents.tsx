import {
  ActionIcon,
  Alert,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconAlertCircle, IconEdit, IconPlus } from '@tabler/icons-react';
import { useStore } from '@nanostores/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { $currUser } from '../../../global-state/user';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { ManageEvent } from '../events/ManageEvent';

// null = modal closed, 0 = new event, otherwise the id being edited
type Editing = number | null;

export const AdminEvents = () => {
  const user = useStore($currUser);
  const canEdit = !!user?.permissions.includes('MANAGE_EVENTS');
  const [editing, setEditing] = useState<Editing>(null);

  // computed once per mount so the SWR key stays stable
  const [from] = useState(() => dayjs().startOf('day').toISOString());

  const { data, error, isLoading, mutate } = getSupaWR({
    query: () =>
      supabaseClient
        .from('events')
        .select('*')
        .gte('event_date', from)
        .order('event_date', { ascending: true }),
    table: 'events',
    params: ['upcoming', from],
  });

  if (error) {
    return (
      <Alert title="Napaka pri nalaganju dogodkov" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const rows = data?.map((event) => (
    <Table.Tr key={event.id}>
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        {dayjs(event.event_date).local().format('DD. MM. YYYY HH:mm')}
      </Table.Td>
      <Table.Td fw={500}>{event.title}</Table.Td>
      <Table.Td c="dimmed">{event.subtitle}</Table.Td>
      {canEdit && (
        <Table.Td>
          <Tooltip label="Uredi dogodek">
            <ActionIcon variant="subtle" onClick={() => setEditing(event.id)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        </Table.Td>
      )}
    </Table.Tr>
  ));

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Prihajajoči dogodki</Title>
        {canEdit && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setEditing(0)}
          >
            Dodaj dogodek
          </Button>
        )}
      </Group>

      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} />
        {data && data.length === 0 ? (
          <Text c="dimmed">Ni prihajajočih dogodkov.</Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={170}>Datum</Table.Th>
                  <Table.Th>Naslov</Table.Th>
                  <Table.Th>Podnaslov</Table.Th>
                  {canEdit && <Table.Th w={60} />}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </div>

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        size="xl"
      >
        {editing !== null && (
          <ManageEvent
            key={editing}
            eventId={editing}
            onSaved={() => {
              setEditing(null);
              mutate();
            }}
          />
        )}
      </Modal>
    </Stack>
  );
};
