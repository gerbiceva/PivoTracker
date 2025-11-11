import {
  Button,
  Container,
  Modal,
  NumberInput,
  Stack,
  Table,
  TableTd,
  TableTh,
  TableTr,
  Text,
  Textarea,
  Title,
  Alert,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { UserTag } from '../../users/UserTag';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';

type PromiseElement = Database['public']['Tables']['obljube']['Row'] & {
  base_users: {
    name: string;
    surname: string | null;
  };
};

export const ManagePromises = () => {
  const {
    data: promises,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('obljube')
        .select(
          `
          *,
          base_users!who(name, surname)
        `,
        ) // Select all columns from obljube and name/surname from base_users, disambiguating with 'who'
        .order('created_at', { ascending: false }),
    table: 'obljube',
  });

  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [selectedObljuba, setSelectedObljuba] = useState<PromiseElement>();

  const form = useForm<Partial<PromiseElement>>({
    initialValues: {
      amount: 0,
      reason: '',
      base_users: {
        name: '',
        surname: '',
      },
    },
  });

  useEffect(() => {
    if (selectedObljuba) {
      form.setInitialValues({
        amount: selectedObljuba.amount,
        reason: selectedObljuba.reason || '',
        base_users: {
          name: selectedObljuba.base_users.name,
          surname: selectedObljuba.base_users.surname,
        },
      });
      form.reset();
    }
  }, [selectedObljuba]);

  const handleEditSubmit = async (values: typeof form.values) => {
    if (!selectedObljuba) return;

    console.log({ values });

    try {
      const { error } = await supabaseClient
        .from('obljube')
        .update({
          amount: values.amount,
          reason: values.reason,
        })
        .eq('id', selectedObljuba.id);

      if (error) {
        throw error;
      }
      notifications.show({
        title: 'Success',
        message: 'Promise updated successfully',
        color: 'green',
      });
      form.resetDirty();
      refetchTables('obljube');
      closeEditModal();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: `Failed to update promise: ${error.message}`,
        color: 'red',
      });
    }
  };

  const handleDeletePromise = async () => {
    if (!selectedObljuba) return;

    try {
      const { error } = await supabaseClient
        .from('obljube')
        .delete()
        .eq('id', selectedObljuba.id);

      if (error) {
        throw error;
      }
      notifications.show({
        title: 'Success',
        message: 'Promise deleted successfully',
        color: 'green',
      });
      refetchTables('obljube');
      closeDeleteModal();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: `Failed to delete promise: ${error.message}`,
        color: 'red',
      });
    }
  };

  if (error) {
    return (
      <Alert color="red" title="Error loading promises">
        {error.message}
      </Alert>
    );
  }

  const rows = promises?.map((element) => {
    const userFullName =
      element.base_users.name + ' ' + element.base_users.name;

    return (
      <TableTr key={element.id}>
        <TableTd>
          <UserTag
            fullname={userFullName || 'N/A'}
            id={element.who?.toString() || ''}
          />
        </TableTd>
        <TableTd>{element.amount}</TableTd>
        <TableTd>{element.reason}</TableTd>
        <TableTd>{new Date(element.created_at).toLocaleDateString()}</TableTd>
        <TableTd>
          <Group wrap="nowrap">
            <Button
              variant="light"
              size="xs"
              onClick={() => {
                setSelectedObljuba(element);
                openEditModal();
              }}
            >
              <IconEdit size={16} />
            </Button>
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={() => {
                setSelectedObljuba(element);
                openDeleteModal();
              }}
            >
              <IconTrash size={16} />
            </Button>
          </Group>
        </TableTd>
      </TableTr>
    );
  });

  return (
    <Container>
      <Title order={1} mb="md">
        Manage Promises
      </Title>

      {/* Edit Promise Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Promise"
      >
        <form onSubmit={form.onSubmit(handleEditSubmit)}>
          <Stack>
            <NumberInput
              label="Beer Amount"
              placeholder="e.g., 5"
              min={1}
              {...form.getInputProps('amount')}
            />
            <Textarea
              label="Reason/Notes"
              placeholder="e.g., Promised 5 beers for helping with the event."
              minRows={3}
              {...form.getInputProps('reason')}
            />
            <Button
              type="submit"
              size="xs"
              disabled={!form.isDirty() || form.values.base_users === null}
            >
              Confirm Changes
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Delete Promise Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Promise"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this promise?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeletePromise}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Table striped highlightOnHover withColumnBorders>
        <Table.Thead>
          <TableTr>
            <TableTh>User</TableTh>
            <TableTh>Amount</TableTh>
            <TableTh>Reason</TableTh>
            <TableTh>Created At</TableTh>
            <TableTh>Actions</TableTh>
          </TableTr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <TableTr>
              <TableTd colSpan={5}>
                <Text ta="center">Loading promises...</Text>
              </TableTd>
            </TableTr>
          ) : (
            rows
          )}
        </Table.Tbody>
      </Table>
    </Container>
  );
};
