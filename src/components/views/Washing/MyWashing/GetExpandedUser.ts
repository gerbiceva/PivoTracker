import useSWR, { mutate, SWRConfiguration } from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Unpacked } from '../../../../utils/objectSplit';

export type UserExpandedType = Unpacked<
  Database['public']['Functions']['get_user_expanded']['Returns']
>;

export const useGetUserExpanded = (
  baseUserID: number | null,
  config?: SWRConfiguration,
) => {
  const fetcher = () =>
    new Promise<UserExpandedType>((resolve, reject) => {
      supabaseClient
        .rpc('get_user_expanded', { p_base_user_id: baseUserID! })
        .select()
        .single()
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<UserExpandedType>(
    baseUserID ? ['user-expanded', baseUserID] : null,
    fetcher,
    config,
  );

  return out;
};

export const invalidateUserExpanded = () => {
  mutate(['user-expanded'], undefined, { revalidate: true });
};
