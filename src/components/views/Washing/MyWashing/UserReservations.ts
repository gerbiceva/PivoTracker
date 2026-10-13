import useSWR, { mutate, SWRConfiguration } from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Unpacked } from '../../../../utils/objectSplit';

export type ReservationForUserType = Unpacked<
  Database['public']['Functions']['get_reservations_for_user']['Returns']
>;

export const useGetReservationsForUser = (
  gerbaUserId: number | undefined,
  config?: SWRConfiguration,
) => {
  const fetcher = () =>
    new Promise<ReservationForUserType[]>((resolve, reject) => {
      supabaseClient
        .rpc('get_reservations_for_user', {
          p_base_user_id: gerbaUserId!,
        })
        .filter('slot_end_utc', 'gt', new Date().toISOString())
        .select()
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<ReservationForUserType[]>(
    gerbaUserId ? ['user-reservations', gerbaUserId] : null,
    fetcher,
    config,
  );

  return out;
};

export const invalidateUserReservations = () => {
  mutate(
    (key) => Array.isArray(key) && key[0] === 'user-reservations',
    undefined,
    { revalidate: true },
  );
};

export interface ReservationHistoryPage {
  rows: ReservationForUserType[];
  total: number;
}

// Past reservations (already ended), newest first. `limit` grows as the user
// loads more. Keyed under 'user-reservations' so invalidateUserReservations
// refreshes it too.
export const useGetReservationHistoryForUser = (
  gerbaUserId: number | undefined,
  limit: number,
  config?: SWRConfiguration,
) => {
  const fetcher = () =>
    new Promise<ReservationHistoryPage>((resolve, reject) => {
      supabaseClient
        .rpc(
          'get_reservations_for_user',
          { p_base_user_id: gerbaUserId! },
          { count: 'exact' },
        )
        .lte('slot_end_utc', new Date().toISOString())
        .order('slot_start_utc', { ascending: false })
        .range(0, limit - 1)
        .then((res) => {
          if (!res.error) {
            resolve({ rows: res.data, total: res.count ?? res.data.length });
          } else {
            reject(res.error);
          }
        });
    });

  return useSWR<ReservationHistoryPage>(
    gerbaUserId ? ['user-reservations', gerbaUserId, 'history', limit] : null,
    fetcher,
    { keepPreviousData: true, ...config },
  );
};
