import {
  Alert,
  Avatar,
  Box,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { Transactiongraph } from '../Transactions/TransactionGraph';
import { TransactionsTable } from '../Transactions/TransactionsTable';
import { useGetTransactions } from '../Transactions/useTransactions';
import { useGetUserInfo } from './getUserInfo';
import { numToColor } from '../../../../utils/colorUtils';
import { PDFUrl } from '../pdf/Pdf';

export const PivoByUser = () => {
  // read link params
  const { id } = useParams();
  const parsedId = parseInt(id || '');

  // load user data
  const {
    data: userInfo,
    error: userErr,
    isLoading: isLoadingUser,
  } = useGetUserInfo(parsedId);

  console.log(parsedId);

  const {
    data: transactions,
    error: TransactionErr,
    isLoading: isLoadingTransactions,
  } = useGetTransactions(parsedId);

  // error handling
  if (userErr) {
    return (
      <Alert c="red" title="User fetching">
        Error fetching current user. Try using the link in the form of{' '}
        <Text fw="bold">/user/5</Text>
      </Alert>
    );
  }

  // error handling
  if (TransactionErr) {
    return (
      <Alert c="red" title="Transaction fetching">
        Error fetching current user. Try using the link in the form of{' '}
        <Text fw="bold">/user/5</Text>
      </Alert>
    );
  }

  // when data is loaded
  return (
    <Stack pos="relative" py="xl">
      <LoadingOverlay visible={isLoadingUser || isLoadingTransactions} />
      <Group w="100%" justify="space-between">
        {/* ime in tag */}
        <Group align="center" py="xl">
          <Avatar variant="light" size="md" color={numToColor(parsedId)}>
            {userInfo?.base_user_id}
          </Avatar>
          <Title c={numToColor(parsedId)}>{userInfo?.name}</Title>
        </Group>

        {/* pdf */}
        {transactions && userInfo && (
          <Box px="xl">
            <PDFUrl transactions={transactions} userinfo={userInfo} />
          </Box>
        )}
      </Group>
      <Transactiongraph transactions={transactions || []} />
      <Divider label="Zgodovina transakcij" my="xl" />

      <TransactionsTable transactions={transactions || []} />
    </Stack>
  );
};
