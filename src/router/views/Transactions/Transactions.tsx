import { Box, Group, LoadingOverlay, Paper, Stack, Table, Text } from "@mantine/core";
import { useGetTransactions } from "./useTransactions";

// 150 => 1.5€
const intToEur = (cents: number) => {
    return (cents / 100);
}

const pivoCena = (ordered: number) => {
    const gajbaPrice = 30;
    const pivoPrice = 1.5;
    let owed = 0;
    let numGajb = Math.floor(ordered / 24);
    owed += numGajb * gajbaPrice;
    ordered -= numGajb * 24;
    owed += ordered * pivoPrice;

    return owed;
};


export const Transactions = () => {
    const { loading, transactions } = useGetTransactions()

    const rows = transactions.map((element) => {
        const diff = intToEur(element.paid || 0) - pivoCena(element.ordered || 0);
        return (
        <Table.Tr key={element.id}>
            <Table.Td>{element.id}</Table.Td>
            <Table.Td>{element.fullname}</Table.Td>
            <Table.Td>{element.ordered}</Table.Td>
            <Table.Td>{element.paid && intToEur(element.paid).toFixed(2)} €</Table.Td>
            <Table.Td><Text c={diff < 0 ? "red" : "green"}>{diff} €</Text></Table.Td>
            <Table.Td>{element.ordered_at && new Date(element.ordered_at).toLocaleDateString()}</Table.Td>
        </Table.Tr>
    )});

    return (
        <>
            <LoadingOverlay visible={loading} />
            <Table stickyHeader stickyHeaderOffset={60}>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Id</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Ordered</Table.Th>
                        <Table.Th>Paid</Table.Th>
                        <Table.Th>Difference</Table.Th>
                        <Table.Th>ordered_at</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
                <Table.Caption>Scroll page to see sticky thead</Table.Caption>
            </Table>
        </>
    )
};