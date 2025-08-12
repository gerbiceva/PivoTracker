import useSWR, { mutate, SWRConfiguration } from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { FormatDateUTC } from '../../../../utils/timeUtils';
import dayjs, { Dayjs } from 'dayjs';
import { Unpacked } from '../../../../utils/objectSplit';

export type ReservationType = Unpacked<
  Database['public']['Functions']['get_slots_for_day']['Returns']
>;

export const useGetDailySlots = (
  date: Dayjs | null,
  config?: SWRConfiguration,
) => {
  const dateStr = FormatDateUTC(date || dayjs());
  const fetcher = () =>
    new Promise<ReservationType[]>((resolve, reject) => {
      supabaseClient
        .rpc('get_slots_for_day', {
          p_date: dateStr,
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

  const out = useSWR<ReservationType[]>(
    date ? ['washing-daily', dateStr] : null,
    fetcher,
    config,
  );

  return out;
};

export const invalidateDailyWashing = () => {
  mutate(['washing-daily'], undefined, { revalidate: true });
};
