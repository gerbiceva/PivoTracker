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
import { NameCombobox } from '../Pivo/Adder/NameCombobox';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';

type PromiseElement = Database['public']['Tables']['promises']['Row']; // Assuming a 'promises' table

export const ManagePromises = () => {
  const {
    data: promises,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('promises')
        .select('*, base_users(name, surname)') // Select all columns from promises and name/surname from base_users
        .order('created_at', { ascending: false }),
    table: 'promises',
  });

  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [selectedPromise, setSelectedPromise] = useState<PromiseElement | null>(
    null,
  );

  const form = useForm<
    Partial<
      PromiseElement & {
        user: Database['public']['Views']['user_view']['Row'] | null;
      }
    >
  >({
    initialValues: {
      amount: 0,
      description: '',
      user: null,
    },
  });

  useEffect(() => {
    if (selectedPromise) {
      form.setInitialValues({
        amount: selectedPromise.amount,
        description: selectedPromise.description || '',
        user: {
          base_user_id: selectedPromise.user_id,
          fullname:
            (selectedPromise.base_users as any)?.name +
            ' ' +
            (selectedPromise.base_users as any)?.surname,
          // Add other user_view properties if necessary, though for display, fullname might be enough
        } as Database['public']['Views']['user_view']['Row'],
      });
      form.reset();
    }
  }, [selectedPromise]);

  const handleEditSubmit = async (values: typeof form.values) => {
    if (!selectedPromise) return;

    try {
      const { error } = await supabaseClient
        .from('promises')
        .update({
          amount: values.amount,
          description: values.description,
          user_id: values.user?.base_user_id,
        })
        .eq('id', selectedPromise.id);

      if (error) {
        throw error;
      }
      notifications.show({
        title: 'Success',
        message: 'Promise updated successfully',
        color: 'green',
      });
      form.resetDirty();
      refetchTables('promises');
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
    if (!selectedPromise) return;

    try {
      const { error } = await supabaseClient
        .from('promises')
        .delete()
        .eq('id', selectedPromise.id);

      if (error) {
        throw error;
      }
      notifications.show({
        title: 'Success',
        message: 'Promise deleted successfully',
        color: 'green',
      });
      refetchTables('promises');
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
      (element.base_users as any)?.name +
      ' ' +
      (element.base_users as any)?.surname;
    return (
      <TableTr key={element.id}>
        <TableTd>
          <UserTag
            fullname={userFullName || 'N/A'}
            id={element.user_id?.toString() || ''}
          />
        </TableTd>
        <TableTd>{element.amount}</TableTd>
        <TableTd>{element.description}</TableTd>
        <TableTd>{new Date(element.created_at).toLocaleDateString()}</TableTd>
        <TableTd>
          <Group wrap="nowrap">
            <Button
              variant="light"
              size="xs"
              onClick={() => {
                setSelectedPromise(element);
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
                setSelectedPromise(element);
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
            <NameCombobox
              value={form.getInputProps('user').value}
              onChange={form.getInputProps('user').onChange}
              label="User"
            />
            <NumberInput
              label="Beer Amount"
              placeholder="e.g., 5"
              min={1}
              {...form.getInputProps('amount')}
            />
            <Textarea
              label="Description/Notes"
              placeholder="e.g., Promised 5 beers for helping with the event."
              minRows={3}
              {...form.getInputProps('description')}
            />
            <Button type="submit" size="xs" disabled={!form.isDirty()}>
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
            <TableTh>Description</TableTh>
            <TableTh>Created At</TableTh>
            <TableTh>Actions</TableTh>
          </TableTr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <TableTr>
              <TableTd colSpan={5}>
                <Text align="center">Loading promises...</Text>
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
