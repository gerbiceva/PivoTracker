import {
  Table,
  Pagination,
  LoadingOverlay,
  Stack,
  Container,
  Title,
  Text,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useUserEditing } from './useUserEditing';
import { useNavigate } from 'react-router-dom';

export const UserEditing = () => {
  const { users, error, isLoading, totalPages, activePage, setPage } =
    useUserEditing();

  const navigate = useNavigate();

  if (error) {
    return (
      <Alert title="Error loading users" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const rows = users?.map((user) => (
    <Table.Tr
      key={user.base_user_id}
      onClick={() => navigate(`/user/edit/${user.base_user_id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>{user.base_user_id}</Table.Td>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.surname}</Table.Td>
      <Table.Td>{user.auth_email}</Table.Td>
      <Table.Td>{user.room}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <Stack>
        <Title>User Management</Title>
        <Text c="dimmed">Edit user information and permissions.</Text>
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Surname</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Room</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
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
