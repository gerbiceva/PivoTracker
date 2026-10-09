import {
  Table,
  Pagination,
  LoadingOverlay,
  Stack,
  Container,
  Text,
  Alert,
  TextInput,
  Group,
  Tabs,
  Drawer,
  Button,
  useMatches,
} from '@mantine/core';
import { IconAlertCircle, IconSearch, IconUserPlus } from '@tabler/icons-react';
import { capitalizeName, useUserEditing } from './useUserEditing';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../../global-state/user';
import { PermissionsCell } from './PermissionsCell';
import { DeleteUserButton } from './DeleteUserButton';
import { ADMIN_GROUP, GroupCell } from './GroupCell';
import { UserDetails, UserDetailsHeader } from './UserDetails';
import { PageHeader } from '../../Admin/PageHeader';
import { SortableTh } from '../../Admin/SortableTh';

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
    groupPreset,
    mutatePermissions,
    mutateUsers,
  } = useUserEditing(debouncedSearchQuery);

  const navigate = useNavigate();
  // phones show only name, room and role; the rest is in the drawer
  const tableMinWidth = useMatches({ base: 0, sm: 800 });
  const [editingUser, setEditingUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const currentUser = useStore($currUser);
  const canDelete = !!currentUser?.permissions.includes('DELETE_USERS');
  const canEditPermissions =
    !!currentUser?.permissions.includes('MANAGE_PERMISSIONS');
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
      <Table.Td visibleFrom="sm">{user.auth_email}</Table.Td>
      <Table.Td>{user.room}</Table.Td>
      <Table.Td>
        <GroupCell
          userId={user.base_user_id!}
          groupId={user.permgroup_id}
          groups={groups}
          permissions={user.permissions
            .map((p) => p.permission_type_id)
            .filter((id): id is number => id != null)}
          permissionTypes={permissionTypes}
          groupPreset={groupPreset}
          currentUserIsAdmin={currentUserIsAdmin}
          onSaved={() => {
            mutateUsers();
            mutatePermissions();
          }}
        />
      </Table.Td>
      <Table.Td visibleFrom="sm">
        <PermissionsCell
          userId={user.base_user_id!}
          isAdminUser={user.permgroup_id === adminGroupId}
          canEdit={canEditPermissions}
          permissions={user.permissions}
          permissionTypes={permissionTypes}
          onSaved={() => mutatePermissions()}
        />
      </Table.Td>
      {canDelete && (
        <Table.Td visibleFrom="sm">
          {/* admins are reserved for developers: only other admins may delete them */}
          {(currentUserIsAdmin || user.permgroup_id !== adminGroupId) && (
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
          )}
        </Table.Td>
      )}
    </Table.Tr>
  ));

  return (
    <Container>
      <Stack>
        <PageHeader
          title="Uporabniki"
          description="Urejanje podatkov in dovoljenj uporabnikov."
          action={
            <Button
              leftSection={<IconUserPlus size={16} />}
              onClick={() => navigate('/admin/enroll')}
            >
              Dodaj uporabnika
            </Button>
          }
        />
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
          <Table.ScrollContainer minWidth={tableMinWidth}>
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
                  <SortableTh
                    visibleFrom="sm"
                    field="email"
                    sort={sort}
                    onSort={toggleSort}
                  >
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
                    visibleFrom="sm"
                    field="permissions"
                    sort={sort}
                    onSort={toggleSort}
                  >
                    Dovoljenja
                  </SortableTh>
                  {canDelete && (
                    <Table.Th w={80} visibleFrom="sm">
                      Izbriši
                    </Table.Th>
                  )}
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
