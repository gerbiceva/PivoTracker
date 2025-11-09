import { Tables } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import useSWR from 'swr';

export const useGetUserInfo = (id: number) => {
  const fetcher = () =>
    new Promise<Tables<'user_view'>>((resolve, reject) => {
      supabaseClient
        .from('user_view')
        .select()
        .eq('base_user_id', id)
        .order('base_user_id', { ascending: false })
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

  const out = useSWR<Tables<'user_view'>>(`/view/customers/${id}`, fetcher);

  return out;
};
