import useSWR from 'swr';
import { Tables } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';

export const useGetZaloge = () => {
  const fetcher = () =>
    new Promise<Tables<'named_transactions'>[]>((resolve, reject) => {
      supabaseClient
        .from('named_transactions')
        .select()
        .order('created_at', { ascending: false })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'named_transactions'>[]>(
    `/view/minister_storage_transactions/`,
    fetcher,
  );

  return out;
};
