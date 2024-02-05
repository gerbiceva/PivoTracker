import { Badge, Button, Divider, Group, LoadingOverlay, Modal, NumberInput, Paper, Stack, Table, Text } from "@mantine/core";
import { getDateFromString, numberToEur, pivoVGajba } from "../../../utils/Converter";
import { useGetElements } from "./useGetElements";
import { Tables } from "../../../supabase/supabase";
import { useDisclosure } from "@mantine/hooks";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";

export interface IUserElements {
    fullname: string;
    ordered: number;
    paid: number;
    owed: number;
    ordered_at: string;
};

const getElementsParsed = (elements: Tables<"everything_sum">[]) => {
    return elements.map((vals) => ({
        fullname: vals.fullname!,
        ordered: vals.total_ordered!,
        paid: vals.total_paid! / 10,
        owed: pivoVGajba(vals.total_ordered!, vals.total_paid! / 10)
    })).sort((a, b) => b.owed - a.owed);
};

const getUserElements = (fullname: string) : PromiseLike<IUserElements[] | undefined> =>  {
    return supabaseClient.from("everything").select().eq("fullname", fullname).order("ordered_at", { ascending: false }).then((res) => {
        if(!res.error) {
            return res.data.map((vals) => ({
                fullname: vals.fullname!,
                ordered: vals.ordered!,
                paid: vals.paid! / 10 || 0,
                owed: pivoVGajba(vals.ordered!, vals.paid! / 10),
                ordered_at: vals.ordered_at!
            }));
        }
        else {
            return undefined;
        }
    });
};

const addGajba = (fullname: string) => () => {
    supabaseClient.from("customers").select("id").eq("fullname", fullname).then((res) => {
        if(!res.error) {
            supabaseClient.from("transactions").insert({ customer_id: res.data[0].id, ordered: 24, paid: 300 }).then((res) => {
                if(!res.error) {
                    notifications.show({
                        title: "Uspeh",
                        color: "green",
                        message: `${fullname} je uspešno kupil in plačal gajbo piva!`,
                    });
                }
                else {
                    notifications.show({
                        title: "Napaka",
                        color: "red",
                        message: `Napaka pri dodajanju gajbe piva: ${res.error.message}!`,
                    });
                }
            });
        }
        else {
            notifications.show({
                title: "Napaka",
                color: "red",
                message: `Napaka pri iskanju uporabnika: ${res.error.message}!`
            });
        }
    });
};


export function Tab() {
    const { loading, elements } = useGetElements();
    const elementsParsed = getElementsParsed(elements);
    const [opened, { open, close }] = useDisclosure(false);
    const [userElements, setUserElements] = useState<IUserElements[]>();
    const [userFullName, setUserFullName] = useState("");
    const [userTotalOwed, setUserTotalOwed] = useState(0);

    const rows = elementsParsed.map((element) => (
        <Table.Tr key={element.fullname} onClick={async () => {
                setUserElements(await getUserElements(element.fullname)); 
                setUserFullName(element.fullname);
                open();
            }}>
            <Table.Td align="left">{element.fullname}</Table.Td>
            <Table.Td align="right">{element.ordered}</Table.Td>
            <Table.Td align="right">{numberToEur(element.paid)} €</Table.Td>
            <Table.Td align="right"><Badge variant="light" radius="sm" size="lg" color={element.owed <= 0 ? "green" :"red"}>{numberToEur(element.owed)} €</Badge></Table.Td>
        </Table.Tr>
    ));

    const getUserRows = useMemo(() => {
        // if no elements (somehow??)
        if(userElements === undefined) {
            return;
        }

        // calculate total ordered and paid
        const userTotalOrdered = userElements.reduce((acc, val) => acc + val.ordered, 0);
        const userTotalPaid = userElements.reduce((acc, val) => acc + val.paid, 0);
        
        // calculate owed
        setUserTotalOwed(pivoVGajba(userTotalOrdered, userTotalPaid));
        
        return userElements.map((element) => (
            <Table.Tr key={element.ordered_at}>
                <Table.Td align="right">{getDateFromString(element.ordered_at)[0]}</Table.Td>
                <Table.Td align="right">{getDateFromString(element.ordered_at)[1]}</Table.Td>
                <Table.Td align="right">{element.ordered}</Table.Td>
                <Table.Td align="right">{numberToEur(element.paid)} €</Table.Td>
                <Table.Td align="right"><Badge variant="light" radius="sm" size="lg" color={element.owed <= 0 ? "green" :"red"}>{numberToEur(element.owed)} €</Badge></Table.Td>
            </Table.Tr>
        ));
    }, [userElements]);

    return (
        <Paper withBorder p="sm" pos="relative">
            <LoadingOverlay visible={loading} />
            <Modal size="xl" opened={opened} onClose={close} withCloseButton={false} centered>
                <Stack>
                    <Group justify="space-between">
                        <Text>{userFullName}</Text>
                        <Badge variant="light" radius="sm" size="lg" color={userTotalOwed <= 0 ? "green" :"red"}>{numberToEur(userTotalOwed)} €</Badge>
                        <Group justify="right">
                            <Group>
                                <NumberInput
                                    maw={70}
                                    defaultValue={1}
                                    placeholder="2"
                                />
                                <Button variant="outline">Dodaj</Button>
                            </Group>
                            <Button variant="outline" onClick={addGajba(userFullName)}>Dodaj gajbo</Button>
                        </Group>
                    </Group>
                    <Divider label="Transakcije" />
                    <Table.ScrollContainer minWidth={500}>
                        <Table striped highlightOnHover stickyHeader>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{textAlign: "right"}}>Kupljeno ob</Table.Th>
                                    <Table.Th style={{textAlign: "right"}}>Kupljeno dne</Table.Th>
                                    <Table.Th style={{textAlign: "right"}}>Število piv</Table.Th>
                                    <Table.Th style={{textAlign: "right"}}>Plačano</Table.Th>
                                    <Table.Th style={{textAlign: "right"}}>Razlika</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{getUserRows}</Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Stack>
            </Modal>
            
            <Stack>
                <Table.ScrollContainer minWidth={200}>
                    <Table striped highlightOnHover withColumnBorders stickyHeader>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{textAlign: "left"}}>Polno ime</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Vseh piv</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Skupaj plačano</Table.Th>
                                <Table.Th style={{textAlign: "right"}}>Razlika</Table.Th>
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