import useSWR from 'swr';
import { supabaseClient } from '../supabase/supabaseClient';
import { User } from '@supabase/supabase-js';

export const useGetAuthUser = () => {
  const fetcher = () =>
    new Promise<User>((resolve, reject) => {
      supabaseClient.auth.getUser().then((res) => {
        if (!res.error) {
          resolve(res.data.user);
        } else {
          reject(res.error);
        }
      });
    });
  return useSWR('auth-user', fetcher);
};
