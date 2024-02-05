import { Button, Divider, LoadingOverlay, Pagination, Paper, Stack, Table, Text } from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { useGetTransactions } from "./useTransactions";
import { intToEur, numberToEur, pivoCena, pivoVGajba } from "../../../utils/Converter";
import { useMemo, useState } from "react";
import { useLiveTransactions } from "../../../components/hooks.ts/liveTransactionsHook";
import { IconTrash, IconTrashFilled, IconTrashX } from "@tabler/icons-react";

interface ChartTooltipProps {
    label: string;
    payload: Record<string, any>[] | undefined;
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
    if (!payload) return null;
  
    return (
      <Paper px="md" py="sm" withBorder shadow="md" radius="md">
        <Text fw={500} mb={5}>
          Zaporedna številka: {label}
        </Text>
        {payload.map((item: any) => (
          <Text fw="500" key={item.name} c={item.color} fz="sm">
            {item.name}: {numberToEur(item.value)} €
          </Text>
        ))}
      </Paper>
    );
}

export const Transactions = () => {
    // const { loading, transactions } = useGetTransactions();
    const { transactions, isLoading, err, removeTransaction } = useLiveTransactions();
    // const [ activePage, setPage ] = useState(1);

    const rows = transactions.map((element) => {
        const diff = intToEur(element.paid || 0) - pivoCena(element.ordered || 0);
        return (
        <Table.Tr key={element.id}>
            <Table.Td>{element.id}</Table.Td>
            <Table.Td>{element.fullname}</Table.Td>
            <Table.Td align="right">{element.ordered}</Table.Td>
            <Table.Td align="right">{numberToEur(intToEur(element.paid || 0))} €</Table.Td>
            <Table.Td align="right"><Text c={diff < 0 ? "red" : "green"}>{numberToEur(diff)} €</Text></Table.Td>
            <Table.Td align="right">{element.ordered_at && new Date(element.ordered_at).toLocaleDateString()}</Table.Td>
            <Table.Td align="right"><Button variant="light" color="red" size="xs" onClick={() => {removeTransaction(element.id || 0)}}><IconTrash/></Button></Table.Td>
        </Table.Tr>
    )});

    const totalOwedAccumulator = useMemo(() => {
        const trans = transactions.slice().reverse();
        let total_ordered = 0;
        let total_paid = 0;
        let it = 0;
        return trans.map((val) => {
            total_ordered += val.ordered || 0;
            total_paid += val.paid! / 10 || 0;
            return {id: it++, Dolg: pivoVGajba(total_ordered, total_paid)};
        });
    }, [transactions]);

    return (
        <>
            <Stack>
                <LoadingOverlay visible={isLoading} />

                <LineChart
                    h={250}
                    data={totalOwedAccumulator}
                    dataKey="id"
                    unit="€"
                    withDots={false}
                    tooltipProps={{content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,}}
                    series={[
                        { name: 'Dolg', color: (totalOwedAccumulator && totalOwedAccumulator[totalOwedAccumulator.length - 1]?.Dolg > 0) ? 'teal.6' : 'red.4' }, // 
                    ]}
                />

                <Divider label="Zgodovina transakcij" />

                <Table.ScrollContainer minWidth={500}>
                    <Table stickyHeader striped highlightOnHover >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Id</Table.Th>
                                <Table.Th>Polno ime</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Naročeno</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Plačano</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Razlika</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Datum naročila</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Odstrani</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
                {/* <Pagination total={rows.length} value={activePage} onChange={setPage}/> */}
            </Stack>
        </>
    )
};