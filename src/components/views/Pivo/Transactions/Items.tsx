import { Button, Container, Group, Modal, NumberInput, Stack, Table, TableTd, TableTh, TableTr, TextInput } from "@mantine/core";
import { getSupaWR } from "../../../../supabase/supa-utils/supaSWR";
import { supabaseClient } from "../../../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Database } from "../../../../supabase/supabase";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { refetchTables } from "../../../../supabase/supa-utils/supaSWRCache";

// const editItem = (element: ) => {

// }
type  ItemElement = Database["public"]["Tables"]["items"]["Row"];

export const Items = () => {
  const { data } = getSupaWR({
    query: () =>
      supabaseClient
        .from("items")
        // .order()
        .select("*"),
      table: "items"
  });

  
  const [opened, {open, close}] = useDisclosure(false);
  const [selectedElement, setSelectedElement] = useState<ItemElement>();
  
  const form = useForm<Partial<ItemElement>>({
    initialValues: {
      name: '',
      beer_count: 0,
      price: 0
    },
  });

  useEffect(
    () => {
      form.setInitialValues({
        ...selectedElement
      })
      form.reset()
    },
    [selectedElement]
  );

  const handleSubmit = async (values: typeof form.values) => {
    if(!selectedElement) return;

    try {
      const { error } = await supabaseClient
        .from('items')
        .update(values)
        .eq('id', selectedElement.id);
      if (error) {
        throw error;
      }
      showNotification({
        title: 'Uspeh',
        message: 'Podatki o ponudbi piva uspesno posobljeni',
        color: 'green',
      });
      form.reset();
      form.setValues({
        ...values,
      });
      form.resetDirty();

      refetchTables("items");
    } catch (error) {
      showNotification({
        title: 'Napaka',
        message: (error as Error).message,
        color: 'red',
      });
    }
  };
  // console.log(data);
  const rows = data?.sort((a, b) => { return a.beer_count - b.beer_count}).map((element) => {
    return (
      <TableTr key={element.id} onClick={() => {setSelectedElement(element); open();}}>
        <TableTd>{element.name}</TableTd>
        <TableTd>{element.beer_count}</TableTd>
        <TableTd>{element.price}</TableTd>
      </TableTr>
    );
  });
  return (
    <Container>
      <Modal opened={opened} onClose={close} title="Urejanje ponudbe piva">
        <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* <form> */}
          <Stack>
            <TextInput description="Ime" {...form.getInputProps("name")}></TextInput>
            <NumberInput description="Stevilo piv" {...form.getInputProps("beer_count")}></NumberInput>
            <NumberInput description="Cena" {...form.getInputProps("price")}></NumberInput>
            <Button type="submit" size="xs" disabled={!form.isDirty()}>
              Potrdi spremembo
            </Button>
          </Stack>
        </form>
      </Modal>
      <Table striped highlightOnHover withColumnBorders>
        <Table.Thead>
          <TableTr>
            <TableTh>Ime</TableTh>
            <TableTh>Stevilo piv</TableTh>
            <TableTh>Cena</TableTh>
          </TableTr>
        </Table.Thead>
        <Table.Tbody>
         {rows}
        </Table.Tbody>
      </Table>

    </Container>
  );
}