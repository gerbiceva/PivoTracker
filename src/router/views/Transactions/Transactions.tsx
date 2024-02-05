import {
  Alert,
  Button,
  Center,
  Divider,
  LoadingOverlay,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useLiveTransactions } from "../../../components/hooks.ts/liveTransactionsHook";
import { intToEur, numberToEur, pivoCena } from "../../../utils/Converter";
import { Transactiongraph } from "./TransactionGraph";

export const Transactions = () => {
  // const { loading, transactions } = useGetTransactions();
  const { transactions, isLoading, err, removeTransaction } =
    useLiveTransactions();
  // const [ activePage, setPage ] = useState(1);

  const rows = transactions.map((element) => {
    const diff = intToEur(element.paid || 0) - pivoCena(element.ordered || 0);
    return (
      <Table.Tr key={element.id}>
        <Table.Td>{element.id}</Table.Td>
        <Table.Td>{element.fullname}</Table.Td>
        <Table.Td align="right">{element.ordered}</Table.Td>
        <Table.Td align="right">
          {numberToEur(intToEur(element.paid || 0))} €
        </Table.Td>
        <Table.Td align="right">
          <Text c={diff < 0 ? "red" : "green"}>{numberToEur(diff)} €</Text>
        </Table.Td>
        <Table.Td align="right">
          {element.ordered_at &&
            new Date(element.ordered_at).toLocaleDateString()}
        </Table.Td>
        <Table.Td align="right">
          <Button
            variant="light"
            color="red"
            size="xs"
            onClick={() => {
              removeTransaction(element.id || 0);
            }}
          >
            <IconTrash />
          </Button>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (err) {
    return (
      <Center w="100%" h="100%">
        <Alert color="red" title="Error" mih="100px" miw="300px">
          {err.message}
        </Alert>
      </Center>
    );
  }

  return (
    <>
      <Stack>
        <LoadingOverlay visible={isLoading} />
        {/* graph */}
        <Transactiongraph transactions={transactions} />
        <Divider label="Zgodovina transakcij" />

        {/* table */}
        <Table.ScrollContainer minWidth={500}>
          <Table stickyHeader striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Id</Table.Th>
                <Table.Th>Polno ime</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Naročeno</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Plačano</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Razlika</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>
                  Datum naročila
                </Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Odstrani</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </>
  );
};
