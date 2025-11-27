import useSWR, { mutate, SWRConfiguration } from 'swr';
import { Database } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { Unpacked } from '../../../../utils/objectSplit';

export type UserExpandedType = Unpacked<
  Database['public']['Functions']['get_user_expanded_from_auth']['Returns']
>;

export const useGetUserExpandedFromAuth = (config?: SWRConfiguration) => {
  const fetcher = () =>
    new Promise<UserExpandedType>((resolve, reject) => {
      supabaseClient
        .rpc('get_user_expanded_from_auth')
        .select('*')
        .limit(1)
        .maybeSingle()
        .then((res) => {
          if (!res.error) {
            if (res.data) {
              resolve(res.data);
            } else {
              reject();
            }
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<UserExpandedType>(
    'user-expanded-from-auth',
    fetcher,
    config,
  );

  return out;
};

export const invalidateUserExpandedFromAuth = () => {
  mutate('user-expanded-from-auth', undefined, { revalidate: true });
};
