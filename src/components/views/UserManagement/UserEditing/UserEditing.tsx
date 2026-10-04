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
  UnstyledButton,
  Center,
  Tabs,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
  IconUserPlus,
} from '@tabler/icons-react';
import { SortField, SortState, useUserEditing } from './useUserEditing';
import { useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../../global-state/user';
import { PermissionsCell } from './PermissionsCell';
import { DeleteUserButton } from './DeleteUserButton';

// JANEZ NOVAK / janez novak -> Janez Novak (also Ana-Marija, D'Angelo)
const capitalizeName = (value: string) =>
  value
    .toLocaleLowerCase('sl')
    .replace(
      /(^|[\s\-'])(\p{L})/gu,
      (_, sep, ch) => sep + ch.toLocaleUpperCase('sl'),
    );

interface SortableThProps {
  w?: number;
  field: SortField;
  sort: SortState;
  onSort: (field: SortField) => void;
  children: ReactNode;
}

const SortableTh = ({ w, field, sort, onSort, children }: SortableThProps) => {
  const active = sort.field === field;
  const Icon = active
    ? sort.reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th w={w}>
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

const floorLabel = (floor: number) =>
  floor === 0 ? 'Pritličje' : `${floor}. nadstropje`;

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
    floors,
    floor,
    setFloor,
    permissionTypes,
    mutatePermissions,
    mutateUsers,
  } = useUserEditing(debouncedSearchQuery);

  const navigate = useNavigate();
  const canDelete = !!useStore($currUser)?.permissions.includes('DELETE_USERS');

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  if (error) {
    return (
      <Alert
        title="Napaka pri nalaganju uporabnikov"
        icon={<IconAlertCircle />}
      >
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
        {capitalizeName(`${user.name ?? ''} ${user.surname ?? ''}`.trim())}
      </Table.Td>
      <Table.Td>{user.auth_email}</Table.Td>
      <Table.Td>{user.room}</Table.Td>
      <Table.Td>{user.phone_number}</Table.Td>
      <Table.Td>
        <PermissionsCell
          userId={user.base_user_id!}
          permissions={user.permissions}
          permissionTypes={permissionTypes}
          onSaved={() => mutatePermissions()}
        />
      </Table.Td>
      {canDelete && (
        <Table.Td>
          <DeleteUserButton
            userId={user.base_user_id!}
            name={capitalizeName(
              `${user.name ?? ''} ${user.surname ?? ''}`.trim(),
            )}
            onDeleted={() => {
              mutateUsers();
              mutatePermissions();
            }}
          />
        </Table.Td>
      )}
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
        />
        <Tabs value={floor} onChange={(v) => setFloor(v ?? 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all">Vsi</Tabs.Tab>
            {floors.map((f) => (
              <Tabs.Tab key={f} value={String(f)}>
                {floorLabel(f)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Table.ScrollContainer minWidth={800}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <SortableTh
                    w={220}
                    field="name"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Ime
                  </SortableTh>
                  <SortableTh field="email" sort={sort} onSort={toggleSort}>
                    E-pošta
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
                  {canDelete && <Table.Th w={80}>Izbriši</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>
        <Group justify="space-between">
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setPage}
          />
          <Text size="sm" c="dimmed">
            {totalCount} {usersLabel(totalCount)}
          </Text>
        </Group>
      </Stack>
    </Container>
  );
};
