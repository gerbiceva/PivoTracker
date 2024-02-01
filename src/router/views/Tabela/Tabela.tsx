import { ActionIcon, Button, Group, NumberInput, Pagination, Paper, ScrollArea, Stack, Table } from "@mantine/core";

const elements = [
    { position: 6, mass: 12.011, symbol: 'C', name: 'Carbon' },
    { position: 7, mass: 14.007, symbol: 'N', name: 'Nitrogen' },
    { position: 39, mass: 88.906, symbol: 'Y', name: 'Yttrium' },
    { position: 56, mass: 137.33, symbol: 'Ba', name: 'Barium' },
    { position: 58, mass: 140.12, symbol: 'Ce', name: 'Cerium' },
];

export function Tab() {
    const rows = elements.map((element) => (
        <Table.Tr key={element.name}>
            <Table.Td>{element.name}</Table.Td>
            <Table.Td>{element.position}</Table.Td>
            <Table.Td>
                <Group>
                    <NumberInput
                        maw={70}
                        defaultValue={1}
                        placeholder="2"
                    />
                    <Button variant="subtle">Dodaj</Button>
                </Group>
            </Table.Td>
            <Table.Td>
                <Button variant="light">Dodaj gajbo</Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="sm">
            <Stack>
                <Table.ScrollContainer minWidth={500}>
                    <Table striped>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Polno ime</Table.Th>
                                <Table.Th>Dolguje</Table.Th>
                                <Table.Th>Bjra</Table.Th>
                                <Table.Th>Gajba</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
                <Group w="100%" justify="end">
                    <Pagination total={10} />
                </Group>
            </Stack>
        </Paper>
    );
}