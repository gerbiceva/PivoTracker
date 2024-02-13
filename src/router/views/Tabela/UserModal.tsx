import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPencil } from "@tabler/icons-react";
import { useMemo } from "react";
import { supabaseClient } from "../../../supabase/supabaseClient";
import {
  getDateFromString,
  numberToEur,
  pivoVGajba,
} from "../../../utils/Converter";
import { useGetTransactions } from "../Transactions/useTransactions";

const addGajba = (fullname: string) => () => {
  supabaseClient
    .from("customers")
    .select("id")
    .eq("fullname", fullname)
    .then((res) => {
      if (!res.error) {
        supabaseClient
          .from("transactions")
          .insert({ customer_id: res.data[0].id, ordered: 24, paid: 300 })
          .then((res) => {
            if (!res.error) {
              notifications.show({
                title: "Uspeh",
                color: "green",
                message: `${fullname} je uspešno kupil in plačal gajbo piva!`,
              });
            } else {
              notifications.show({
                title: "Napaka",
                color: "red",
                message: `Napaka pri dodajanju gajbe piva: ${res.error.message}!`,
              });
            }
          });
      } else {
        notifications.show({
          title: "Napaka",
          color: "red",
          message: `Napaka pri iskanju uporabnika: ${res.error.message}!`,
        });
      }
    });
};

interface UserModalProps {
  id: number;
  displayName: string;
}

export const UserModal = ({ id, displayName }: UserModalProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { loading, transactions } = useGetTransactions(id);

  const { userTotalOrdered, userTotalPaid, rows } = useMemo(() => {
    // calculate total ordered and paid
    const userTotalOrdered = transactions.reduce(
      (acc, val) => acc + (val.ordered || 0),
      0
    );
    const userTotalPaid = transactions.reduce(
      (acc, val) => acc + (val.paid || 0),
      0
    );

    const rows = transactions.map((element) => {
      const owed = pivoVGajba(element.ordered!, element.paid! / 10);
      return (
        <Table.Tr key={element.ordered_at}>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || "")[0]}
          </Table.Td>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || "")[1]}
          </Table.Td>
          <Table.Td align="right">{element.ordered}</Table.Td>
          <Table.Td align="right">{numberToEur(element.paid || 0)} €</Table.Td>
          <Table.Td align="right">
            <Badge
              variant="light"
              radius="sm"
              size="lg"
              color={owed <= 0 ? "green" : "red"}
            >
              {numberToEur(owed)} €
            </Badge>
          </Table.Td>
        </Table.Tr>
      );
    });
    return { userTotalOrdered, userTotalPaid, rows };
  }, [transactions]);

  return (
    <>
      <ActionIcon
        variant="transparent"
        onClick={() => {
          opened ? close() : open();
        }}
      >
        <IconPencil />
      </ActionIcon>
      <Modal
        pos="relative"
        size="xl"
        opened={opened}
        onClose={close}
        withCloseButton={true}
        centered
      >
        <LoadingOverlay visible={loading} />
        <Stack>
          <Group justify="space-between">
            <Text>{displayName}</Text>
            <Badge
              variant="light"
              radius="sm"
              size="lg"
              color={userTotalOrdered - userTotalPaid <= 0 ? "green" : "red"}
            >
              {numberToEur(userTotalOrdered - userTotalPaid)} €
            </Badge>
            <Group justify="right">
              <Group>
                <NumberInput maw={70} defaultValue={1} placeholder="2" />
                <Button variant="outline">Dodaj</Button>
              </Group>
              <Button variant="outline" onClick={addGajba(displayName)}>
                Dodaj gajbo
              </Button>
            </Group>
          </Group>
          <Divider label="Transakcije" />
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "right" }}>
                    Kupljeno ob
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    Kupljeno dne
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    Število piv
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Plačano</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Razlika</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody
                style={{
                  cursor: "pointer",
                }}
              >
                {rows}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </Modal>
    </>
  );
};
