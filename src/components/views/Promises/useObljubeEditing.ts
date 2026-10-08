import { useMemo, useState } from 'react';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { Database } from '../../../supabase/supabase';
import { SortState } from '../Admin/SortableTh';
import { capitalizeName } from '../UserManagement/UserEditing/useUserEditing';

const PAGE_SIZE = 15;

export type PromiseElement =
  Database['public']['Views']['obljube_with_user_info']['Row'];

// a single promise, or one row per user when the amounts are aggregated
export interface PromiseRow {
  key: string;
  who: number | null;
  name: string;
  amount: number;
  count: number;
  // latest promise when aggregated
  created_at: string | null;
  reason: string | null;
  // only set for single promises
  promise?: PromiseElement;
}

export type ObljubeSortField = 'name' | 'amount' | 'reason' | 'date';

export const promiseUserName = (p: PromiseElement) =>
  capitalizeName(`${p.user_name ?? ''} ${p.user_surname ?? ''}`.trim());

const time = (date: string | null) => (date ? new Date(date).getTime() : 0);

// Loads all promises once; search, sort, aggregation and pagination are
// client-side.
export const useObljubeEditing = (query_string?: string) => {
  const [activePage, setPage] = useState(1);
  const [aggregated, setAggregatedState] = useState(false);
  const [sort, setSort] = useState<SortState<ObljubeSortField>>({
    field: 'date',
    reversed: false,
  });

  const {
    data: obljube,
    error,
    isLoading,
  } = getSupaWR({
    query: () => supabaseClient.from('obljube_with_user_info').select('*'),
    table: ['user_view', 'obljube_with_user_info', 'obljube'],
    params: ['all-obljube'],
  });

  const filtered = useMemo(() => {
    const query = query_string?.trim().toLowerCase().replace(/\s+/g, ' ');
    const all = (obljube as PromiseElement[] | undefined) ?? [];
    return query
      ? all.filter((p) =>
          [promiseUserName(p), p.reason, p.amount?.toString()]
            .join(' ')
            .toLowerCase()
            .includes(query),
        )
      : all;
  }, [obljube, query_string]);

  const rows = useMemo(() => {
    const byName = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name, 'sl');

    let result: PromiseRow[];
    if (aggregated) {
      const byUser = new Map<number | null, PromiseRow>();
      for (const p of filtered) {
        const row = byUser.get(p.who) ?? {
          key: `user-${p.who}`,
          who: p.who,
          name: promiseUserName(p),
          amount: 0,
          count: 0,
          created_at: null,
          reason: null,
        };
        row.amount += p.amount ?? 0;
        row.count += 1;
        if (time(p.created_at) > time(row.created_at))
          row.created_at = p.created_at;
        byUser.set(p.who, row);
      }
      result = [...byUser.values()];
    } else {
      result = filtered.map((p) => ({
        key: `promise-${p.id}`,
        who: p.who,
        name: promiseUserName(p),
        amount: p.amount ?? 0,
        count: 1,
        created_at: p.created_at,
        reason: p.reason,
        promise: p,
      }));
    }

    result.sort((a, b) => {
      switch (sort.field) {
        case 'name':
          return byName(a, b);
        case 'amount':
          // largest first
          return b.amount - a.amount || byName(a, b);
        case 'reason':
          return (a.reason ?? '').localeCompare(b.reason ?? '', 'sl');
        case 'date':
          // newest first
          return time(b.created_at) - time(a.created_at);
      }
    });
    if (sort.reversed) result.reverse();
    return result;
  }, [filtered, aggregated, sort]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );

  const toggleSort = (field: ObljubeSortField) => {
    setSort((s) => ({
      field,
      reversed: s.field === field ? !s.reversed : false,
    }));
    setPage(1);
  };

  const setAggregated = (value: boolean) => {
    setAggregatedState(value);
    // reason doesn't exist on aggregated rows
    if (value && sort.field === 'reason')
      setSort({ field: 'date', reversed: false });
    setPage(1);
  };

  return {
    rows: pageRows,
    totalCount: rows.length,
    error,
    isLoading,
    totalPages,
    activePage,
    setPage,
    sort,
    toggleSort,
    aggregated,
    setAggregated,
  };
};
