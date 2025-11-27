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
  TextInput,
  Pagination,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import { UserTag } from '../../users/UserTag';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useObljubeEditing } from './useObljubeEditing';
import dayjs from 'dayjs';

type PromiseElement =
  Database['public']['Views']['obljube_with_user_info']['Row'];

export const ManagePromises = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(inputValue, 200);

  const { activePage, setPage, totalPages, obljube, error, isLoading } =
    useObljubeEditing(debouncedSearchQuery);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

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
      user_name: '',
      user_surname: '',
    },
  });

  useEffect(() => {
    if (selectedObljuba) {
      form.setInitialValues({
        amount: selectedObljuba.amount,
        reason: selectedObljuba.reason || '',
        user_name: selectedObljuba.user_name,
        user_surname: selectedObljuba.user_surname,
      });
      form.reset();
    }
  }, [selectedObljuba]);

  const handleEditSubmit = async (values: typeof form.values) => {
    if (!selectedObljuba) return;

    try {
      const { error } = await supabaseClient
        .from('obljube')
        .update({
          amount: values.amount || undefined,
          reason: values.reason || undefined,
        })
        .eq('id', selectedObljuba.id || -1);

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
        .eq('id', selectedObljuba.id || -1);

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

  const rows = obljube?.map((element) => {
    const userFullName = element.user_name + ' ' + element.user_surname;

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
        <TableTd>
          {dayjs(element.created_at || '')
            .local()
            .format('DD.MM YYYY')}
        </TableTd>
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
      <Stack>
        <Title order={1} mb="md">
          Manage Promises
        </Title>

        <TextInput
          placeholder="Search by name or surname"
          value={inputValue}
          onChange={(event) => setInputValue(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />

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
        <Pagination
          total={totalPages}
          value={activePage}
          onChange={setPage}
          mt="sm"
        />
      </Stack>
    </Container>
  );
};
