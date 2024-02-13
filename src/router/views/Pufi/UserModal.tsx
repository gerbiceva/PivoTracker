import {
  ActionIcon,
  Alert,
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
import { getDateFromString, numberToEur } from "../../../utils/Converter";
import { useGetTransactions } from "../Transactions/useTransactions";
import { DebtBadge } from "../../../components/pricing/DebtBadge";

const addGajba = (id: number, successCallback: () => void) => () => {
  supabaseClient
    .from("customers")
    .select("id")
    .eq("id", id)
    .then((res) => {
      if (!res.error) {
        supabaseClient
          .from("transactions")
          .insert({ customer_id: id, ordered: 24, paid: 300 })
          .then((res) => {
            if (!res.error) {
              notifications.show({
                title: "Uspeh",
                color: "green",
                message: `Uspešno kupil in plačal gajbo piva!`,
              });
              successCallback();
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
  const { data, error, isLoading, mutate } = useGetTransactions(id);

  const { userTotalOrdered, userTotalPaid, rows } = useMemo(() => {
    if (!data) {
      return { userTotalOrdered: 0, userTotalPaid: 0, rows: undefined };
    }
    // calculate total ordered and paid
    const userTotalOrdered = data.reduce(
      (acc, val) => acc + (val.ordered || 0),
      0
    );
    const userTotalPaid = data.reduce((acc, val) => acc + (val.paid || 0), 0);

    const rows = data.map((element) => {
      // const owed = computeDebt(element.ordered || 0, element.paid || 0);
      return (
        <Table.Tr key={element.ordered_at}>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || "")[0]}
          </Table.Td>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || "")[1]}
          </Table.Td>
          <Table.Td align="right">{element.ordered}</Table.Td>
          <Table.Td align="right">
            {numberToEur((element.paid || 0) / 10)}
          </Table.Td>
          <Table.Td align="right">
            <DebtBadge ordered={element.ordered!} paid={element.paid!} />
          </Table.Td>
        </Table.Tr>
      );
    });
    return { userTotalOrdered, userTotalPaid, rows };
  }, [data]);

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
        <LoadingOverlay visible={isLoading} />
        <Stack>
          <Group justify="space-between" px="xl">
            <Text size="xl" fw="bold">
              {displayName}
            </Text>
            <DebtBadge ordered={userTotalOrdered} paid={userTotalPaid} />
            <Group justify="right">
              <Group>
                <NumberInput maw={70} defaultValue={1} placeholder="2" />
                <Button variant="outline">Dodaj</Button>
              </Group>
              <Button variant="outline" onClick={addGajba(id, mutate)}>
                Dodaj gajbo
              </Button>
            </Group>
          </Group>
          <Divider label="Transakcije" />
          {error ? (
            <Alert c="red">Error fetching {error}</Alert>
          ) : (
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
          )}
        </Stack>
      </Modal>
    </>
  );
};
