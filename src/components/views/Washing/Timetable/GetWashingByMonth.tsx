import useSWR from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';

type funcType =
  Database['public']['Functions']['get_reservations_month']['Returns'];

export const useGetMonthlyWashing = (
  month: number,
  year: number,
  machineId: number,
) => {
  const fetcher = () =>
    new Promise<funcType>((resolve, reject) => {
      supabaseClient
        .rpc('get_reservations_month', {
          p_month: month,
          p_year: year,
          p_machine_id: machineId,
        })
        .select()
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<funcType>(
    `/func/get_reservations_month/${month}/${year}/${machineId}`,
    fetcher,
  );

  return out;
};
