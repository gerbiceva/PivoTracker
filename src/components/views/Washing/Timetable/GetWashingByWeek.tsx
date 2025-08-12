import useSWR, { mutate } from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import dayjs from 'dayjs';

export type weeklyWashingData =
  Database['public']['Functions']['get_reservations_week']['Returns'];

export const useGetWeeklyWashing = (dateStart: dayjs.Dayjs) => {
  const fetcher = () =>
    new Promise<weeklyWashingData>((resolve, reject) => {
      supabaseClient
        .rpc('get_reservations_week', {
          p_date: dateStart.toISOString(),
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

  const out = useSWR<weeklyWashingData>(['washing-weekly', dateStart], fetcher);

  return out;
};

export const invalidateWeeklyWashing = () => {
  mutate(
    (key) => Array.isArray(key) && key[0] === 'washing-weekly',
    undefined, // keep current data as placeholder
    { revalidate: true },
  );
};
