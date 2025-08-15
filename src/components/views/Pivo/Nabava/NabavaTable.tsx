import { Alert, LoadingOverlay, Paper, Stack, Table } from '@mantine/core';
import { useMemo } from 'react';
import { Tables } from '../../../../supabase/supabase';
import { formatCurrency } from '../../../../utils/Converter';

interface NabavaTableProps {
  data: Tables<'gerba_storage'>[];
  error: Error | null;
  isLoading: boolean;
}

export function NabavaTable({ data, error, isLoading }: NabavaTableProps) {
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

    if (data && !isLoading && data.length == 0) {
      return (
        <Table.Tr>
          <Table.Td colSpan={100}>
            <Alert title="No data" variant="light">
              Ni podatkov o nabavi. Statistika o nabavi bo izpisana, ko dodate
              prvi nakup.
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    return data.map((element) => (
      <Table.Tr key={element.id} p="xs">
        <Table.Td>{new Date(element.created_at).toLocaleDateString()}</Table.Td>
        <Table.Td>{element.notes}</Table.Td>
        <Table.Td align="right">{element.beer_count}</Table.Td>
        <Table.Td align="right">
          {element.price ? formatCurrency(element.price) : 'N/A'}
        </Table.Td>
        {/* <Table.Td>{element.minister}</Table.Td> */}
      </Table.Tr>
    ));
  }, [data, error, isLoading]);

  return (
    <Paper p="sm" pos="relative">
      <LoadingOverlay visible={isLoading} />

      <Stack>
        <Table.ScrollContainer minWidth={200}>
          <Table striped highlightOnHover withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th align="right">Datum</Table.Th>
                <Table.Th align="right">Opombe</Table.Th>
                <Table.Th align="right">Število piv</Table.Th>
                <Table.Th align="right">Cena</Table.Th>
                {/* <Table.Th align="right">Potrdil</Table.Th> */}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  );
}
