import { useState } from 'react';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';

const PAGE_SIZE = 15;

export const useObljubeEditing = (query_string?: string) => {
  const [activePage, setPage] = useState(1);

  const query = query_string?.trim();
  const hasQuery = query && query.length > 0;

  const {
    data: obljube,
    error: obljubeError,
    isLoading: areobljubeLoading,
  } = getSupaWR({
    query: () => {
      let supaQuery = supabaseClient
        .from('obljube')
        .select(`*,base_users!who(name, surname)`); // Select all columns from obljube and name/surname from base_users, disambiguating with 'who'

      if (hasQuery) {
        supaQuery = supaQuery.or(
          `name.ilike.%${query}%,surname.ilike.%${query}%`,
        );
      }
      return supaQuery.range(
        (activePage - 1) * PAGE_SIZE,
        activePage * PAGE_SIZE - 1,
      );
    },
    table: 'user_view',
    params: ['users', activePage, query],
  });

  const {
    data: count,
    error: countError,
    isLoading: isCountLoading,
  } = getSupaWR({
    query: () =>
      new Promise<PostgrestSingleResponse<number | null>>((resolve, reject) => {
        let supaQuery = supabaseClient
          .from('obljube')
          .select(`*,base_users!who(name, surname)`, {
            count: 'exact',
            head: true,
          }); // Select all columns from obljube and name/surname from base_users, disambiguating with 'who'
        if (hasQuery) {
          supaQuery = supaQuery.or(
            `name.ilike.%${query}%,surname.ilike.%${query}%`,
          );
        }
        supaQuery.then((response) => {
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
    params: ['count', query],
  });

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const error = obljubeError || countError;
  const isLoading = areobljubeLoading || isCountLoading;

  return {
    obljube,
    error,
    isLoading,
    totalPages,
    activePage,
    setPage,
  };
};
