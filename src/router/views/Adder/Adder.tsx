import { Paper, Stack, Title, TextInput, SimpleGrid, NumberInput, Box, Button, LoadingOverlay, Group, Text, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { notifications } from "@mantine/notifications";
import { NameCombobox } from "./NameCombobox";
import { Tables } from "../../../supabase/supabase";

// SELECT c.fullname, t.ordered_at, t.ordered, t.paid FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id; 
// SELECT c.fullname, SUM(t.paid) FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id GROUP BY c.fullname; 

interface Order {
    fullname: Tables<"customers"> | null;
    order: number;
    paid: number;
}

const pivoVGajba = (ordered: number, paid: number) => {
    const gajbaPrice = 30;
    const pivoPrice = 1.5;
    let owed = 0;
    let numGajb = Math.floor(ordered / 24);
    owed += numGajb * gajbaPrice;
    ordered -= numGajb * 24;
    owed += ordered * pivoPrice;

    return owed - paid;
};

const getTableData = () => {
    const offset = 10;

    supabaseClient.from("everything_sum")
        .select()
        .then((res) => {
            if (!res.error) {
                res.data.forEach((vals) => {
                    vals.total_paid /= offset;
                    vals.owed = pivoVGajba(vals.total_ordered, vals.total_paid);
                });

                console.log(res.data);
            }
            else {
                console.log(res.error);
            }
        });
};

const addOrder = ({ fullname, order, paid }: Order) => {
    const ordered = order;
    const offset = 100;
    paid = paid * offset; // max ena decimalka, zato množimo z 10
    return new Promise<void>((resolve, reject) => {
        supabaseClient.from("transactions").insert({ customer_id: fullname?.id || -1, ordered, paid }).then((res) => {
            if (res.error) {
                console.log(res.error);
                notifications.show({
                    title: "Error",
                    color: "red",
                    message: "Ni uspelo dodati piva" + res.error.message,
                });
                return reject();
            }

            notifications.show({
                title: "Success",
                color: "green",
                message: "Pivo uspešno dodano",
            });
            resolve();
        })
    })
};

export const BeerAdded = () => {
    const form = useForm<Order>({
        initialValues: {
            fullname: null,
            order: 1,
            paid: 1,
        },

        validate: {
            order: (value) => value != 0 ? null : 'Število naročenih piv ne sme biti 0',
            paid: (value) => value >= 0 ? null : 'Število plačanih piv ne sme biti negativno število',
        },
    });

    useEffect(() => {
        form.setFieldValue('paid', form.values.order * 1.5);
        getTableData();
    }, [form.values.order]);

    const [isLoading, setIsLoading] = useState(false);


    const diffFloat = form.values.order * 1.5 - form.values.paid;
    const diff = Math.round(diffFloat * 100) / 100.0;

    function order(order: Order) {
        setIsLoading(true);
        addOrder(order).finally(() => {
            setIsLoading(false);
            form.reset();
            form.setValues({
                fullname: null,
                order: 1,
                paid: 1,
            })
        });
    }

    return (<form onSubmit={form.onSubmit(order)}>
        <Paper withBorder w="100%" pos="relative" shadow="sm">
            <Group w="100%" p="md">
                <Stack style={{ flex: 1 }}>
                    <Title order={2}>Dodajanje bjre</Title>
                    <NameCombobox
                        value={form.getInputProps('fullname').value}
                        onChange={form.getInputProps('fullname').onChange}
                    />
                    <SimpleGrid cols={2}>
                        <NumberInput
                            label="Število piv"
                            placeholder="3"
                            {...form.getInputProps('order')}
                        />
                        <NumberInput
                            label="Plačano"
                            placeholder="vsa"
                            min={0}
                            rightSection="€"
                            {...form.getInputProps('paid')}
                        />
                    </SimpleGrid>
                    <Group justify="space-between">
                        <Box mt="md">
                            <Button type="submit" variant="gradient">Dodaj</Button>
                        </Box>
                    </Group>
                </Stack>
                <Alert variant="outline" px="xl" color={diff > 0 ? "red" : "green"}>
                    <Stack gap="xs">
                        <Text>
                            Dobi <b> {form.values.order} </b> 🍺.
                        </Text>
                        <Text>
                            Plača <b> {form.values.paid} </b> 💰.
                        </Text>
                        {diff > 0 ?
                            <Text c="red">Puf: <b> {Math.abs(diff)} </b> €. </Text>
                            :
                            <Text c="green"> Bonus: <b> {Math.abs(diff)} </b> €.</Text>
                        }
                    </Stack>
                </Alert>
            </Group>

            <LoadingOverlay visible={isLoading}
                overlayProps={{ radius: 'sm', blur: 2 }}
            ></LoadingOverlay>
        </Paper>
    </form>);

}
