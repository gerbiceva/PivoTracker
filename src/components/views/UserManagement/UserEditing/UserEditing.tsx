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
  Drawer,
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
  capitalizeName,
  SortField,
  SortState,
  useUserEditing,
} from './useUserEditing';
import { useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../../global-state/user';
import { PermissionsCell } from './PermissionsCell';
import { DeleteUserButton } from './DeleteUserButton';
import { ADMIN_GROUP, GroupCell } from './GroupCell';
import { UserDetails, UserDetailsHeader } from './UserDetails';

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
    allUsers,
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
    groups,
    mutatePermissions,
    mutateUsers,
  } = useUserEditing(debouncedSearchQuery);

  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const currentUser = useStore($currUser);
  const canDelete = !!currentUser?.permissions.includes('DELETE_USERS');
  const adminGroupId = groups.find((g) => g.name === ADMIN_GROUP)?.id;
  const currentUserIsAdmin =
    adminGroupId != null &&
    allUsers.some(
      (u) =>
        u.base_user_id === currentUser?.base_user_id &&
        u.permgroup_id === adminGroupId,
    );

  // read from the live list so the drawer reflects saves immediately
  const drawerUser = allUsers.find((u) => u.base_user_id === editingUser?.id);

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
      onClick={() =>
        setEditingUser({
          id: user.base_user_id!,
          name: capitalizeName(
            `${user.name ?? ''} ${user.surname ?? ''}`.trim(),
          ),
        })
      }
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>
        {capitalizeName(`${user.name ?? ''} ${user.surname ?? ''}`.trim())}
      </Table.Td>
      <Table.Td>{user.auth_email}</Table.Td>
      <Table.Td>{user.room}</Table.Td>
      <Table.Td>
        <GroupCell
          userId={user.base_user_id!}
          groupId={user.permgroup_id}
          groups={groups}
          currentUserIsAdmin={currentUserIsAdmin}
          onSaved={() => mutateUsers()}
        />
      </Table.Td>
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
                  <SortableTh
                    w={190}
                    field="group"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Vloga
                  </SortableTh>
                  <SortableTh
                    w={260}
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
      <Drawer
        opened={!!editingUser}
        onClose={() => {
          setEditingUser(null);
          mutateUsers();
          mutatePermissions();
        }}
        position="right"
        size="lg"
        title={
          drawerUser && <UserDetailsHeader user={drawerUser} groups={groups} />
        }
      >
        {drawerUser && (
          <UserDetails
            user={drawerUser}
            allUsers={allUsers}
            groups={groups}
            permissionTypes={permissionTypes}
            onChanged={() => {
              mutateUsers();
              mutatePermissions();
            }}
            onDeleted={() => {
              setEditingUser(null);
              mutateUsers();
            }}
          />
        )}
      </Drawer>
    </Container>
  );
};
