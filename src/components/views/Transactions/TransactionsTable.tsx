import { Button, Table, TableProps } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { DebtBadge } from '../../../components/pricing/DebtBadge';
import { UserTag } from '../../../components/users/UserTag';
import { Tables } from '../../../supabase/supabase';
import { intToEur, numberToEur } from '../../../utils/Converter';

interface ITransactionsTableProps extends TableProps {
  transactions: Tables<'named_transactions'>[];
  removeTransaction?: (id: number) => void;
}
export const TransactionsTable = ({
  transactions,
  removeTransaction,
}: ITransactionsTableProps) => {
  // const theme = useMantineTheme();
  const rows = transactions.map((element) => {
    return (
      <Table.Tr key={element.id}>
        <Table.Td>{element.id}</Table.Td>
        <Table.Td>
          <UserTag
            fullname={element.fullname || ''}
            id={element.customer_id || -1}
          />
        </Table.Td>
        <Table.Td align="right">{element.ordered}</Table.Td>
        <Table.Td align="right">
          {numberToEur(intToEur(element.paid || 0))}
        </Table.Td>
        <Table.Td align="right">
          <DebtBadge
            variant="outline"
            ordered={element.ordered!}
            paid={element.paid!}
          />
          {/* <Text c={diff < 0 ? "red" : "green"}>{numberToEur(diff)} €</Text> */}
        </Table.Td>
        <Table.Td align="right">
          {element.ordered_at &&
            new Date(element.ordered_at).toLocaleDateString()}
        </Table.Td>
        {removeTransaction && (
          <Table.Td align="right">
            <Button
              opacity={0.7}
              variant="transparent"
              color="red"
              size="xs"
              onClick={() => {
                confirm('Are you sure you want to delete this transaction?') &&
                  removeTransaction(element.id || 0);
              }}
            >
              <IconTrash />
            </Button>
          </Table.Td>
        )}
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table stickyHeader striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Id</Table.Th>
            <Table.Th>Polno ime</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Naročeno</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Plačano</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Razlika</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Datum naročila</Table.Th>
            {removeTransaction && (
              <Table.Th style={{ textAlign: 'right' }}>Odstrani</Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
