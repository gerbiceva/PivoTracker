import { Tables } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import useSWR from 'swr';

export const useGetWeeklyBars = () => {
  const fetcher = () =>
    new Promise<Tables<'weekly_summary'>[]>((resolve, reject) => {
      supabaseClient
        .from('weekly_summary')
        .select()
        .order('week_start', { ascending: true })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'weekly_summary'>[]>(
    `/view/weekly_summary`,
    fetcher,
  );

  return out;
};
