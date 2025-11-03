import { useState } from 'react';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

const PAGE_SIZE = 15;

export const useUserEditing = () => {
  const [activePage, setPage] = useState(1);

  const {
    data: users,
    error: usersError,
    isLoading: areUsersLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('*')
        .range((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE - 1),
    table: 'user_view',
    params: ['users', activePage],
  });

  const {
    data: count,
    error: countError,
    isLoading: isCountLoading,
  } = getSupaWR({
    query: () =>
      new Promise<PostgrestSingleResponse<number | null>>((resolve, reject) => {
        supabaseClient
          .from('user_view')
          .select('*', { count: 'exact', head: true })
          .then((response) => {
            if (response.error) {
              reject(response.error);
            } else {
              const res = {
                data: response.count,
                error: null,
                count: response.count,
                status: 200,
                statusText: 'OK',
              } as PostgrestSingleResponse<number | null>;
              resolve(res);
            }
          });
      }),
    table: 'user_view',
    params: ['count'],
  });

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const error = usersError || countError;
  const isLoading = areUsersLoading || isCountLoading;

  return {
    users,
    error,
    isLoading,
    totalPages,
    activePage,
    setPage,
  };
};
