import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Drawer,
  Group,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useStore } from '@nanostores/react';
import dayjs from 'dayjs';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { $currUser } from '../../../global-state/user';
import { PromiseRow } from './useObljubeEditing';

interface PoplacilaDrawerProps {
  // a single obljuba, or a user's aggregated row
  row: PromiseRow | null;
  onClose: () => void;
}

const formatDate = (date: string | null | undefined) =>
  date ? dayjs(date).local().format('DD. MM. YYYY HH:mm') : '';

export const PoplacilaDrawer = ({ row, onClose }: PoplacilaDrawerProps) => {
  const currentUser = useStore($currUser);
  const obljuba = row?.promise;

  const { data: poplacila, error } = getSupaWR({
    query: () => {
      let query = supabaseClient
        .from('obljube_poplacila')
        .select(
          '*, obljube!inner(who, reason), transactions(ordered, ordered_at, items(name))',
        )
        .order('created_at', { ascending: false });
      query = obljuba
        ? query.eq('obljuba_id', obljuba.id ?? -1)
        : query.eq('obljube.who', row?.who ?? -1);
      return query;
    },
    table: ['obljube_poplacila', 'obljube', 'transactions'],
    params: ['poplacila', obljuba?.id ?? null, row?.who ?? null],
  });

  const form = useForm({
    initialValues: { amount: 1, note: '' },
    validate: {
      amount: (v) =>
        v > 0 && v <= (row?.remaining ?? 0)
          ? null
          : `Največ ${row?.remaining ?? 0}`,
    },
  });

  const addManual = async (values: typeof form.values) => {
    if (!obljuba) return;
    const { error } = await supabaseClient.from('obljube_poplacila').insert({
      obljuba_id: obljuba.id!,
      amount: values.amount,
      note: values.note.trim() || null,
      created_by: currentUser?.base_user_id ?? null,
    });
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Vpis ni uspel',
        message: error.message,
      });
      return;
    }
    form.reset();
    refetchTables('obljube_poplacila');
  };

  const removeManual = async (id: number) => {
    const { error } = await supabaseClient
      .from('obljube_poplacila')
      .delete()
      .eq('id', id);
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Brisanje ni uspelo',
        message: error.message,
      });
      return;
    }
    refetchTables('obljube_poplacila');
  };

  return (
    <Drawer
      opened={!!row}
      onClose={onClose}
      position="right"
      size="lg"
      title={
        row && (
          <Stack gap={0}>
            <Text fw={700}>{row.name}</Text>
            <Text size="sm" c="dimmed">
              {obljuba ? obljuba.reason : `${row.count} obljub`}
            </Text>
          </Stack>
        )
      }
    >
      {row && (
        <Stack>
          <Group gap="xs">
            <Badge variant="light" color="gray">
              Obljubljeno {row.amount}
            </Badge>
            <Badge variant="light" color="green">
              Plačano {row.paid}
            </Badge>
            <Badge variant="light" color={row.remaining ? 'orange' : 'green'}>
              Dolguje {row.remaining}
            </Badge>
          </Group>

          {error && (
            <Alert color="red" title="Napaka pri nalaganju plačil">
              {error.message}
            </Alert>
          )}

          <Table.ScrollContainer minWidth={obljuba ? 0 : 480}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Datum</Table.Th>
                  {!obljuba && <Table.Th>Obljuba</Table.Th>}
                  <Table.Th>Vir</Table.Th>
                  <Table.Th>Piva</Table.Th>
                  <Table.Th w={40} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {poplacila?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed" ta="center">
                        Še ni plačil.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {poplacila?.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      {formatDate(p.transactions?.ordered_at ?? p.created_at)}
                    </Table.Td>
                    {!obljuba && <Table.Td>{p.obljube.reason}</Table.Td>}
                    <Table.Td>
                      {p.transactions ? (
                        `Prodaja: ${p.transactions.ordered}× ${p.transactions.items?.name ?? ''}`
                      ) : (
                        <Text size="sm" c="dimmed">
                          Ročno{p.note ? `: ${p.note}` : ''}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td fw={700}>{p.amount}</Table.Td>
                    <Table.Td>
                      {p.transaction_id == null && (
                        <Tooltip label="Odstrani ročni vpis">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => removeManual(p.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {obljuba && row.remaining > 0 && (
            <form onSubmit={form.onSubmit(addManual)}>
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Ročni vpis (odpis ali plačilo izven prodaje)
                </Text>
                <Group align="flex-start">
                  <NumberInput
                    w={110}
                    min={1}
                    max={row.remaining}
                    placeholder="Piva"
                    {...form.getInputProps('amount')}
                  />
                  <TextInput
                    style={{ flex: '1 1 10rem' }}
                    placeholder="Opomba, npr. odpisano"
                    {...form.getInputProps('note')}
                  />
                  <Button type="submit">Dodaj</Button>
                </Group>
              </Stack>
            </form>
          )}
        </Stack>
      )}
    </Drawer>
  );
};
