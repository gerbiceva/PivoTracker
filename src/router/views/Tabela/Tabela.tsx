import { ActionIcon, Badge, Box, Button, Group, LoadingOverlay, NumberInput, Pagination, Paper, ScrollArea, Stack, Table, Text } from "@mantine/core";
import { numberToEur, pivoVGajba } from "../../../utils/Converter";
import { useGetElements } from "./useGetElements";
import { Tables } from "../../../supabase/supabase";

interface hehe extends Tables<"everything_sum"> {
    owed: number
}

const getElementsParsed = (elements: Tables<"everything_sum">[]) => {
    return elements.map((vals) => ({
        fullname: vals.fullname!,
        ordered: vals.total_ordered!,
        paid: vals.total_paid! / 10 || 0,
        owed: pivoVGajba(vals.total_ordered!, vals.total_paid! / 10)
    }));
};



export function Tab() {
    const { loading, elements } = useGetElements();
    const elementsParsed = getElementsParsed(elements);
    console.log(elementsParsed);

    const rows = elementsParsed.map((element) => (
        <Table.Tr key={element.fullname}>
            <Table.Td align="left">{element.fullname}</Table.Td>
            <Table.Td align="right">{element.ordered}</Table.Td>
            <Table.Td align="right">{numberToEur(element.paid)} €</Table.Td>
            <Table.Td align="right"><Badge variant="light" radius="sm" size="lg" color={element.owed <= 0 ? "green" :"red"}>{numberToEur(element.owed)}</Badge></Table.Td>
            {/* <Table.Td>
                <Group justify="space-around">
                    <Group>
                        <NumberInput
                            maw={70}
                            defaultValue={1}
                            placeholder="2"
                        />
                        <Button variant="subtle">Dodaj</Button>
                    </Group>
                    <Button variant="subtle">Dodaj gajbo</Button>
                </Group>
            </Table.Td> */}
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="sm" pos="relative">
            <LoadingOverlay visible={loading} />
            <Stack>
                <Table.ScrollContainer minWidth={200}>
                    <Table striped highlightOnHover withColumnBorders stickyHeader>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{textAlign: "left"}}>Polno ime</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Vseh piv</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Skupaj plačano</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Razlika</Table.Th>
                                {/* <Table.Th>Utils</Table.Th> */}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
                {/* <Group w="100%" justify="end">
                    <Pagination total={10} />
                </Group> */}
            </Stack>
        </Paper>
    );
}