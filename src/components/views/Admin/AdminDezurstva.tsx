import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCalendar,
  IconCalendarPlus,
  IconClockEdit,
  IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import {
  drawTimeLabel,
  poolMonthLabel,
  signupCountLabel,
  timeLeftLabel,
} from '../Dezurstva/format';
import { PageHeader } from './PageHeader';

type Pool = Database['public']['Tables']['reception_pools']['Row'];

const refetchPools = () =>
  refetchTables(['reception_pools', 'reception_applications', 'notifications']);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DRAW_TIME_FORMAT = 'D. M. YYYY, HH:mm';

// this month and the next three, as the first day of each
const monthOptions = (taken: string[]) =>
  [0, 1, 2, 3].map((i) => {
    const value = dayjs().add(i, 'month').startOf('month').format('YYYY-MM-DD');
    const label = capitalize(poolMonthLabel(value));
    const isTaken = taken.includes(value);
    return {
      value,
      label: isTaken ? `${label} (že razpisan)` : label,
      disabled: isTaken,
    };
  });

const ScheduleDrawModal = ({
  opened,
  onClose,
  takenMonths,
}: {
  opened: boolean;
  onClose: () => void;
  takenMonths: string[];
}) => {
  const options = monthOptions(takenMonths);
  // next month is the usual case
  const [month, setMonth] = useState<string | null>(
    () => options.slice(1).find((o) => !o.disabled)?.value ?? null,
  );
  const [drawAt, setDrawAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inPast = !!drawAt && !dayjs(drawAt).isAfter(dayjs());

  const submit = async () => {
    if (!month || !drawAt || inPast) return;
    setSaving(true);
    setError(null);
    const { error } = await supabaseClient.rpc('open_reception_pool', {
      p_month: month,
      p_closes_at: dayjs(drawAt).toISOString(),
    });
    setSaving(false);
    if (error) return setError(error.message);
    notifications.show({
      color: 'green',
      message: `Žreb za ${poolMonthLabel(month)} je razpisan. Vsi z dovoljenjem za dežurstvo vidijo obvestilo na domači strani.`,
    });
    refetchPools();
    setDrawAt(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Razpiši žreb"
      styles={{
        title: { fontWeight: 700, fontSize: 'var(--mantine-h3-font-size)' },
      }}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Vsi z dovoljenjem za dežurstvo bodo na domači strani dobili obvestilo
          in se lahko prijavijo ali odjavijo do začetka žreba.
        </Text>
        <Select
          label="Mesec dežurstev"
          data={options}
          value={month}
          onChange={setMonth}
          allowDeselect={false}
          withAsterisk
        />
        <DateTimePicker
          label="Čas žreba"
          description="Prijave so odprte do takrat."
          placeholder="Izberi datum in uro"
          valueFormat={DRAW_TIME_FORMAT}
          leftSection={<IconCalendar size={16} />}
          minDate={new Date()}
          value={drawAt}
          onChange={setDrawAt}
          error={inPast ? 'Čas žreba mora biti v prihodnosti.' : undefined}
          withAsterisk
        />
        {error && (
          <Alert color="red" icon={<IconAlertCircle />}>
            {error}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Prekliči
          </Button>
          <Button
            leftSection={<IconCalendarPlus size={16} />}
            onClick={submit}
            loading={saving}
            disabled={!month || !drawAt || inPast}
          >
            Razpiši in obvesti
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const RescheduleModal = ({
  pool,
  opened,
  onClose,
}: {
  pool: Pool;
  opened: boolean;
  onClose: () => void;
}) => {
  const [drawAt, setDrawAt] = useState<string | null>(
    dayjs(pool.closes_at).format('YYYY-MM-DD HH:mm:ss'),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inPast = !!drawAt && !dayjs(drawAt).isAfter(dayjs());

  const submit = async () => {
    if (!drawAt || inPast) return;
    setSaving(true);
    setError(null);
    const { error } = await supabaseClient.rpc('update_reception_pool_time', {
      p_pool_id: pool.id,
      p_closes_at: dayjs(drawAt).toISOString(),
    });
    setSaving(false);
    if (error) return setError(error.message);
    notifications.show({
      color: 'green',
      message: 'Žreb je prestavljen, obvestilo je posodobljeno.',
    });
    refetchPools();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Prestavi žreb: ${poolMonthLabel(pool.month)}`}
      styles={{
        title: { fontWeight: 700, fontSize: 'var(--mantine-h3-font-size)' },
      }}
    >
      <Stack>
        <DateTimePicker
          label="Nov čas žreba"
          description="Če je bil rok že mimo, se prijave spet odprejo."
          valueFormat={DRAW_TIME_FORMAT}
          leftSection={<IconCalendar size={16} />}
          minDate={new Date()}
          value={drawAt}
          onChange={setDrawAt}
          error={inPast ? 'Čas žreba mora biti v prihodnosti.' : undefined}
          withAsterisk
        />
        {error && (
          <Alert color="red" icon={<IconAlertCircle />}>
            {error}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Prekliči
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!drawAt || inPast}
          >
            Shrani
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const PoolCard = ({ pool }: { pool: Pool }) => {
  const [rescheduling, setRescheduling] = useState(false);
  const left = timeLeftLabel(pool.closes_at);
  const isOpen = pool.status === 'open';

  const {
    data: applicants,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient.rpc('get_reception_applicants', { p_pool_id: pool.id }),
    table: 'reception_applications',
    params: ['applicants', pool.id],
  });

  const cancel = () =>
    modals.openConfirmModal({
      title: `Prekliči žreb za ${poolMonthLabel(pool.month)}?`,
      centered: true,
      children: (
        <Text size="sm">
          Izbrisane bodo vse prijave ({applicants?.length ?? 0}) in obvestilo na
          domači strani.
        </Text>
      ),
      labels: { confirm: 'Prekliči žreb', cancel: 'Nazaj' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabaseClient.rpc('cancel_reception_pool', {
          p_pool_id: pool.id,
        });
        if (error) {
          return notifications.show({
            color: 'red',
            title: 'Napaka',
            message: error.message,
          });
        }
        notifications.show({ color: 'green', message: 'Žreb je preklican.' });
        refetchPools();
      },
    });

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Stack gap={4}>
            <Group gap="xs">
              <Title order={3}>{capitalize(poolMonthLabel(pool.month))}</Title>
              {isOpen && left && <Badge variant="light">Prijave odprte</Badge>}
              {isOpen && !left && (
                <Badge variant="light" color="gray">
                  Prijave zaprte
                </Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed">
              Žreb: {drawTimeLabel(pool.closes_at)}
              {left && ` · ${left}`}
            </Text>
          </Stack>
          {isOpen && (
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconClockEdit size={14} />}
                onClick={() => setRescheduling(true)}
              >
                Prestavi
              </Button>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={cancel}
              >
                Prekliči
              </Button>
            </Group>
          )}
        </Group>

        <Text fw={600}>
          {applicants ? signupCountLabel(applicants.length) : 'Prijavljeni'}
        </Text>
        {error && (
          <Alert color="red" icon={<IconAlertCircle />}>
            {error.message}
          </Alert>
        )}
        {isLoading && <Skeleton h={80} />}
        {applicants?.length === 0 && (
          <Text size="sm" c="dimmed">
            Še nihče se ni prijavil.
          </Text>
        )}
        {!!applicants?.length && (
          <Table.ScrollContainer minWidth={360}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40}>#</Table.Th>
                  <Table.Th>Ime in priimek</Table.Th>
                  <Table.Th w={70}>Soba</Table.Th>
                  <Table.Th w={120}>Prijava</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {applicants.map((a, i) => (
                  <Table.Tr key={a.user_id}>
                    <Table.Td c="dimmed">{i + 1}</Table.Td>
                    <Table.Td>
                      {a.name} {a.surname}
                    </Table.Td>
                    <Table.Td>{a.room ?? '–'}</Table.Td>
                    <Table.Td c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {dayjs(a.applied_at).format('D. M. HH:mm')}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
      {rescheduling && (
        <RescheduleModal
          pool={pool}
          opened={rescheduling}
          onClose={() => setRescheduling(false)}
        />
      )}
    </Paper>
  );
};

export const AdminDezurstva = () => {
  const [scheduling, setScheduling] = useState(false);

  const {
    data: pools,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('reception_pools')
        .select('*')
        .order('month', { ascending: false }),
    table: 'reception_pools',
    params: ['all'],
  });

  return (
    <Stack>
      <PageHeader
        title="Dežurstva"
        description="Razpiši žreb za dežurstva. Vsi z dovoljenjem za dežurstvo dobijo obvestilo na domači strani in se lahko prijavijo do žreba."
        action={
          <Button
            leftSection={<IconCalendarPlus size={16} />}
            onClick={() => setScheduling(true)}
          >
            Razpiši žreb
          </Button>
        }
      />

      {error && (
        <Alert
          title="Napaka pri nalaganju"
          color="red"
          icon={<IconAlertCircle />}
        >
          {error.message}
        </Alert>
      )}
      {isLoading && <Skeleton h={160} radius="md" />}
      {pools?.length === 0 && (
        <Text c="dimmed">
          Žreb še ni bil razpisan. Začni z gumbom Razpiši žreb.
        </Text>
      )}
      {pools?.map((pool) => (
        <PoolCard key={pool.id} pool={pool} />
      ))}

      {scheduling && (
        <ScheduleDrawModal
          opened={scheduling}
          onClose={() => setScheduling(false)}
          takenMonths={(pools ?? []).map((p) => p.month)}
        />
      )}
    </Stack>
  );
};
