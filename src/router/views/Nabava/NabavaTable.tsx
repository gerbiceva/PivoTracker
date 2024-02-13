import { Alert, LoadingOverlay, Paper, Stack, Table } from "@mantine/core";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Tables } from "../../../supabase/supabase";
import { numberToEur } from "../../../utils/Converter";

interface NabavaTableProps {
  data: Tables<"nabava">[];
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

    if (!data && !isLoading) {
      return (
        <Table.Tr>
          <Table.Td colSpan={100}>
            <Alert title="No data">
              No data yet. Go to the <Link to={"/"}>ADD BEER</Link> section and
              sell some beer.
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (!data) {
      return "nodata";
    }

    return data.map((element) => (
      <Table.Tr key={element.id} p="xs">
        <Table.Td>{new Date(element.created_at).toLocaleDateString()}</Table.Td>
        <Table.Td align="right">{element.stevilo_piv}</Table.Td>
        <Table.Td align="right">
          {element.cena ? numberToEur(element.cena) : "N/A"}
        </Table.Td>
      </Table.Tr>
    ));
  }, [data, error]);

  return (
    <Paper p="sm" pos="relative">
      <LoadingOverlay visible={isLoading} />

      <Stack>
        <Table.ScrollContainer minWidth={200}>
          <Table striped highlightOnHover withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th align="right">Datum</Table.Th>
                <Table.Th align="right">Število piv</Table.Th>
                <Table.Th align="right">Cena</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  );
}
