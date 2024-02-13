import {
  Alert,
  Badge,
  LoadingOverlay,
  Paper,
  Stack,
  Table,
} from "@mantine/core";
import { useMemo } from "react";
import { numberToEur } from "../../../utils/Converter";
import { UserModal } from "./UserModal";
import { useGetSummedDebt } from "./useGetElements";

export interface IUserElements {
  fullname: string;
  ordered: number;
  paid: number;
  owed: number;
  ordered_at: string;
}

export function PuffTable() {
  const { isLoading, data } = useGetSummedDebt();
  const rows = useMemo(() => {
    if (!data && !isLoading) {
      return (
        <Table.Tr>
          <Table.Td rowSpan={100}>
            <Alert title="No data">
              No data yet. Go to the <b>ADD BEER</b> section and sell some beer.
            </Alert>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (!data) {
      return <Table.Tr></Table.Tr>;
    }

    return data.map((element) => (
      <Table.Tr
        key={element.fullname}
        // onClick={async () => {
        //   setUserElements(await getUserElements(element.fullname));
        //   setUserFullName(element.fullname);
        //   open();
        // }}
      >
        <Table.Td align="left">{element.fullname}</Table.Td>
        <Table.Td align="right">{element.total_ordered}</Table.Td>
        <Table.Td align="right">
          {numberToEur(element.total_paid || 0)} €
        </Table.Td>
        <Table.Td align="right">
          <Badge
            variant="light"
            radius="sm"
            size="lg"
            color={element.owed <= 0 ? "green" : "red"}
          >
            {numberToEur(element.owed)} €
          </Badge>
        </Table.Td>
        <Table.Td align="right">
          <UserModal id={0} displayName={element.fullname || ""} />
        </Table.Td>
      </Table.Tr>
    ));
  }, [data, isLoading]);

  return (
    <Paper withBorder p="sm" pos="relative">
      <LoadingOverlay visible={isLoading} />

      <Stack>
        <Table.ScrollContainer minWidth={200}>
          <Table striped highlightOnHover withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ textAlign: "left" }}>Polno ime</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Vseh piv</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>
                  Skupaj plačano
                </Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Razlika</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Edit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  );
}
