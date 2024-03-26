import {
  Alert,
  Center,
  Divider,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Title,
} from '@mantine/core';
import { useLiveTransactions } from '../../../components/hooks.ts/liveTransactionsHook';
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
    <ScrollArea type="always" h="100%">
      <Stack py="xl">
        <LoadingOverlay visible={isLoading} />
        <Title order={2} pb="xl">
          Vse transakcije
        </Title>
        {/* graph */}
        <Transactiongraph transactions={transactions} />
        <Divider label="Zgodovina transakcij" py="lg" />
        {/* tabble */}
        <TransactionsTable
          transactions={transactions}
          removeTransaction={removeTransaction}
        />
      </Stack>
    </ScrollArea>
  );
};
