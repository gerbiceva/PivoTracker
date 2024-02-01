import { Box, Group, LoadingOverlay, Paper, Stack, Table, Text } from "@mantine/core";
import { useGetTransactions } from "./useTransactions";
import { intToEur, pivoCena } from "../../../utils/Converter";


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
            <Table stickyHeader stickyHeaderOffset={60} striped highlightOnHover >
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Id</Table.Th>
                        <Table.Th>Polno ime</Table.Th>
                        <Table.Th>Naročeno</Table.Th>
                        <Table.Th>Plačano</Table.Th>
                        <Table.Th>Razlika</Table.Th>
                        <Table.Th>Datum naročila</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
                {/* <Table.Caption>Scroll page to see sticky thead</Table.Caption> */}
            </Table>
        </>
    )
};