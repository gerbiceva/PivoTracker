import { Avatar, Divider, Group, LoadingOverlay, Stack, Title } from "@mantine/core";
import { numToColor } from "../../../components/users/stringToCol";
import { Transactiongraph } from "../Transactions/TransactionGraph";
import { TransactionsTable } from "../Transactions/TransactionsTable";
import { NabavaAdder } from "./NabavaAdder";

export const Nabava = () => {
    // when data is loaded
    return (
        <Stack pos="relative" py="xl">
            <Title order={2}>Nabava</Title>
            <LoadingOverlay visible={false} />
            <NabavaAdder></NabavaAdder>
        </Stack>
    );
};