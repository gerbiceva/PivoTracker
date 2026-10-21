import {
  Alert,
  Box,
  Center,
  Divider,
  LoadingOverlay,
  Stack,
} from '@mantine/core';
import { useLiveTransactions } from '../../../hooks.ts/liveTransactionsHook';
import { Transactiongraph } from './TransactionGraph';
import { TransactionsTable } from './TransactionsTable';
import { PageHeader } from '../../Admin/PageHeader';
import { ClearTableButton } from '../../Admin/ClearTableButton';

export const Transactions = () => {
  // const { loading, transactions } = useGetTransactions();
  const { transactions, isLoading, err, removeTransaction, clearAll } =
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
    <Stack w="100%">
      <PageHeader
        title="Transakcije"
        description="Vsi nakupi in plačila."
        action={
          <ClearTableButton
            table="transactions"
            what="vse transakcije"
            note="Izbrisana bodo tudi poplačila obljub, zato bodo obljube spet neporavnane."
            onCleared={clearAll}
          />
        }
      />
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
