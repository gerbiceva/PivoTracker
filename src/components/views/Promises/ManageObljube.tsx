import {
  ActionIcon,
  Alert,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Pagination,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  useMatches,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import {
  IconAlertCircle,
  IconEdit,
  IconHeartHandshake,
  IconSearch,
  IconSum,
  IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { UserTag } from '../../users/UserTag';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { supabaseClient } from '../../../supabase/supabaseClient';
import {
  PromiseElement,
  promiseUserName,
  useObljubeEditing,
} from './useObljubeEditing';
import { PageHeader } from '../Admin/PageHeader';
import { SortableTh } from '../Admin/SortableTh';
import { PoplacilaDrawer } from './PoplacilaDrawer';

// Slovene dual/plural: 1 obljuba, 2 obljubi, 3-4 obljube, 5+ obljub
const promisesLabel = (n: number) => {
  const m = n % 100;
  if (m === 1) return 'obljuba';
  if (m === 2) return 'obljubi';
  if (m === 3 || m === 4) return 'obljube';
  return 'obljub';
};

// 1 uporabnik, 2 uporabnika, 3-4 uporabniki, 5+ uporabnikov
const usersLabel = (n: number) => {
  const m = n % 100;
  if (m === 1) return 'uporabnik';
  if (m === 2) return 'uporabnika';
  if (m === 3 || m === 4) return 'uporabniki';
  return 'uporabnikov';
};

const formatDate = (date: string | null) =>
  date ? dayjs(date).local().format('DD. MM. YYYY') : '';

export const ManagePromises = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(inputValue, 200);

  const {
    rows,
    allRows,
    totalCount,
    error,
    isLoading,
    totalPages,
    activePage,
    setPage,
    sort,
    toggleSort,
    aggregated,
    setAggregated,
  } = useObljubeEditing(debouncedSearchQuery);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // phones drop the less important columns, so the table can be narrower
  const tableMinWidth = useMatches({ base: 480, sm: 700 });

  const [selectedObljuba, setSelectedObljuba] = useState<PromiseElement>();
  // row whose payment log is open; read from the live rows so it updates
  const [logKey, setLogKey] = useState<string | null>(null);
  const logRow = allRows.find((r) => r.key === logKey) ?? null;

  const form = useForm<Partial<PromiseElement>>({
    initialValues: { amount: 0, reason: '' },
  });

  useEffect(() => {
    if (selectedObljuba) {
      form.setInitialValues({
        amount: selectedObljuba.amount,
        reason: selectedObljuba.reason || '',
      });
      form.reset();
    }
  }, [selectedObljuba]);

  const handleEditSubmit = async (values: typeof form.values) => {
    if (!selectedObljuba) return;

    const { error } = await supabaseClient
      .from('obljube')
      .update({
        amount: values.amount || undefined,
        reason: values.reason || undefined,
      })
      .eq('id', selectedObljuba.id || -1);

    if (error) {
      notifications.show({
        color: 'red',
        title: 'Urejanje ni uspelo',
        message: error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: 'Obljuba posodobljena',
      message: promiseUserName(selectedObljuba),
    });
    form.resetDirty();
    refetchTables('obljube');
    setSelectedObljuba(undefined);
  };

  const deletePromise = async (promise: PromiseElement, name: string) => {
    const { error } = await supabaseClient
      .from('obljube')
      .delete()
      .eq('id', promise.id || -1);

    if (error) {
      notifications.show({
        color: 'red',
        title: 'Brisanje ni uspelo',
        message: error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: 'Obljuba izbrisana',
      message: name,
    });
    refetchTables('obljube');
  };

  const confirmDelete = (promise: PromiseElement, name: string) =>
    modals.openConfirmModal({
      title: 'Izbriši obljubo',
      children: (
        <Text size="sm">
          Ali res želiš izbrisati obljubo uporabnika <b>{name}</b> (količina:{' '}
          {promise.amount})? Tega ni mogoče razveljaviti.
        </Text>
      ),
      labels: { confirm: 'Izbriši', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: () => deletePromise(promise, name),
    });

  if (error) {
    return (
      <Alert title="Napaka pri nalaganju obljub" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const tableRows = rows.map((row) => (
    <Table.Tr
      key={row.key}
      onClick={() => setLogKey(row.key)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>
        <UserTag fullname={row.name || 'N/A'} id={row.who?.toString() || ''} />
      </Table.Td>
      <Table.Td visibleFrom="sm">{row.amount}</Table.Td>
      <Table.Td>
        <Text size="sm" fw={700} c={row.remaining ? 'orange' : 'green'}>
          {row.remaining || 'Plačano'}
        </Text>
      </Table.Td>
      {aggregated ? (
        <Table.Td>{row.count}</Table.Td>
      ) : (
        <Table.Td>{row.reason}</Table.Td>
      )}
      <Table.Td visibleFrom="sm">{formatDate(row.created_at)}</Table.Td>
      {!aggregated && row.promise && (
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Group gap={4} wrap="nowrap">
            <Tooltip label="Uredi obljubo">
              <ActionIcon
                variant="subtle"
                onClick={() => setSelectedObljuba(row.promise)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Izbriši obljubo">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => confirmDelete(row.promise!, row.name)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  ));

  return (
    <Container>
      <Stack>
        <PageHeader
          title="Obljube"
          description="Kdo je komu obljubil koliko piva."
          action={
            <Button
              leftSection={<IconHeartHandshake size={16} />}
              onClick={() => navigate('/promises/create')}
            >
              Dodaj obljubo
            </Button>
          }
        />
        <Group>
          <TextInput
            style={{ flex: '1 1 14rem' }}
            placeholder="Išči po imenu, razlogu ali količini"
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Button
            variant={aggregated ? 'filled' : 'default'}
            color={aggregated ? 'green' : undefined}
            leftSection={<IconSum size={16} />}
            onClick={() => setAggregated(!aggregated)}
          >
            Seštej po uporabnikih
          </Button>
        </Group>

        <Modal
          opened={!!selectedObljuba}
          onClose={() => setSelectedObljuba(undefined)}
          title="Uredi obljubo"
        >
          <form onSubmit={form.onSubmit(handleEditSubmit)}>
            <Stack>
              <NumberInput
                label="Količina piva"
                placeholder="npr. 5"
                min={1}
                {...form.getInputProps('amount')}
              />
              <Textarea
                label="Razlog"
                placeholder="npr. Obljubil 5 piv za pomoč pri dogodku."
                minRows={3}
                {...form.getInputProps('reason')}
              />
              <Button type="submit" disabled={!form.isDirty()}>
                Shrani
              </Button>
            </Stack>
          </form>
        </Modal>

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Table.ScrollContainer minWidth={tableMinWidth}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <SortableTh
                    w={220}
                    field="name"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Ime
                  </SortableTh>
                  <SortableTh
                    w={120}
                    visibleFrom="sm"
                    field="amount"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Obljubljeno
                  </SortableTh>
                  <SortableTh
                    w={120}
                    field="remaining"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Dolguje
                  </SortableTh>
                  {aggregated ? (
                    <Table.Th>Št. obljub</Table.Th>
                  ) : (
                    <SortableTh field="reason" sort={sort} onSort={toggleSort}>
                      Razlog
                    </SortableTh>
                  )}
                  <SortableTh
                    w={150}
                    visibleFrom="sm"
                    field="date"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    {aggregated ? 'Zadnja obljuba' : 'Datum'}
                  </SortableTh>
                  {!aggregated && <Table.Th w={90}>Uredi</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{tableRows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>
        <Group justify="space-between">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setPage}
          />
          <Text size="sm" c="dimmed">
            {totalCount}{' '}
            {aggregated ? usersLabel(totalCount) : promisesLabel(totalCount)}
          </Text>
        </Group>
      </Stack>
      <PoplacilaDrawer row={logRow} onClose={() => setLogKey(null)} />
    </Container>
  );
};
