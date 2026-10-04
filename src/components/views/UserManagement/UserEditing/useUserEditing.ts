import { useMemo, useState } from 'react';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Database } from '../../../../supabase/supabase';

const PAGE_SIZE = 15;

type UserRow = Database['public']['Views']['user_view']['Row'];
type PermissionRow =
  Database['public']['Views']['user_permissions_view']['Row'];

export type UserWithPermissions = UserRow & { permissions: PermissionRow[] };

export type SortField = 'name' | 'email' | 'floor' | 'room' | 'phone' | 'permissions';
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
) => {
  switch (field) {
    case 'name':
      return fullName(a).localeCompare(fullName(b), 'sl');
    case 'email':
      return (a.auth_email ?? '').localeCompare(b.auth_email ?? '');
    case 'floor':
      // within a floor, alphabetically by name
      return (
        (floorOf(a.room) ?? Infinity) - (floorOf(b.room) ?? Infinity) ||
        fullName(a).localeCompare(fullName(b), 'sl')
      );
    case 'room':
      return (a.room ?? Infinity) - (b.room ?? Infinity);
    case 'phone':
      return (a.phone_number ?? '').localeCompare(b.phone_number ?? '');
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
  const [sort, setSort] = useState<SortState>({
    field: 'name',
    reversed: false,
  });

  const {
    data: users,
    error: usersError,
    isLoading: areUsersLoading,
  } = getSupaWR({
    query: () => supabaseClient.from('user_view').select('*'),
    table: 'user_view',
    params: ['all-users'],
  });

  const {
    data: permissions,
    error: permissionsError,
    isLoading: arePermissionsLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_permissions_view')
        .select('*')
        .order('permission_type_id'),
    table: 'user_permissions_view',
    params: ['all-permissions'],
  });

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

  const filtered = useMemo(() => {
    const query = query_string?.trim().toLowerCase();
    const result = query
      ? usersWithPermissions.filter((u) =>
          [
            fullName(u),
            u.auth_email,
            u.room?.toString(),
            u.phone_number,
            permissionsLabel(u),
            ...u.permissions.map((p) => p.permission_name),
          ]
            .join(' ')
            .toLowerCase()
            .includes(query.replace(/\s+/g, ' ')),
        )
      : [...usersWithPermissions];

    result.sort((a, b) => compare(a, b, sort.field));
    if (sort.reversed) result.reverse();
    return result;
  }, [usersWithPermissions, query_string, sort]);

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

  return {
    users: pageUsers,
    totalCount: filtered.length,
    error: usersError || permissionsError,
    isLoading: areUsersLoading || arePermissionsLoading,
    totalPages,
    activePage,
    setPage,
    sort,
    toggleSort,
  };
};
