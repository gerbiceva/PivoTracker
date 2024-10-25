import { Tables } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import useSWR from 'swr';

export type sumOrdersOptions =
  | 'total_ordered'
  | 'fullname'
  | 'total_paid'
  | 'total_difference'
  | 'total_owed';
export const useGetSummedDebt = (order: sumOrdersOptions = 'total_ordered') => {
  const fetcher = () =>
    new Promise<Tables<'everything_sum'>[]>((resolve, reject) => {
      supabaseClient
        .from('everything_sum')
        .select()
        .order('total_paid', { ascending: false })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'everything_sum'>[]>(
    `/view/everything_sum/${order}`,
    fetcher,
  );

  return out;
};
