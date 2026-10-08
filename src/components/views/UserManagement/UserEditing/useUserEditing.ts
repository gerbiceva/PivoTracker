import { useMemo, useState } from 'react';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';

const PAGE_SIZE = 15;

type UserRow = Database['public']['Views']['user_view']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];
type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionRow =
  Database['public']['Views']['user_permissions_view']['Row'];

// JANEZ NOVAK / janez novak -> Janez Novak (also Ana-Marija, D'Angelo)
export const capitalizeName = (value: string) =>
  value
    .toLocaleLowerCase('sl')
    .replace(
      /(^|[\s\-'])(\p{L})/gu,
      (_, sep, ch) => sep + ch.toLocaleUpperCase('sl'),
    );

export type UserWithPermissions = UserRow & { permissions: PermissionRow[] };

export type SortField = 'name' | 'email' | 'room' | 'group' | 'permissions';
export interface SortState {
  field: SortField;
  reversed: boolean;
}

// rooms 0-99 = etage 0, 100-199 = etage 1, ...
export const floorOf = (room: number | null) =>
  room == null ? null : Math.floor(room / 100);

const fullName = (u: UserRow) => `${u.name ?? ''} ${u.surname ?? ''}`.trim();

const permissionsLabel = (u: UserWithPermissions) =>
  u.permissions
    .map((p) => p.permission_display_name ?? p.permission_name ?? '')
    .join(' ');

const compare = (
  a: UserWithPermissions,
  b: UserWithPermissions,
  field: SortField,
  groupLabel: (u: UserRow) => string,
) => {
  switch (field) {
    case 'name':
      return fullName(a).localeCompare(fullName(b), 'sl');
    case 'email':
      return (a.auth_email ?? '').localeCompare(b.auth_email ?? '');
    case 'room':
      // roommates alphabetically by name
      return (
        (a.room ?? Infinity) - (b.room ?? Infinity) ||
        fullName(a).localeCompare(fullName(b), 'sl')
      );
    case 'group':
      // users without a role last, then by name
      return (
        (a.permgroup_id == null ? 1 : 0) - (b.permgroup_id == null ? 1 : 0) ||
        groupLabel(a).localeCompare(groupLabel(b), 'sl') ||
        fullName(a).localeCompare(fullName(b), 'sl')
      );
    case 'permissions':
      // most permissions first, then alphabetically by permission names
      return (
        b.permissions.length - a.permissions.length ||
        permissionsLabel(a).localeCompare(permissionsLabel(b), 'sl')
      );
  }
};

// Loads all users + permissions once; search, sort and pagination are
// client-side because permissions live in a separate view.
export const useUserEditing = (query_string?: string) => {
  const [activePage, setPage] = useState(1);
  // 'all' or a floor number as string (Tabs values are strings)
  const [floor, setFloorState] = useState('all');
  const [sort, setSort] = useState<SortState>({
    field: 'room',
    reversed: false,
  });

  const {
    data: users,
    error: usersError,
    isLoading: areUsersLoading,
    mutate: mutateUsers,
  } = getSupaWR({
    query: () => supabaseClient.from('user_view').select('*'),
    table: 'user_view',
    params: ['all-users'],
  });

  const {
    data: permissions,
    error: permissionsError,
    isLoading: arePermissionsLoading,
    mutate: mutatePermissions,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_permissions_view')
        .select('*')
        .order('permission_type_id'),
    table: 'user_permissions_view',
    params: ['all-permissions'],
  });

  const { data: permissionTypes, error: permissionTypesError } = getSupaWR({
    query: () =>
      supabaseClient.from('permission_types').select('*').order('id'),
    table: 'permission_types',
  });

  const {
    data: groups,
    error: groupsError,
    mutate: mutateGroups,
  } = getSupaWR({
    query: () =>
      supabaseClient.from('permission_groups').select('*').order('id'),
    table: 'permission_groups',
  });

  const groupLabel = useMemo(() => {
    const byId = new Map(
      ((groups as PermissionGroup[] | undefined) ?? []).map((g) => [
        g.id,
        g.display_name || g.name,
      ]),
    );
    return (u: UserRow) =>
      u.permgroup_id == null ? '' : (byId.get(u.permgroup_id) ?? '');
  }, [groups]);

  const usersWithPermissions = useMemo<UserWithPermissions[]>(() => {
    const byUser = new Map<number, PermissionRow[]>();
    for (const p of (permissions as PermissionRow[] | undefined) ?? []) {
      if (p.user_id == null) continue;
      byUser.set(p.user_id, [...(byUser.get(p.user_id) ?? []), p]);
    }
    return ((users as UserRow[] | undefined) ?? []).map((u) => ({
      ...u,
      permissions: byUser.get(u.base_user_id ?? -1) ?? [],
    }));
  }, [users, permissions]);

  const floors = useMemo(
    () =>
      [...new Set(usersWithPermissions.map((u) => floorOf(u.room)))]
        .filter((f): f is number => f != null)
        .sort((a, b) => a - b),
    [usersWithPermissions],
  );

  const filtered = useMemo(() => {
    const query = query_string?.trim().toLowerCase();
    const onFloor =
      floor === 'all'
        ? usersWithPermissions
        : usersWithPermissions.filter((u) => floorOf(u.room) === Number(floor));
    const result = query
      ? onFloor.filter((u) =>
          [
            fullName(u),
            u.auth_email,
            u.room?.toString(),
            u.phone_number,
            groupLabel(u),
            permissionsLabel(u),
            ...u.permissions.map((p) => p.permission_name),
          ]
            .join(' ')
            .toLowerCase()
            .includes(query.replace(/\s+/g, ' ')),
        )
      : [...onFloor];

    result.sort((a, b) => compare(a, b, sort.field, groupLabel));
    if (sort.reversed) result.reverse();
    return result;
  }, [usersWithPermissions, query_string, sort, floor, groupLabel]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );

  const toggleSort = (field: SortField) => {
    setSort((s) => ({
      field,
      reversed: s.field === field ? !s.reversed : false,
    }));
    setPage(1);
  };

  const setFloor = (value: string) => {
    setFloorState(value);
    setPage(1);
  };

  return {
    users: pageUsers,
    allUsers: usersWithPermissions,
    floors,
    floor,
    setFloor,
    totalCount: filtered.length,
    error:
      usersError || permissionsError || permissionTypesError || groupsError,
    groups: (groups as PermissionGroup[] | undefined) ?? [],
    mutateGroups,
    permissionTypes: (permissionTypes as PermissionType[] | undefined) ?? [],
    mutatePermissions,
    mutateUsers,
    isLoading: areUsersLoading || arePermissionsLoading,
    totalPages,
    activePage,
    setPage,
    sort,
    toggleSort,
  };
};
