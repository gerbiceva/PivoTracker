import {
  Alert,
  Box,
  Center,
  Divider,
  LoadingOverlay,
  Stack,
  Title,
} from '@mantine/core';
import { useLiveTransactions } from '../../../hooks.ts/liveTransactionsHook';
import { Transactiongraph } from './TransactionGraph';
import { TransactionsTable } from './TransactionsTable';

export const Transactions = () => {
  // const { loading, transactions } = useGetTransactions();
  const { transactions, isLoading, err, removeTransaction } =
    useLiveTransactions();
  // const [ activePage, setPage ] = useState(1);

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
    <Stack py="xl" w="100%">
      <Title order={2} pb="xl">
        Vse transakcije
      </Title>
      <Box p="lg">
        <Transactiongraph transactions={transactions} />
      </Box>
      <LoadingOverlay visible={isLoading} />
      <Divider label="Zgodovina transakcij" py="lg" />
      {/* tabble */}
      <TransactionsTable
        transactions={transactions}
        removeTransaction={removeTransaction}
      />
    </Stack>
  );
};
