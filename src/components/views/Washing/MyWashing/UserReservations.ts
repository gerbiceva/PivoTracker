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
          p_gerba_user_id: gerbaUserId!,
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
