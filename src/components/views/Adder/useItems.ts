import { supabaseClient } from '../../../supabase/supabaseClient';
import { Tables } from '../../../supabase/supabase';
import useSWR from 'swr';

export const useGetItems = () => {
  const fetcher = () =>
    new Promise<Tables<'items'>[]>((resolve, reject) => {
      const query = supabaseClient.from('items').select();

      query
        .filter('visible', 'eq', true)
        .order('beer_count', { ascending: true })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'items'>[]>(`/view/items/`, fetcher);

  return out;
};
