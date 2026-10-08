import {
  Alert,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Switch,
  Table,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DebtBadge } from '../../../pricing/DebtBadge';
import { UserTag } from '../../../users/UserTag';
import { formatCurrency } from '../../../../utils/Converter';
import { sumOrdersOptions, useGetSummedDebt } from './GetEverythingSum';
import { UserModal } from './UserModal';
import { PageHeader } from '../../Admin/PageHeader';
import { capitalizeName } from '../../UserManagement/UserEditing/useUserEditing';

export function PuffTable() {
  const [ord, stOrd] = useState<sumOrdersOptions>('total_difference');
  const { isLoading, data, error } = useGetSummedDebt(ord);
  const [onlyDebtors, setOnlyDebtors] = useState(true);

  const rows = useMemo(() => {
    if (error) {
      return (
        <Table.Tr>
          <Table.Td colSpan={100}>
            <Alert title="Error" color="red">
              {error.message}
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (!data && !isLoading) {
      return (
        <Table.Tr>
          <Table.Td colSpan={100}>
            <Alert title="No data">
              No data yet. Go to the <Link to={'/'}>ADD BEER</Link> section and
              sell some beer.
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (!data) {
      return undefined;
    }

    const shown = onlyDebtors
      ? data.filter((element) => (element.total_difference ?? 0) > 0)
      : data;

    if (shown.length === 0) {
      return (
        <Table.Tr>
          <Table.Td colSpan={100} ta="center" c="dimmed">
            Nihče nima pufa.
          </Table.Td>
        </Table.Tr>
      );
    }

    return shown.map((element) => (
      <Table.Tr key={element.name} p="xs">
        <Table.Td align="left">
          <UserTag
            fullname={capitalizeName(
              `${element.name ?? ''} ${element.surname ?? ''}`.trim(),
            )}
            id={element.id?.toString() || ''}
          />
        </Table.Td>
        <Table.Td align="right">{element.total_ordered}</Table.Td>
        <Table.Td align="right">
          {formatCurrency(element.total_paid || 0)}
        </Table.Td>
        <Table.Td align="right">
          <DebtBadge debt={element.total_difference || 0} />
        </Table.Td>
        <Table.Td align="right">
          <UserModal
            id={element.id || 0}
            displayName={capitalizeName(
              `${element.name ?? ''} ${element.surname ?? ''}`.trim(),
            )}
          />
        </Table.Td>
      </Table.Tr>
    ));
  }, [data, error, isLoading, onlyDebtors]);

  return (
    <Stack
      h="100%"
      style={{
        overflow: 'hidden',
      }}
    >
      <PageHeader title="Seznam pufov" description="Kdo dolguje koliko." />
      <SegmentedControl
        data={[
          {
            label: 'Zadolžitev',
            value: 'total_difference',
          },
          {
            label: 'Plačano',
            value: 'total_paid',
          },
          {
            label: 'Ime',
            value: 'name',
          },
          {
            label: 'Naročeno',
            value: 'total_ordered',
          },
        ]}
        value={ord}
        onChange={(val) => {
          // @ts-expect-error segment controll cant take generics
          stOrd(val);
        }}
        w="100%"
      />
      <Switch
        label="Prikaži samo tiste s pufom"
        checked={onlyDebtors}
        onChange={(event) => setOnlyDebtors(event.currentTarget.checked)}
      />
      <ScrollArea type="always" h="100%">
        <Paper withBorder p="sm" pos="relative">
          <LoadingOverlay visible={isLoading} />
          <Stack>
            <Table.ScrollContainer minWidth={200}>
              <Table striped highlightOnHover withColumnBorders stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: 'left' }}>Polno ime</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Vseh piv</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>
                      Skupaj plačano
                    </Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Razlika</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Edit</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Paper>
      </ScrollArea>
    </Stack>
  );
}
