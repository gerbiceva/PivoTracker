import { Tables } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import useSWR from 'swr';

export const useGetUserInfo = (id: number) => {
  const fetcher = () =>
    new Promise<Tables<'base_users'>>((resolve, reject) => {
      supabaseClient
        .from('base_users')
        .select()
        .eq('id', id)
        .order('id', { ascending: false })
        .then((res) => {
          if (!res.error) {
            if (res.data.length == 1) {
              resolve(res.data[0]);
            } else {
              reject(Error('No customer foudnd'));
            }
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'base_users'>>(`/view/customers/${id}`, fetcher);

  return out;
};
