import {
  ActionIcon,
  Alert,
  Divider,
  LoadingOverlay,
  Modal,
  Stack,
  Table,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil } from '@tabler/icons-react';
import { useMemo } from 'react';
import { DebtBadge } from '../../../pricing/DebtBadge';
import { numToColor } from '../../../../utils/colorUtils';
import { formatCurrency, getDateFromString } from '../../../../utils/Converter';
import { useGetTransactions } from '../Transactions/useTransactions';

export const ModalWindow = ({
  id,
  displayName,
  opened,
  close,
}: {
  id: number;
  displayName: string;
  opened: boolean;
  close: () => void;
}) => {
  const { data, error, isLoading } = useGetTransactions(id);

  const rows = useMemo(() => {
    if (!data) {
      return undefined;
    }

    const rows = data.map((element) => {
      // const owed = computeDebt(element.ordered || 0, element.paid || 0);
      return (
        <Table.Tr key={element.ordered_at}>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || '')[0]}
          </Table.Td>
          <Table.Td align="right">
            {getDateFromString(element.ordered_at || '')[1]}
          </Table.Td>
          <Table.Td align="right">{element.ordered}</Table.Td>
          <Table.Td align="right">{element.item_name}</Table.Td>
          <Table.Td align="right">
            {formatCurrency((element.paid || 0) / 10)}
          </Table.Td>
          <Table.Td align="right">
            <DebtBadge debt={element.owed || 0} />
          </Table.Td>
        </Table.Tr>
      );
    });
    return rows;
  }, [data]);

  return (
    <Modal
      pos="relative"
      size="xl"
      onClose={close}
      opened={opened}
      withCloseButton={true}
      centered
    >
      <LoadingOverlay visible={isLoading} />
      <Stack align="center" gap="xl" py="xl">
        <Title order={2} fw="bold" c={numToColor(id)}>
          {displayName}
        </Title>
        <Divider label="Transakcije" />
        {error ? (
          <Alert c="red">Error fetching {error}</Alert>
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'right' }}>
                    Kupljeno ob
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    Kupljeno dne
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Število</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Artikel</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Plačano</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Razlika</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody
                style={{
                  cursor: 'pointer',
                }}
              >
                {rows}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </Modal>
  );
};

interface UserModalProps {
  id: number;
  displayName: string;
}

export const UserModal = ({ id, displayName }: UserModalProps) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ActionIcon variant="transparent" onClick={open}>
        <IconPencil />
      </ActionIcon>
      {opened && (
        <ModalWindow
          id={id}
          displayName={displayName}
          opened={opened}
          close={close}
        />
      )}
    </>
  );
};
