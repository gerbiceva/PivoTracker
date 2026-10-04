import {
  Table,
  Pagination,
  LoadingOverlay,
  Stack,
  Container,
  Title,
  Text,
  Alert,
  TextInput,
  Group,
  ActionIcon,
  Badge,
  UnstyledButton,
  Center,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
  IconUserPlus,
} from '@tabler/icons-react';
import {
  SortField,
  SortState,
  floorOf,
  useUserEditing,
} from './useUserEditing';
import { useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { numToColor } from '../../../../utils/colorUtils';

interface SortableThProps {
  field: SortField;
  sort: SortState;
  onSort: (field: SortField) => void;
  children: ReactNode;
}

const SortableTh = ({ field, sort, onSort, children }: SortableThProps) => {
  const active = sort.field === field;
  const Icon = active
    ? sort.reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th>
      <UnstyledButton onClick={() => onSort(field)}>
        <Group gap={4} wrap="nowrap">
          <Text fw="bold" size="sm">
            {children}
          </Text>
          <Center>
            <Icon size={14} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
};

// Slovene dual/plural: 1 uporabnik, 2 uporabnika, 3-4 uporabniki, 5+ uporabnikov
const usersLabel = (n: number) => {
  const m = n % 100;
  if (m === 1) return 'uporabnik';
  if (m === 2) return 'uporabnika';
  if (m === 3 || m === 4) return 'uporabniki';
  return 'uporabnikov';
};

export const UserEditing = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(inputValue, 200);
  const {
    users,
    totalCount,
    error,
    isLoading,
    totalPages,
    activePage,
    setPage,
    sort,
    toggleSort,
  } = useUserEditing(debouncedSearchQuery);

  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  if (error) {
    return (
      <Alert title="Napaka pri nalaganju uporabnikov" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  const rows = users.map((user) => (
    <Table.Tr
      key={user.base_user_id}
      onClick={() => navigate(`/user/edit/${user.base_user_id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>
        {user.name} {user.surname}
      </Table.Td>
      <Table.Td>{user.auth_email}</Table.Td>
      <Table.Td>{floorOf(user.room)}</Table.Td>
      <Table.Td>{user.room}</Table.Td>
      <Table.Td>{user.phone_number}</Table.Td>
      <Table.Td>
        <Group gap={4}>
          {user.permissions.map((p) => (
            <Badge
              key={p.permission_id}
              variant="light"
              size="sm"
              color={numToColor(p.permission_type_id || 0)}
            >
              {p.permission_display_name ?? p.permission_name}
            </Badge>
          ))}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <Stack>
        <Group w="100%" justify="space-between">
          <Stack>
            <Title>Upravljanje uporabnikov</Title>
            <Text c="dimmed">Urejanje podatkov in dovoljenj uporabnikov.</Text>
          </Stack>
          <ActionIcon
            variant="light"
            size="xl"
            onClick={() => {
              navigate('/admin/enroll');
            }}
          >
            <IconUserPlus />
          </ActionIcon>
        </Group>
        <TextInput
          placeholder="Išči po imenu, e-pošti, sobi, telefonu ali dovoljenju"
          value={inputValue}
          onChange={(event) => setInputValue(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Table.ScrollContainer minWidth={850}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <SortableTh field="name" sort={sort} onSort={toggleSort}>
                    Ime
                  </SortableTh>
                  <SortableTh field="email" sort={sort} onSort={toggleSort}>
                    E-pošta
                  </SortableTh>
                  <SortableTh field="floor" sort={sort} onSort={toggleSort}>
                    Nadstropje
                  </SortableTh>
                  <SortableTh field="room" sort={sort} onSort={toggleSort}>
                    Soba
                  </SortableTh>
                  <SortableTh field="phone" sort={sort} onSort={toggleSort}>
                    Telefon
                  </SortableTh>
                  <SortableTh
                    field="permissions"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Dovoljenja
                  </SortableTh>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>
        <Group justify="space-between">
          <Pagination total={totalPages} value={activePage} onChange={setPage} />
          <Text size="sm" c="dimmed">
            {totalCount} {usersLabel(totalCount)}
          </Text>
        </Group>
      </Stack>
    </Container>
  );
};
