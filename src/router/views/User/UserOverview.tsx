import {
  Alert,
  Avatar,
  Badge,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { useGetUserInfo } from "./getUserInfo";
import { useGetTransactions } from "../Transactions/useTransactions";
import { Transactiongraph } from "../Transactions/TransactionGraph";
import { TransactionsTable } from "../Transactions/TransactionsTable";

export const UserView = () => {
  // read link params
  const { id } = useParams();
  const parsedId = parseInt(id || "");

  // load user data
  const {
    data: userInfo,
    error: userErr,
    isLoading: isLoadingUser,
  } = useGetUserInfo(parsedId);
  const {
    data: transactions,
    error: TransactionErr,
    isLoading: isLoadingTransactions,
  } = useGetTransactions(parsedId);

  // error handling
  if (userErr) {
    return (
      <Alert c="red" title="User fetching">
        Error fetching current user. Try using the link in the form of{" "}
        <Text fw="bold">/user/5</Text>
      </Alert>
    );
  }

  // error handling
  if (TransactionErr) {
    return (
      <Alert c="red" title="Transaction fetching">
        Error fetching current user. Try using the link in the form of{" "}
        <Text fw="bold">/user/5</Text>
      </Alert>
    );
  }

  // when data is loaded
  return (
    <Stack pos="relative" py="xl">
      <LoadingOverlay visible={isLoadingUser || isLoadingTransactions} />
      <Group w="100%">
        <Group align="center" py="xl">
          <Avatar variant="light" size="md">
            {userInfo?.id}
          </Avatar>
          <Title>{userInfo?.fullname}</Title>
        </Group>
      </Group>
      <Transactiongraph transactions={transactions || []} />
      <Divider label="Zgodovina transakcij" my="xl" />

      <TransactionsTable transactions={transactions || []} />
    </Stack>
  );
};
