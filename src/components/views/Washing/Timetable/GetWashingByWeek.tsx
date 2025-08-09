import useSWR from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import dayjs from 'dayjs';

type funcType =
  Database['public']['Functions']['get_reservations_week']['Returns'];

export const useGetWeeklyWashing = (
  dateStart: dayjs.Dayjs,
  machineId: number,
) => {
  const fetcher = () =>
    new Promise<funcType>((resolve, reject) => {
      supabaseClient
        .rpc('get_reservations_week', {
          p_week_start: dateStart.toISOString(),
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
    `/func/get_reservations_month/${dateStart}/${machineId}`,
    fetcher,
  );

  return out;
};
